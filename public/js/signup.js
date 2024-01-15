import { supabase } from "./supabase.js";

const subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
            if (session == null) {
                document.getElementById("loading").style.display = "none";
            } else {
                if (session.user.user_metadata.role == 'teacher') {
                    window.location = "../teacher"
                } else if (session.user.user_metadata.role == 'student') {
                    window.location = "../student"
                }
            }
        } else if (event === 'SIGNED_IN') {
            console.log("Signed in already!");
            if (session.user.user_metadata.role == 'teacher') {
                window.location = "../teacher"
            } else if (session.user.user_metadata.role == 'student') {
                window.location = "../student"
            }
        }
})

document.getElementById("signup-form").addEventListener("submit", signup);

async function signup(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const accountType = document.querySelector('input[name="role"]:checked').value;

    const passwordCheck = await checkPassword();

    if (passwordCheck == "passed") {
        console.log("Password check passed. Creating user.")
        createNewUser(name, email, password, accountType);
    } else {
        console.log("Password check failed. Not creating user.")
        document.getElementById("signup-error").innerHTML = "Password check failed. Please meet the requirements."
    }
}

async function createNewUser(inputName, inputEmail, inputPassword, inputAccountType) {
    const result = await supabase.auth.signUp({
        email: inputEmail,
        password: inputPassword,
        options: {
            emailRedirectTo: window.location.origin + "/login",
            data: {
                name: inputName,
                role: inputAccountType,
            }
        }
    })

    if (result.error) {
        console.error("Error signing up: ", result.error);
        document.getElementById("signup-error").innerHTML = result.error.message
        return
    }

    const userId = result.data.user.id
    // add user data to db
    const dbRes = await supabase.from("users").insert(
        {
            user_id: userId,
            role: inputAccountType,
            name: inputName,
            email: inputEmail
        }
    );

    if (dbRes.error) {
        console.error("Error signing up: ", dbRes.error);
        
        let errorHint;
        if (dbRes.error.code == "23503") {
            errorHint = "User may already exist. Please try logging in."
        } else {
            errorHint = "Encountered unexpected error. Please try again later."
        }
        
        document.getElementById("signup-error").innerHTML = "Error code: " + dbRes.error.code + ". " + errorHint
        return
    }

    document.getElementById("signup-form").innerHTML = "Verification email sent. Please check your inbox and follow the link to verify your account. You may close this tab.";
    document.getElementById("signup-form").style.fontSize = "clamp(16px, 2vw, 18px)";
}