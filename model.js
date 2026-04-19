(function() {

    // ── Tweak these ──────────────────────────────────────────────
    const HIDE_BREAKPOINT = 1440;   // hide model below this viewport width (px)

    const CAM_X     = 8;            // camera position
    const CAM_Y     = 14;
    const CAM_Z     = 32;

    const BASE_FOV   = 60;          // FOV at BASE_WIDTH container width
    const BASE_WIDTH = 500;         // reference container width for FOV scaling

    const MODEL_ROT_Y = 4;          // initial model Y rotation (radians)
    const BOB_SPEED   = 0.8;        // float bob frequency
    const BOB_AMOUNT  = 0.15;       // float bob amplitude (units)

    const AMBIENT_COLOR     = 0x1a2a4a;   // ambient light colour
    const AMBIENT_INTENSITY = 1.3;
    const DIR_COLOR         = 0x4a80ff;   // main directional light colour
    const DIR_INTENSITY     = 2;
    const FILL_COLOR        = 0x0a1628;   // fill light colour
    const FILL_INTENSITY    = 0.4;

    const FOG_COLOR   = 0x0d1b3e;
    const FOG_DENSITY = 0.02;

    const TONE_EXPOSURE = 1.3;
    // ─────────────────────────────────────────────────────────────

    const container = document.getElementById('model-container');

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(BASE_FOV, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(DIR_COLOR, DIR_INTENSITY);
    dirLight.position.set(4, 0, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(FILL_COLOR, FILL_INTENSITY);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = TONE_EXPOSURE;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    camera.position.set(CAM_X, CAM_Y, CAM_Z);

    function updateCamera() {
        const winW = window.innerWidth;

        if (winW < HIDE_BREAKPOINT) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';

        const w = container.clientWidth;
        const h = container.clientHeight;

        camera.fov    = Math.min(BASE_FOV * (BASE_WIDTH / Math.max(w, 1)), 90);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        camera.clearViewOffset();
    }

    updateCamera();

    let model;
    let mixer;
    const clock = new THREE.Clock();

    const loader = new THREE.GLTFLoader();
    loader.load('model.glb', (gltf) => {
        model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.material.envMapIntensity = 0.3;
            }
        });

        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.rotation.x = 0;
        model.rotation.z = 0;
        model.rotation.y = MODEL_ROT_Y;

        scene.add(model);

        model.traverse((child) => {
            if (child.isMesh) {
                child.material.side        = THREE.DoubleSide;
                child.material.transparent = false;
                child.material.opacity     = 1.0;
                child.material.depthWrite  = true;
                child.material.depthTest   = true;
            }
        });

        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
    });

    let animId = null;

    function animate() {
        animId = requestAnimationFrame(animate);

        const delta = clock.getDelta();

        if (model) {
            const t = clock.elapsedTime;
            model.position.y = Math.sin(t * BOB_SPEED) * BOB_AMOUNT;
        }

        if (mixer) mixer.update(delta);

        if (container.style.display !== 'none') {
            renderer.render(scene, camera);
        }
    }

    animate();

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            clock.stop();
            cancelAnimationFrame(animId);
            animId = null;
        } else if (!animId) {
            clock.start();
            animate();
        }
    });

    function syncPosition() {
        container.style.top    = (window.scrollY + 60) + 'px';
        container.style.height = (window.innerHeight - 60) + 'px';
    }
    syncPosition();

    const hero = document.getElementById('main-hero');
    window.addEventListener('scroll', () => {
        syncPosition();
        if (!hero) return;
        const heroBottom = hero.getBoundingClientRect().bottom;
        container.style.opacity = heroBottom > 0 ? '1' : '0';
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { syncPosition(); updateCamera(); }, 100);
    });
})();
