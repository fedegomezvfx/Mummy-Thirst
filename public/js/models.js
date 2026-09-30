// ==========================================================
// MUMMY THIRST — 3D VOXEL MODELS FACTORY
// Modelos 3D reconstruidos fielmente de las referencias gráficas:
// - personaje momia.png (Momia detallada con vendajes y proporciones exactas)
// - escenario A.png / B.png / C.png (Arquitectura egipcia, columnas, templos, arañas)
// - grafica juego.png (Botella de agua y elementos coleccionables)
// ==========================================================

const VoxelColors = {
  // Paleta de Vendajes de la Momia (personaje momia.png)
  mummyBase: 0xdec098,
  mummyShadow: 0xb5956c,
  mummyDark: 0x8a6c47,
  mummyLight: 0xf0d9b8,
  mummyEyeSocket: 0x221810,
  mummyEyeGlow: 0xffea9f,
  mummyMouth: 0x18100a,

  // Paleta de la Araña (escenario A.png & Menu.png)
  spiderBody: 0x28201a,
  spiderAbdomen: 0x3d2f25,
  spiderLeg: 0x1f1814,
  spiderEye: 0xff1e00,

  // Paleta de Botella de Agua (grafica juego.png)
  waterBody: 0x00a8e8,
  waterCyan: 0x007ea7,
  waterCap: 0xdff4fc,
  waterHighlight: 0xffffff,

  // Paleta de Ruinas Egipcias (escenario A, B, C)
  sandstoneLight: 0xdeb06c,
  sandstoneMid: 0xc8964d,
  sandstoneDark: 0xa67431,
  sandstoneShadow: 0x6e461b,
  sandGround: 0xebb874,
  clayPot: 0xba5832
};

// Material cache for optimal performance and unified aesthetics
const MatCache = {
  get(color, opts = {}) {
    const key = color + '_' + JSON.stringify(opts);
    if (!this[key]) {
      this[key] = new THREE.MeshLambertMaterial({
        color: color,
        flatShading: true,
        ...opts
      });
    }
    return this[key];
  }
};

