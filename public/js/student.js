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
        } else if (userRole == 'teacher') {
            window.location.href = "../teacher";
        } else if (userRole == 'student') {
            // handle initial session
            currentUser = session.user

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
        if (session.user.user_metadata.role == 'teacher') {
            window.location = "../teacher"
        } else if (session.user.user_metadata.role != 'student') {
            window.location = "../login"
        }
    }
})


document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    const { error } = await supabase.auth.signOut();
}

async function initPage() {

    titleContainerSize()
    await setUserData()
    await setClasses()

    document.getElementById("loading").style.display = "none"
}

async function setUserData() {
    let data = currentUser.user_metadata

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
}

async function setClasses() {
    const resp = await supabase
        .from('classes')
        .select('id, class_name, description')
        .contains('students', [currentUser.id])

    if (resp.error) {
        console.error(resp.error)
        alert("Error in loading classes. Check the console for more info.")
        return
    }

    for (let i = 0; i < resp.data.length; i++) {
        await createClassCard(resp.data[i])
    }
}

async function createClassCard(classData) {
    const classesContainer = document.getElementById('classes')
    const className = classData.class_name;
    const classDesc = classData.description;
    const classId = classData.id;

    const classDiv = document.createElement("a");
    classDiv.setAttribute("data-id", classId);
    classDiv.id = classId;
    classDiv.classList.add("class");
    classDiv.href = "student/classes?c=" + classId;
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
    link.href = "student/classes?c=" + classId;

    classDiv.appendChild(classTitle);
    classDiv.appendChild(classDescEl);
    classDiv.appendChild(link);

    classesContainer.appendChild(classDiv);

}


// Event Listner instantiations
document.getElementById("add-class").addEventListener("click", () => {
    document.getElementById("modal-container").style.display = "flex"
})

document.getElementById("modal-close").addEventListener("click", () => {
    document.getElementById("modal-container").style.display = "none"
})

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
            .contains('students', [currentUser.id])
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
            link.href = "student/classes?c=" + data[i].id
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

