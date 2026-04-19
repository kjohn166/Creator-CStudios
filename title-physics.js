// title-physics.js
// Per-letter independent physics: each letter bounces around the arena
// and is individually repelled by the mouse cursor.

(function () {
    const arena = document.getElementById('title-arena');
    const title = document.getElementById('index-title');
    if (!arena || !title) return;

    const REPEL_RADIUS    = 23;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const REPEL_FORCE     = 0.08;
    const DAMPING         = 0.988;
    const ANG_DAMPING     = 0.975;
    const MAX_SPEED       = 5.0;
    const MAX_ANG_SPEED   = 4.0;
    const BOUNCE_DAMP     = 0.65;
    const RETURN_DELAY      = 1000;
    const RETURN_SNAP       = 0.5;
    const RETURN_SNAP_SQ    = RETURN_SNAP * RETURN_SNAP;
    const RETURN_POS_LERP   = 0.01;
    const RETURN_ANGLE_LERP = 0.01;

    let mouseX = null, mouseY = null;
    let lastMouseTime = 0;
    let returning = false;
    let wasReturning = false;
    let sleeping = false;
    let rafId = null;

    // Cached arena rect — updated on resize/scroll, not every mousemove
    let arenaRect = { left: 0, top: 0 };

    const letters = [];

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function updateArenaRect() {
        arenaRect = arena.getBoundingClientRect();
    }

    function init() {
        updateArenaRect();
        const spans = title.querySelectorAll('.title-letter');
        const aw = arena.offsetWidth;
        const ah = arena.offsetHeight;

        spans.forEach(function (span) {
            span.style.position   = 'static';
            span.style.visibility = 'visible';
        });

        const measurements = Array.from(spans).map(function (span) {
            return { w: span.offsetWidth, h: span.offsetHeight };
        });

        const totalW = measurements.reduce(function (sum, m) { return sum + m.w; }, 0);
        const startX0 = (aw - totalW) / 2;
        const startY0 = ah - measurements[0].h - 16;

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
                homeX: curX,
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

        title.style.visibility = 'hidden';
        title.style.position   = 'absolute';
        title.style.width      = '100%';
        title.style.height     = '100%';
        title.style.top        = '0';
        title.style.left       = '0';

        spans.forEach(s => s.style.visibility = 'visible');

        rafId = requestAnimationFrame(tick);
    }

    function tick() {
        const aw = arena.offsetWidth;
        const ah = arena.offsetHeight;
        const now = performance.now();

        const nowReturning = (now - lastMouseTime > RETURN_DELAY);

        if (nowReturning && !wasReturning) {
            letters.forEach(function (lt) {
                lt.vx = 0; lt.vy = 0; lt.va = 0;
            });
        }
        returning    = nowReturning;
        wasReturning = nowReturning;

        let allSnapped = true;

        letters.forEach(function (lt) {
            if (returning) {
                const dx   = lt.homeX - lt.x;
                const dy   = lt.homeY - lt.y;
                const dSq  = dx * dx + dy * dy;

                if (dSq < RETURN_SNAP_SQ && Math.abs(lt.angle) < 0.1) {
                    lt.x     = lt.homeX;
                    lt.y     = lt.homeY;
                    lt.angle = 0;
                } else {
                    lt.x     += dx * RETURN_POS_LERP;
                    lt.y     += dy * RETURN_POS_LERP;
                    lt.angle += (0 - lt.angle) * RETURN_ANGLE_LERP;
                    allSnapped = false;
                }
                lt.vx = 0;
                lt.vy = 0;
                lt.va = 0;
            } else {
                allSnapped = false;

                if (mouseX !== null) {
                    const cx = arenaRect.left + lt.x + lt.w / 2;
                    const cy = arenaRect.top  + lt.y + lt.h / 2;
                    const dx = cx - mouseX;
                    const dy = cy - mouseY;
                    const dSq = dx * dx + dy * dy;

                    if (dSq < REPEL_RADIUS_SQ && dSq > 0.25) {
                        const dist  = Math.sqrt(dSq);
                        const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
                        lt.vx += (dx / dist) * force;
                        lt.vy += (dy / dist) * force;
                        lt.va += (Math.random() - 0.5) * force * 2.5;
                    }
                }

                const spd = Math.sqrt(lt.vx * lt.vx + lt.vy * lt.vy);
                if (spd > MAX_SPEED) {
                    lt.vx = (lt.vx / spd) * MAX_SPEED;
                    lt.vy = (lt.vy / spd) * MAX_SPEED;
                }
                if (Math.abs(lt.va) > MAX_ANG_SPEED) {
                    lt.va = Math.sign(lt.va) * MAX_ANG_SPEED;
                }

                lt.x     += lt.vx;
                lt.y     += lt.vy;
                lt.angle += lt.va;

                if (lt.x < 0)         { lt.x = 0;         lt.vx =  Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.x > aw - lt.w) { lt.x = aw - lt.w; lt.vx = -Math.abs(lt.vx) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.y < 0)         { lt.y = 0;          lt.vy =  Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }
                if (lt.y > ah - lt.h) { lt.y = ah - lt.h;  lt.vy = -Math.abs(lt.vy) * BOUNCE_DAMP; lt.va += rand(-1, 1); }

                lt.vx *= DAMPING;
                lt.vy *= DAMPING;
                lt.va *= ANG_DAMPING;
            }

            lt.el.style.transform =
                `translate(${lt.x}px, ${lt.y}px) rotate(${lt.angle}deg)`;
        });

        // Letter-letter AABB collision
        if (!returning) {
            for (let i = 0; i < letters.length; i++) {
                for (let j = i + 1; j < letters.length; j++) {
                    const a = letters[i];
                    const b = letters[j];

                    const acx = a.x + a.w / 2;  const acy = a.y + a.h / 2;
                    const bcx = b.x + b.w / 2;  const bcy = b.y + b.h / 2;

                    const overlapX = (a.w * 0.7 + b.w * 0.7) / 2 - Math.abs(acx - bcx);
                    const overlapY = (a.h + b.h) / 2 - Math.abs(acy - bcy);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            const sign = acx < bcx ? -1 : 1;
                            a.x += sign * overlapX / 2;
                            b.x -= sign * overlapX / 2;
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

        // Sleep when all letters have returned home — no more rAF until mouse wakes them
        if (returning && allSnapped) {
            sleeping = true;
            rafId = null;
            return;
        }

        rafId = requestAnimationFrame(tick);
    }

    function wake() {
        lastMouseTime = performance.now();
        if (sleeping) {
            sleeping = false;
            rafId = requestAnimationFrame(tick);
        }
    }

    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!letters.length) return;

        const inRange = letters.some(function (lt) {
            const cx = arenaRect.left + lt.x + lt.w / 2;
            const cy = arenaRect.top  + lt.y + lt.h / 2;
            const dx = cx - e.clientX;
            const dy = cy - e.clientY;
            return (dx * dx + dy * dy) < REPEL_RADIUS_SQ;
        });

        if (inRange) wake();
    });

    window.addEventListener('mouseleave', function () {
        mouseX = null;
        mouseY = null;
    });

    window.addEventListener('resize', updateArenaRect);
    window.addEventListener('scroll', updateArenaRect, { passive: true });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (!sleeping) {
            rafId = requestAnimationFrame(tick);
        }
    });

    window.addEventListener('load', init);
})();
