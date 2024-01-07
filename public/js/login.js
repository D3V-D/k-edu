import { auth, signInWithEmailAndPassword } from "./firebase.js";

document.getElementById('login-form').addEventListener('submit',  login)

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
   
    signInWithEmailAndPassword(auth, email, password).then(
        (userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log(user);
        }
    ).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    })
}