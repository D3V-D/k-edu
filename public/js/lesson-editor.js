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
        } else if (userRole == 'student') {
            window.location.href = "../student";
        } else if (userRole == 'teacher') {
            // handle initial session
            currentUser = session.user
            // initialize
            initPage()
        }
    } else if (event === 'SIGNED_IN') {
        currentUser = session.user
    } else if (event === 'SIGNED_OUT') {
        window.location.href = "../login";
    } else if (event === 'USER_UPDATED') {
        currentUser = session.user
        if (session.user.user_metadata.role == 'student') {
            window.location = "../student"
        } else if (session.user.user_metadata.role != 'teacher') {
            window.location = "../login"
        }
    }
})

document.getElementById("logout").addEventListener("click", signout);

async function signout() {
    signOut(auth).then(() => {
        console.log('Sign out successful')
    }).catch((error) => {
        console.error(error)
        alert(error)
    })
}

document.getElementById("create-new").addEventListener("click", () => {
    document.getElementById("start").style.display = "none";
    document.getElementById("create").style.display = "flex";
})


/** UX for mobile */
document.getElementById("profile").addEventListener("click", () => {
    const profileDropdown = document.getElementById("profile-dropdown");

    if (profileDropdown.style.display === "flex") {
        profileDropdown.style.display = "none";
    } else {
        profileDropdown.style.display = "flex";
    }
})



// if click outside, close
window.onclick = function(event) {
    const profileDropdown = document.getElementById("profile-dropdown");
    const profilePicture = document.getElementById("profile-img");
    if (event.target !== profilePicture) {
        profileDropdown.style.display = "none";
    }
}

// initialize input counters
document.getElementById("lesson-name-label").innerHTML = `Lesson Name (${document.getElementById("lesson-name").value.length}/50)`

document.getElementById("lesson-name").addEventListener("input", () => {
    document.getElementById("lesson-name-label").innerHTML = `Lesson Name (${document.getElementById("lesson-name").value.length}/50)`
})

document.getElementById("pdf-additional-text-label").innerHTML = `Additional Information (${document.getElementById("pdf-additional-text").value.length}/1500)`

document.getElementById("pdf-additional-text").addEventListener("input", () => {
    document.getElementById("pdf-additional-text-label").innerHTML = `Additional Information (${document.getElementById("pdf-additional-text").value.length}/1500)`
})

document.getElementById("module-name-label").innerHTML = `Module Name (${document.getElementById("module-name").value.length}/50)`

document.getElementById("module-name").addEventListener("input", () => {
    document.getElementById("module-name-label").innerHTML = `Module Name (${document.getElementById("module-name").value.length}/50)`
})

document.getElementById("module-description-label").innerHTML = `Module Description (${document.getElementById("module-description").value.length}/150)`

document.getElementById("module-description").addEventListener("input", () => {
    document.getElementById("module-description-label").innerHTML = `Module Description (${document.getElementById("module-description").value.length}/150)`
})

// initialize date input
document.getElementById("due-date").min = new Date().toISOString().split("T")[0]

document.getElementById("lesson-type").addEventListener("input", disableBasedOnLessonType)

function disableBasedOnLessonType(e) {
    let lessonType = document.getElementById("lesson-type").value
    if (lessonType === "info") {
        document.getElementById("lesson-points").value = 0;
        document.getElementById("lesson-points").disabled = true;
    } else {
        document.getElementById("lesson-points").disabled = false;
    }

    if (lessonType === "project") {
        document.getElementById("html").disabled = false;
        document.getElementById("css").disabled = false;
        document.getElementById("js").disabled = false;
    } else {
        document.getElementById("html").checked = false;
        document.getElementById("css").checked = false;
        document.getElementById("js").checked = false;

        document.getElementById("html").disabled = true;
        document.getElementById("css").disabled = true;
        document.getElementById("js").disabled = true;
    }
}

disableBasedOnLessonType()

document.getElementById("due-date").addEventListener("input", disableBasedOnDate)

function disableBasedOnDate(e) {
    let dueDate = document.getElementById("due-date").value
    if (dueDate === "") {
        document.getElementById("due-time").value = "";
        document.getElementById("due-time").disabled = true;
    } else {
        document.getElementById("due-time").disabled = false;
    }
}

disableBasedOnDate()

document.getElementById("lock").addEventListener("input", disableBasedOnLock)

function disableBasedOnLock(e) {
    let lock = document.getElementById("lock").checked
    if (lock) {
        document.getElementById("unlock-date").disabled = false;
        document.getElementById("unlock-time").disabled = false;
    } else {
        document.getElementById("unlock-date").value = "";
        document.getElementById("unlock-date").disabled = true;
        document.getElementById("unlock-time").value = "";
        document.getElementById("unlock-time").disabled = true;
    }
}

disableBasedOnLock()

document.getElementById("unlock-date").addEventListener("input", disableBasedOnLockDate)

function disableBasedOnLockDate(e) {
    let lockDate = document.getElementById("unlock-date").value

    if (lockDate === "") {
        document.getElementById("unlock-time").value = "";
        document.getElementById("unlock-time").disabled = true;
    } else {
        document.getElementById("unlock-time").disabled = false;
    }
}

disableBasedOnLockDate()

document.getElementById("module").addEventListener("input", disableBasedOnModule)

