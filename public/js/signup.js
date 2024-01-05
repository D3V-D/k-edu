


function createNewUser(inputEmail, inputPassword, viaGmail) {
    if (!viaGmail) {

        const requestData = {
            email: inputEmail,
            password: inputPassword,
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
}