// ==========================================================
// MUMMY THIRST — 3D GRAPHICS & ISOMETRIC CAMERA ENGINE
// Cumple con la regla fundamental:
// - Vista isométrica 3D exacta a las imágenes de referencia
// - La momia SIEMPRE permanece en el centro visual de la pantalla
// - Rotación de la cámara orbital manteniendo ángulo e inclinación constante
// ==========================================================

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Configuración de la Cámara Isométrica
    this.frustumSize = 13.5;
    this.camDistance = 42;
    // Inclinación isométrica auténtica (~35.264 grados)
    this.camPitch = Math.atan(1 / Math.SQRT2);
    // Ángulo de giro orbital horizontal (Yaw)
    this.currentYaw = Math.PI / 4; // Empieza a 45 grados como en escenario A
    this.targetYaw = Math.PI / 4;
    this.rotationSpeed = 8.0;

    // Luces
    this.sunLight = null;
    this.ambientLight = null;

    // Partículas
    this.particles = [];

    this.init();
  }

  init() {
    // 1. ESCENA Y NIEBLA AMBIENTAL
    this.scene = new THREE.Scene();
    // Niebla cálida de tormenta de arena del Sahara (como en escenario A, B y C)
    this.scene.background = new THREE.Color(0xdca35e);
    this.scene.fog = new THREE.FogExp2(0xdca35e, 0.011);

    // 2. CÁMARA ISOMÉTRICA ORTOGRÁFICA
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -this.frustumSize * aspect,
      this.frustumSize * aspect,
      this.frustumSize,
      -this.frustumSize,
      0.1,
      1000
    );

    // 3. RENDERER WEBGL CON SOMBRAS SUAVES
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. ILUMINACIÓN FIDELIDAD REFERENCIA
    this.setupLighting();

    // 5. EVENTO DE REDIMENSIONAMIENTO
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Luz ambiental cálida que ilumina las zonas de sombra de las ruinas
    this.ambientLight = new THREE.AmbientLight(0xfce0b8, 0.75);
    this.scene.add(this.ambientLight);

    // Luz del Sol desértico (Direccional con sombras definidas)
    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 1.45);
    this.sunLight.position.set(28, 45, 20);
    this.sunLight.castShadow = true;

    // Configuración de resolución y rango del shadow map
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    const shadowD = 28;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    // Luz de rebote celestial (Sky fill suave para matices celestes en los rincones)
    const skyFill = new THREE.DirectionalLight(0x82c8eb, 0.35);
    skyFill.position.set(-20, 25, -25);
    this.scene.add(skyFill);
  }

  /**
   * REGLA FUNDAMENTAL DE CÁMARA:
   * La momia permanece estrictamente en el centro de la pantalla.
   * La cámara orbita manteniendo distancia e inclinación fijas.
   */
  updateCamera(targetPos, delta) {
    // Interpolar suavemente el ángulo de giro hacia el objetivo
    this.currentYaw += (this.targetYaw - this.currentYaw) * Math.min(delta * this.rotationSpeed, 1.0);

    // Calcular posición orbital en 3D
    const offsetX = Math.sin(this.currentYaw) * Math.cos(this.camPitch) * this.camDistance;
    const offsetY = Math.sin(this.camPitch) * this.camDistance;
    const offsetZ = Math.cos(this.currentYaw) * Math.cos(this.camPitch) * this.camDistance;

    this.camera.position.set(
      targetPos.x + offsetX,
      targetPos.y + offsetY,
      targetPos.z + offsetZ
    );

    // La cámara mira exactamente al punto donde está la momia (centrado absoluto)
    this.camera.lookAt(targetPos.x, targetPos.y + 0.8, targetPos.z);

    // La luz solar se desplaza con la momia para mantener la calidad de sombras uniforme
    this.sunLight.position.set(
      targetPos.x + 28,
      targetPos.y + 45,
      targetPos.z + 20
    );
    this.sunLight.target.position.copy(targetPos);
    this.sunLight.target.updateMatrixWorld();
  }

  // Girar la vista orbital hacia la izquierda o derecha (90 grados)
  rotateCamera(direction = 1) {
    this.targetYaw += (Math.PI / 2) * direction;
  }

  // Establecer ángulo directamente (ej: al cargar una partida guardada)
  setCameraAngle(angle) {
    this.currentYaw = angle;
    this.targetYaw = angle;
  }

  /**
   * Sistema de Partículas Voxel (Polvo de ataque, derrota de araña, agua)
   */
  spawnParticles(position, color, count = 12, speed = 3.0, size = 0.12) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(position);
      // Desplazamiento aleatorio
      mesh.position.x += (Math.random() - 0.5) * 0.4;
      mesh.position.y += Math.random() * 0.4;
      mesh.position.z += (Math.random() - 0.5) * 0.4;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.9 + 1.0,
        (Math.random() - 0.5) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // Gravedad
      p.mesh.rotation.x += delta * 6;
      p.mesh.rotation.y += delta * 6;

      const scale = Math.max(0, p.life);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -this.frustumSize * aspect;
    this.camera.right = this.frustumSize * aspect;
    this.camera.top = this.frustumSize;
    this.camera.bottom = -this.frustumSize;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.GameEngine = GameEngine;