function disableBasedOnModule(e) {
    let newOrPreExisting = document.getElementById("module").value

    if (newOrPreExisting === "new") {
        document.getElementById("module-create").style.display = "flex";
        document.getElementById("module-name").disabled = false;
        document.getElementById("module-description").disabled = false;
        document.getElementById("class-choice").disabled = false;
        document.getElementById("module-name").required = true
        document.getElementById("module-description").required = true
        document.getElementById("class-choice").required = true

        document.getElementById("module-select").style.display = "none";
        document.getElementById("module-select").disabled = true;
        document.getElementById("module-select").required = false
    } else {
        document.getElementById("module-select").style.display = "flex";
        document.getElementById("module-select").disabled = false;
        document.getElementById("module-select").required = true

        document.getElementById("module-create").style.display = "none";
        document.getElementById("module-name").disabled = true;
        document.getElementById("module-description").disabled = true;
        document.getElementById("class-choice").disabled = true;
        document.getElementById("module-name").required = false
        document.getElementById("module-description").required = false
        document.getElementById("class-choice").required = false
    }
}

disableBasedOnModule()


document.getElementById("lesson-format").addEventListener("input", showCorrectEditor)

function showCorrectEditor() {
    let lessonFormat = document.getElementById("lesson-format").value
    if (lessonFormat === "pdf") {
        // close markdown
        document.getElementById("markdown-editor-container").style.display = "none";

        // open pdf
        document.getElementById("pdf-url").disabled = false;
        document.getElementById("pdf-url").required = true
        // show pdf viewer
        document.getElementById("pdf-viewer").style.display = "flex";
        document.getElementById("pdf-additional-text").disabled = false
        document.getElementById("pdf-additional").style.display = "flex"
        updatePDFViewer()
    }
    
    if (lessonFormat === "markdown") {
        // show markdown editor
        document.getElementById("pdf-additional").style.display = "none"
        document.getElementById("pdf-viewer").style.display = "none";
        document.getElementById("markdown-editor-container").style.display = "flex";
        document.getElementById("pdf-url").disabled = true;
        document.getElementById("pdf-url").required = false
        document.getElementById("pdf-additional-text").disabled = true
    }
}

showCorrectEditor()

document.getElementById("pdf-url").addEventListener("input", updatePDFViewer)

function updatePDFViewer() {
    let url = document.getElementById("pdf-url").value

    if (url === "") {
        // note: doesn't work in localhost as it is not a https: source
        let iframeURL = window.location.origin + "/pdfjs/web/viewer.html?file=" + window.location.origin + "/.netlify/functions/cors-proxy?url=" + window.location.origin + "/pdfjs/web/example.pdf"
        document.getElementById("pdf-viewer").src = iframeURL;
        return
    }

    // make sure url is a valid https url with a .pdf
    // matching ^https:\/\/[^\/]+\.[^\/]+\/.+\.pdf.*$
    if (!url.match(/^https:\/\/[^\/]+\.[^\/]+\/.+\.pdf.*/)) {
        return
    }

    // iframe shows pdfjs, which proxies url to circumvent CORs
    let iframeURL = window.location.origin + "/pdfjs/web/viewer.html?file=" + window.location.origin + "/.netlify/functions/cors-proxy?url=" + url
    document.getElementById("pdf-viewer").src = iframeURL;
}

updatePDFViewer()

function initEditor() {
    const easyMDE = new EasyMDE({
        element: document.getElementById("markdown"),
        spellChecker: false,
        autosave: {
            enabled: true,
            uniqueId: "lesson-editor",
            delay: 1000,
        },
        forceSync: true,
        promptURLs: true,
        sideBySideFullscreen: false,
        hideIcons: ["heading"],
        showIcons: ["code", "table", "link", "strikethrough", "undo", "redo", "heading-1", "heading-2", "heading-3"],
    })
}

async function initClasses() {
    const { data, error } = await supabase.from("classes")
            .select("class_name, description, id")
            .eq("teacher_uid", currentUser.id)
            .order("updated_at", { ascending: true })

    if (error) {
        console.error(error)
        return
    }
   
    for (let i = 0; i < data.length; i++) { 
        const option = document.createElement("option")
        option.value = data[i].id
        option.text = data[i].class_name
        option.title = data[i].description
        document.getElementById("class-choice").appendChild(option)
    }
}

async function initModules() {
    const { data, error } = await supabase.from("modules")
    .select("module_name, description, id")
    .eq("teacher_uid", currentUser.id)
    .order("updated_at", { ascending: true })

    if (error) {
        console.error(error)
        return
    }

    if (data.length === 0) {
        return
    } else {
        document.getElementById("module-select").innerHTML = "<legend>Select Module</legend>"
    }

    for (let i = 0; i < data.length; i++) {
        const radio = document.createElement("input")
        radio.type = "radio"
        radio.name = "module"
        radio.id = data[i].id
        radio.value = data[i].id
        radio.title = data[i].description

        const label = document.createElement("label")
        label.htmlFor = data[i].id
        label.textContent = data[i].module_name
        label.title = data[i].description

        const inlineInput = document.createElement("div")
        inlineInput.classList.add("inline-input")

        inlineInput.append(radio)
        inlineInput.append(label)

        document.getElementById("module-select").appendChild(inlineInput)
    }
}

async function initPage() {
    await initEditor()    
    await initClasses()
    await initModules()
    document.getElementById("loading").style.display = "none";
}