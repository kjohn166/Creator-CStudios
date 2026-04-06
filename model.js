(function() {
    const container = document.getElementById('model-container');

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4ade80, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    camera.position.z = 3;
    camera.position.y = 0.5;

    let model;
    let mixer; // handles the animation
    const clock = new THREE.Clock();

    const loader = new THREE.GLTFLoader();
    loader.load('model.glb', (gltf) => {
        model = gltf.scene;

        // Auto-center
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Initial tilt
        model.rotation.x = 0;
        model.rotation.z = 0;
        model.rotation.y = 4;

        scene.add(model);

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
    });
})();