class VoxelBuilder {
  /**
   * Helper para crear un bloque voxel con material Lambert
   */
  static box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = MatCache.get(color, opts);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ==========================================================
  // 1. MODELO DE LA MOMIA (Basado exactamente en personaje momia.png)
  // ==========================================================
  static createMummy() {
    const mummyGroup = new THREE.Group();
    mummyGroup.name = 'mummy_root';

    // Dimensiones proporcionales basadas en la hoja de modelo de referencia
    const s = 0.08; // Factor de escala para voxel art equilibrado

    // --- CABEZA ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0);

    // Núcleo de la cabeza (cuboide voxel con vendajes superpuestos)
    const headCore = this.box(0.55, 0.52, 0.52, VoxelColors.mummyBase, 0, 0, 0);
    headGroup.add(headCore);

    // Vendajes salientes en la cabeza para relieve voxel
    const headWrapTop = this.box(0.57, 0.12, 0.54, VoxelColors.mummyLight, 0, 0.18, 0);
    const headWrapMid = this.box(0.58, 0.10, 0.55, VoxelColors.mummyShadow, 0, 0.02, 0);
    const headWrapBack = this.box(0.56, 0.35, 0.15, VoxelColors.mummyDark, 0, 0, -0.22);
    headGroup.add(headWrapTop, headWrapMid, headWrapBack);

    // Cuenca ocular hundida (franja oscura horizontal característica)
    const eyeBand = this.box(0.52, 0.14, 0.10, VoxelColors.mummyEyeSocket, 0, 0.02, 0.23);
    headGroup.add(eyeBand);

    // Ojos brillantes cálidos dentro de la cuenca
    const eyeLeft = this.box(0.10, 0.09, 0.06, VoxelColors.mummyEyeGlow, -0.13, 0.02, 0.26, {
      emissive: 0xffea9f,
      emissiveIntensity: 0.7
    });
    const eyeRight = this.box(0.10, 0.09, 0.06, VoxelColors.mummyEyeGlow, 0.13, 0.02, 0.26, {
      emissive: 0xffea9f,
      emissiveIntensity: 0.7
    });
    headGroup.add(eyeLeft, eyeRight);

    // Hendidura de la boca
    const mouth = this.box(0.22, 0.05, 0.06, VoxelColors.mummyMouth, 0, -0.14, 0.24);
    headGroup.add(mouth);

    mummyGroup.add(headGroup);

    // --- CUELLO ---
    const neck = this.box(0.20, 0.12, 0.20, VoxelColors.mummyShadow, 0, 1.05, 0);
    mummyGroup.add(neck);

    // --- TORSO ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.85, 0);

    // Bloques del torso con vendajes escalonados (como en el render 3D)
    const chest = this.box(0.44, 0.38, 0.30, VoxelColors.mummyBase, 0, 0.05, 0);
    const abdomen = this.box(0.38, 0.25, 0.26, VoxelColors.mummyShadow, 0, -0.16, 0);
    // Vendas cruzadas diagonales
    const chestStrap1 = this.box(0.46, 0.08, 0.32, VoxelColors.mummyLight, 0, 0.12, 0);
    chestStrap1.rotation.z = 0.15;
    const chestStrap2 = this.box(0.46, 0.08, 0.32, VoxelColors.mummyDark, 0, -0.04, 0);
    chestStrap2.rotation.z = -0.12;

    torsoGroup.add(chest, abdomen, chestStrap1, chestStrap2);
    mummyGroup.add(torsoGroup);

    // --- BRAZOS ---
    // Brazo Izquierdo
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.29, 0.95, 0);
    const leftBicep = this.box(0.13, 0.26, 0.13, VoxelColors.mummyBase, 0, -0.13, 0);
    const leftForearm = this.box(0.12, 0.28, 0.12, VoxelColors.mummyShadow, 0, -0.38, 0);
    const leftHand = this.box(0.14, 0.10, 0.14, VoxelColors.mummyLight, 0, -0.54, 0);
    leftArmGroup.add(leftBicep, leftForearm, leftHand);
    mummyGroup.add(leftArmGroup);

