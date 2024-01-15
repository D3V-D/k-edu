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
            joinClass()
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

// get query params
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('c');
const classUID = urlParams.get('p');

async function joinClass() {
    // add student to class
    let res = await supabase
        .from('classes')
        .select('students')
        .eq('id', classId)
        .eq('class_join_id', classUID)
    
    if (res.error) {
        console.error(res.error)
        alert("Error in joining class. Check the console for more info.")
        return
    }

    console.log(res)

    const currStudents = res.data.students || []

    if (currStudents.includes(currentUser.id)) {
        alert("You are already in the class.")
        window.location.href = "../student/classes?c=" + classId
        return
    }

    const newStudents = [...currStudents, currentUser.id]

    const { updateError } = await supabase
        .from('classes')
        .update({ students: newStudents })
        .eq('id', classId)
        .eq('class_join_id', classUID)

    if (updateError) {
        console.error(updateError)
        alert("Error in joining class. Check the console for more info.")
        return
    }

    console.log(updateError)

    window.location.href = "../student/classes?c=" + classId
}