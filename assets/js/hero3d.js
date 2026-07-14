const canvas = document.getElementById('hero3d');
if (!canvas || typeof THREE === 'undefined' || !window.WebGLRenderingContext) {
    // no WebGL / library unavailable: the CSS gradient sky behind the canvas is enough of a hero.
} else {
    initScene(canvas);
}

/*
 * Massing modelled after a real exterior photo of The View Rabat: a tall slim
 * tower with a lower, wider wing attached to one side, white punched-window
 * facade (not a glass curtain wall), a vertical illuminated sign running the
 * height of the tower's front corner, and a lit ground-floor lobby band.
 */
function initScene(canvas) {
    const heroEl = canvas.closest('.hero');

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1626, 0.014);

    const camera = new THREE.PerspectiveCamera(40, heroEl.clientWidth / heroEl.clientHeight, 0.1, 100);
    camera.position.set(3.2, 3.6, 17);
    camera.lookAt(1.6, 3.4, 0);

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
        return;
    }
    renderer.setSize(heroEl.clientWidth, heroEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

    /* ---------- Real CC0 PBR texture (ambientCG Concrete034) for the wall surfaces ---------- */
    const texLoader = new THREE.TextureLoader();
    const TX = 'assets/textures/concrete/Concrete034_1K-JPG_';

    function tile(tex, x, y) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(x, y);
        return tex;
    }
    const wallColor = tile(texLoader.load(TX + 'Color.jpg'), 3, 4);
    if ('colorSpace' in wallColor) wallColor.colorSpace = THREE.SRGBColorSpace;

    // real building is a pale rendered/painted facade, not bare grey concrete —
    // tint the photo texture warm-white so it reads as painted render, not pavement.
    // (no roughness/normal maps: at this scale and lighting they just muddied the
    // tint into a dark blotch instead of reading as a clean painted wall.)
    const wallMat = new THREE.MeshStandardMaterial({
        map: wallColor,
        color: 0xf0ead8, roughness: 0.75, metalness: 0.0,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a564d, roughness: 0.8 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x46423a, roughness: 0.6, metalness: 0.15 });
    const cityMat = new THREE.MeshStandardMaterial({ color: 0x1a151c, roughness: 0.9 });

    const litWinMat = new THREE.MeshStandardMaterial({
        color: 0xf7d99a, emissive: 0xf3b25e, emissiveIntensity: 1.6, roughness: 0.4,
    });
    const unlitWinMat = new THREE.MeshStandardMaterial({
        color: 0x11131a, emissive: 0x050608, roughness: 0.5, metalness: 0.3,
    });

    /* ---------- Lighting: dusk over Rabat ---------- */
    scene.add(new THREE.HemisphereLight(0xaab0d8, 0x241f30, 2.6));
    scene.add(new THREE.AmbientLight(0x8a84a0, 1.8));

    const sunLight = new THREE.DirectionalLight(0xf3e6c8, 3.2);
    sunLight.position.set(-6, 8, 8);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x9aa8d8, 1.2);
    rimLight.position.set(6, 4, -6);
    scene.add(rimLight);

    /* ---------- Building group ---------- */
    const building = new THREE.Group();
    scene.add(building);

    const FLOOR_H = 0.4;

    function addWindowGrid(parent, floors, width, depth, z, litChance) {
        const cols = Math.max(3, Math.round(width / 0.35));
        const winGeo = new THREE.BoxGeometry(width / cols * 0.62, FLOOR_H * 0.55, 0.04);
        for (let f = 1; f < floors; f++) { // skip ground floor — handled separately
            const y = f * FLOOR_H + FLOOR_H * 0.5;
            for (let c = 0; c < cols; c++) {
                const x = (c + 0.5) / cols * width - width / 2;
                const win = new THREE.Mesh(winGeo, Math.random() < litChance ? litWinMat : unlitWinMat);
                win.position.set(x, y, z);
                parent.add(win);
            }
        }
    }

    // --- main tower (tall, narrow) ---
    const TOWER_FLOORS = 18;
    const TOWER_W = 2.1;
    const TOWER_D = 2.1;
    const towerH = TOWER_FLOORS * FLOOR_H;

    const tower = new THREE.Mesh(
        new THREE.BoxGeometry(TOWER_W, towerH, TOWER_D),
        [wallMat, wallMat, roofMat, roofMat, wallMat, wallMat]
    );
    tower.position.set(0, towerH / 2, 0);
    building.add(tower);
    addWindowGrid(tower, TOWER_FLOORS, TOWER_W, TOWER_D, TOWER_D / 2 + 0.03, 0.6);
    addWindowGrid(tower, TOWER_FLOORS, TOWER_W, TOWER_D, -(TOWER_D / 2 + 0.03), 0.5);

    // --- illuminated vertical sign along the tower's front corner ---
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, towerH * 0.92, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xdcf0ff, emissive: 0x9fe0ff, emissiveIntensity: 4.5 })
    );
    sign.position.set(-TOWER_W / 2 - 0.05, towerH * 0.5, TOWER_D / 2 + 0.05);
    building.add(sign);
    const signGlow = new THREE.PointLight(0x9fe0ff, 1.6, 4, 2);
    signGlow.position.copy(sign.position);
    signGlow.position.y = towerH * 0.75;
    building.add(signGlow);

    // --- lower wing attached to the tower's side (wider, shorter) ---
    const WING_FLOORS = 11;
    const WING_W = 4.4;
    const WING_D = 1.9;
    const wingH = WING_FLOORS * FLOOR_H;

    const wing = new THREE.Mesh(
        new THREE.BoxGeometry(WING_W, wingH, WING_D),
        [wallMat, wallMat, roofMat, roofMat, wallMat, wallMat]
    );
    wing.position.set(TOWER_W / 2 + WING_W / 2, wingH / 2, -0.15);
    building.add(wing);
    addWindowGrid(wing, WING_FLOORS, WING_W, WING_D, WING_D / 2 + 0.03, 0.55);

    const lobbyMat = new THREE.MeshStandardMaterial({ color: 0xffdca0, emissive: 0xffb15c, emissiveIntensity: 1.1, roughness: 0.5 });

    // ground-floor lit lobby band + roofline trim, one per volume so each hugs its
    // own footprint instead of one long slab stretching (and visually distorting)
    // across the gap between the two volumes.
    [
        { vol: tower, w: TOWER_W, d: TOWER_D, h: towerH },
        { vol: wing, w: WING_W, d: WING_D, h: wingH },
    ].forEach(v => {
        const lobby = new THREE.Mesh(new THREE.BoxGeometry(v.w + 0.05, FLOOR_H * 0.85, v.d + 0.05), lobbyMat);
        lobby.position.set(0, -v.h / 2 + FLOOR_H * 0.42, 0);
        v.vol.add(lobby);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(v.w + 0.08, 0.12, v.d + 0.08), trimMat);
        trim.position.set(0, v.h / 2 + 0.06, 0);
        v.vol.add(trim);
    });

    // ground disc — oversized well past the fog's falloff so its edge never shows
    const ground = new THREE.Mesh(
        new THREE.CircleGeometry(30, 48),
        new THREE.MeshStandardMaterial({ color: 0x120e14, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // distant city silhouette for scale/context
    for (let i = 0; i < 22; i++) {
        const w = 0.35 + Math.random() * 0.6;
        const h = 0.4 + Math.random() * 1.1;
        const d = 0.35 + Math.random() * 0.6;
        const blk = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cityMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 5;
        blk.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
        scene.add(blk);
    }

    building.position.set(-1.6, -1.6, 0);
    ground.position.y = -1.6;

    /* ---------- Interaction: drag to rotate, auto-rotate when idle ---------- */
    let targetRotY = 0.5;
    let currentRotY = 0.5;
    let isDragging = false;
    let lastX = 0;
    let idleTimer = null;
    let autoRotate = true;

    function onDown(x) {
        isDragging = true;
        autoRotate = false;
        lastX = x;
        clearTimeout(idleTimer);
    }
    function onMove(x) {
        if (!isDragging) return;
        const dx = x - lastX;
        lastX = x;
        targetRotY += dx * 0.01;
    }
    function onUp() {
        isDragging = false;
        idleTimer = setTimeout(() => { autoRotate = true; }, 2500);
    }

    heroEl.addEventListener('mousedown', e => onDown(e.clientX));
    window.addEventListener('mousemove', e => onMove(e.clientX));
    window.addEventListener('mouseup', onUp);
    heroEl.addEventListener('touchstart', e => onDown(e.touches[0].clientX), { passive: true });
    heroEl.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
    heroEl.addEventListener('touchend', onUp);
    heroEl.style.cursor = 'grab';
    heroEl.addEventListener('mousedown', () => heroEl.style.cursor = 'grabbing');
    window.addEventListener('mouseup', () => heroEl.style.cursor = 'grab');

    /* ---------- Render loop ---------- */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();

        if (autoRotate) targetRotY += dt * 0.09;
        currentRotY += (targetRotY - currentRotY) * 0.08;
        building.rotation.y = currentRotY;

        renderer.render(scene, camera);
    }
    animate();

    /* ---------- Resize ---------- */
    window.addEventListener('resize', () => {
        camera.aspect = heroEl.clientWidth / heroEl.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(heroEl.clientWidth, heroEl.clientHeight);
    });
}
