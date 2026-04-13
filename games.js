// games.js — Circular carousel with focused center card and arrow nav buttons.
// To add a game: add an entry to the GAMES array in games.html.

(function () {
    const scroller = document.getElementById('games-scroller');
    const wrap     = document.getElementById('games-scroller-wrap');

    if (!GAMES || GAMES.length === 0) {
        scroller.innerHTML = '<p style="opacity:0.4; font-style:italic;">No games listed yet.</p>';
        return;
    }

    // Current focused index
    let current = 0;

    // Build cards
    function buildCards() {
        scroller.innerHTML = '';
        GAMES.forEach(function (game, i) {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.index = i;

            const hasLink = game.url && game.url.trim() !== '';
            const btnHtml = hasLink
                ? `<a class="game-btn" href="${game.url}" target="_blank" rel="noopener">▶ Play on Roblox</a>`
                : `<span class="game-btn game-btn-disabled">Coming Soon</span>`;

            card.innerHTML = `
                <div class="game-thumb-wrap">
                    <img
                        class="game-thumb"
                        src="${game.image || ''}"
                        alt="${game.name}"
                        onerror="this.style.display='none'; this.parentElement.classList.add('no-thumb')"
                    >
                </div>
                <div class="game-info">
                    <h3 class="game-name">${game.name}</h3>
                    ${btnHtml}
                </div>
            `;

            // Clicking a side card navigates to it
            card.addEventListener('click', function () {
                const idx = parseInt(card.dataset.index);
                if (idx !== current) {
                    current = idx;
                    updateCarousel(true);
                }
            });

            scroller.appendChild(card);
        });
    }

    // Update card positions, scales, and opacities
    function updateCarousel(animate) {
        const cards = scroller.querySelectorAll('.game-card');
        const total = cards.length;

        cards.forEach(function (card, i) {
            // Circular offset from center: -floor(n/2) to +floor(n/2)
            let offset = i - current;
            // Wrap around for circular effect
            if (offset > total / 2)  offset -= total;
            if (offset < -total / 2) offset += total;

            const absOffset = Math.abs(offset);

            // Layout constants
            const cardWidth  = 360;
            const gap        = 80;
            const xPos       = offset * (cardWidth + gap);

            // Scale and opacity drop off with distance from center
            const scale   = absOffset === 0 ? 1 : absOffset === 1 ? 0.78 : 0.6;
            const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.55 : 0.3;
            const zIndex  = absOffset === 0 ? 10 : absOffset === 1 ? 5 : 1;

            card.style.transition = animate ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease' : 'none';
            card.style.transform  = `translateX(${xPos}px) scale(${scale})`;
            card.style.opacity    = opacity;
            card.style.zIndex     = zIndex;
            card.style.cursor     = absOffset === 0 ? 'default' : 'pointer';

            card.classList.toggle('game-card-focused', absOffset === 0);
        });
    }

    function rotate(dir) {
        current = (current + dir + GAMES.length) % GAMES.length;
        updateCarousel(true);
    }

    // Build arrow buttons
    function buildArrows() {
        const leftBtn = document.createElement('button');
        leftBtn.className  = 'carousel-arrow carousel-arrow-left';
        leftBtn.innerHTML  = '&#8592;';
        leftBtn.setAttribute('aria-label', 'Previous game');
        leftBtn.addEventListener('click', function () { rotate(-1); });

        const rightBtn = document.createElement('button');
        rightBtn.className = 'carousel-arrow carousel-arrow-right';
        rightBtn.innerHTML = '&#8594;';
        rightBtn.setAttribute('aria-label', 'Next game');
        rightBtn.addEventListener('click', function () { rotate(1); });

        wrap.appendChild(leftBtn);
        wrap.appendChild(rightBtn);
    }

    // Dot indicators
    function buildDots() {
        const dotsWrap = document.createElement('div');
        dotsWrap.id = 'carousel-dots';
        GAMES.forEach(function (_, i) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', function () {
                current = i;
                updateCarousel(true);
                refreshDots();
            });
            dotsWrap.appendChild(dot);
        });
        wrap.parentElement.appendChild(dotsWrap);
    }

    function refreshDots() {
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    // Patch updateCarousel to also refresh dots
    const _update = updateCarousel;
    updateCarousel = function (animate) {
        _update(animate);
        refreshDots();
    };

    buildCards();
    buildArrows();
    buildDots();
    updateCarousel(false);
})();
