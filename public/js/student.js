import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        let role = getUserRole(user.uid).then((data)=>{
            if (data.role == 'teacher') {
                window.location = "../teacher"
            } else if (data.role == 'student') {
                document.getElementById("loading").style.display = "none";
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

document.getElementById("sign-out").addEventListener("click", signout);

async function signout() {
    signOut(auth).then(() => {
        console.log('Sign out successful')
    }).catch((error) => {
        console.error(error)
        alert(error)
    })
}