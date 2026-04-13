(function() {
    const container = document.getElementById('model-container');

    // Minimum width (px) at which the 3D model is shown.
    // Below this the container is hidden via CSS and we skip rendering.
    const HIDE_BREAKPOINT = 500;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0x1a2a4a, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4a80ff, 2);
    dirLight.position.set(4, 0, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x0a1628, 0.4);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    scene.fog = new THREE.FogExp2(0x0d1b3e, 0.023);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Camera is fixed in world space — only FOV changes on resize.
    // Y=14 / Z=18 gives the original cinematic downward angle.
    camera.position.set(8, 14, 18);

    // Reference container width at which FOV=50 looks correct.
    const BASE_FOV   = 50;
    const BASE_WIDTH = 500;

    /**
     * Called on load and every resize.
     * - Hides the container below HIDE_BREAKPOINT px.
     * - Widens the FOV proportionally on narrower containers so the model
     *   always fits fully within the canvas with comfortable margins.
     * - Never touches camera position or fog — those stay constant.
     */
    function updateCamera() {
        const winW = window.innerWidth;

        if (winW < HIDE_BREAKPOINT) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';

        const w = container.clientWidth;
        const h = container.clientHeight;

        // Widen FOV as the container shrinks so the model always fits.
        // Clamp between BASE_FOV (desktop) and 90° (very narrow).
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

        // Auto-center
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Initial tilt
        model.rotation.x = 0;
        model.rotation.z = 0;
        model.rotation.y = 4;

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

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        if (model) {
            const t = clock.elapsedTime;
            model.position.y = Math.sin(t * 0.8) * 0.15;
        }

        if (mixer) mixer.update(delta);

        // Only render when the container is visible
        if (container.style.display !== 'none') {
            renderer.render(scene, camera);
        }
    }
    animate();

    // Debounced resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateCamera, 100);
    });
})();