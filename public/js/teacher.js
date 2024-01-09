import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

let currentUser;
onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            currentUser = user
            let data = await getUserRole(user.uid)

            if (data.role == 'teacher') {
            
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
                try {
                    await getClasses()
                } catch (error) {
                    console.error(error)
                }
                document.getElementById("welcome").innerHTML = phrase + ", " + user.displayName + "."
                titleContainerSize()
                document.getElementById("loading").style.display = "none";
            } else if (data.role == 'student') {
                
                window.location = "../student"
            
            }
        } else {
            window.location = "../login"
        }
    } catch (error) {
        console.error(error)
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

        await fetch('/.netlify/functions/createClass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
            .then((response) => response.json())
            .then((data) => {
                document.getElementById("overlay").style.display = "flex"
                document.getElementById("modal-content-overlay").style.display = "flex"
                document.getElementById("modal-content-overlay").innerHTML = data.message || data.error   
            })
            .catch((error) => {
                document.getElementById("overlay").style.display = "flex"
                document.getElementById("modal-content-overlay").style.display = "flex"
                document.getElementById("modal-content-overlay").innerHTML = error
                document.getElementById("modal-content-overlay").style.color = 'red';
                console.error('Error:', error);
            });
    }
}

document.getElementById("modal-close").addEventListener("click", () => {
    document.getElementById("modal-content-overlay").style.display = "none";
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('add-class-form').reset();
})

async function deleteClass(classId) {
    return new Promise((resolve, reject) => {
        if (currentUser) {
            const requestData = {
                uid: currentUser.uid,
                classId: classId
            };

            fetch('/.netlify/functions/deleteClass', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                console.log(data.message);
                resolve(data);
            })
            .catch((error) => {
                console.error('Error:', error);
                reject(error); // Reject the promise if an error occurs
            });
        } else {
            reject(new Error('No currentUser')); // Reject if there's no currentUser
        }
    });
}


let classesContainerInitialContent = document.getElementById("classes").innerHTML
async function getClasses() {
    return new Promise((resolve, reject) => {
        if (currentUser) {
            const requestData = {
                uid: currentUser.uid
            };

            fetch('/.netlify/functions/getClasses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                const classesContainer = document.getElementById("classes");
                classesContainer.innerHTML = classesContainerInitialContent

                document.getElementById("add-class").addEventListener("click", () => {
                    document.getElementById('overlay').style.display = 'flex';
                    document.getElementById("modal-content-overlay").style.display = "none"
                });      
                
                for (let i = 0; i < data.length; i++) {
                    const { className, classDesc, classId } = data[i];

                    const classDiv = document.createElement("a");
                    classDiv.setAttribute("data-id", classId);
                    classDiv.classList.add("class");
                    classDiv.href = "teacher/class/" + classId;
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
                    link.href = "teacher/class/" + classId; 
                    

                    /** NOTE TO SELF: Move delete to class page, and 
                     * make it less error-prone (make the confirm prompt
                     * something like "Type the name of the class")
                     */
                    const deleteBtn = document.createElement("img");
                    deleteBtn.classList.add("class-delete");
                    deleteBtn.src = "assets/icons/delete (dark).svg";
                    deleteBtn.addEventListener("click", async (e) => {
                        e.preventDefault()
                        const confirmDelete = confirm("Are you sure you want to delete this class? This action cannot be undone.");
                        if (confirmDelete) {
                            await deleteClass(classId);
                            await getClasses();
                        }
                    })

                    classDiv.appendChild(classTitle);
                    classDiv.appendChild(classDescEl);
                    classDiv.appendChild(link);
                    classDiv.appendChild(deleteBtn);

                    classesContainer.appendChild(classDiv);
                }

                resolve(data); // Resolve the Promise with the fetched data
            })
            .catch((error) => {
                console.error('Error:', error);
                reject(error); // Reject the Promise if an error occurs
            });
        } else {
            reject(new Error('No currentUser')); // Reject if there's no currentUser
        }
    });
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
    
    await getClasses()
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

window.addEventListener("resize", () => {
    titleContainerSize()
})

function titleContainerSize() {
    let titleHeight = document.getElementById("welcome").offsetHeight
    document.getElementById("title-holder").style.minHeight = titleHeight + "px"
}