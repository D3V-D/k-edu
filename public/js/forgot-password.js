import { auth, sendPasswordResetEmail } from "./firebase.js";

document.getElementById("forgot-password-form").addEventListener("submit", forgotPassword);

async function forgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;

    sendPasswordResetEmail(auth, email).then(() => {
        document.getElementById('modal-text').innerText = 'An email has been sent to ' + email + '. Please check your inbox and follow the instructions to reset your password.'
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        })
        document.getElementById('modal').style.display = 'flex';
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage)
        document.getElementById('modal-text').innerText = errorMessage
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        })
        document.getElementById('modal').style.display = 'flex';
    })
}



