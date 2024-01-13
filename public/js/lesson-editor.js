import { auth, onAuthStateChanged, signOut } from "./supabase.js";
import { getUserRole } from "./userRoles.js";

let currentUser;
onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            currentUser = user
            let data = await getUserRole(user.uid)

            if (data.role == 'teacher') {
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

document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    signOut(auth).then(() => {
        console.log('Sign out successful')
    }).catch((error) => {
        console.error(error)
        alert(error)
    })
}

document.getElementById("create-new").addEventListener("click", () => {
    document.getElementById("start").style.display = "none";
    document.getElementById("create").style.display = "flex";
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

// initialize input counters
document.getElementById("lesson-name-label").innerHTML = `Lesson Name (${document.getElementById("lesson-name").value.length}/50)`

document.getElementById("lesson-name").addEventListener("input", () => {
    document.getElementById("lesson-name-label").innerHTML = `Lesson Name (${document.getElementById("lesson-name").value.length}/50)`
})

// initialize date input
document.getElementById("due-date").min = new Date().toISOString().split("T")[0]

document.getElementById("lesson-type").addEventListener("input", disableBasedOnLessonType)

function disableBasedOnLessonType(e) {
    let lessonType = document.getElementById("lesson-type").value
    if (lessonType === "info") {
        document.getElementById("lesson-points").value = 0;
        document.getElementById("lesson-points").disabled = true;
    } else {
        document.getElementById("lesson-points").disabled = false;
    }

    if (lessonType === "project") {
        document.getElementById("html").disabled = false;
        document.getElementById("css").disabled = false;
        document.getElementById("js").disabled = false;
    } else {
        document.getElementById("html").checked = false;
        document.getElementById("css").checked = false;
        document.getElementById("js").checked = false;

        document.getElementById("html").disabled = true;
        document.getElementById("css").disabled = true;
        document.getElementById("js").disabled = true;
    }
}

disableBasedOnLessonType()

document.getElementById("due-date").addEventListener("input", disableBasedOnDate)

function disableBasedOnDate(e) {
    let dueDate = document.getElementById("due-date").value
    if (dueDate === "") {
        document.getElementById("due-time").value = "";
        document.getElementById("due-time").disabled = true;
    } else {
        document.getElementById("due-time").disabled = false;
    }
}

disableBasedOnDate()

document.getElementById("lock").addEventListener("input", disableBasedOnLock)

function disableBasedOnLock(e) {
    let lock = document.getElementById("lock").checked
    if (lock) {
        document.getElementById("unlock-date").disabled = false;
        document.getElementById("unlock-time").disabled = false;
    } else {
        document.getElementById("unlock-date").value = "";
        document.getElementById("unlock-date").disabled = true;
        document.getElementById("unlock-time").value = "";
        document.getElementById("unlock-time").disabled = true;
    }
}

disableBasedOnLock()

document.getElementById("unlock-date").addEventListener("input", disableBasedOnLockDate)

function disableBasedOnLockDate(e) {
    let lockDate = document.getElementById("unlock-date").value

    if (lockDate === "") {
        document.getElementById("unlock-time").value = "";
        document.getElementById("unlock-time").disabled = true;
    } else {
        document.getElementById("unlock-time").disabled = false;
    }
}

disableBasedOnLockDate()

document.getElementById("lesson-format").addEventListener("input", showCorrectEditor)

function showCorrectEditor() {
    let lessonFormat = document.getElementById("lesson-format").value
    if (lessonFormat === "pdf") {
        document.getElementById("pdf-url").disabled = false;

        // show pdf viewer
        document.getElementById("markdown-editor").style.display = "none";
        document.getElementById("pdf-viewer").style.display = "flex";
        updatePDFViewer()
    }
    
    if (lessonFormat === "markdown") {
        // show markdown editor
        document.getElementById("pdf-viewer").style.display = "none";
        document.getElementById("markdown-editor").style.display = "flex";
        document.getElementById("pdf-url").value = "";
        document.getElementById("pdf-url").disabled = true;
    }
}

showCorrectEditor()

document.getElementById("pdf-url").addEventListener("input", updatePDFViewer)

function updatePDFViewer() {
    let url = document.getElementById("pdf-url").value

    // make sure url is a valid https url with a .pdf
    // matching ^https:\/\/[^\/]+\.[^\/]+\/.+\.pdf.*$
    if (!url.match(/^https:\/\/[^\/]+\.[^\/]+\/.+\.pdf.*/)) {
        return
    }

    document.getElementById("pdf").data = document.getElementById("pdf-url").value
    document.getElementById("download-pdf-link").href = document.getElementById("pdf-url").value
}

updatePDFViewer()