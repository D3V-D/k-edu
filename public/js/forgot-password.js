import { supabase } from "./supabase.js";

document.getElementById("forgot-password-form").addEventListener("submit", forgotPassword);

async function forgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('modal-text').innerText = 'Sending email...'


    const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password-confirmation"
    })

    if (response.error) {
        document.getElementById('modal-text').innerText = response.error.message
        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        })
        document.getElementById('modal').style.display = 'flex';
        return
    }

    document.getElementById('modal-text').innerText = 'An email has been sent to ' + email + '. Please check your inbox and follow the instructions to reset your password.'
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
    })
}



