import { supabase } from "./supabase.js";
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm'
import Split from 'https://cdn.jsdelivr.net/npm/split.js@1.6.5/+esm'
// get class id from query params
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('c');
const lessonId = urlParams.get('l');

let lessonName;

document.getElementById("back-link").href = "../classes?c=" + classId

let currentUser;
const subscription = supabase.auth.onAuthStateChange((event, session) => {
    let userRole;

    if (session != null) {
        userRole = session.user.user_metadata.role
    }
    
    if (event === 'INITIAL_SESSION') {
        if (session == null || (userRole != 'teacher' && userRole != 'student')) {
            window.location = "../../login";
        } else if (userRole == 'teacher') {
            window.location = "../../teacher/lesson-editor?c=" + classId + "&l=" + lessonId
        } else if (userRole == 'student') {
            // handle initial session
            currentUser = session.user
            initPage()
        }
    } else if (event === 'SIGNED_IN') {
        console.log("Signed in.")
        currentUser = session.user
    } else if (event === 'SIGNED_OUT') {
        window.location.href = "../../login";
    } else if (event === 'USER_UPDATED') {
        console.log("User updated")
        currentUser = session.user
        if (session.user.user_metadata.role == 'teacher') {
            window.location = "../../teacher/lesson-editor?c=" + classId + "&l=" + lessonId
        } else if (session.user.user_metadata.role != 'student') {
            window.location = "../../login"
        }
    }
})

async function initPage() {
    const currentLesson = await supabase
        .from('lessons')
        .select()
        .eq('id', lessonId)
        .single()
    
    if (currentLesson.error) {
        console.error(currentLesson.error)
        alert("Error in loading lesson. Check the console for more info.")
        return
    }

    // if locked, redirect to class
    if (currentLesson.data.locked) {
        alert("Lesson is locked.")
        window.location.href = "../classes?c=" + classId
        return
    }

    // if already submitted, redirect to edit
    await checkIfAlreadySubmitted(currentLesson.data)

    lessonName = currentLesson.data.lesson_name

    await setLessonFormat(currentLesson.data)
    await setLessonData(currentLesson.data)
    await initializeEditors(currentLesson.data)

    document.getElementById("loading").style.display = "none"
}

async function setLessonData(lesson) {
    document.getElementById("title").innerText = lesson.lesson_name
}

async function setLessonFormat(lesson) {
    if (lesson.lesson_format == "pdf") {
        document.getElementById("lesson").style.padding = "0";
        document.getElementById("pdf-viewer").style.display = "flex";
        let iframeURL = window.location.origin + "/pdfjs/web/viewer.html?file=" + window.location.origin + "/.netlify/functions/cors-proxy?url=" + lesson.content
        document.getElementById("pdf-viewer").src = iframeURL

        setResizer()

        document.getElementById("markdown-render").style.display = "none";
    } else if (lesson.lesson_format == "markdown") {
        setResizer()
        document.getElementById("pdf-viewer").style.display = "none";

        document.getElementById("markdown-render").style.display = "block";
        document.getElementById("markdown-src").value = lesson.content
    
        // create easyMDE for rendering, then destroy
        let easyMDE = new EasyMDE({
            element: document.getElementById("markdown-src"),
            spellChecker: false,
            autoDownloadFontAwesome: false,
        })

        let rendered = easyMDE.options.previewRender(easyMDE.value())

        document.getElementById("markdown-render").innerHTML = rendered
    
        easyMDE.toTextArea()
        easyMDE = null
    }

    if (lesson.lesson_type == "info") {
        document.getElementById("editor").style.display = "none";
        document.getElementById("lesson").style.minWidth = "100%"
        document.getElementById("submit").style.opacity = "0";
        document.getElementById("submit").style.pointerEvents = "none";
    } 
    /** TODO: ADD QUIZZES */
}


// resizing sections
function setResizer() {
    Split(["#lesson", "#editor"], {
        sizes: [50, 50],
        minSize: 20,
        gutterSize: 20,
    })
    
}


