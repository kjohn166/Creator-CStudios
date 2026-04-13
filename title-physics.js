// title-physics.js
// Per-letter independent physics: each letter bounces around the arena
// and is individually repelled by the mouse cursor.

(function () {
    const arena = document.getElementById('title-arena');
    const title = document.getElementById('index-title');
    if (!arena || !title) return;

    const REPEL_RADIUS   = 23;   // px — mouse influence radius per letter
    const REPEL_FORCE    = 0.08;   // repulsion strength
    const DAMPING        = 0.988; // velocity bleed per frame
    const ANG_DAMPING    = 0.975; // angular velocity bleed
    const MAX_SPEED      = 5.0;   // px/frame
    const MAX_ANG_SPEED  = 4.0;   // deg/frame
    const BOUNCE_DAMP    = 0.65;  // speed kept after wall bounce
    const RETURN_DELAY      = 1000;  // ms of no letter interaction before letters return home
    const RETURN_SNAP       = 0.5;   // px distance at which letter snaps exactly to home
    const RETURN_POS_LERP   = 0.01;  // lerp strength for position return (0–1, higher = snappier)
    const RETURN_ANGLE_LERP = 0.01;  // lerp strength for rotation return (0–1, higher = snappier)

    let mouseX = null, mouseY = null; // in page coords
    let physicsActive = false;
    let lastMouseTime = 0;            // timestamp of last mousemove over arena
    let returning = false;            // whether letters are easing back home
    let wasReturning = false;         // previous frame's returning state

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
        const startX0 = (aw - totalW) / 2;
        const startY0 = ah - measurements[0].h - 16; // sit near the bottom of the arena

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
                homeX: curX,      // original resting position
                homeY: startY0,
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
        const now = performance.now();

        // Check if letters should be returning home
        const nowReturning = (now - lastMouseTime > RETURN_DELAY);

        // The moment we switch into return mode, kill all velocity immediately
        if (nowReturning && !wasReturning) {
            letters.forEach(function (lt) {
                lt.vx = 0; lt.vy = 0; lt.va = 0;
            });
        }
        returning = nowReturning;
        wasReturning = nowReturning;

        letters.forEach(function (lt) {
            if (returning) {
                // --- Lerp back to home position, snap when close enough ---
                const dx = lt.homeX - lt.x;
                const dy = lt.homeY - lt.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < RETURN_SNAP && Math.abs(lt.angle) < 0.1) {
                    lt.x = lt.homeX;
                    lt.y = lt.homeY;
                    lt.angle = 0;
                } else {
                    lt.x     += dx * RETURN_POS_LERP;
                    lt.y     += dy * RETURN_POS_LERP;
                    lt.angle += (0 - lt.angle) * RETURN_ANGLE_LERP;
                }
                lt.vx = 0;
                lt.vy = 0;
                lt.va = 0;
            } else {
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
                        lt.va += (Math.random() - 0.5) * force * 2.5;
                    }
                }

                // --- Speed caps ---
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
                if (lt.x < 0)         { lt.x = 0;         lt.vx =  Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.x > aw - lt.w) { lt.x = aw - lt.w; lt.vx = -Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.y < 0)         { lt.y = 0;          lt.vy =  Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.y > ah - lt.h) { lt.y = ah - lt.h;  lt.vy = -Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }

                // --- Damping ---
                lt.vx *= DAMPING;
                lt.vy *= DAMPING;
                lt.va *= ANG_DAMPING;
            }

            // --- Apply transform ---
            lt.el.style.transform =
                `translate(${lt.x}px, ${lt.y}px) rotate(${lt.angle}deg)`;
        });

        // --- Letter-to-letter AABB collision (only when not returning) ---
        if (!returning) {
            for (let i = 0; i < letters.length; i++) {
                for (let j = i + 1; j < letters.length; j++) {
                    const a = letters[i];
                    const b = letters[j];

                    // AABB overlap check using centres — tighten width to 70% to avoid oversized hitboxes on narrow letters
                    const acx = a.x + a.w / 2;  const acy = a.y + a.h / 2;
                    const bcx = b.x + b.w / 2;  const bcy = b.y + b.h / 2;

                    const overlapX = (a.w * 0.7 + b.w * 0.7) / 2 - Math.abs(acx - bcx);
                    const overlapY = (a.h + b.h) / 2 - Math.abs(acy - bcy);

                    if (overlapX > 0 && overlapY > 0) {
                        // Resolve along the axis of least penetration
                        if (overlapX < overlapY) {
                            const sign = acx < bcx ? -1 : 1;
                            a.x += sign * overlapX / 2;
                            b.x -= sign * overlapX / 2;
                            // Exchange x-velocities and spin
                            const tmp = a.vx;
                            a.vx = b.vx * BOUNCE_DAMP;
                            b.vx = tmp  * BOUNCE_DAMP;
                            a.va += sign * rand(0.05, 0.2);
                            b.va -= sign * rand(0.05, 0.2);
                        } else {
                            const sign = acy < bcy ? -1 : 1;
                            a.y += sign * overlapY / 2;
                            b.y -= sign * overlapY / 2;
                            const tmp = a.vy;
                            a.vy = b.vy * BOUNCE_DAMP;
                            b.vy = tmp  * BOUNCE_DAMP;
                            a.va += rand(-0.1, 0.1);
                            b.va += rand(-0.1, 0.1);
                        }
                    }
                }
            }
        }

        requestAnimationFrame(tick);
    }

    // Track raw page mouse coords and record interaction time
    // Only reset the return timer if the mouse is within repel range of any letter
    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!arena) return;
        const arenaRect = arena.getBoundingClientRect();
        const inRange = letters.some(function (lt) {
            const cx = arenaRect.left + lt.x + lt.w / 2;
            const cy = arenaRect.top  + lt.y + lt.h / 2;
            const dx = cx - e.clientX;
            const dy = cy - e.clientY;
            return Math.sqrt(dx * dx + dy * dy) < REPEL_RADIUS;
        });

        if (inRange) lastMouseTime = performance.now();
    });

    window.addEventListener('mouseleave', function () {
        mouseX = null;
        mouseY = null;
    });

    window.addEventListener('load', init);
})();
