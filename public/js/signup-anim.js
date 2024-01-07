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
    document.getElementById("role-prompt").style.display = "none";
    document.getElementById("role-container").style.display = "none";
    document.getElementById("email-prompt").style.display = "none";
    document.getElementById("email-container").style.display = "none";
    document.getElementById("password-prompt").style.display = "none";
    document.getElementById("password-container").style.display = "none";

    document.querySelectorAll(".continue-btn").forEach(btn => {
        btn.style.display = "none";
    })

    document.getElementById("signup-btn").style.height = "0";

    await typeWriter(document.getElementById("welcome-line1"));
    await typeWriter(document.getElementById("welcome-line2"));
    document.getElementById("name-container").style.display = "flex";
    document.getElementById("name-continue-btn").style.display = "flex";
    document.getElementById('name').focus()
}

initialAnimation();
    
/** name to role prompt*/
async function handleNameKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
        await revealRolePrompt();
    }
}

document.getElementById("name").addEventListener("keydown", handleNameKeyDown);

async function revealRolePrompt() {
    if (window.getComputedStyle(document.getElementById("role-prompt")).getPropertyValue("display") == "none") {
        const prompt = document.getElementById("role-prompt");
        const roleContainer = document.getElementById("role-container");
        const nameContinueButton = document.getElementById("name-continue-btn");

        nameContinueButton.style.display = "none";
        await typeWriter(prompt);
        roleContainer.style.display = "flex";
        document.getElementById('role-continue-btn').style.display = "flex";
    }
}

document.getElementById("name-continue-btn").addEventListener("click", revealRolePrompt);

/** role to email prompt */
async function revealEmailPrompt() {
    if (window.getComputedStyle(document.getElementById("email-container")).getPropertyValue("display") == "none") {
        const prompt = document.getElementById("email-prompt");
        const emailContainer = document.getElementById("email-container");
        const roleContinueButton = document.getElementById("role-continue-btn");

        roleContinueButton.style.display = "none";
        await typeWriter(prompt);
        emailContainer.style.display = "block";
        document.getElementById('email-continue-btn').style.display = "flex";
        document.getElementById('email').focus();
    }
}

document.getElementById("role-continue-btn").addEventListener("click", revealEmailPrompt);


/** email to password prompt */
async function handleEmailKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
        await revealPasswordPrompt();
    }
}

document.getElementById("email").addEventListener("keydown", handleEmailKeyDown);

async function revealPasswordPrompt() {
    if (window.getComputedStyle(document.getElementById("password-prompt")).getPropertyValue("display") == "none") {
        const prompt = document.getElementById("password-prompt");
        const passwordContainer = document.getElementById("password-container");

        document.getElementById("email-continue-btn").style.display = "none";
        await typeWriter(prompt);
        passwordContainer.style.display = "flex";
        document.getElementById("password-check-btn").style.display = "flex";
        document.getElementById('password').focus()
    }
}

document.getElementById("email-continue-btn").addEventListener("click", revealPasswordPrompt);

/** make sure password is secure */
async function handlePasswordKeyDown(e) {
    if (e.key == "Enter") {
        e.preventDefault();
    }
}

document.getElementById("password").addEventListener("keydown", handlePasswordKeyDown);

async function checkPassword() {
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

        if (document.getElementById("password-check-btn").style.display == "flex") {
            document.getElementById("password-check-btn").style.display = "none";
        }

        passwordError.style.color = "green";
        passwordError.innerHTML = "Password passes all tests.";
        document.getElementById("signup-btn").style.height = "auto";
        document.getElementById("signup-btn").style.opacity = "1";
        return "passed";
    }


}

document.getElementById("password-check-btn").addEventListener("click", checkPassword);

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

