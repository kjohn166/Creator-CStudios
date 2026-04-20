// games.js — Carousel + detail panel + games grid.
// To add a game: add an entry to the GAMES array in games.html.

(function () {
    const scroller = document.getElementById('games-scroller');
    const wrap     = document.getElementById('games-scroller-wrap');
    const page     = document.getElementById('games-page');

    if (!GAMES || GAMES.length === 0) {
        scroller.innerHTML = '<p style="opacity:0.4; font-style:italic;">No games listed yet.</p>';
        return;
    }

    let current = 0;

    // ── Carousel ──────────────────────────────────────────────
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

    function updateCarousel(animate) {
        const cards = scroller.querySelectorAll('.game-card');
        const total = cards.length;

        cards.forEach(function (card, i) {
            let offset = i - current;
            if (offset > total / 2)  offset -= total;
            if (offset < -total / 2) offset += total;

            const absOffset = Math.abs(offset);
            const cardWidth  = cards[0] ? cards[0].offsetWidth : 360;
            const gap        = 20;
            const xPos       = offset * (cardWidth + gap);
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

        refreshDots();
        if (!window.GAMES_EMBED) updateDetailPanel();
    }

    function rotate(dir) {
        current = (current + dir + GAMES.length) % GAMES.length;
        updateCarousel(true);
    }

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

    function buildDots() {
        const dotsWrap = document.createElement('div');
        dotsWrap.id = 'carousel-dots';
        GAMES.forEach(function (_, i) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', function () {
                current = i;
                updateCarousel(true);
            });
            dotsWrap.appendChild(dot);
        });
        wrap.parentElement.appendChild(dotsWrap);
    }

    function refreshDots() {
        document.querySelectorAll('.carousel-dot').forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    // ── Detail Panel ──────────────────────────────────────────
    function buildDetailPanel() {
        const panel = document.createElement('div');
        panel.id = 'game-detail-panel';
        panel.className = 'game-detail-panel';
        page.appendChild(panel);
    }

    function updateDetailPanel() {
        const panel = document.getElementById('game-detail-panel');
        const game  = GAMES[current];
        if (!panel || !game) return;

        const hasLink = game.url && game.url.trim() !== '';
        const isComingSoon = !hasLink || game.status === 'coming-soon';

        const statusBadge = isComingSoon
            ? '<span class="game-status-badge coming-soon">Coming Soon</span>'
            : '<span class="game-status-badge active">● Active</span>';

        const genreTags = (game.genre || [])
            .map(function (g) { return `<span class="game-genre-tag">${g}</span>`; })
            .join('');

        const btn = hasLink
            ? `<a class="game-detail-btn" href="${game.url}" target="_blank" rel="noopener">▶ Play on Roblox</a>`
            : `<span class="game-detail-btn disabled">Coming Soon</span>`;

        const thumbSection = game.image
            ? `<img class="game-detail-thumb" src="${game.image}" alt="${game.name}"
                   onerror="this.style.display='none'; this.parentElement.classList.add('no-thumb')">`
            : '';

        panel.innerHTML = `
            <div class="game-detail-thumb-wrap${game.image ? '' : ' no-thumb'}">
                ${thumbSection}
            </div>
            <div class="game-detail-info">
                <div class="game-detail-meta">
                    ${statusBadge}
                    ${genreTags}
                </div>
                <h2 class="game-detail-name">${game.name}</h2>
                <p class="game-detail-desc">${game.desc || ''}</p>
                ${btn}
            </div>
        `;
    }

    // ── Games Grid ────────────────────────────────────────────
    function buildGamesGrid() {
        const section = document.createElement('div');
        section.className = 'games-grid-section';

        section.innerHTML = `
            <div class="games-grid-header">
                <h2 class="games-grid-title">All Games</h2>
            </div>
        `;

        const grid = document.createElement('div');
        grid.className = 'games-grid';

        GAMES.forEach(function (game) {
            const hasLink = game.url && game.url.trim() !== '';
            const isComingSoon = !hasLink || game.status === 'coming-soon';

            const genreTags = (game.genre || [])
                .map(function (g) { return `<span class="game-genre-tag small">${g}</span>`; })
                .join('');

            const statusBadge = isComingSoon
                ? '<span class="game-status-badge coming-soon" style="font-size:10px;">Coming Soon</span>'
                : '';

            const btn = hasLink
                ? `<a class="game-btn" href="${game.url}" target="_blank" rel="noopener" style="font-size:13px;padding:9px 0;">▶ Play on Roblox</a>`
                : `<span class="game-btn-disabled" style="font-size:13px;padding:9px 0;display:block;text-align:center;border-radius:10px;">Coming Soon</span>`;

            const card = document.createElement('div');
            card.className = 'games-grid-card' + (isComingSoon ? ' games-grid-card-disabled' : '');

            card.innerHTML = `
                <div class="games-grid-thumb-wrap${game.image ? '' : ' no-thumb'}">
                    ${game.image ? `<img class="games-grid-thumb" src="${game.image}" alt="${game.name}"
                        onerror="this.style.display='none'; this.parentElement.classList.add('no-thumb')">` : ''}
                </div>
                <div class="games-grid-body">
                    <div class="game-detail-meta">
                        ${statusBadge}
                        ${genreTags}
                    </div>
                    <h3 class="games-grid-name">${game.name}</h3>
                    <p class="games-grid-desc">${game.desc || ''}</p>
                    ${btn}
                </div>
            `;

            grid.appendChild(card);
        });

        section.appendChild(grid);
        page.appendChild(section);
    }

    // ── Init ──────────────────────────────────────────────────
    buildCards();
    buildArrows();
    buildDots();
    if (!window.GAMES_EMBED) {
        buildDetailPanel();
        buildGamesGrid();
    }
    updateCarousel(false);
})();
