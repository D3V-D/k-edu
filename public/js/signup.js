import { auth, onAuthStateChanged } from "./firebase.js";
import { getUserRole } from "./userRoles.js";

// redirect if logged in already
onAuthStateChanged(auth, (user) => {
    if (user) {
        let role = getUserRole(user.uid).then((data)=>{
            if (data.role == 'teacher') {
                window.location = "../teacher"
            } else if (data.role == 'student') {
                window.location = "../student"
            }
        })
    } else {
        document.getElementById("loading").style.display = "none";
    }
})

// in case of back button (doesn't auto reload the page)
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
})

document.getElementById("signup-form").addEventListener("submit", signup);

async function signup(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const accountType = document.querySelector('input[name="role"]:checked').value;

    console.log(name, email, password, accountType);
    const passwordCheck = await checkPassword();
    console.log(passwordCheck);

    if (passwordCheck == "passed") {
        console.log("Password check passed. Creating user.")
        createNewUser(name, email, password, accountType);
    } else {
        console.log("Password check failed. Not creating user.")
    }
}

function createNewUser(inputName, inputEmail, inputPassword, inputAccountType) {
    const requestData = {
        displayName: inputName,
        email: inputEmail,
        password: inputPassword,
        accountType: inputAccountType
    }

    fetch('/.netlify/functions/signupDefault', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data); // Handle the response data here
            
            const passwordError = document.getElementById("password-error");
            
            if (data.error) {
                passwordError.style.color = "red";
                passwordError.innerHTML = data.error
            }

            if (data.error == "The email address is already in use by another account.") {
                alert("The email address is already in use by another account.")
                passwordError.innerHTML = "The email address is already in use by another account."
            }

            if (!data.error) {
                passwordError.style.color = "green";
                window.location.href = "../login"
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}