(function() {
    const scene = document.getElementById('stars');
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top  = Math.random() * 100 + '%';
        const delay = -(Math.random() * 4);
        const duration = 1.5 + Math.random() * 3;
        star.style.animation = `starTwinkle ${duration}s ease-in-out ${delay}s infinite`;
        scene.appendChild(star);
    }
})();
