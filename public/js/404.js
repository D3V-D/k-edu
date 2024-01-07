let currentDomain = window.location.origin;
document.getElementById("home-link").href = currentDomain

document.getElementById("star-image").src = currentDomain + "/assets/icons/star-solid.svg"

document.body.style.backgroundImage = "url('" + currentDomain + "/assets/imgs/space.jpg')";
