import { supabase } from "./supabase.js";

document.getElementById('login-form').addEventListener('submit',  login)

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
   
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })

    if (error) {
        console.error(error)
        document.querySelectorAll('input').forEach((input) => {
            input.style.borderColor = 'red';
            document.getElementById('wrong').style.display = 'block';
            document.getElementById('wrong').innerHTML = error.message
        })
        return;
    }
}

const subscription = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
        if (session == null) {
            document.getElementById("loading").style.display = "none";
        }
    } else if (event === 'SIGNED_IN') {
        console.log("Signed in.")
        if (session.user.user_metadata.role == 'teacher') {
            window.location = "../teacher"
        } else if (session.user.user_metadata.role == 'student') {
            window.location = "../student"
        }
    }
})