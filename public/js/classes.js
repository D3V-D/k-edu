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

async function setClassData() {
    // first, check if teacher is in the class
    // if not, show error
    let { data, error } = await supabase
                            .from('classes')
                            .select('class_name, students, description, teacher_uid, class_join_id')
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
    className = class_name // set global
    const class_desc = data[0].description
    const teacher_uid = data[0].teacher_uid

    document.getElementById('title').innerText = class_name
    document.getElementById('class-name').innerText = class_name
    document.getElementById('class-name-update').value = class_name
    document.getElementById('class-description').innerText = class_desc
    document.getElementById('class-description-update').value = class_desc
    document.getElementById('title').title = class_desc
    document.title = class_name + "| K-Edu | Teacher View"

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

    // construct class join link
    // join link is current host url + /join-class?c=class_id&p=_____
    // where ____ is a randomly generated unique UID string for each class (in the db)
    const classJoinId = data[0].class_join_id
    const joinLink = window.location.origin + "/join-class?c=" + classId + "&p=" + classJoinId
    document.getElementById('code').innerText = joinLink
    document.getElementById('copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(joinLink)
        // show popup
        document.getElementById('copy-popup').style.display = 'flex'
        setTimeout(() => {
            document.getElementById('copy-popup').style.display = 'none'
        }, 1000)
    })

    
    // get students
    let students = data[0].students;
    if (students != null && students.length > 0) {
        students = await getStudentData(students)
        setStudents(students)
    }
}

async function getStudentData(studentIDs) {
    const studentsRes = await supabase
            .from('users')
            .select('name, email, user_id')
            .in('user_id', studentIDs)
            .order('name', { ascending: true })

    if (studentsRes.error) {
        console.error(studentsRes.error)
        document.getElementById("loading").style.display = "none"
        document.getElementById('page').innerHTML = "Error in getting student data"
        return
    }

    return studentsRes.data
}

async function setStudents(students) {
    // set students
    let studentList = document.getElementById('student-container')
    if (students.length == 0) {
        studentList.innerHTML = "No students yet. Add them with the join code above!"
        return
    }

    if (students != null) {
        studentList.innerHTML = ""
        for (const student of students) {
            let studentItem = document.createElement('div')
            studentItem.classList.add('student-item')

            let studentName = document.createElement('a')
            studentName.innerText = student.name
            studentName.href = "mailto:" + student.email
            studentName.title = student.email
            studentName.classList.add('student-name')
            
            let removeStudent = document.createElement('img')
            removeStudent.src = "../assets/icons/delete (dark).svg"
            removeStudent.title = "Remove Student"
            removeStudent.setAttribute('data-id', student.user_id)
            removeStudent.classList.add('remove-student')
            removeStudent.addEventListener('click', async (e) => {
                let confirmation = prompt("Are you sure you want to remove " + student.name + " from the class? If so, type 'yes'.")

                if (confirmation !== "yes") {
                    return
                }

                const res = await supabase
                    .rpc('remove_student_from_class', { class_id: classId, student_id: student.user_id })
                
                if (res.error) {
                    console.error(res.error)
                    alert("Error in removing student")
                    return
                }
            })

            studentItem.appendChild(studentName)
            studentItem.appendChild(removeStudent)
            studentList.append(studentItem)
        }
    }
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
    moduleTitle.title = module.description

    const moduleDel = document.createElement('img')
    moduleDel.classList.add("module-del")
    moduleDel.src = "../assets/icons/delete (dark).svg"
    moduleDel.addEventListener('click', async (e) => {
        let confirmation = prompt("Are you sure you want to delete " + module.module_name + "? If so, type 'yes'.")

        if (confirmation !== "yes") {
            return
        }

        const res = await supabase
            .from('modules')
            .delete()
            .eq('id', module.id)

        if (res.error) {
            console.error(res.error)
            alert("Error in deleting module. Check console for further details")
            return
        }

        document.getElementById(module.id).remove()
    })
    moduleDel.title = "Delete Module"
    moduleTitle.append(moduleDel)

    const lessonsContainer = document.createElement('div')
    lessonsContainer.classList.add("lessons")

    const lessons = await getLessonsFromModule(module.id)

    for (const lesson of lessons) {
        await addLessonToModule(lesson, lessonsContainer)
    }

    const addLessonButton = document.createElement('a')
    addLessonButton.classList.add("add-lesson")
    addLessonButton.classList.add("lesson")
    addLessonButton.href = `../teacher/lesson-editor`
    addLessonButton.title = "Add Lesson"
    const addLessonIcon = document.createElement('img')
    addLessonIcon.classList.add("add-lesson-icon")
    addLessonIcon.src = "../assets/icons/plus-dark.svg"
    addLessonButton.appendChild(addLessonIcon)

    
    moduleDiv.append(moduleTitle, lessonsContainer, addLessonButton)
    modulesSection.append(moduleDiv)
}

