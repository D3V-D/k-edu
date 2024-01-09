import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

let currentUser;
onAuthStateChanged(auth, (user) => {
    if (user) {
        let role = getUserRole(user.uid).then((data)=>{
            if (data.role == 'teacher') {
                document.getElementById("loading").style.display = "none";
                
                // get phrase from time of day
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

                document.getElementById("welcome").innerHTML = phrase + ", " + user.displayName + "."
            } else if (data.role == 'student') {
                window.location = "../student"
            }
        })
        currentUser = user
        getClasses()
    } else {
        window.location = "../login"
    }
})

// in case of back button (doesn't auto reload the page)
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
})

document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    signOut(auth).then(() => {
        console.log('Sign out successful')
    }).catch((error) => {
        console.error(error)
        alert(error)
    })
}

/** Database logic **/
async function createClass(className, classDescription) {
    if (currentUser) {
        const requestData = {
            uid: currentUser.uid,
            className: className,
            classDesc: classDescription
        }

        fetch('/.netlify/functions/createClass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data); // Handle the response data here
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}

async function deleteClass(classId) {
    if (currentUser) {
        const requestData = {
            uid: currentUser.uid,
            classId: classId
        }


    fetch('/.netlify/functions/deleteClass', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data); // Handle the response data here
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
}

async function getClasses() {
    if (currentUser) {
        const requestData = {
            uid: currentUser.uid
        }

        fetch('/.netlify/functions/getClasses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
            .then((response) => response.json())
            .then((data) => {
                for (let i = 0; i < data.length; i++) {
                    const class_name = data[i].className;
                    const class_desc = data[i].classDesc;
                    const class_id = data[i].classId;

                    let classesContainer = document.getElementById("classes");
                    
                    let classDiv = document.createElement("div");
                    classDiv.classList.add("class");

                    let classTitle = document.createElement("h3");
                    classTitle.classList.add("class-title");
                    classTitle.innerHTML = class_name;

                    let classDesc = document.createElement("p");
                    classDesc.classList.add("class-desc");
                    classDesc.innerHTML = class_desc;

                    let link = document.createElement("a");
                    link.classList.add("class-link");
                    link.innerHTML = "View";
                    link.href = "teacher/class/" + class_id;

                    classDiv.appendChild(classTitle);
                    classDiv.appendChild(classDesc);
                    classDiv.appendChild(link);

                    classesContainer.appendChild(classDiv);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}

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