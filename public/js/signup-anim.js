/** auto-resizing inputs */
let inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('input', resizeInput);
    resizeInput.call(input);
})

function resizeInput() {
    this.style.width = this.value.length + "ch";
}

let inputContainers = document.querySelectorAll('.input-container');
inputContainers.forEach(inputContainer => {
    inputContainer.addEventListener('click', (e) => {
        // focus on child input
        inputContainer.querySelector('input').focus();
    })
})

/** inital name prompt */
async function initialAnimation() {
    // first, make everything invisible
    // we do this in the js so noscript users are able to use the site
    document.getElementById("welcome-line1").style.display = "none";
    document.getElementById("welcome-line2").style.display = "none";
    document.getElementById("name-container").style.display = "none";
    document.getElementById("email-prompt").style.display = "none";
    document.getElementById("email-container").style.display = "none";
    document.getElementById("password-prompt").style.display = "none";
    document.getElementById("password-container").style.display = "none";

    await typeWriter(document.getElementById("welcome-line1"));
    await typeWriter(document.getElementById("welcome-line2"));
    document.getElementById("name-container").style.display = "flex";
}

initialAnimation();
    
/** name to email prompt*/
async function handleNameKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
        if (window.getComputedStyle(document.getElementById("email-container")).getPropertyValue("display") == "none") {
            await revealEmailPrompt();
        }
    }
}

async function revealEmailPrompt() {
    const prompt = document.getElementById("email-prompt");
    const emailContainer = document.getElementById("email-container");
    
    await typeWriter(prompt);
    emailContainer.style.display = "block";
}

/** email to password prompt */
async function handleEmailKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
        if (window.getComputedStyle(document.getElementById("password-prompt")).getPropertyValue("display") == "none") {
            await revealPasswordPrompt();
        }
    }
}

async function revealPasswordPrompt() {
    const prompt = document.getElementById("password-prompt");
    const passwordContainer = document.getElementById("password-container");

    await typeWriter(prompt);
    passwordContainer.style.display = "flex";
}

/** make sure password is secure */
async function handlePasswordKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();

        let password = document.getElementById("password").value;
        const passwordError = document.getElementById("password-error");

        passwordError.style.color = "red";
        if (password.length < 8) {
            passwordError.innerHTML = "Password must be at least 8 characters long.";
        } else if (password.toLowerCase().includes(document.getElementById("name").value.toLowerCase())) {
            passwordError.innerHTML = "Password cannot contain your name.";
        } else if (!/[A-Z]/.test(password)) {
            passwordError.innerHTML = "Password must have at least 1 uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            passwordError.innerHTML = "Password must have at least 1 lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            passwordError.innerHTML = "Password must have at least 1 number.";
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
            passwordError.innerHTML = "Password must have at least 1 special character.";
        } else {
            passwordError.style.color = "green";
            passwordError.innerHTML = "Password passes all tests.";
        }
    }
}

/** helper functions */
async function typeWriter(element) {
    element.style.display = "flex";
    let text = element.innerHTML;
    element.innerHTML = "";
    let index = 0;
    for (let i = 0; i < text.length; i++) {
        element.innerHTML += text[i];
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}  