async function addLessonToModule(lesson, lessonsContainer) {
    // add lesson to module
    const lessonItem = document.createElement('a')
    lessonItem.classList.add("lesson")
    lessonItem.id = lesson.id
    lessonItem.href = `../teacher/submissions?c=${classId}&l=${lesson.id}`
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

    const move = document.createElement('span')
    move.classList.add("move")
    move.title = "Move Lesson"

    const moveImg = document.createElement('img')
    moveImg.classList.add("move-img")
    moveImg.alt = "Move Lesson"
    moveImg.src = "../assets/icons/grips.svg"
    move.appendChild(moveImg)

    const deleteBtn = document.createElement('btn')
    deleteBtn.classList.add("option")
    deleteBtn.classList.add("lesson-del")
    deleteBtn.style.backgroundColor = "rgb(250, 89, 89)"
    deleteBtn.title = "Delete Lesson"

    deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation()
        e.preventDefault()
        await deleteLesson(lesson.id)
    }) 
    
    const deleteImg = document.createElement('img')
    deleteImg.classList.add("delete-img")
    deleteImg.src = "../assets/icons/delete (dark).svg"
    deleteImg.alt = "Delete Lesson"
    deleteBtn.appendChild(deleteImg)

    const edit = document.createElement('a')
    edit.title = "Edit Lesson"
    edit.classList.add("option")
    edit.href = `../teacher/lesson-editor?c=${classId}&l=${lesson.id}`

    const editImg = document.createElement('img')
    editImg.classList.add("edit-img")
    editImg.src = "../assets/icons/pencil.svg"
    editImg.alt = "Edit Lesson"
    edit.appendChild(editImg)

    // have title & move icon in same section
    const lessonTitleAndMove = document.createElement('div')
    lessonTitleAndMove.classList.add("lesson-title-and-move")
    lessonTitleAndMove.append(move, lessonTitle)

    lessonInfo.append(lessonType, lessonPoints, lock, edit, deleteBtn)
    lessonItem.append(lessonTitleAndMove, lessonInfo)
    lessonsContainer.append(lessonItem)
}

function showOptions(e) {
    // show options
    const options = e.target
    const optionsMenu = options.nextElementSibling
    optionsMenu.style.display = "flex"

    // hide options if click outside
    document.addEventListener("click", (e) => {
        if (!optionsMenu.contains(e.target)) {
            optionsMenu.style.display = "none"
        }
    })
}

async function deleteLesson(lessonId) {

    const confirm = window.confirm("Are you sure you want to delete this lesson?")

    if (!confirm) {
        return
    }

    const { error } = await supabase.from("lessons")
        .delete()
        .eq("id", lessonId)
    
    if (error) {
        console.error(error)
        alert("Error in deleting lesson. Check the console for more info.")
        return
    }

    document.getElementById(lessonId).remove()
}

async function initPage() {

    await setClassData()
    await createIntersectionLogic()
    await setModules()

    document.getElementById("loading").style.display = "none"
}


// input counters
// get text inputs ONLY
const textInputs = document.querySelectorAll('input[type="text"]')
textInputs.forEach(input => {
    input.addEventListener('input', updateCounter)
    updateCounter({ target: input })
})

function updateCounter(e) {
    const id = e.target.id
    const max = e.target.maxLength
    const value = e.target.value
    const counter = document.getElementById(id + '-label')
    let counterLabelText = counter.innerText

    // get label text up to first parenthesis
    counterLabelText = counterLabelText.split("(")[0]

    counter.innerText = counterLabelText + " (" + value.length + "/" + max + ")"
}

// update class details
document.getElementById("update-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const { error } = await supabase
        .from('classes')
        .update({
            class_name: document.getElementById("class-name-update").value,
            description: document.getElementById("class-description-update").value
        })
        .eq('id', classId)
    
    if (error) {
        console.error(error)
        alert("Error updating class. Check console for details.")
        return
    }
})

// delete class
document.getElementById("delete-class").addEventListener("click", async (e) => {
    let confirmation = prompt("Are you sure you want to delete this class? If so, type \"" + className + "\" below.")
    if (confirmation !== className) {
        return
    }

    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

    if (error) {
        console.error(error)
        alert("Error deleting class. Check console for details.")
        return
    }

    window.location.href = "../teacher"
})

// realtime updates
const classUpdated = supabase.channel("class-update").on("postgres_changes", 
    { 
        event: "UPDATE", 
        schema: "public", 
        table: "classes" 
    }, (payload) => {
        const updatedClass = payload.new
        if (payload.old.students !== updatedClass.students) {
            getStudentData(updatedClass.students).then((studentData) => {
                setStudents(studentData)    
            })
        }

        if (payload.old.class_name !== updatedClass.class_name) {
            document.getElementById('title').innerText = updatedClass.class_name
            document.getElementById('class-name').innerText = updatedClass.class_name
            document.getElementById('class-name-update').value = updatedClass.class_name            
            document.title = updatedClass.class_name + "| K-Edu | Teacher View"
        }

        if (payload.old.description !== updatedClass.description) {
            document.getElementById('class-description').innerText = updatedClass.description
            document.getElementById('class-description-update').value = updatedClass.description
            document.getElementById('title').title = updatedClass.description
        }
    }
).subscribe();