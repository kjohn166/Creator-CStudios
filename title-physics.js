// title-physics.js
// Per-letter independent physics: each letter bounces around the arena
// and is individually repelled by the mouse cursor.

(function () {
    const arena = document.getElementById('title-arena');
    const title = document.getElementById('index-title');
    if (!arena || !title) return;

    const REPEL_RADIUS   = 23;   // px — mouse influence radius per letter
    const REPEL_FORCE    = 1.1;   // repulsion strength
    const DAMPING        = 0.988; // velocity bleed per frame
    const ANG_DAMPING    = 0.975; // angular velocity bleed
    const MAX_SPEED      = 5.0;   // px/frame
    const MAX_ANG_SPEED  = 4.0;   // deg/frame
    const BOUNCE_DAMP    = 0.65;  // speed kept after wall bounce
    const DRIFT_FORCE    = 0.008; // tiny constant nudge to prevent total stillness
    const PHYSICS_DELAY  = 5000;  // ms to wait before enabling drift/bounce

    let mouseX = null, mouseY = null; // in page coords
    let physicsActive = false;         // drift/bounce disabled until after delay

    // Each letter's physics state
    const letters = [];

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function init() {
        const spans = title.querySelectorAll('.title-letter');
        const aw = arena.offsetWidth;
        const ah = arena.offsetHeight;

        // --- Step 1: measure each letter's natural size before touching layout ---
        // Temporarily make them inline-block with no positioning so we can measure
        spans.forEach(function (span) {
            span.style.position   = 'static';
            span.style.visibility = 'visible';
        });

        // Force a layout read
        const measurements = Array.from(spans).map(function (span) {
            return { w: span.offsetWidth, h: span.offsetHeight };
        });

        // --- Step 2: compute total title width so we can centre it ---
        const totalW = measurements.reduce(function (sum, m) { return sum + m.w; }, 0);
        const startX0 = (aw - totalW) / 2;   // x of first letter
        const startY0 = (ah - measurements[0].h) / 2; // vertically centred

        // --- Step 3: switch every span to absolute and record its position ---
        let curX = startX0;
        spans.forEach(function (span, i) {
            const m = measurements[i];

            span.style.position  = 'absolute';
            span.style.left      = '0';
            span.style.top       = '0';
            span.style.animation = 'shimmer 6s ease infinite';

            letters.push({
                el:    span,
                x:     curX,
                y:     startY0,
                vx:    0,
                vy:    0,
                angle: 0,
                va:    0,
                w:     m.w,
                h:     m.h,
            });

            curX += m.w;
        });

        // Collapse the h1 wrapper — letters are now positioned directly in arena
        title.style.visibility = 'hidden';
        title.style.position   = 'absolute';
        title.style.width      = '100%';
        title.style.height     = '100%';
        title.style.top        = '0';
        title.style.left       = '0';

        // Make each span visible (h1 is hidden, but spans are absolutely placed)
        spans.forEach(s => s.style.visibility = 'visible');

        // Enable physics (mouse repulsion only — no autonomous drift)
        physicsActive = true;

        tick();
    }

    function tick() {
        const aw = arena.offsetWidth;
        const ah = arena.offsetHeight;

        letters.forEach(function (lt) {
            // --- Mouse repulsion (per letter centre) ---
            if (mouseX !== null) {
                const arenaRect = arena.getBoundingClientRect();
                const cx = arenaRect.left + lt.x + lt.w / 2;
                const cy = arenaRect.top  + lt.y + lt.h / 2;
                const dx = cx - mouseX;
                const dy = cy - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < REPEL_RADIUS && dist > 0.5) {
                    const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
                    lt.vx += (dx / dist) * force;
                    lt.vy += (dy / dist) * force;
                    // Repulsion also spins the letter
                    lt.va += (Math.random() - 0.5) * force * 2.5;
                }
            }

            // --- Tiny random drift (only once physics is active) ---
            // (disabled — letters only move via mouse repulsion)

            // --- Speed caps (skip if physics not yet active) ---
            if (!physicsActive && mouseX === null) {
                lt.el.style.transform =
                    `translate(${lt.x}px, ${lt.y}px) rotate(${lt.angle}deg)`;
                return;
            }

            const spd = Math.sqrt(lt.vx * lt.vx + lt.vy * lt.vy);
            if (spd > MAX_SPEED) {
                lt.vx = (lt.vx / spd) * MAX_SPEED;
                lt.vy = (lt.vy / spd) * MAX_SPEED;
            }
            if (Math.abs(lt.va) > MAX_ANG_SPEED) {
                lt.va = Math.sign(lt.va) * MAX_ANG_SPEED;
            }

            // --- Integrate ---
            lt.x     += lt.vx;
            lt.y     += lt.vy;
            lt.angle += lt.va;

            // --- Wall bouncing ---
            if (lt.x < 0)            { lt.x = 0;            lt.vx =  Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
            if (lt.x > aw - lt.w)    { lt.x = aw - lt.w;    lt.vx = -Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
            if (lt.y < 0)            { lt.y = 0;             lt.vy =  Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
            if (lt.y > ah - lt.h)    { lt.y = ah - lt.h;    lt.vy = -Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }

            // --- Damping ---
            lt.vx *= DAMPING;
            lt.vy *= DAMPING;
            lt.va *= ANG_DAMPING;

            // --- Apply transform ---
            lt.el.style.transform =
                `translate(${lt.x}px, ${lt.y}px) rotate(${lt.angle}deg)`;
        });

        requestAnimationFrame(tick);
    }

    // Track raw page mouse coords
    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mouseleave', function () {
        mouseX = null;
        mouseY = null;
    });

    window.addEventListener('load', init);
})();
