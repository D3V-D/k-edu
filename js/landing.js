const landingImages = document.querySelectorAll('.floating')
window.addEventListener('scroll', () => {
    landingImages.forEach(image => {
        const transformValue = window.getComputedStyle(image).getPropertyValue('transform');
        const matrixRegex = /matrix\((.*)\)/;
        const matrixMatch = transformValue.match(matrixRegex);
        let rotation;
        if (matrixMatch) {
            const matrixValues = matrixMatch[1].split(',').map(parseFloat);

            const scaleX = matrixValues[0];
            const scaleY = matrixValues[3];
            const sin = matrixValues[1];
            const cos = matrixValues[0];
            rotation = Math.round(Math.atan2(sin, cos) * (180 / Math.PI));
        } else {
            console.log('No matrix transformation found');
        }

        image.style.transform = `translateY(${window.scrollY * 0.1}px) rotate(${rotation}deg)`
    })
})