// initialize editors
async function initializeEditors(lesson) {
    if (lesson.lesson_type !== "project") {
        return
    }
    
    let editors = ["#html-editor", "#css-editor", "#js-editor"];

    if (!lesson.html_enabled) {
        document.getElementById("html-editor").style.display = "none";
        editors = editors.filter(editor => editor !== "#html-editor");
    }

    if (!lesson.css_enabled) {
        document.getElementById("css-editor").style.display = "none";
        editors = editors.filter(editor => editor !== "#css-editor");
    }

    if (!lesson.js_enabled) {
        document.getElementById("js-editor").style.display = "none";
        editors = editors.filter(editor => editor !== "#js-editor");
    }

    Split(editors, {
        minSize: 50,
        gutterSize: 20,
    });


    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    window.MonacoEnvironment = { getWorkerUrl: () => proxy };

    let proxy = URL.createObjectURL(new Blob([`
        self.MonacoEnvironment = {
            baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/'
        };
        importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/worker/workerMain.js');
    `], { type: 'text/javascript' }));

    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});

    require(["vs/editor/editor.main"], async function () {

        // define themes

        // TODO: user theme selection
        const darkResp = await fetch('/js/themes/Tomorrow-Night-Eighties.json')
        let darkTheme = await darkResp.json()
        monaco.editor.defineTheme('dark-default', darkTheme)

        const lightResp = await fetch('/js/themes/GitHub Light.json')
        let lightTheme = await lightResp.json()
        monaco.editor.defineTheme('light-default', lightTheme)

        let currentTheme = getColorScheme() == "dark" ? 'dark-default' : 'light-default'

        window.htmlEditor = await monaco.editor.create(document.getElementById('html-editor'), {
            value: [
                ''
            ].join('\n'),
            language: 'html',
            theme: currentTheme,
        automaticLayout: true
        });

        window.cssEditor = await monaco.editor.create(document.getElementById('css-editor'), {
            value: [
                ''
            ].join('\n'),
            language: 'css',
            theme:  currentTheme,
        automaticLayout: true
        });

        window.jsEditor = await monaco.editor.create(document.getElementById('js-editor'), {
            value: [
                ''
            ].join('\n'),
            language: 'javascript',
            theme: currentTheme,
        automaticLayout: true
        });

        window.htmlEditor.onDidChangeModelContent(() => {
            updateIframe()
        })
    
        window.cssEditor.onDidChangeModelContent(() => {
            updateIframe()
        })
    
        window.jsEditor.onDidChangeModelContent(() => {
            updateIframe()
        })

        if (window.alreadySubmitted) {
            window.htmlEditor.setValue(window.storedHTMLValue)
            window.cssEditor.setValue(window.storedCSSValue)
            window.jsEditor.setValue(window.storedJSValue)
        }
    });

    Split(["#editors", "#output"],
        {
            direction: "vertical",
            sizes: [50, 50],
            minSize: 100,
            gutterSize: 20,
        })

    // add download files button
    const downloadImg = document.createElement('img')
    downloadImg.src = "../../assets/icons/download.svg"
    downloadImg.title = "Download Files"
    downloadImg.classList.add("download")
    
    const downloadLink = document.createElement('a')
    downloadLink.download = "project.zip"
    downloadLink.id = "download-link"
    downloadLink.href = "#"
    downloadLink.addEventListener("click", downloadFiles)
    downloadLink.append(downloadImg)

    document.getElementById("button-row").prepend(downloadLink)
}

async function downloadFiles() {
    let html = window.htmlEditor.getValue();
    const css = window.cssEditor.getValue();
    const js = window.jsEditor.getValue();

    html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="styles.css"></link>
    </head>
    <body>
        ${html}
        <script src="script.js"></script>
    </body>
    </html>`

    const zip = new JSZip();
    
    zip.file('index.html', html);
    zip.file('styles.css', css);
    zip.file('script.js', js);

    zip.generateAsync({ type: 'blob' }).then((content) => {
        const url = window.URL.createObjectURL(content);
        const link = document.getElementById('download-link');
        link.href = url;
        link.download = 'project.zip';
        link.removeEventListener('click', downloadFiles);
        link.click()
        link.addEventListener('click', downloadFiles);
        window.URL.revokeObjectURL(url);
    })
}

function getColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return "dark"
    } else {
        return "light"
    }
}

function updateIframe() {
    const html = window.htmlEditor.getValue();
    const css = window.cssEditor.getValue();
    const js = window.jsEditor.getValue();

    const iframe = document.getElementById('output');
    
    const combinedCode = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
            
        <style>${css}</style>
    </head>
    <body>
        ${html}
        <script>${js}</script>
    </body>
    </html>
    `

    iframe.srcdoc = combinedCode
}

// submission logic
document.getElementById("submit").addEventListener("click", async (e) => {
    e.preventDefault();

    const html = window.htmlEditor.getValue();
    const css = window.cssEditor.getValue();
    const js = window.jsEditor.getValue();

    // TODO: Add quiz functionality
    if (window.alreadySubmitted) {
        editSubmission(html, css, js)
    } else {
        createSubmission(html, css, js)
    }
})

async function editSubmission(html, css, js) {
    let timestampz = new Date()
    timestampz = timestampz.toISOString()

    const resp = await supabase
        .from('submissions')
        .update({
            htmlContent: html,
            cssContent: css,
            jsContent: js,
            updated_at: timestampz,
        })
        .eq('lesson_id', lessonId)
        .eq('student_uid', currentUser.id)

    if (resp.error) {
        console.error(resp.error)
        showModal("Error in editing. Check console for more info.")
        return
    }

    showModal("Submission successfully updated.")
}

async function createSubmission(html, css, js) {
    const resp = await supabase
    .from('submissions')
    .insert({
        class_id: classId,
        lesson_id: lessonId,
        student_uid: currentUser.id,
        htmlContent: html,
        cssContent: css,
        jsContent: js,
        student_name: currentUser.user_metadata.name
    })

    if (resp.error) {
        console.error(resp.error)
        showModal("Error in submitting. Check console for more info.")
        return
    }

    showModal("Submission successful!", () => {
        window.location.href = "../classes?c=" + classId
    })
}

async function checkIfAlreadySubmitted(lesson) {
    const resp = await supabase
        .from('submissions')
        .select()
        .eq('lesson_id', lesson.id)
        .eq('student_uid', currentUser.id)
    
    if (resp.error) {
        console.error(resp.error)
        showModal("Error in checking if already submitted. Check console for more info.")
        return
    }

    if (resp.data.length > 0) {
        document.getElementById("submit").innerText = "Edit Submission"
        window.alreadySubmitted = true
        window.storedHTMLValue = resp.data[0].htmlContent
        window.storedCSSValue = resp.data[0].cssContent
        window.storedJSValue = resp.data[0].jsContent
    }
}

function showModal(message, callback) {
    document.getElementById("modal-container").style.display = "flex"
    document.getElementById("modal-text").innerText = message
    document.getElementById("modal-close").addEventListener("click", () => {
        document.getElementById("modal-container").style.display = "none"
        if (callback) {
            callback()
        }
    })
}