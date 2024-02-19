import { supabase } from "./supabase.js";

// get class id from query params
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('c');
let className;

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
            window.location.href = "../teacher/classes?c=" + classId;
        } else if (userRole == 'student') {
            // handle initial session
            currentUser = session.user
            initPage()
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
            window.location = "../teacher/classes?c=" + classId
        } else if (session.user.user_metadata.role != 'student') {
            window.location = "../login"
        }
    }
})

async function setClassData() {
    // get class data
    let { data, error } = await supabase
                            .from('classes')
                            .select('class_name, students, description, teacher_uid')
                            .eq('id', classId)

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

    const students = data[0].students
    const class_name = data[0].class_name
    className = class_name // set global
    const class_desc = data[0].description
    const teacher_uid = data[0].teacher_uid

    if (students == null) {
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error: You are not in this class"
        return
    }

    if (teacher_uid !== currentUser.id && !students.includes(currentUser.id)) {
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error: You are not in this class"
        return
    }

    document.getElementById('title').innerText = class_name
    document.getElementById('class-name').innerText = class_name
    document.getElementById('class-description').innerText = class_desc
    document.getElementById('title').title = class_desc
    document.title = class_name + " | K-Edu"

    // get teacher
    const teacherRes = await supabase
        .from('users')
        .select('name, email')
        .eq('user_id', teacher_uid)

    if (teacherRes.error) {
        console.error(teacherRes.error)
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error in getting teacher data"
        return
    }

    document.getElementById('teacher-name').innerText = teacherRes.data[0].name
    document.getElementById('teacher-name').href = "mailto:" + teacherRes.data[0].email
}

let observer; // can be updated if modules height changes
async function createIntersectionLogic() {
    // create intersection observer
    let options = {
        root: document.querySelector("#scroll-container"),
        rootMargin: "0px",
        threshold: 0.46,
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // get corresponding link
            let sectionId = entry.target.id

            if (sectionId == "modules") {
               options.threshold = getThresholdForModules(entry)
            }

            let linkId = sectionId + "-link"
            if (entry.isIntersecting) {   
                document.getElementById(linkId).classList.add("active-nav-item")
            } else {
                document.getElementById(linkId).classList.remove("active-nav-item")
            }
        })
    }, options);

    let navTargets = document.getElementsByTagName("section")
    
    for (const item of navTargets) {
        observer.observe(item)
    }
}

function getThresholdForModules(entry) {
    const sectionHeight = entry.target.offsetHeight
    const parentHeight = entry.rootBounds.height

    // calc threshold relative to parent
    // threshold based on how much of parent is hidden by modules
    // since modules has variable height
    const threshold = Math.max(0, Math.min(1, sectionHeight / parentHeight))

    return threshold
}

// to dynamically update intersection observer 
// in case of module height changes
function updateObserver() {
    observer.disconnect()
    createIntersectionLogic()
}

async function getModules() {
    const res = await supabase
        .from('modules')
        .select('module_name, description, id')
        .eq('class_id', classId)
        .order('index_in_class', { ascending: false })
        // get in reverse order since modules is 
        // column-reverse display

    if (res.error) {
        console.error(res.error)
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error in getting module data"
        return
    }

    return res.data
}

async function setModules() {
    let modules = await getModules()
    for (const module of modules) {
        await addModuleToDOM(module)
    }
}

async function getLessonsFromModule(moduleId) {
    const res = await supabase
        .from('lessons')
        .select('lesson_name, id, index_in_module, due_date, locked, unlock_date, lesson_type, total_points, lesson_format')
        .eq('module_id', moduleId)
        .eq('class_id', classId)
        .order('index_in_module', { ascending: true })

    if (res.error) {
        console.error(res.error)
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error in getting lesson data"
        return
    }

    return res.data
}

