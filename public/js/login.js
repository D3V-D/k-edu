import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "./firebase.js";

document.getElementById('login-form').addEventListener('submit',  login)

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
   
    signInWithEmailAndPassword(auth, email, password).then(
        (userCredential) => {
            // Signed in
            const user = userCredential.user;
        }
    ).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    })
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(user)
        user.getIdTokenResult().then((idTokenResult) => {
            console.log(idTokenResult.claims.role)
            console.log(user.displayName)
        })
    } else {
        console.log('no user')
    }
})

async function signOut() {

}