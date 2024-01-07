import { auth, confirmPasswordReset } from "./firebase.js";

const oobCode = new URLSearchParams(window.location.search).get('oobCode');

document.getElementById("modal-text").innerHTML = `
        <form id="forgot-password-form">
            <div class="input-container">
                <input required class="input-box" id="password-1" type="password" placeholder=" ">
                <label class="input-label" for="email">Password</label>
            </div>
            <div class="input-container">
                <input required class="input-box" id="password-2" type="password" placeholder=" ">
                <label class="input-label" for="email">Re-Type Password</label>
            </div>
            <button id="reset-button" type="submit">Complete Reset</button>
        </form>
`

document.getElementById("forgot-password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("password-1").value
    const confirmPassword = document.getElementById("password-2").value
    if (password === confirmPassword) {
        confirmPasswordReset(auth, oobCode, password)
            .then(() => {
                document.getElementById('modal-text').innerText = 'Password reset successful. Redirecting to login...'
                setTimeout(() => {
                    window.location.href = '../login'
                }, 3000)
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorCode, errorMessage)
                alert(errorMessage)
            })
    } else {
        alert("Passwords do not match.")
    }
})