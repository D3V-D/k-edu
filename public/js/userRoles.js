async function getUserRole(uid) {

    let requestData = {
        uid: uid
    }

    const response = await fetch('/.netlify/functions/getUserRole', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
}

export { getUserRole }