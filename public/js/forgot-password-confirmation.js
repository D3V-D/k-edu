import { supabase } from "./supabase.js";

const subscription = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // handle password recovery event
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
    } else {
        document.getElementById("modal-text").innerHTML = `
            <p style="width: 100%; text-align: center">Could not complete reset. Please try again later.</p>
        `
    }
})

document.getElementById("forgot-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("password-1").value
    const confirmPassword = document.getElementById("password-2").value
    const passwordChecked = await checkPassword()
    if (password === confirmPassword && passwordChecked === "passed") {
        const response = await supabase.auth.updateUser({ password: password })
        
        if (response.error) {
            console.error(response.error)
            const passwordError = document.getElementById("password-error");
            passwordError.style.color = "red";
            passwordError.innerHTML = response.error.message;
            return
        }

        document.getElementById('modal-text').innerText = 'Password reset successful. Redirecting to login...'
        setTimeout(() => {
            window.location.href = '../login'
        }, 3000)
    }
})

async function checkPassword() {
    let password = document.getElementById("password-1").value;
    let passwordConfirmation = document.getElementById("password-2").value;
    const passwordError = document.getElementById("password-error");

    passwordError.style.color = "red";
    if (password.length < 8) {
        passwordError.innerHTML = "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(password)) {
        passwordError.innerHTML = "Password must have at least 1 uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
        passwordError.innerHTML = "Password must have at least 1 lowercase letter.";
    } else if (!/[0-9]/.test(password)) {
        passwordError.innerHTML = "Password must have at least 1 number.";
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        passwordError.innerHTML = "Password must have at least 1 special character.";
    } else if (passwordConfirmation !== password) {
        passwordError.innerHTML = "Passwords do not match.";
    } else {
        passwordError.style.color = "green";
        passwordError.innerHTML = "Password passes all tests.";
        return "passed";
    }
}
