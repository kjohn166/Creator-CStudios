(function() {
    const scene = document.getElementById('stars');

    function getStarCount() {
        const area = window.innerWidth * window.innerHeight;
        // Roughly 1 star per 1500px² of screen area
        return Math.floor(area / 1500);
    }

    function createStars() {
        scene.innerHTML = '';
        const count = getStarCount();
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top  = Math.random() * 100 + '%';
            const delay = -(Math.random() * 4);
            const duration = 1.5 + Math.random() * 3;
            star.style.animation = `starTwinkle ${duration}s ease-in-out ${delay}s infinite`;
            scene.appendChild(star);
        }
    }

    createStars();

    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(createStars, 200);
    });
})();
