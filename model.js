(function() {
    const container = document.getElementById('model-container');

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);

    // Shift the view so the model appears in the left portion of the canvas,
    // leaving the right side visually open for the sidebar stack boxes.
    function applyViewOffset() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        // Render as if the canvas were 1.5x wider, showing the left portion.
        // This pans the model toward the left without moving the camera.
        camera.setViewOffset(w * 0.1, h, 0, 0, w, h);
    }
    container.appendChild(renderer.domElement);

    // Replace your current lights with these
    const ambientLight = new THREE.AmbientLight(0x1a2a4a, 1.3); // dark navy ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4a80ff, 2); // blue-tinted key light
    dirLight.position.set(4, 0, 4);
    scene.add(dirLight);

    // Add a subtle fill light from below (like space glow)
    const fillLight = new THREE.DirectionalLight(0x0a1628, 0.4);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    scene.fog = new THREE.FogExp2(0x0d1b3e, 0.023); // matches your bg color

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // slightly underexposed = more cinematic
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    camera.position.z = 18;
    camera.position.y = 14;
    camera.position.x = 0;

    applyViewOffset();

    let model;
    let mixer; // handles the animation
    const clock = new THREE.Clock();

    const loader = new THREE.GLTFLoader();
    loader.load('model.glb', (gltf) => {
        model = gltf.scene;
        // After loader.load, inside the callback:
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.envMapIntensity = 0.3; // subtle reflection of scene
            }
        });

        // Auto-center
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Initial tilt
        model.rotation.x = 0;
        model.rotation.z = 0;
        model.rotation.y = 4;

        scene.add(model);

        model.traverse((child) => {
    if (child.isMesh) {
        // Render both sides of each face
        child.material.side = THREE.DoubleSide;

        // Ensure material isn't accidentally transparent
        child.material.transparent = false;
        child.material.opacity = 1.0;

        // Fixes depth-sorting issues with overlapping meshes
        child.material.depthWrite = true;
        child.material.depthTest = true;
    }
});

        // Set up the animation mixer and play all animations
        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });
        }
    });

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta(); // time since last frame

        if (model) {
            // Floating bob
            const t = clock.elapsedTime;
            model.position.y = Math.sin(t * 0.8) * 0.15;
        }

        if (mixer) {
            mixer.update(delta); // advance the animation
        }

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        applyViewOffset();
    });
})();