async function addModuleToDOM(module) {
    // add module & its lessons
    const modulesSection = document.getElementById("modules")
    
    const moduleDiv = document.createElement('div')
    moduleDiv.classList.add("module")
    moduleDiv.id = module.id

    const moduleTitle = document.createElement('h3')
    moduleTitle.classList.add("module-name")
    moduleTitle.innerText = module.module_name

    const lessonsContainer = document.createElement('div')
    lessonsContainer.classList.add("lessons")

    const lessons = await getLessonsFromModule(module.id)

    for (const lesson of lessons) {
        await addLessonToModule(lesson, lessonsContainer)
    }

    moduleDiv.append(moduleTitle, lessonsContainer)
    modulesSection.append(moduleDiv)
}

async function addLessonToModule(lesson, lessonsContainer) {
    // add lesson to module
    const lessonItem = document.createElement('a')
    lessonItem.classList.add("lesson")
    lessonItem.id = lesson.id
    lessonItem.href = `classes/lessons?c=${classId}&l=${lesson.id}`
    lessonItem.title = lesson.lesson_name

    const lessonTitle = document.createElement('h4')
    lessonTitle.classList.add("lesson-name")
    lessonTitle.innerText = lesson.lesson_name

    const lessonInfo = document.createElement('div')
    lessonInfo.classList.add("lesson-info")

    const lessonType = document.createElement('span')
    lessonType.classList.add("lesson-type")
    let lessonText = lesson.lesson_type == "info" ? "Informative" : lesson.lesson_type == "project" ? "Project" : lesson.lesson_type == "file-project" ? "Project" : "Quiz/Test" 
    lessonType.innerText = lessonText
    lessonType.setAttribute('data-type', lesson.lesson_type)
    lessonType.title = lessonText

    const lessonPoints = document.createElement('span')
    lessonPoints.classList.add("lesson-points")
    lessonPoints.innerText = lesson.total_points + " pts"
    lessonPoints.title = "Max Points"

    const lock = document.createElement('img')
    lock.classList.add("lock")
    lock.src = lesson.locked ? "../assets/icons/lock.svg" : "../assets/icons/unlock.svg"
    let unlockDate = new Date(lesson.unlock_date)
    lock.title = lesson.locked ? "Unlocks on " + unlockDate.toLocaleDateString() : "Unlocked"
    lessonItem.setAttribute('data-locked', lesson.locked)
    if (lesson.locked) {
        // check if the current exact time is after the unlock date
        let unlockDate = new Date(lesson.unlock_date)
        let now = new Date()

        if (unlockDate < now) {
            lock.src = "../assets/icons/unlock.svg"
            lock.title = "Unlocked"
            lessonItem.setAttribute('data-locked', false)
        
            const { error } = await supabase.from("lessons")
                .update({ locked: false })
                .eq("id", lesson.id)
        }
    }

    // also, don't have href url if locked
    if (lesson.locked) {
        lessonItem.href = "#"
        lessonItem.title += " (Locked)"
        lessonItem.classList.add("locked")
    }

    lessonInfo.append(lessonType, lessonPoints, lock)
    lessonItem.append(lessonTitle, lessonInfo)
    lessonsContainer.append(lessonItem)
}

async function initPage() {

    await setClassData()
    await createIntersectionLogic()
    await setModules()

    document.getElementById("loading").style.display = "none"
}

// realtime updates
const classUpdated = supabase.channel("class-update").on("postgres_changes", 
    { 
        event: "UPDATE", 
        schema: "public", 
        table: "classes" 
    }, (payload) => {
        const updatedClass = payload.new
        if (payload.old.students !== updatedClass.students) {
            if (!updatedClass.students.includes(currentUser.id)) {
                window.location.href = "../student/classes?c=" + classId
            }
        }

        if (payload.old.class_name !== updatedClass.class_name) {
            document.getElementById('title').innerText = updatedClass.class_name
            document.getElementById('class-name').innerText = updatedClass.class_name
            document.getElementById('class-name-update').value = updatedClass.class_name            
            document.title = updatedClass.class_name + " | K-Edu"
        }

        if (payload.old.description !== updatedClass.description) {
            document.getElementById('class-description').innerText = updatedClass.description
            document.getElementById('class-description-update').value = updatedClass.description
            document.getElementById('title').title = updatedClass.description
        }
    }
).subscribe();