import { supabase } from "./supabase.js";

let currentUser;
const subscription = supabase.auth.onAuthStateChange((event, session) => {
    let userRole;

    if (session != null) {
        userRole = session.user.user_metadata.role
    }
    
    if (event === 'INITIAL_SESSION') {
        if (session == null || (userRole != 'teacher' && userRole != 'student')) {
            window.location.href = "../login";
        } else if (userRole == 'student') {
            window.location.href = "../student";
        } else if (userRole == 'teacher') {
            // handle initial session
            currentUser = session.user
            let data = session.user.user_metadata

            //get phrase from time of day
            let date = new Date();
            let hour = date.getHours();
            let phrase;
            if (hour < 12) {
                phrase = "Good Morning"
            } else if (hour < 16) {
                phrase = "Good Afternoon"
            } else if (hour < 19) {
                phrase = "Good Evening"
            } else if (hour < 24) {
                phrase = "Good Night"
            }
            document.getElementById("welcome").innerHTML = phrase + ", " + data.name + "."
            titleContainerSize()
            initPage()
        }
    } else if (event === 'SIGNED_IN') {
        console.log("Signed in.")
        currentUser = session.user
    } else if (event === 'SIGNED_OUT') {
        window.location.href = "../login";
    } else if (event === 'USER_UPDATED') {
        console.log("User updated")
        currentUser = session.user
        if (session.user.user_metadata.role == 'student') {
            window.location = "../student"
        } else if (session.user.user_metadata.role != 'teacher') {
            window.location = "../login"
        }
    }
})


document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    const { error } = await supabase.auth.signOut();
}

// /** Database logic **/
async function createClass(className, classDescription) {
    if (!currentUser) {
        return
    }

    const currClasses = await getClasses()
    if (currClasses.length >= 15) {
        document.getElementById("overlay").style.display = "flex"
        document.getElementById("modal-content-overlay").style.display = "flex"
        document.getElementById("modal-content-overlay").innerHTML = "You can only have up to 15 classes."
        document.getElementById("modal-content-overlay").style.color = 'red';
        return
    }


    const insertData = {
        teacher_uid: currentUser.id,
        class_name: className,
        description: classDescription
    }

    const { error } = await supabase.from("classes").insert(insertData)
   
    if (error) {
        document.getElementById("overlay").style.display = "flex"
        document.getElementById("modal-content-overlay").style.display = "flex"
        document.getElementById("modal-content-overlay").innerHTML = error
        document.getElementById("modal-content-overlay").style.color = 'red';
        console.error('Error:', error.code);
        return
    }

    document.getElementById("overlay").style.display = "flex"
    document.getElementById("modal-content-overlay").style.display = "flex"
    document.getElementById("modal-content-overlay").innerHTML = "Class created."
}

// modal closer
document.getElementById("modal-close").addEventListener("click", () => {
    document.getElementById("modal-content-overlay").style.display = "none";
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('add-class-form').reset();
})

// initialize page.
async function initPage() {
    let classes = await getClasses()
    for (let i = 0; i < classes.length; i++) { 
        addClassToList(classes[i].class_name, classes[i].description, classes[i].id)
    }
    document.getElementById("loading").style.display = "none";
}

async function getClasses() {
    const { data, error } = await supabase.from("classes")
            .select("class_name, description, id")
            .eq("teacher_uid", currentUser.id)
            .order("updated_at", { ascending: true })

    if (error) {
        console.error(error)
        return
    }
   
    return data
}

// update page on class creation or deletion
const classesInserted = supabase.channel("class-insert").on("postgres_changes", 
    { 
        event: "INSERT", 
        schema: "public", 
        table: "classes" 
    }, (payload) => {
        addClassToList(payload.new.class_name, payload.new.description, payload.new.id)
    }
).subscribe();

const classesRemoved = supabase.channel("class-remove").on("postgres_changes", 
    { 
        event: "DELETE", 
        schema: "public", 
        table: "classes" 
    }, (payload) => {
        document.getElementById('' + payload.old.id).remove()
    }
).subscribe();


