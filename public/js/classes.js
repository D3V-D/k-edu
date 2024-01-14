import { supabase } from "./supabase.js";

// get class id from query params
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('c');

let currentUser;
const subscription = supabase.auth.onAuthStateChange((event, session) => {
    let userRole;

    if (session != null) {
        userRole = session.user.user_metadata.role
    }
    
    if (event === 'INITIAL_SESSION') {
        if (session == null || (userRole != 'teacher' && userRole != 'student')) {
            window.location.href = "../login";
        } else if (userRole == 'student') {
            window.location.href = "../student/classes?c=" + classId;
        } else if (userRole == 'teacher') {
            // handle initial session
            currentUser = session.user
            initPage()
        }
    } else if (event === 'SIGNED_IN') {
        currentUser = session.user
    } else if (event === 'SIGNED_OUT') {
        window.location.href = "../login";
    } else if (event === 'USER_UPDATED') {
        console.log("User updated")
        currentUser = session.user
        if (session.user.user_metadata.role == 'student') {
            window.location.href = "../student/classes?c=" + classId;
        } else if (session.user.user_metadata.role != 'teacher') {
            window.location = "../login"
        }
    }
})

async function initPage() {
    // first, check if teacher is in the class
    // if not, show error
    let { data, error } = await supabase
                            .from('classes')
                            .select('class_name, students, description')
                            .eq('id', classId)
                            .eq('teacher_uid', currentUser.id)

    if (error) {
        console.error(error)
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error: " + error
        return
    }
    
    if (data.length == 0) {
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error: Class not found"
        return
    }

    const class_name = data[0].class_name
    const class_desc = data[0].description
    const students = data[0].students

    document.getElementById('title').innerHTML = class_name
    document.title = class_name + "| K-Edu | Teacher View"

    document.getElementById('description').innerHTML = class_desc

    document.getElementById("loading").style.display = "none"
}