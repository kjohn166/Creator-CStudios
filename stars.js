(function () {
    const scene = document.getElementById('stars');
    if (!scene) return;

    // ── bgCanvas: tall, static, drawn once — browser composites on scroll ──
    const bgCanvas = document.createElement('canvas');
    bgCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    scene.appendChild(bgCanvas);
    const bgCtx = bgCanvas.getContext('2d');

    // ── fxCanvas: fixed viewport overlay — constellation animation only ──
    const fxCanvas = document.createElement('canvas');
    fxCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    scene.appendChild(fxCanvas);
    const fxCtx = fxCanvas.getContext('2d');

    let rafId       = null;
    let twinkleT    = 0;
    let lastTwinkle = 0;
    let scrollY     = 0;
    let scrollDirty = false;
    let lastDrawScrollY = -1;
    const TWINKLE_MS = 80;

    window.addEventListener('scroll', function () {
        scrollY     = window.scrollY || 0;
        scrollDirty = true;
    }, { passive: true });

    // ── Constellations (normalized to viewport 0–1) ───────────────────────
    const CONSTELLATIONS = [
        {
            // GEMINI
            points: [
                { x: 0.065, y: 0.040 }, { x: 0.135, y: 0.048 },
                { x: 0.052, y: 0.100 }, { x: 0.040, y: 0.158 },
                { x: 0.030, y: 0.225 }, { x: 0.118, y: 0.118 },
                { x: 0.100, y: 0.188 }, { x: 0.088, y: 0.248 },
            ],
            edges: [[0,1],[0,2],[2,3],[3,4],[1,5],[5,6],[6,7],[2,5]],
        },
        {
            // URSA MAJOR
            points: [
                { x: 0.920, y: 0.050 }, { x: 0.918, y: 0.148 },
                { x: 0.822, y: 0.165 }, { x: 0.810, y: 0.068 },
                { x: 0.745, y: 0.088 }, { x: 0.668, y: 0.172 },
                { x: 0.578, y: 0.268 },
            ],
            edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]],
        },
        {
            // ORION
            points: [
                { x: 0.845, y: 0.455 }, { x: 0.928, y: 0.530 },
                { x: 0.762, y: 0.542 }, { x: 0.910, y: 0.648 },
                { x: 0.852, y: 0.660 }, { x: 0.795, y: 0.672 },
                { x: 0.818, y: 0.818 }, { x: 0.930, y: 0.800 },
            ],
            edges: [[0,1],[0,2],[1,3],[2,5],[3,4],[4,5],[5,6],[3,7]],
        },
        {
            // SCORPIUS
            points: [
                { x: 0.540, y: 0.378 }, { x: 0.482, y: 0.372 },
                { x: 0.422, y: 0.380 }, { x: 0.484, y: 0.440 },
                { x: 0.512, y: 0.520 }, { x: 0.572, y: 0.462 },
                { x: 0.592, y: 0.580 }, { x: 0.622, y: 0.635 },
                { x: 0.642, y: 0.682 }, { x: 0.632, y: 0.732 },
                { x: 0.578, y: 0.775 }, { x: 0.502, y: 0.790 },
                { x: 0.432, y: 0.772 }, { x: 0.382, y: 0.730 },
                { x: 0.342, y: 0.712 },
            ],
            edges: [
                [2,1],[1,0],[1,3],[3,4],[4,5],
                [5,6],[6,7],[7,8],[8,9],[9,10],
                [10,11],[11,12],[12,13],[13,14],
            ],
        },
        {
            // LEO
            points: [
                { x: 0.098, y: 0.580 }, { x: 0.118, y: 0.638 },
                { x: 0.108, y: 0.698 }, { x: 0.138, y: 0.750 },
                { x: 0.178, y: 0.798 }, { x: 0.198, y: 0.878 },
                { x: 0.262, y: 0.840 }, { x: 0.272, y: 0.758 },
                { x: 0.338, y: 0.698 },
            ],
            edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[3,7]],
        },
    ];

    // ── Background star rendering (static, drawn once) ────────────────────
    function getPageHeight() {
        return Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            window.innerHeight
        );
    }

    function renderBg() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        bgCanvas.width  = w;
        bgCanvas.height = h;

        const count = Math.floor((w * h) / 1500);
        bgCtx.clearRect(0, 0, w, h);
        bgCtx.fillStyle = 'white';

        for (let i = 0; i < count; i++) {
            // Power > 1 biases y toward top
            const x = Math.random() * w;
            const y = h * Math.pow(Math.random(), 1.6);
            // Random opacity baked in (no animation needed)
            bgCtx.globalAlpha = 0.15 + Math.random() * 0.75;
            bgCtx.fillRect(x, y, 2, 2);
        }
        bgCtx.globalAlpha = 1;
    }

    // ── Constellation fx rendering (animated, fixed canvas) ───────────────
    function resizeFx() {
        fxCanvas.width  = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }

    function drawConstellationStar(ctx, x, y, alpha) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        const arm = 2.2 * 3.2;
        ctx.beginPath();
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
        ctx.stroke();
    }

    function drawFx(time) {
        rafId = requestAnimationFrame(drawFx);

        const ticked = time - lastTwinkle >= TWINKLE_MS;
        if (ticked) {
            twinkleT    = time * 0.001;
            lastTwinkle = time;
        }

        // skip redraw if nothing changed
        if (!ticked && !scrollDirty) return;
        scrollDirty = false;

        const w  = fxCanvas.width;
        const h  = fxCanvas.height;
        const vH = window.innerHeight;
        fxCtx.clearRect(0, 0, w, h);

        fxCtx.shadowBlur  = 0;
        fxCtx.strokeStyle = 'rgba(200, 225, 255, 0.22)';
        fxCtx.lineWidth   = 1.0;
        fxCtx.fillStyle   = 'white';

        for (let c = 0; c < CONSTELLATIONS.length; c++) {
            const con = CONSTELLATIONS[c];
            const pts = con.points;
            const n   = pts.length;

            const sx = new Float32Array(n);
            const sy = new Float32Array(n);
            let minY =  Infinity, maxY = -Infinity;
            for (let p = 0; p < n; p++) {
                sx[p] = pts[p].x * w;
                sy[p] = pts[p].y * vH - scrollY;
                if (sy[p] < minY) minY = sy[p];
                if (sy[p] > maxY) maxY = sy[p];
            }
            if (maxY < -20 || minY > h + 20) continue;

            fxCtx.globalAlpha = 1;
            fxCtx.beginPath();
            for (let e = 0; e < con.edges.length; e++) {
                const a = con.edges[e][0], b = con.edges[e][1];
                fxCtx.moveTo(sx[a], sy[a]);
                fxCtx.lineTo(sx[b], sy[b]);
            }
            fxCtx.stroke();

            fxCtx.strokeStyle = 'rgba(255,255,255,0.50)';
            fxCtx.lineWidth   = 0.7;
            for (let p = 0; p < n; p++) {
                const pulse = 0.68 + 0.22 * Math.sin(twinkleT * 0.5 + c * 1.9 + p * 1.3);
                drawConstellationStar(fxCtx, sx[p], sy[p], pulse);
            }

            fxCtx.strokeStyle = 'rgba(200, 225, 255, 0.22)';
            fxCtx.lineWidth   = 1.0;
        }
    }

    // ── Init ─────────────────────────────────────────────────────────────
    renderBg();
    resizeFx();
    rafId = requestAnimationFrame(drawFx);

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
        else if (!rafId)      { rafId = requestAnimationFrame(drawFx); }
    });

    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            renderBg();
            resizeFx();
        }, 200);
    });

    /* bgCanvas is now fixed-viewport — no body resize observer needed */
})();