    // Brazo Derecho
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.29, 0.95, 0);
    const rightBicep = this.box(0.13, 0.26, 0.13, VoxelColors.mummyBase, 0, -0.13, 0);
    const rightForearm = this.box(0.12, 0.28, 0.12, VoxelColors.mummyShadow, 0, -0.38, 0);
    const rightHand = this.box(0.14, 0.10, 0.14, VoxelColors.mummyLight, 0, -0.54, 0);
    rightArmGroup.add(rightBicep, rightForearm, rightHand);
    mummyGroup.add(rightArmGroup);

    // --- PIERNAS ---
    // Pierna Izquierda
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.13, 0.58, 0);
    const leftThigh = this.box(0.14, 0.30, 0.14, VoxelColors.mummyBase, 0, -0.15, 0);
    const leftShin = this.box(0.13, 0.28, 0.13, VoxelColors.mummyShadow, 0, -0.42, 0);
    const leftFoot = this.box(0.15, 0.08, 0.24, VoxelColors.mummyDark, 0, -0.58, 0.04);
    leftLegGroup.add(leftThigh, leftShin, leftFoot);
    mummyGroup.add(leftLegGroup);

    // Pierna Derecha
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.13, 0.58, 0);
    const rightThigh = this.box(0.14, 0.30, 0.14, VoxelColors.mummyBase, 0, -0.15, 0);
    const rightShin = this.box(0.13, 0.28, 0.13, VoxelColors.mummyShadow, 0, -0.42, 0);
    const rightFoot = this.box(0.15, 0.08, 0.24, VoxelColors.mummyDark, 0, -0.58, 0.04);
    rightLegGroup.add(rightThigh, rightShin, rightFoot);
    mummyGroup.add(rightLegGroup);

    // Empaque con referencias de articulaciones para animación en tiempo real
    return {
      mesh: mummyGroup,
      head: headGroup,
      torso: torsoGroup,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      walkCycle: 0,
      attackCycle: 0,
      isAttacking: false,

      // Actualizador de animaciones
      updateAnimation(delta, isMoving, isRunning, isAttacking) {
        if (isAttacking) {
          this.attackCycle += delta * 12;
          const swing = Math.sin(this.attackCycle);
          // Giro dinámico de ataque / golpe con remolino de vendajes
          this.mesh.rotation.y += delta * 24;
          this.leftArm.rotation.x = -1.2 + swing * 0.5;
          this.rightArm.rotation.x = -1.2 - swing * 0.5;
          this.leftArm.rotation.z = -1.1;
          this.rightArm.rotation.z = 1.1;
          if (this.attackCycle >= Math.PI * 2) {
            this.isAttacking = false;
            this.attackCycle = 0;
            this.leftArm.rotation.set(0, 0, 0);
            this.rightArm.rotation.set(0, 0, 0);
          }
          return;
        }

        if (isMoving) {
          const speed = isRunning ? 16 : 9;
          this.walkCycle += delta * speed;
          const stride = Math.sin(this.walkCycle);

          // Balanceo natural de extremidades opuestas
          this.leftArm.rotation.x = stride * 0.75;
          this.rightArm.rotation.x = -stride * 0.75;
          this.leftLeg.rotation.x = -stride * 0.85;
          this.rightLeg.rotation.x = stride * 0.85;

          // Ligero rebote vertical y balanceo de cabeza
          this.mesh.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.08;
          this.head.rotation.y = Math.sin(this.walkCycle * 0.5) * 0.12;
          this.torso.rotation.y = Math.sin(this.walkCycle) * 0.08;
        } else {
          // Animación de respiración / Idle
          this.walkCycle += delta * 2;
          const breathe = Math.sin(this.walkCycle);
          this.mesh.position.y = breathe * 0.02;
          this.head.rotation.x = 0.05 + breathe * 0.03;
          this.leftArm.rotation.set(breathe * 0.04, 0, 0.08);
          this.rightArm.rotation.set(breathe * 0.04, 0, -0.08);
          this.leftLeg.rotation.set(0, 0, 0);
          this.rightLeg.rotation.set(0, 0, 0);
        }
      }
    };
  }

  // ==========================================================
  // 2. MODELO DE LA ARAÑA (Basado en escenario A.png y Menu.png)
  // ==========================================================
  static createSpider() {
    const spiderGroup = new THREE.Group();
    spiderGroup.name = 'spider_root';

    // Cefalotórax (cabeza frontal)
    const head = this.box(0.24, 0.14, 0.22, VoxelColors.spiderBody, 0, 0.12, 0.10);
    // Abdomen posterior abultado
    const abdomen = this.box(0.32, 0.20, 0.36, VoxelColors.spiderAbdomen, 0, 0.15, -0.16);
    spiderGroup.add(head, abdomen);

    // Ojos rojos brillantes
    const eyeL = this.box(0.05, 0.05, 0.04, VoxelColors.spiderEye, -0.06, 0.14, 0.21, {
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    });
    const eyeR = this.box(0.05, 0.05, 0.04, VoxelColors.spiderEye, 0.06, 0.14, 0.21, {
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    });
    spiderGroup.add(eyeL, eyeR);

    // 8 Patas articuladas en forma de arco (4 por lado)
    const legs = [];
    const zOffsets = [0.12, 0.02, -0.08, -0.18];

    for (let i = 0; i < 4; i++) {
      const z = zOffsets[i];

      // Pata Izquierda
      const legLGroup = new THREE.Group();
      legLGroup.position.set(-0.14, 0.12, z);
      const upperL = this.box(0.18, 0.05, 0.05, VoxelColors.spiderLeg, -0.09, 0.05, 0);
      upperL.rotation.z = 0.45;
      const lowerL = this.box(0.05, 0.16, 0.05, VoxelColors.spiderLeg, -0.20, -0.05, 0);
      legLGroup.add(upperL, lowerL);
      spiderGroup.add(legLGroup);
      legs.push({ group: legLGroup, side: -1, phase: i * 0.7 });

      // Pata Derecha
      const legRGroup = new THREE.Group();
      legRGroup.position.set(0.14, 0.12, z);
      const upperR = this.box(0.18, 0.05, 0.05, VoxelColors.spiderLeg, 0.09, 0.05, 0);
      upperR.rotation.z = -0.45;
      const lowerR = this.box(0.05, 0.16, 0.05, VoxelColors.spiderLeg, 0.20, -0.05, 0);
      legRGroup.add(upperR, lowerR);
      spiderGroup.add(legRGroup);
      legs.push({ group: legRGroup, side: 1, phase: i * 0.7 + Math.PI });
    }

    return {
      mesh: spiderGroup,
      legs: legs,
      walkCycle: Math.random() * 10,
      animateLegs(delta, isMoving) {
        if (isMoving) {
          this.walkCycle += delta * 18;
          this.legs.forEach(leg => {
            const swing = Math.sin(this.walkCycle + leg.phase);
            leg.group.rotation.y = swing * 0.35;
            leg.group.rotation.x = Math.cos(this.walkCycle + leg.phase) * 0.25;
          });
        }
      }
    };
  }

  // ==========================================================
  // 3. MODELO DE BOTELLA DE AGUA (Basado en grafica juego.png)
  // ==========================================================
  static createWaterBottle() {
    const bottleGroup = new THREE.Group();
    bottleGroup.name = 'water_bottle_root';

    // Base y cuerpo del agua (celeste refrescante brillante)
    const base = this.box(0.26, 0.38, 0.26, VoxelColors.waterBody, 0, 0.20, 0, {
      transparent: true,
      opacity: 0.88,
      emissive: 0x007ea7,
      emissiveIntensity: 0.35
    });
    // Capa interna de agua azul intenso
    const waterCore = this.box(0.20, 0.32, 0.20, VoxelColors.waterCyan, 0, 0.18, 0);

    // Cuello de la botella
    const neck = this.box(0.14, 0.12, 0.14, VoxelColors.waterBody, 0, 0.44, 0);

    // Tapa de botella (blanca / celeste claro)
    const cap = this.box(0.16, 0.08, 0.16, VoxelColors.waterCap, 0, 0.52, 0, {
      emissive: 0xffffff,
      emissiveIntensity: 0.4
    });

    // Franja decorativa de brillo vertical
    const shine = this.box(0.04, 0.34, 0.27, VoxelColors.waterHighlight, 0.08, 0.21, 0, {
      transparent: true,
      opacity: 0.5
    });

    bottleGroup.add(base, waterCore, neck, cap, shine);

    // Pequeño pedestal de luz bajo la botella
    const auraGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 8);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.y = 0.01;
    bottleGroup.add(auraMesh);

    return bottleGroup;
  }

  // ==========================================================
  // 4. ARQUITECTURA EGIPCIA (escenario A, B, C)
  // ==========================================================

  // Columna Egipcia completa con capitel esculpido
  static createColumn(height = 3) {
    const colGroup = new THREE.Group();

    // Base cuadrada escalonada
    const base1 = this.box(0.9, 0.2, 0.9, VoxelColors.sandstoneDark, 0, 0.1, 0);
    const base2 = this.box(0.75, 0.15, 0.75, VoxelColors.sandstoneMid, 0, 0.25, 0);
    colGroup.add(base1, base2);

    // Fuste de la columna con anillos de piedra
    const shaft = this.box(0.5, height, 0.5, VoxelColors.sandstoneLight, 0, 0.3 + height / 2, 0);
    colGroup.add(shaft);

    // Franjas de relieve en la columna
    const ring1 = this.box(0.55, 0.12, 0.55, VoxelColors.sandstoneMid, 0, 0.3 + height * 0.33, 0);
    const ring2 = this.box(0.55, 0.12, 0.55, VoxelColors.sandstoneMid, 0, 0.3 + height * 0.66, 0);
    colGroup.add(ring1, ring2);

    // Capitel acampanado egipcio en la cúspide
    const cap1 = this.box(0.75, 0.2, 0.75, VoxelColors.sandstoneMid, 0, 0.3 + height + 0.1, 0);
    const cap2 = this.box(0.95, 0.25, 0.95, VoxelColors.sandstoneLight, 0, 0.3 + height + 0.3, 0);
    colGroup.add(cap1, cap2);

    return colGroup;
  }

  // Portal / Arco de Templo Egipcio con Dintel Masivo
  static createTempleArch(width = 3.5, height = 3.5) {
    const archGroup = new THREE.Group();

    // Pilar Izquierdo
    const pilarL = this.box(0.8, height, 0.8, VoxelColors.sandstoneLight, -width / 2 + 0.4, height / 2, 0);
    // Pilar Derecho
    const pilarR = this.box(0.8, height, 0.8, VoxelColors.sandstoneLight, width / 2 - 0.4, height / 2, 0);

    // Dintel Superior Masivo
    const lintel = this.box(width + 0.6, 0.6, 1.1, VoxelColors.sandstoneMid, 0, height + 0.3, 0);
    const cornice = this.box(width + 1.0, 0.3, 1.3, VoxelColors.sandstoneLight, 0, height + 0.7, 0);

    archGroup.add(pilarL, pilarR, lintel, cornice);
    return archGroup;
  }

  // Estatua Voxel del Faraón Sedente (como en escenario A.png y Menu.png)
  static createPharaohStatue() {
    const statueGroup = new THREE.Group();

    // Trono de piedra
    const throneBase = this.box(1.0, 0.5, 1.2, VoxelColors.sandstoneDark, 0, 0.25, 0);
    const throneBack = this.box(1.0, 1.8, 0.3, VoxelColors.sandstoneMid, 0, 1.1, -0.45);
    statueGroup.add(throneBase, throneBack);

    // Cuerpo sedente del Faraón
    const legs = this.box(0.65, 0.5, 0.7, VoxelColors.sandstoneLight, 0, 0.65, 0.15);
    const torso = this.box(0.6, 0.7, 0.45, VoxelColors.sandstoneMid, 0, 1.15, -0.1);
    const nemesHead = this.box(0.5, 0.5, 0.5, VoxelColors.sandstoneLight, 0, 1.7, -0.1);
    const nemesFlaps = this.box(0.7, 0.4, 0.4, VoxelColors.sandstoneDark, 0, 1.6, -0.05);

    statueGroup.add(legs, torso, nemesHead, nemesFlaps);
    return statueGroup;
  }

  // Vasija / Urna de Barro Voxel
  static createUrn() {
    const urn = new THREE.Group();
    const b1 = this.box(0.35, 0.35, 0.35, VoxelColors.clayPot, 0, 0.20, 0);
    const b2 = this.box(0.42, 0.25, 0.42, 0xa34a26, 0, 0.35, 0);
    const neck = this.box(0.24, 0.15, 0.24, VoxelColors.clayPot, 0, 0.52, 0);
    const rim = this.box(0.30, 0.06, 0.30, 0xa34a26, 0, 0.60, 0);
    urn.add(b1, b2, neck, rim);
    return urn;
  }

  // Escalera de piedra arenisca
  static createStairs(steps = 4, width = 2, stepHeight = 0.25, stepDepth = 0.5) {
    const stairsGroup = new THREE.Group();
    for (let i = 0; i < steps; i++) {
      const h = (i + 1) * stepHeight;
      const stepMesh = this.box(
        width,
        stepHeight,
        stepDepth,
        (i % 2 === 0) ? VoxelColors.sandstoneMid : VoxelColors.sandstoneLight,
        0,
        i * stepHeight + stepHeight / 2,
        i * stepDepth
      );
      stairsGroup.add(stepMesh);
    }
    return stairsGroup;
  }
}

window.VoxelBuilder = VoxelBuilder;
window.VoxelColors = VoxelColors;
