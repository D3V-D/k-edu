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
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}