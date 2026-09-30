// ==========================================================
// MUMMY THIRST — CORE GAME LOGIC & SYSTEM CONTROLLER
// Cumple estrictamente con:
// - Momia siempre en el centro visual de la pantalla
// - Vista isométrica rotatoria alrededor de la momia
// - 10 niveles, 10 botellas por nivel, dificultad progresiva
// - 5 vidas máximas, daño de arañas, invulnerabilidad post-daño
// - +1 Vida cada 3 botellas (a las 3, 6 y 9 botellas)
// - Arañas con IA de persecución y ataque arcade de la momia
// ==========================================================

class MummyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new GameEngine(canvas);

    // Estado del juego
    this.currentLevel = 1;
    this.lives = 5;
    this.maxLives = 5;
    this.energy = 100;
    this.maxEnergy = 100;
    this.bottlesCollected = 0;
    this.totalBottlesNeeded = 10;
    this.spiderKills = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isGameWon = false;

    // Tiempos e invulnerabilidad
    this.invulnerableTimer = 0;
    this.attackCooldown = 0;
    this.stepTimer = 0;

    // Entidades en la escena
    this.mummy = null;
    this.mummyPos = new THREE.Vector3(0, 0.1, 0);
    this.mummyHeading = 0;

    this.activeSpiders = [];
    this.activeBottles = [];
    this.colliders = [];
    this.bottlePool = [];
    this.levelGroup = null;

    // Control de entrada (Teclado & Virtual)
    this.keys = {};
    this.virtualInput = { x: 0, z: 0, sprint: false, attack: false };

    // Inicializar listeners y HUD
    this.setupInputs();
    this.initHUD();

    // Loop de render
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // ==========================================================
  // INICIALIZACIÓN DEL HUD (Basado en grafica juego.png)
  // ==========================================================
  initHUD() {
    this.hudLivesRow = document.getElementById('hud-lives-row');
    this.hudEnergyBar = document.getElementById('hud-energy-bar');
    this.hudWaterCount = document.getElementById('hud-water-count');
    this.hudLevelBadge = document.getElementById('hud-level-badge');
    this.hudNotification = document.getElementById('hud-notification');

    // Generar los 5 iconos de cabezas de momia voxel (Activa vs Perdida)
    this.renderLivesHUD();
    this.updateHUD();
  }

  renderLivesHUD() {
    if (!this.hudLivesRow) return;
    this.hudLivesRow.innerHTML = '';

    for (let i = 0; i < this.maxLives; i++) {
      const head = document.createElement('div');
      head.className = `mummy-head-icon ${i < this.lives ? 'active' : 'lost'}`;
      head.id = `mummy-head-${i}`;

      // SVG Voxel que replica con exactitud la cabeza de momia de grafica juego.png
      head.innerHTML = `
        <svg viewBox="0 0 44 44" width="100%" height="100%">
          <defs>
            <linearGradient id="mummyBandage" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#f5e1c4"/>
              <stop offset="50%" stop-color="#dec098"/>
              <stop offset="100%" stop-color="#b5956c"/>
            </linearGradient>
            <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <!-- Contorno y cabeza cúbica voxel -->
          <rect x="5" y="5" width="34" height="34" rx="4" fill="#a4763a" />
          <rect x="7" y="7" width="30" height="30" rx="3" fill="url(#mummyBandage)" />
          <!-- Franjas horizontales de vendas -->
          <rect x="7" y="11" width="30" height="3" fill="#b08a5b" opacity="0.6"/>
          <rect x="7" y="18" width="30" height="4" fill="#f8e7cb" opacity="0.8"/>
          <rect x="7" y="27" width="30" height="3" fill="#a07a4b" opacity="0.7"/>
          <rect x="7" y="32" width="30" height="2" fill="#8c6437" opacity="0.5"/>
          <!-- Cuenca ocular oscura -->
          <rect x="10" y="19" width="24" height="8" rx="2" fill="#20150d" />
          <!-- Ojos brillantes dorados -->
          <rect x="13" y="21" width="5" height="4" rx="1" fill="#ffea9f" filter="url(#eyeGlow)" />
          <rect x="25" y="21" width="5" height="4" rx="1" fill="#ffea9f" filter="url(#eyeGlow)" />
        </svg>
      `;

      this.hudLivesRow.appendChild(head);
    }
  }

  updateHUD() {
    // Actualizar Vidas
    for (let i = 0; i < this.maxLives; i++) {
      const headEl = document.getElementById(`mummy-head-${i}`);
      if (headEl) {
        if (i < this.lives) {
          if (headEl.classList.contains('lost')) {
            headEl.classList.remove('lost');
            headEl.classList.add('active', 'gained');
            setTimeout(() => headEl.classList.remove('gained'), 600);
          }
        } else {
          headEl.classList.remove('active');
          headEl.classList.add('lost');
        }
      }
    }

    // Actualizar Barra de Energía
    if (this.hudEnergyBar) {
      const pct = Math.max(0, Math.min(100, (this.energy / this.maxEnergy) * 100));
      this.hudEnergyBar.style.width = `${pct}%`;
    }

    // Actualizar Contador de Botellas
    if (this.hudWaterCount) {
      this.hudWaterCount.textContent = `${this.bottlesCollected}/${this.totalBottlesNeeded}`;
    }

    // Actualizar Nivel
    if (this.hudLevelBadge) {
      const config = LevelConfigs[this.currentLevel - 1];
      this.hudLevelBadge.textContent = `NIVEL ${this.currentLevel} — ${config ? config.name : ''}`;
    }
  }

  showNotification(text, duration = 2500) {
    if (!this.hudNotification) return;
    this.hudNotification.textContent = text;
    this.hudNotification.classList.remove('hidden');
    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      this.hudNotification.classList.add('hidden');
    }, duration);
  }

  // ==========================================================
  // CARGA Y CAMBIO DE NIVELES
  // ==========================================================
  startLevel(levelNumber) {
    this.currentLevel = Math.max(1, Math.min(10, levelNumber));
    this.bottlesCollected = 0;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isPaused = false;

    // Limpiar entidades anteriores
    this.clearLevel();

    // Construir nuevo escenario 3D
    const levelData = LevelBuilder.buildLevel(this.currentLevel, this.engine.scene);
    this.levelGroup = levelData.levelGroup;
    this.colliders = levelData.colliders;
    this.bottlePool = [...levelData.bottleSpawnPool];

    // Crear Momia
    this.mummy = VoxelBuilder.createMummy();
    this.mummyPos.set(
      levelData.config.spawnPoint.x,
      levelData.config.spawnPoint.y,
      levelData.config.spawnPoint.z
    );
    this.mummy.mesh.position.copy(this.mummyPos);
    this.engine.scene.add(this.mummy.mesh);

    // Generar Arañas
    this.spawnSpiders(levelData.spiderSpawnPoints, levelData.config);

    // Generar Botellas de Agua simultáneas iniciales
    this.replenishBottles(levelData.config.maxSimultaneousBottles);

    // Actualizar Cámara Isométrica y HUD
    this.engine.updateCamera(this.mummyPos, 0.016);
    this.updateHUD();
    this.showNotification(`¡Comienza el Nivel ${this.currentLevel}: ${levelData.config.name}!`);

    // Mostrar HUD de juego
    const hud = document.getElementById('game-hud');
    if (hud) hud.classList.remove('hidden');
  }

  clearLevel() {
    // Eliminar momia previa
    if (this.mummy) {
      this.engine.scene.remove(this.mummy.mesh);
      this.mummy = null;
    }

    // Eliminar arañas
    this.activeSpiders.forEach(sp => {
      this.engine.scene.remove(sp.model.mesh);
    });
    this.activeSpiders = [];

    // Eliminar botellas
    this.activeBottles.forEach(bt => {
      this.engine.scene.remove(bt.mesh);
    });
    this.activeBottles = [];

    // Eliminar escenario
    if (this.levelGroup) {
      this.engine.scene.remove(this.levelGroup);
      this.levelGroup = null;
    }

    this.colliders = [];
    this.bottlePool = [];
  }

  // Generar Arañas con IA de patrulla y persecución
  spawnSpiders(spawnPoints, config) {
    spawnPoints.forEach(pos => {
      const spiderModel = VoxelBuilder.createSpider();
      spiderModel.mesh.position.set(pos.x, pos.y, pos.z);
      this.engine.scene.add(spiderModel.mesh);

      this.activeSpiders.push({
        model: spiderModel,
        pos: new THREE.Vector3(pos.x, pos.y, pos.z),
        origin: new THREE.Vector3(pos.x, pos.y, pos.z),
        speed: config.spiderSpeed,
        aggroRadius: config.spiderAggroRadius,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolTimer: Math.random() * 3,
        isChasing: false,
        attackCooldown: 0
      });
    });
  }

  // Rellenar botellas hasta el límite simultáneo permitido
  replenishBottles(maxSimultaneous) {
    const neededOnField = Math.min(
      maxSimultaneous,
      this.totalBottlesNeeded - this.bottlesCollected
    );

    while (this.activeBottles.length < neededOnField && this.bottlePool.length > 0) {
      // Tomar una ubicación aleatoria disponible del pool
      const randIdx = Math.floor(Math.random() * this.bottlePool.length);
      const spawn = this.bottlePool.splice(randIdx, 1)[0];

      const bottleMesh = VoxelBuilder.createWaterBottle();
      bottleMesh.position.set(spawn.x, spawn.y + 0.2, spawn.z);
      this.engine.scene.add(bottleMesh);

      this.activeBottles.push({
        mesh: bottleMesh,
        pos: new THREE.Vector3(spawn.x, spawn.y, spawn.z),
        baseY: spawn.y + 0.2,
        bobPhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ==========================================================
  // ATAQUE ARCADE DE LA MOMIA
  // ==========================================================
  mummyAttack() {
    if (this.mummy.isAttacking || this.attackCooldown > 0) return;

    this.mummy.isAttacking = true;
    this.mummy.attackCycle = 0;
    this.attackCooldown = 0.4;

    if (window.soundManager) window.soundManager.playAttack();

    // Partículas de polvo y arena por el giro de ataque
    this.engine.spawnParticles(this.mummyPos, 0xdeb06c, 16, 4.0, 0.14);

    // Rango de ataque arcade de la momia (2.2 unidades alrededor)
    const attackRange = 2.2;

    for (let i = this.activeSpiders.length - 1; i >= 0; i--) {
      const spider = this.activeSpiders[i];
      const dist = this.mummyPos.distanceTo(spider.pos);

      if (dist <= attackRange) {
        // Araña alcanzada y eliminada!
        if (window.soundManager) window.soundManager.playSpiderSquish();
        this.engine.spawnParticles(spider.pos, 0x3d2f25, 14, 3.5, 0.12);
        this.engine.spawnParticles(spider.pos, 0xff1e00, 6, 2.5, 0.08); // Chispa roja de ojos

        this.engine.scene.remove(spider.model.mesh);
        this.activeSpiders.splice(i, 1);
        this.spiderKills++;
        this.showNotification('¡Araña eliminada!', 1200);
      }
    }
  }

  // ==========================================================
  // RECOLECCIÓN DE BOTELLAS Y REGLA DE RECUPERACIÓN DE VIDAS
  // ==========================================================
  collectBottle(index) {
    const bottle = this.activeBottles[index];
    this.engine.scene.remove(bottle.mesh);
    this.activeBottles.splice(index, 1);

    this.bottlesCollected++;
    if (window.soundManager) window.soundManager.playBottlePickup();

    // Partículas brillantes de agua
    this.engine.spawnParticles(bottle.pos, 0x00d4ff, 18, 3.2, 0.10);

    // REGLA FUNDAMENTAL DE RECUPERACIÓN DE VIDAS:
    // Cada 3 botellas recogidas = +1 VIDA (a las 3, 6 y 9 botellas, máximo 5)
    if (this.bottlesCollected % 3 === 0 && this.lives < this.maxLives) {
      this.lives++;
      if (window.soundManager) window.soundManager.playHeal();
      this.showNotification(`💧 ¡3 Botellas obtenidas! +1 VIDA RECUPERADA (${this.lives}/5)`, 3000);
    } else {
      this.showNotification(`💧 ¡Botella de agua recogida! (${this.bottlesCollected}/10)`, 1500);
    }

    this.updateHUD();

    // Comprobar finalización de nivel
    if (this.bottlesCollected >= this.totalBottlesNeeded) {
      this.handleLevelComplete();
    } else {
      // Reponer botellas según la disponibilidad simultánea del nivel
      const config = LevelConfigs[this.currentLevel - 1];
      this.replenishBottles(config.maxSimultaneousBottles);
    }
  }

  handleLevelComplete() {
    this.isLevelComplete = true;
    if (window.soundManager) window.soundManager.playLevelUp();

    if (this.currentLevel >= 10) {
      // ¡Juego completado en su totalidad!
      this.isGameWon = true;
      const winModal = document.getElementById('game-win-overlay');
      if (winModal) winModal.classList.remove('hidden');
    } else {
      // Pantalla de nivel completado
      const modal = document.getElementById('level-complete-overlay');
      const statLives = document.getElementById('stat-lives');
      const statSpiders = document.getElementById('stat-spiders');
      const statNext = document.getElementById('stat-next-level');

      if (statLives) statLives.textContent = `${this.lives}/${this.maxLives}`;
      if (statSpiders) statSpiders.textContent = `${this.spiderKills}`;
      if (statNext) statNext.textContent = `NIVEL ${this.currentLevel + 1}`;
      if (modal) modal.classList.remove('hidden');
    }
  }

  // Daño recibido por araña
  takeDamage() {
    if (this.invulnerableTimer > 0 || this.isGameOver) return;

    this.lives--;
    this.invulnerableTimer = 1.6; // Breve período de invulnerabilidad
    if (window.soundManager) window.soundManager.playDamage();

    this.updateHUD();
    this.showNotification('¡Una araña te ha picado! -1 VIDA', 2000);

    // Efecto visual de temblor y sangre/daño en pantalla
    document.body.style.filter = 'sepia(0.8) hue-rotate(-50deg)';
    setTimeout(() => {
      document.body.style.filter = '';
    }, 150);

    if (this.lives <= 0) {
      this.handleGameOver();
    }
  }

  handleGameOver() {
    this.isGameOver = true;
    if (window.soundManager) window.soundManager.playGameOver();

    const gameOverModal = document.getElementById('game-over-overlay');
    if (gameOverModal) gameOverModal.classList.remove('hidden');
  }

  // ==========================================================
  // FÍSICA Y DETECCIÓN DE COLISIONES
  // ==========================================================
  checkCollision(newX, newZ, radius = 0.35) {
    for (const box of this.colliders) {
      // Verificación AABB simple contra círculo/caja del jugador
      if (
        newX + radius > box.minX &&
        newX - radius < box.maxX &&
        newZ + radius > box.minZ &&
        newZ - radius < box.maxZ
      ) {
        return true; // Hay colisión
      }
    }
    return false;
  }

  // ==========================================================
  // ACTUALIZACIÓN DE ESTADO Y LOOP PRINCIPAL
  // ==========================================================
  update(delta) {
    if (this.isPaused || this.isGameOver || this.isLevelComplete || this.isGameWon) return;

    // Reducir timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      // Parpadeo visual de invulnerabilidad
      if (this.mummy) {
        this.mummy.mesh.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
      }
    } else if (this.mummy) {
      this.mummy.mesh.visible = true;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // 1. GESTIÓN DEL MOVIMIENTO DE LA MOMIA
    this.updateMummyMovement(delta);

    // 2. IA DE LAS ARAÑAS
    this.updateSpiders(delta);

    // 3. ANIMACIÓN Y DETECCIÓN DE BOTELLAS DE AGUA
    this.updateBottles(delta);

    // 4. ACTUALIZACIÓN DE CÁMARA (Regla: momia siempre centrada)
    this.engine.updateCamera(this.mummyPos, delta);

    // 5. ACTUALIZACIÓN DE PARTÍCULAS
    this.engine.updateParticles(delta);
  }

  updateMummyMovement(delta) {
    if (!this.mummy) return;

    // Obtener vector de entrada de teclado o controles en pantalla
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    // Joystick virtual táctil
    if (this.virtualInput.x !== 0 || this.virtualInput.z !== 0) {
      inputX = this.virtualInput.x;
      inputZ = this.virtualInput.z;
    }

    const isMoving = Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05;

    // Carrera / Sprint
    const wantsSprint = (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.virtualInput.sprint) && this.energy > 5;
    const isRunning = isMoving && wantsSprint;

    // Gestión de energía de sprint
    if (isRunning) {
      this.energy = Math.max(0, this.energy - delta * 35);
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + delta * 25);
    }
    this.updateHUDEnergy();

    let moveSpeed = isRunning ? 8.2 : 5.0;

    if (isMoving && !this.mummy.isAttacking) {
      // Normalizar vector de entrada
      const len = Math.hypot(inputX, inputZ);
      const normX = inputX / (len || 1);
      const normZ = inputZ / (len || 1);

      // DIRECCIÓN RELATIVA A LA CÁMARA ISOMÉTRICA (Fundamental para controles intuitivos)
      const yaw = this.engine.currentYaw;
      const camForwardX = -Math.sin(yaw);
      const camForwardZ = -Math.cos(yaw);
      const camRightX = Math.cos(yaw);
      const camRightZ = -Math.sin(yaw);

      const worldDirX = camRightX * normX + camForwardX * normZ;
      const worldDirZ = camRightZ * normX + camForwardZ * normZ;

      // Movimiento candidato
      const stepX = worldDirX * moveSpeed * delta;
      const stepZ = worldDirZ * moveSpeed * delta;

      // Colisión con paredes y ruinas (con deslizamiento suave)
      const nextX = this.mummyPos.x + stepX;
      const nextZ = this.mummyPos.z + stepZ;

      let canMoveX = !this.checkCollision(nextX, this.mummyPos.z);
      let canMoveZ = !this.checkCollision(this.mummyPos.x, nextZ);

      if (canMoveX) this.mummyPos.x = nextX;
      if (canMoveZ) this.mummyPos.z = nextZ;

      // Orientar a la momia en la dirección de avance
      if (Math.abs(worldDirX) > 0.01 || Math.abs(worldDirZ) > 0.01) {
        this.mummyHeading = Math.atan2(worldDirX, worldDirZ);
        this.mummy.mesh.rotation.y = this.mummyHeading;
      }

      // Sonido de pasos
      this.stepTimer += delta * (isRunning ? 1.6 : 1.0);
      if (this.stepTimer > 0.32) {
        this.stepTimer = 0;
        if (window.soundManager) window.soundManager.playStep();
      }
    }

    // Actualizar posición de la momia en 3D
    this.mummy.mesh.position.x = this.mummyPos.x;
    this.mummy.mesh.position.z = this.mummyPos.z;

    // Actualizar animaciones articulares de la momia
    this.mummy.updateAnimation(delta, isMoving, isRunning, this.mummy.isAttacking);
  }

  updateHUDEnergy() {
    if (this.hudEnergyBar) {
      const pct = (this.energy / this.maxEnergy) * 100;
      this.hudEnergyBar.style.width = `${pct}%`;
    }
  }

  updateSpiders(delta) {
    this.activeSpiders.forEach(spider => {
      const distToMummy = spider.pos.distanceTo(this.mummyPos);

      // Determinar si la araña detecta a la momia
      if (distToMummy <= spider.aggroRadius) {
        spider.isChasing = true;
      } else if (distToMummy > spider.aggroRadius * 1.6) {
        spider.isChasing = false;
      }

      let moveX = 0;
      let moveZ = 0;

      if (spider.isChasing) {
        // Persecución hacia la momia
        const dir = new THREE.Vector3().subVectors(this.mummyPos, spider.pos).normalize();
        moveX = dir.x * spider.speed * delta;
        moveZ = dir.z * spider.speed * delta;

        // Orientar araña hacia la momia
        spider.model.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Si toca a la momia: Daño
        if (distToMummy < 0.75) {
          this.takeDamage();
        }
      } else {
        // Patrulla ambiental tranquila
        spider.patrolTimer -= delta;
        if (spider.patrolTimer <= 0) {
          spider.patrolAngle = Math.random() * Math.PI * 2;
          spider.patrolTimer = 2.0 + Math.random() * 3.0;
        }

        moveX = Math.sin(spider.patrolAngle) * (spider.speed * 0.45) * delta;
        moveZ = Math.cos(spider.patrolAngle) * (spider.speed * 0.45) * delta;
        spider.model.mesh.rotation.y = spider.patrolAngle;
      }

      // Evitar obstáculos básicos
      const nextX = spider.pos.x + moveX;
      const nextZ = spider.pos.z + moveZ;

      if (!this.checkCollision(nextX, spider.pos.z, 0.3)) spider.pos.x = nextX;
      if (!this.checkCollision(spider.pos.x, nextZ, 0.3)) spider.pos.z = nextZ;

      spider.model.mesh.position.x = spider.pos.x;
      spider.model.mesh.position.z = spider.pos.z;

      // Animar patas de la araña
      spider.model.animateLegs(delta, true);
    });
  }

  updateBottles(delta) {
    for (let i = this.activeBottles.length - 1; i >= 0; i--) {
      const bottle = this.activeBottles[i];

      // Animación de levitación suave y rotación cristalina
      bottle.bobPhase += delta * 2.5;
      bottle.mesh.position.y = bottle.baseY + Math.sin(bottle.bobPhase) * 0.12;
      bottle.mesh.rotation.y += delta * 1.8;

      // Comprobar colisión con la momia (recolección)
      const dist = this.mummyPos.distanceTo(bottle.pos);
      if (dist < 0.95) {
        this.collectBottle(i);
      }
    }
  }

  // ==========================================================
  // CONFIGURACIÓN DE TECLADO Y CONTROLES
  // ==========================================================
  setupInputs() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;

      // Girar cámara con Q o E
      if (e.code === 'KeyQ') this.engine.rotateCamera(1);
      if (e.code === 'KeyE') this.engine.rotateCamera(-1);

      // Ataque de la momia con Espacio
      if (e.code === 'Space') {
        e.preventDefault();
        this.mummyAttack();
      }

      // Pausa con tecla Escape
      if (e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    // Click / Tap para atacar
    this.canvas.addEventListener('click', () => {
      if (!this.isPaused && !this.isGameOver && !this.isLevelComplete) {
        this.mummyAttack();
      }
    });

    // Touch Joystick Virtual
    this.setupVirtualJoystick();
  }

  setupVirtualJoystick() {
    const zone = document.getElementById('joystick-zone');
    const stick = document.getElementById('joystick-stick');
    if (!zone || !stick) return;

    let touchId = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    zone.addEventListener('touchstart', e => {
      if (touchId === null) {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = zone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }, { passive: false });

    window.addEventListener('touchmove', e => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);

          const curX = Math.cos(angle) * clampedDist;
          const curY = Math.sin(angle) * clampedDist;

          stick.style.transform = `translate(${curX}px, ${curY}px)`;

          this.virtualInput.x = curX / maxRadius;
          this.virtualInput.z = curY / maxRadius;
        }
      }
    }, { passive: false });

    const endTouch = e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          stick.style.transform = `translate(0px, 0px)`;
          this.virtualInput.x = 0;
          this.virtualInput.z = 0;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    // Botones de acción en pantalla
    const btnAttack = document.getElementById('btn-action-attack');
    if (btnAttack) {
      btnAttack.addEventListener('click', e => {
        e.stopPropagation();
        this.mummyAttack();
      });
    }

    const btnSprint = document.getElementById('btn-action-sprint');
    if (btnSprint) {
      btnSprint.addEventListener('mousedown', () => { this.virtualInput.sprint = true; });
      btnSprint.addEventListener('mouseup', () => { this.virtualInput.sprint = false; });
      btnSprint.addEventListener('touchstart', e => { e.preventDefault(); this.virtualInput.sprint = true; });
      btnSprint.addEventListener('touchend', e => { e.preventDefault(); this.virtualInput.sprint = false; });
    }

    const btnCamL = document.getElementById('btn-cam-left');
    const btnCamR = document.getElementById('btn-cam-right');
    if (btnCamL) btnCamL.addEventListener('click', () => this.engine.rotateCamera(1));
    if (btnCamR) btnCamR.addEventListener('click', () => this.engine.rotateCamera(-1));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const modal = document.getElementById('pause-overlay');
    if (modal) {
      if (this.isPaused) modal.classList.remove('hidden');
      else modal.classList.add('hidden');
    }
  }

  // ==========================================================
  // EXPORTAR / IMPORTAR ESTADO (PRESETS & GUARDADO)
  // ==========================================================
  getCurrentState() {
    return {
      level: this.currentLevel,
      lives: this.lives,
      bottlesCollected: this.bottlesCollected,
      energy: this.energy,
      cameraAngle: this.engine.currentYaw,
      mummyX: this.mummyPos.x,
      mummyZ: this.mummyPos.z
    };
  }

  loadState(state) {
    this.currentLevel = state.level || 1;
    this.lives = Math.min(5, Math.max(1, state.lives || 5));
    this.energy = state.energy !== undefined ? state.energy : 100;
    this.startLevel(this.currentLevel);

    // Restaurar botellas recogidas si las hubiera
    this.bottlesCollected = state.bottlesCollected || 0;
    if (state.cameraAngle !== undefined) {
      this.engine.setCameraAngle(state.cameraAngle);
    }
    if (state.scenarioConfig && state.scenarioConfig.mummyX !== undefined) {
      this.mummyPos.x = state.scenarioConfig.mummyX;
      this.mummyPos.z = state.scenarioConfig.mummyZ;
    }

    this.updateHUD();
    this.showNotification(`¡Partida cargada: Nivel ${this.currentLevel}!`, 2500);
  }

  // Loop de Renderizado
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.update(delta);
    this.engine.render();
  }
}

window.MummyGame = MummyGame;
