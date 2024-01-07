import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

document.getElementById('login-form').addEventListener('submit',  login)

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
   
    signInWithEmailAndPassword(auth, email, password).then(
        (userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('User logged in successfully')
            let role = getUserRole(user.uid).then((data)=>{
                console.log(data.role)
                if (data.role == 'teacher') {
                    window.location.href = "../teacher"
                } else if (data.role == 'student') {
                    window.location.href = "../student"
                }
            })
        }
    ).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode == "auth/invalid-credential") {
            document.querySelectorAll('input').forEach((input) => {
                input.style.borderColor = 'red';
                document.getElementById('wrong').style.display = 'block';
            })
        }

        if (errorCode == "auth/too-many-requests") {
            document.querySelectorAll('input').forEach((input) => {
                input.style.borderColor = 'red';
                document.getElementById('too-many-requests').style.display = 'block';
            })
        }
        console.error(errorCode, errorMessage);
    })
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        let role = getUserRole(user.uid).then((data)=>{
            if (data.role == 'teacher') {
                window.location = "../teacher"
            } else if (data.role == 'student') {
                window.location = "../student"
            }
        })
    } else {
        document.getElementById("loading").style.display = "none";
        console.log('Not logged in.')
    }
})

// in case of back button (doesn't auto reload the page)
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
})