function addClassToList(class_name, class_desc, class_id) {
    const classesContainer = document.getElementById('classes')
    const className = class_name;
    const classDesc = class_desc;
    const classId = class_id;

    const classDiv = document.createElement("a");
    classDiv.setAttribute("data-id", classId);
    classDiv.id = classId;
    classDiv.classList.add("class");
    classDiv.href = "teacher/classes?c=" + classId;
    classDiv.title = className;

    const classTitle = document.createElement("h3");
    classTitle.classList.add("class-title");
    classTitle.innerHTML = className;

    const classDescEl = document.createElement("p");
    classDescEl.classList.add("class-desc");
    classDescEl.innerHTML = classDesc;

    const link = document.createElement("a");
    link.classList.add("class-link");
    link.innerHTML = "View";
    link.href = "teacher/classes?c=" + classId;

    classDiv.appendChild(classTitle);
    classDiv.appendChild(classDescEl);
    classDiv.appendChild(link);
    
    classesContainer.appendChild(classDiv);
}


document.getElementById("add-class").addEventListener("click", () => {
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById("modal-content-overlay").style.display = "none"
});
document.getElementById("add-class-form").addEventListener("submit", handleClassForm)

async function handleClassForm(e) {
    e.preventDefault();
    const className = document.getElementById("class-name-input").value
    const classDescription = document.getElementById("class-desc-input").value


    document.getElementById("overlay").style.display = "flex"
    document.getElementById("modal-content-overlay").style.display = "flex"
    document.getElementById("modal-content-overlay").innerHTML = "Loading..."
    await createClass(className, classDescription)
}

// for searchbar
document.getElementById("search").addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        const query = document.getElementById("search").value
        
        if (query === "") {
            return
        }

        // or = search for mult. keywords
        // wrap words in "" to search for items with same order of words
        // to exclude keywords from search, use - in front of the keyword
        const { data, classError } = await supabase.from("classes")
            .select(
                `id, 
                class_name, 
                description
               `
            )
            .eq("teacher_uid", currentUser.id)
            .textSearch('name_description', query, {
                type: 'websearch',
                config: 'english'
            })
        
        if (classError) {
            console.error(classError)
            document.getElementById("search-results").innerText = "Error encountered in search:" + classError
            return
        }

        if (data.length === 0) {
            document.getElementById("search-results").innerText = "No results found."
            return
        }

        document.getElementById("search-results").innerHTML = "<span style='margin-bottom: 5px;'>Found " + data.length + " results</span>"
        for (let i = 0; i < data.length; i++) {            
            const link = document.createElement("a")
            link.classList.add("search-result")
            link.setAttribute("data-id", data[i].id)
            link.href = "teacher/classes?c=" + data[i].id
            link.title = data[i].class_name
            
            const linkTitle = document.createElement("h3")
            linkTitle.classList.add("search-result-title")
            linkTitle.innerHTML = data[i].class_name

            const linkDesc = document.createElement("p")
            linkDesc.classList.add("search-result-desc")
            linkDesc.innerHTML = data[i].description

            link.appendChild(linkTitle)
            link.appendChild(linkDesc)

            document.getElementById("search-results").appendChild(link)
        }

    }
})


/** UX for mobile */
document.getElementById("profile").addEventListener("click", () => {
    const profileDropdown = document.getElementById("profile-dropdown");

    if (profileDropdown.style.display === "flex") {
        profileDropdown.style.display = "none";
    } else {
        profileDropdown.style.display = "flex";
    }
})



// if click outside, close
window.onclick = function(event) {
    const profileDropdown = document.getElementById("profile-dropdown");
    const profilePicture = document.getElementById("profile-img");
    if (event.target !== profilePicture) {
        profileDropdown.style.display = "none";
    }
}

window.addEventListener("resize", () => {
    titleContainerSize()
})

function titleContainerSize() {
    let titleHeight = document.getElementById("welcome").offsetHeight
    document.getElementById("title-holder").style.minHeight = titleHeight + "px"
}

