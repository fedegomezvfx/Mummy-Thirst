// ==========================================================
// MUMMY THIRST — 10 NIVELES Y PROGRESIÓN DE DIFICULTAD
// Cumple con la regla fundamental:
// - 10 Niveles con 10 botellas a recolectar por nivel
// - A mayor nivel: MÁS ARAÑAS + MENOS BOTELLAS SIMULTÁNEAS
// - Escenarios 3D con ruinas, templos, desniveles, puentes y colisiones
// ==========================================================

const LevelConfigs = [
  {
    level: 1,
    name: 'Atrio de la Gran Pirámide',
    spiders: 3,
    maxSimultaneousBottles: 10,
    spiderSpeed: 1.8,
    spiderAggroRadius: 7.0,
    worldSize: { w: 26, d: 26 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xe2ad58
  },
  {
    level: 2,
    name: 'El Paso de las Columnas',
    spiders: 4,
    maxSimultaneousBottles: 8,
    spiderSpeed: 1.9,
    spiderAggroRadius: 7.5,
    worldSize: { w: 30, d: 30 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xdeb06c
  },
  {
    level: 3,
    name: 'Ruinas del Oasis Enterrado',
    spiders: 5,
    maxSimultaneousBottles: 7,
    spiderSpeed: 2.0,
    spiderAggroRadius: 8.0,
    worldSize: { w: 32, d: 32 },
    spawnPoint: { x: -2, y: 0.1, z: 0 },
    themeColor: 0xebb874
  },
  {
    level: 4,
    name: 'Santuario de Horus',
    spiders: 6,
    maxSimultaneousBottles: 6,
    spiderSpeed: 2.1,
    spiderAggroRadius: 8.5,
    worldSize: { w: 34, d: 34 },
    spawnPoint: { x: 0, y: 0.1, z: -2 },
    themeColor: 0xd8a45b
  },
  {
    level: 5,
    name: 'El Gran Puente del Desfiladero',
    spiders: 7,
    maxSimultaneousBottles: 5,
    spiderSpeed: 2.2,
    spiderAggroRadius: 9.0,
    worldSize: { w: 36, d: 36 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xcaa060
  },
  {
    level: 6,
    name: 'Templo de las Cuatro Cámaras',
    spiders: 8,
    maxSimultaneousBottles: 5,
    spiderSpeed: 2.3,
    spiderAggroRadius: 9.5,
    worldSize: { w: 38, d: 38 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xdeb06c
  },
  {
    level: 7,
    name: 'La Cripta Solar del Nilo',
    spiders: 9,
    maxSimultaneousBottles: 4,
    spiderSpeed: 2.4,
    spiderAggroRadius: 10.0,
    worldSize: { w: 40, d: 40 },
    spawnPoint: { x: 0, y: 0.1, z: -3 },
    themeColor: 0xd99f52
  },
  {
    level: 8,
    name: 'El Laberinto de Piedra Ancestral',
    spiders: 10,
    maxSimultaneousBottles: 3,
    spiderSpeed: 2.5,
    spiderAggroRadius: 10.5,
    worldSize: { w: 42, d: 42 },
    spawnPoint: { x: -3, y: 0.1, z: -3 },
    themeColor: 0xcca366
  },
  {
    level: 9,
    name: 'Garganta de los Escorpiones y Arañas',
    spiders: 12,
    maxSimultaneousBottles: 3,
    spiderSpeed: 2.6,
    spiderAggroRadius: 11.0,
    worldSize: { w: 44, d: 44 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xd49b4d
  },
  {
    level: 10,
    name: 'El Santuario del Agua Eterna',
    spiders: 14,
    maxSimultaneousBottles: 2,
    spiderSpeed: 2.7,
    spiderAggroRadius: 12.0,
    worldSize: { w: 46, d: 46 },
    spawnPoint: { x: 0, y: 0.1, z: 0 },
    themeColor: 0xe2ad58
  }
];

class LevelBuilder {
  /**
   * Construye el escenario 3D completo para un nivel específico
   */
  static buildLevel(levelNumber, scene) {
    const config = LevelConfigs[levelNumber - 1] || LevelConfigs[0];
    const levelGroup = new THREE.Group();
    levelGroup.name = `level_${levelNumber}_root`;

    // Colección de colisionadores AABB para la momia y arañas
    const colliders = [];
    // Puntos candidatos para botellas de agua
    const bottleSpawnPool = [];
    // Puntos de patrulla para arañas
    const spiderSpawnPoints = [];

    // Helper para registrar un obstáculo sólido con colisión
    const addObstacle = (mesh, boxW, boxH, boxD, posX, posY, posZ) => {
      levelGroup.add(mesh);
      colliders.push({
        minX: posX - boxW / 2,
        maxX: posX + boxW / 2,
        minZ: posZ - boxD / 2,
        maxZ: posZ + boxD / 2,
        minY: posY - boxH / 2,
        maxY: posY + boxH / 2
      });
    };

    // 1. TERRENO BASE Y DESIERTO
    const groundGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
    const groundMat = MatCache.get(VoxelColors.sandGround);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    levelGroup.add(groundMesh);

    // Dunas y elevaciones de arena en el borde del mapa
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const dist = 28 + Math.sin(angle * 3) * 4;
      const duneX = Math.cos(angle) * dist;
      const duneZ = Math.sin(angle) * dist;
      const duneW = 8 + Math.random() * 6;
      const duneH = 3 + Math.random() * 3;
      const dune = VoxelBuilder.box(duneW, duneH, duneW, VoxelColors.sandstoneMid, duneX, duneH / 2 - 0.5, duneZ);
      addObstacle(dune, duneW, duneH, duneW, duneX, duneH / 2, duneZ);
    }

    // 2. PATRÓN ARQUITECTÓNICO SEGÚN NIVEL
    // Generamos un trazado modular inspirado en escenario A, B y C:
    // - Pasarela / Puente central elevado
    // - Plataformas este y oeste
    // - Patios de templos con columnatas
    // - Cámaras secretas y desniveles con escaleras

    // Camino de piedra central (como en escenario A.png)
    for (let z = -14; z <= 14; z += 2) {
      const pathTile = VoxelBuilder.box(2.8, 0.2, 1.9, VoxelColors.sandstoneLight, 0, 0.1, z);
      levelGroup.add(pathTile);
    }
    for (let x = -14; x <= 14; x += 2) {
      const pathTile = VoxelBuilder.box(1.9, 0.2, 2.8, VoxelColors.sandstoneLight, x, 0.1, 0);
      levelGroup.add(pathTile);
    }

    // PLATAFORMA ELEVADA NORTE (Templo con columnas)
    const northH = 1.6;
    const platNorth = VoxelBuilder.box(12, northH, 10, VoxelColors.sandstoneMid, 0, northH / 2, -12);
    addObstacle(platNorth, 12, northH, 10, 0, northH / 2, -12);

    // Escaleras que suben al Templo Norte
    const stairsNorth = VoxelBuilder.createStairs(6, 3, 0.27, 0.45);
    stairsNorth.position.set(0, 0, -7);
    stairsNorth.rotation.y = Math.PI;
    levelGroup.add(stairsNorth);

    // Columnas en el Templo Norte
    const colCoordsNorth = [
      { x: -4, z: -15 }, { x: -4, z: -9 },
      { x: 4, z: -15 }, { x: 4, z: -9 }
    ];
    colCoordsNorth.forEach(pos => {
      const col = VoxelBuilder.createColumn(3.5);
      col.position.set(pos.x, northH, pos.z);
      addObstacle(col, 1.2, 4.5, 1.2, pos.x, northH + 2, pos.z);
    });

    // Portal / Arco de Templo en el Norte
    const archNorth = VoxelBuilder.createTempleArch(4.0, 3.2);
    archNorth.position.set(0, northH, -16);
    levelGroup.add(archNorth);
    colliders.push({ minX: -2.3, maxX: -1.3, minZ: -16.5, maxZ: -15.5, minY: 0, maxY: 6 });
    colliders.push({ minX: 1.3, maxX: 2.3, minZ: -16.5, maxZ: -15.5, minY: 0, maxY: 6 });

    // Estatua del Faraón en la entrada norte
    const statue1 = VoxelBuilder.createPharaohStatue();
    statue1.position.set(-3.5, northH, -12);
    statue1.rotation.y = Math.PI / 4;
    addObstacle(statue1, 1.4, 2.5, 1.4, -3.5, northH + 1.2, -12);

    const statue2 = VoxelBuilder.createPharaohStatue();
    statue2.position.set(3.5, northH, -12);
    statue2.rotation.y = -Math.PI / 4;
    addObstacle(statue2, 1.4, 2.5, 1.4, 3.5, northH + 1.2, -12);

    // Vasijas / Urnas decorativas
    const urnCoords = [
      { x: -1.8, y: northH, z: -11 },
      { x: 1.8, y: northH, z: -11 },
      { x: -2.5, y: 0, z: 3 },
      { x: 2.5, y: 0, z: 3 },
      { x: -8, y: 0, z: -2 }
    ];
    urnCoords.forEach(pos => {
      const urn = VoxelBuilder.createUrn();
      urn.position.set(pos.x, pos.y, pos.z);
      addObstacle(urn, 0.6, 0.8, 0.6, pos.x, pos.y + 0.4, pos.z);
    });

    // PLATAFORMA SUR Y OESTE (Patios con muros y ruinas)
    const platWestH = 1.0;
    const platWest = VoxelBuilder.box(10, platWestH, 10, VoxelColors.sandstoneMid, -12, platWestH / 2, 0);
    addObstacle(platWest, 10, platWestH, 10, -12, platWestH / 2, 0);

    const stairsWest = VoxelBuilder.createStairs(4, 2.5, 0.25, 0.45);
    stairsWest.position.set(-7, 0, 0);
    stairsWest.rotation.y = -Math.PI / 2;
    levelGroup.add(stairsWest);

    // Muros perimetrales y ruinas en Oeste
    const wallWest = VoxelBuilder.box(1.0, 2.2, 8, VoxelColors.sandstoneDark, -16.5, 1.1 + platWestH, 0);
    addObstacle(wallWest, 1.0, 2.2, 8, -16.5, 1.1 + platWestH, 0);

    // PLATAFORMA ESTE (Canyon y puentes de piedra)
    const platEastH = 1.2;
    const platEast = VoxelBuilder.box(10, platEastH, 12, VoxelColors.sandstoneMid, 12, platEastH / 2, 0);
    addObstacle(platEast, 10, platEastH, 12, 12, platEastH / 2, 0);

    const stairsEast = VoxelBuilder.createStairs(5, 2.5, 0.24, 0.45);
    stairsEast.position.set(7, 0, 0);
    stairsEast.rotation.y = Math.PI / 2;
    levelGroup.add(stairsEast);

    // Columnata en el Este
    for (let z = -4; z <= 4; z += 4) {
      const col = VoxelBuilder.createColumn(3.0);
      col.position.set(14, platEastH, z);
      addObstacle(col, 1.0, 4.0, 1.0, 14, platEastH + 1.5, z);
    }

    // OBSTÁCULOS Y LABERINTO ADICIONAL SEGÚN DIFICULTAD DEL NIVEL
    // A niveles más altos, agregamos más bloques de ruinas y muros interiores
    const extraBlocksCount = (levelNumber - 1) * 3;
    const rng = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < extraBlocksCount; i++) {
      const rx = (rng(levelNumber * 40 + i * 3) - 0.5) * 24;
      const rz = (rng(levelNumber * 70 + i * 5) - 0.5) * 24;
      // Evitar bloquear el spawn central (0,0)
      if (Math.hypot(rx, rz) > 4) {
        const bw = 1.2 + rng(i) * 1.5;
        const bh = 1.5 + rng(i + 1) * 2.0;
        const bd = 1.2 + rng(i + 2) * 1.5;
        const block = VoxelBuilder.box(bw, bh, bd, VoxelColors.sandstoneLight, rx, bh / 2, rz);
        addObstacle(block, bw, bh, bd, rx, bh / 2, rz);
      }
    }

    // 3. PUNTOS DE APARICIÓN DE BOTELLAS DE AGUA (DISTRIBUCIÓN ESTRATÉGICA)
    // Variedad de ubicaciones en diferentes alturas, cámaras y recovecos
    const bottlePool = [
      { x: 0, y: northH + 0.1, z: -15.5 }, // Dentro del portal norte
      { x: -4, y: northH + 0.1, z: -12 },  // Junto al Faraón oeste
      { x: 4, y: northH + 0.1, z: -12 },   // Junto al Faraón este
      { x: 0, y: 0.1, z: -5 },             // Base de las escaleras norte
      { x: -12, y: platWestH + 0.1, z: -3 }, // Patio oeste norte
      { x: -14, y: platWestH + 0.1, z: 3 },  // Patio oeste sur
      { x: 12, y: platEastH + 0.1, z: -4 },  // Entre columnas este
      { x: 14, y: platEastH + 0.1, z: 2 },   // Detrás de columnas este
      { x: -6, y: 0.1, z: 6 },              // Ruina sudoeste
      { x: 6, y: 0.1, z: 6 },               // Ruina sudeste
      { x: 0, y: 0.1, z: 10 },              // Final del camino sur
      { x: -8, y: 0.1, z: -8 },             // Cuadrante noroeste
      { x: 8, y: 0.1, z: -8 },              // Cuadrante noreste
      { x: -2.5, y: northH + 0.1, z: -9 },  // Borde superior norte
      { x: 2.5, y: northH + 0.1, z: -9 },   // Borde superior este
      { x: -10, y: 0.1, z: 0 },             // Escalón oeste
      { x: 10, y: 0.1, z: 0 },              // Escalón este
      { x: 0, y: 0.1, z: -10 }              // Bajo el arco
    ];

    bottleSpawnPool.push(...bottlePool);

    // 4. PUNTOS DE PATRULLA DE ARAÑAS
    const spiderPool = [
      { x: -5, y: 0.1, z: -3 },
      { x: 5, y: 0.1, z: -3 },
      { x: -8, y: 0.1, z: 5 },
      { x: 8, y: 0.1, z: 5 },
      { x: 0, y: northH + 0.1, z: -12 },
      { x: -12, y: platWestH + 0.1, z: 0 },
      { x: 12, y: platEastH + 0.1, z: 0 },
      { x: 0, y: 0.1, z: 8 },
      { x: -6, y: 0.1, z: -10 },
      { x: 6, y: 0.1, z: -10 },
      { x: -10, y: platWestH + 0.1, z: -4 },
      { x: 10, y: platEastH + 0.1, z: 4 },
      { x: -3, y: northH + 0.1, z: -15 },
      { x: 3, y: northH + 0.1, z: -15 }
    ];

    // Tomamos la cantidad necesaria para este nivel
    for (let i = 0; i < config.spiders; i++) {
      spiderSpawnPoints.push(spiderPool[i % spiderPool.length]);
    }

    scene.add(levelGroup);

    return {
      levelGroup,
      colliders,
      bottleSpawnPool,
      spiderSpawnPoints,
      config
    };
  }
}

window.LevelConfigs = LevelConfigs;
window.LevelBuilder = LevelBuilder;
