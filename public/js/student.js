import { supabase } from "./supabase.js";

let currentUser;
const subscription = supabase.auth.onAuthStateChange((event, session) => {
    let userRole;

    if (session != null) {
        userRole = session.user.user_metadata.role
    }
    
    if (event === 'INITIAL_SESSION') {
        if (session == null || (userRole != 'teacher' && userRole != 'student')) {
            window.location.href = "../login";
        } else if (userRole == 'teacher') {
            window.location.href = "../teacher";
        } else if (userRole == 'student') {
            // handle initial session
            currentUser = session.user
            document.getElementById("loading").style.display = "none"
        }
    } else if (event === 'SIGNED_IN') {
        console.log("Signed in.")
        currentUser = session.user
    } else if (event === 'SIGNED_OUT') {
        window.location.href = "../login";
    } else if (event === 'USER_UPDATED') {
        console.log("User updated")
        currentUser = session.user
        if (session.user.user_metadata.role == 'teacher') {
            window.location = "../teacher"
        } else if (session.user.user_metadata.role != 'student') {
            window.location = "../login"
        }
    }
})


document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    const { error } = await supabase.auth.signOut();
}
