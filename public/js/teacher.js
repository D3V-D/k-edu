import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

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


/** visual effects */
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