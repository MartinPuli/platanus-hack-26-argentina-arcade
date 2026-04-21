// SUBTE DUEL — Platanus Hack 26, Buenos Aires Edition.
// Light cycles temáticos con las seis líneas del subte porteño.
// 1P vs CPU o 2P local. Release v2 (preview).

const W = 800;
const H = 600;
const CELL = 20;
const COLS = 40;
const ROWS = 26;
const PLAY_TOP = 80;
const WIN_ROUNDS = 3;
const TICK_MS = 90;
const STORAGE_KEY = 'subte-duel-v2';
const MAX_RECENT = 6;

// Paleta general. Túnel oscuro + cartelería esmaltada + amarillo subte.
const THEME = {
  bgDeep: 0x080a12,
  bgMid: 0x12172b,
  tileA: 0x171c2e,
  tileB: 0x1d2336,
  concrete: 0x2a3146,
  railMetal: 0x5a6375,
  tie: 0x1f2536,
  signWhite: 0xeee9d5,
  signCream: 0xe5dfc1,
  signInk: 0x0f1320,
  subteYellow: 0xffd020,
  warmAmber: 0xffb547,
  danger: 0xff4d55,
};

// Estilo e identidad de cada línea — color oficial + identidad real.
// Datos fieles al subte porteño (ver memory/project_ba_subte.md).
const LINES = [
  { id: 'A', color: 0xb7e4ed, dark: 0x4a727a, inkOnBadge: '#0f1320', era: 'HISTÓRICA · 1913',   style: 'classic' },
  { id: 'B', color: 0xe63946, dark: 0x6a1d24, inkOnBadge: '#ffffff', era: 'LA MÁS USADA',       style: 'sleek' },
  { id: 'C', color: 0x2a5a9c, dark: 0x10294d, inkOnBadge: '#ffffff', era: 'RETIRO ↔ CONSTITUCIÓN', style: 'boxy' },
  { id: 'D', color: 0x2ca04a, dark: 0x134d1f, inkOnBadge: '#ffffff', era: 'PALERMO · FACULTADES', style: 'sport' },
  { id: 'E', color: 0x8f3f94, dark: 0x4a1c4e, inkOnBadge: '#ffffff', era: 'SUR · RESIDENCIAL',  style: 'industrial' },
  { id: 'H', color: 0xffd020, dark: 0x8c6a00, inkOnBadge: '#0f1320', era: 'TRANSVERSAL · NUEVA', style: 'modern' },
];
const LINE_COUNT = LINES.length;

// Estaciones reales con su línea correcta (ver memory/project_ba_subte.md).
const STATIONS = [
  { gx: 4,  gy: 3,  name: 'PLAZA DE MAYO', lineId: 'A' },
  { gx: 4,  gy: 24, name: 'CONGRESO',      lineId: 'A' },
  { gx: 13, gy: 3,  name: 'PELLEGRINI',    lineId: 'B' },
  { gx: 35, gy: 3,  name: 'RETIRO',        lineId: 'C' },
  { gx: 35, gy: 24, name: 'CONSTITUCIÓN',  lineId: 'C' },
  { gx: 19, gy: 7,  name: '9 DE JULIO',    lineId: 'D' },
  { gx: 13, gy: 24, name: 'PALERMO',       lineId: 'D' },
  { gx: 19, gy: 19, name: 'BOEDO',         lineId: 'E' },
];

// Graffiti / tags distribuidos en esquinas del andén (puro color local).
const GRAFFITI = [
  { t: 'CRAK',       c: 0xe63946, gx: 4,  gy: 9,  r: -0.12, a: 0.55, s: 13 },
  { t: 'SUBTE·26',   c: 0xffd020, gx: 32, gy: 13, r: -0.06, a: 0.55, s: 10 },
  { t: 'VAMO PIBES', c: 0xc8a0ff, gx: 6,  gy: 22, r:  0.10, a: 0.50, s: 10 },
];

// Obstáculos internos: "obras en vía". Bloques 2×2 distribuidos simétricamente.
// Matan al que los choque, igual que las estelas o el borde.
const WALLS = [
  // Zona norte (sector superior)
  [9, 5], [10, 5], [9, 6], [10, 6],
  [29, 5], [30, 5], [29, 6], [30, 6],
  // Barras medias (dejan pasar por el centro pero condicionan el camino)
  [19, 11], [20, 11], [19, 12], [20, 12],
  [19, 15], [20, 15], [19, 16], [20, 16],
  // Zona sur (sector inferior)
  [9, 20], [10, 20], [9, 21], [10, 21],
  [29, 20], [30, 20], [29, 21], [30, 21],
];

// Power-ups: catálogo de ítems.
// TURBO (⚡): 2.5s de velocidad aumentada para el jugador que lo toma.
// CORTE (✂): borra las últimas 10 celdas de la propia estela liberando espacio.
// PASE (👻): 2s de inmunidad contra estelas — atravesás vías como un fantasma.
const POWERUP_TYPES = [
  { id: 'turbo', color: 0xffd020, dark: 0xa07700, icon: '⚡', title: 'TURBO' },
  { id: 'corte', color: 0x68ffb4, dark: 0x1e6d48, icon: '✂', title: 'CORTE' },
  { id: 'pase',  color: 0xc8a0ff, dark: 0x503088, icon: '⦾', title: 'PASE' },
];

// Cableado del gabinete. DO NOT modify — refleja el arcade físico.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEY_TO_ARCADE = {};
for (const [code, keys] of Object.entries(CABINET_KEYS)) {
  for (const k of keys) KEY_TO_ARCADE[normKey(k)] = code;
}

function normKey(key) {
  if (typeof key !== 'string' || !key) return '';
  if (key === ' ') return 'space';
  return key.length === 1 ? key.toLowerCase() : key;
}

const DIRS = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};
const OPP = { U: 'D', D: 'U', L: 'R', R: 'L' };
const DIR_ANGLE = { R: 0, D: 90, L: 180, U: 270 };

// Tipografías. No cargamos webfonts — elegimos fallbacks estándar con buen peso.
const FONT_DISPLAY = 'Impact, "Arial Black", sans-serif';
const FONT_SIGN = '"Arial Black", Arial, sans-serif';
const FONT_BODY = 'Arial, Helvetica, sans-serif';
const FONT_MONO = 'Consolas, "Courier New", monospace';

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#060810',
  render: { preserveDrawingBuffer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  scene: { create, update },
};

new Phaser.Game(config);

// ============================================================
// Scene lifecycle
// ============================================================

function create() {
  const scene = this;
  scene.state = initState();

  buildArenaBackground(scene);
  createControls(scene);

  scene.trails = scene.add.group();
  scene.effects = scene.add.group();

  createHud(scene);
  createMenu(scene);
  createCountdownUi(scene);
  createRoundEndUi(scene);
  createMatchEndUi(scene);

  showMenu(scene);

  loadLeaderboard().then((data) => {
    scene.state.lb = data;
    refreshLeaderboardUi(scene);
  });
}

function update(time, delta) {
  const scene = this;
  const st = scene.state;
  if (!st) return;
  const dt = delta || 0;

  if (st.inputCooldown > 0) st.inputCooldown -= dt;
  if (st.endTimer > 0) st.endTimer -= dt;

  if (st.phase === 'menu') return updateMenu(scene, dt);
  if (st.phase === 'countdown') return updateCountdown(scene, dt);
  if (st.phase === 'playing') return updatePlaying(scene, dt);
  if (st.phase === 'roundend') return updateRoundEnd(scene, dt);
  if (st.phase === 'matchend') return updateMatchEnd(scene, dt);
}

function initState() {
  return {
    phase: 'menu',
    mode: '2p',
    menuCursor: 0,
    menuItems: ['mode', 'p1', 'p2', 'start'],
    p1: makePlayer(0, false),
    p2: makePlayer(1, false),
    grid: null,
    round: 0,
    countdown: 0,
    roundWinner: null,
    matchWinner: null,
    lb: { wins: {}, recent: [] },
    inputCooldown: 0,
    endTimer: 0,
    countdownShown: null,
    gameTime: 0,
    powerups: [],
    powerupTimer: 0,
    powerupNext: 2600,
    wallObjs: [],
    dynWalls: [],
    dynWallTimer: 0,
    dynWallNext: 5000,
  };
}

function makePlayer(lineIdx, isAI) {
  return {
    lineIdx,
    isAI,
    score: 0,
    alive: true,
    dir: 'R',
    nextDir: 'R',
    gridX: 0,
    gridY: 0,
    head: null,
    cells: [],
    tickAccum: 0,
    turboUntil: 0,
    paseUntil: 0,
    fxIcon: null,
    fxText: null,
    fxTimer: 0,
  };
}

// ============================================================
// Arena background — túnel, piso, plano fantasma, estaciones
// ============================================================

function buildArenaBackground(scene) {
  const ax = 0;
  const ay = PLAY_TOP;
  const aw = COLS * CELL;
  const ah = ROWS * CELL;

  // Piso túnel base
  scene.add.rectangle(aw / 2, ay + ah / 2, aw, ah, THEME.bgDeep, 1);

  // Baldosas alternadas horizontales (sensación de piso de andén)
  const tiles = scene.add.graphics();
  for (let r = 0; r < ROWS; r += 1) {
    const alt = r % 2 === 0 ? THEME.tileA : THEME.tileB;
    tiles.fillStyle(alt, 1);
    tiles.fillRect(ax, ay + r * CELL, aw, CELL);
  }

  // Grilla fina (junta de baldosas)
  const grid = scene.add.graphics();
  grid.lineStyle(1, 0x070912, 0.55);
  for (let c = 0; c <= COLS; c += 1) {
    grid.lineBetween(c * CELL, ay, c * CELL, ay + ah);
  }
  for (let r = 0; r <= ROWS; r += 1) {
    grid.lineBetween(ax, ay + r * CELL, aw, ay + r * CELL);
  }

  // Plano fantasma: 3 líneas del subte trazadas muy tenues por debajo de todo
  const ghost = scene.add.graphics();
  traceGhost(ghost, 0x2a5a9c, [[4, 3], [4, 24]]); // C recta vertical
  traceGhost(ghost, 0x2ca04a, [[8, 4], [30, 4], [34, 12], [38, 12]]); // D horizontal con quiebre
  traceGhost(ghost, 0xffd020, [[14, 1], [14, 25]]); // H vertical
  traceGhost(ghost, 0xb7e4ed, [[2, 16], [22, 16], [26, 20], [38, 20]]); // A zigzag
  traceGhost(ghost, 0xe63946, [[6, 9], [20, 9], [24, 13], [36, 13]]); // B
  traceGhost(ghost, 0x8f3f94, [[2, 12], [12, 12], [16, 21], [34, 21]]); // E

  // Sombras de pilares retrocediendo (profundidad de andén)
  const pillars = scene.add.graphics();
  for (const px of [110, 280, 520, 690]) {
    // Sombra vertical difusa
    for (let step = 0; step < 5; step += 1) {
      pillars.fillStyle(0x000000, 0.18 - step * 0.03);
      pillars.fillRect(px - 10 - step, ay, 20 + step * 2, ah);
    }
    // Remaches en la parte alta y baja del pilar
    pillars.fillStyle(0x2a3146, 0.35);
    pillars.fillRect(px - 8, ay + 4, 16, 4);
    pillars.fillRect(px - 8, ay + ah - 8, 16, 4);
  }

  // Manchas de humedad ovaladas, irregulares
  const grime = scene.add.graphics();
  const dampSpots = [
    [82, 9, 28, 14], [322, 18, 22, 10], [618, 7, 32, 16],
    [188, 22, 18, 8], [468, 21, 26, 12], [582, 24, 22, 11],
  ];
  for (const [sx, sy, rw, rh] of dampSpots) {
    grime.fillStyle(0x050810, 0.55);
    grime.fillEllipse(sx, ay + sy * (ah / 27), rw, rh);
  }
  // Polvillo de andén
  for (let i = 0; i < 24; i += 1) {
    grime.fillStyle(0x1a2030, 0.28);
    grime.fillCircle((i * 73 + 131) % aw, ay + ((i * 47 + 91) % ah), 1.2 + (i % 3) * 0.4);
  }

  // Graffiti tags decorativos — curvas estilizadas en esquinas
  const graffiti = scene.add.graphics();
  graffiti.lineStyle(1.6, 0xe63946, 0.35);
  graffiti.beginPath();
  graffiti.moveTo(20, ay + ah - 44);
  graffiti.lineTo(28, ay + ah - 56);
  graffiti.lineTo(40, ay + ah - 44);
  graffiti.lineTo(48, ay + ah - 58);
  graffiti.lineTo(58, ay + ah - 46);
  graffiti.strokePath();
  graffiti.lineStyle(1.4, 0x2ca04a, 0.32);
  graffiti.beginPath();
  graffiti.moveTo(aw - 64, ay + 18);
  graffiti.lineTo(aw - 42, ay + 10);
  graffiti.lineTo(aw - 30, ay + 22);
  graffiti.lineTo(aw - 52, ay + 28);
  graffiti.closePath();
  graffiti.strokePath();
  // Un tag firma "SUBTE'26"
  graffiti.lineStyle(1.2, 0xffd020, 0.4);
  const tg = [
    [aw - 86, ay + 40], [aw - 70, ay + 36], [aw - 60, ay + 44],
    [aw - 50, ay + 38], [aw - 40, ay + 44], [aw - 30, ay + 40],
  ];
  graffiti.beginPath();
  graffiti.moveTo(tg[0][0], tg[0][1]);
  for (const [x, y] of tg.slice(1)) graffiti.lineTo(x, y);
  graffiti.strokePath();

  // Graffiti tags — identidad porteña en las esquinas
  for (const gf of GRAFFITI) {
    const gx = gf.gx * CELL + CELL / 2;
    const gy = PLAY_TOP + gf.gy * CELL + CELL / 2;
    const tag = scene.add.text(gx, gy, gf.t, {
      fontFamily: FONT_DISPLAY,
      fontSize: gf.s + 'px',
      color: hexColor(gf.c),
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(gf.a);
    tag.setRotation(gf.r);
    tag.setDepth(0.5);
  }

  // Warning "CUIDADO CON LA BRECHA" sobre la franja amarilla del borde
  scene.add.text(W / 2, ay + 9, 'CUIDADO CON LA BRECHA  ·  MIND THE GAP  ·  CUIDADO CON LA BRECHA', {
    fontFamily: FONT_SIGN,
    fontSize: '8px',
    color: '#0f1320',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0.5).setAlpha(0.85).setDepth(4);

  // Estaciones (cartelería, capa baja)
  for (const st of STATIONS) drawStationSign(scene, st.gx, st.gy, st.name, st.lineId);

  // Obras en vía — paredes internas (único Graphics, liviano)
  drawAllWalls(scene);

  // Marco de andén: borde metálico + franja amarilla de "no cruzar"
  const frame = scene.add.graphics();
  frame.lineStyle(2, THEME.railMetal, 1);
  frame.strokeRect(0, ay, aw, ah);
  // Franja amarilla superior (debajo del HUD)
  frame.fillStyle(THEME.subteYellow, 0.9);
  frame.fillRect(0, ay, aw, 3);
  // Dashes oscuros sobre la franja amarilla
  frame.fillStyle(0x0f1320, 1);
  for (let x = 6; x < aw; x += 18) frame.fillRect(x, ay, 4, 3);
  // Franja inferior (sombra)
  frame.fillStyle(0x000000, 0.45);
  frame.fillRect(0, ay + ah - 3, aw, 3);
}

function traceGhost(g, color, pts) {
  g.lineStyle(4, color, 0.06);
  g.beginPath();
  g.moveTo(pts[0][0] * CELL + CELL / 2, PLAY_TOP + pts[0][1] * CELL + CELL / 2);
  for (let i = 1; i < pts.length; i += 1) {
    g.lineTo(pts[i][0] * CELL + CELL / 2, PLAY_TOP + pts[i][1] * CELL + CELL / 2);
  }
  g.strokePath();
}

function drawStationSign(scene, gx, gy, name, lineId) {
  const line = LINES.find((l) => l.id === lineId);
  const px = cx(gx);
  const py = cy(gy);
  // Cartel blanco esmaltado
  const bg = scene.add.rectangle(px + 10, py, 64, 12, THEME.signWhite, 0.88);
  bg.setStrokeStyle(1, THEME.signInk, 0.6);
  // Punto de color
  const dot = scene.add.circle(px - 15, py, 4, line.color, 1);
  dot.setStrokeStyle(1, 0xffffff, 0.9);
  const letter = scene.add.text(px - 15, py, line.id, {
    fontFamily: FONT_SIGN,
    fontSize: '6px',
    color: line.inkOnBadge,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  letter.setAlpha(0.95);
  // Nombre
  scene.add.text(px + 10, py - 0.5, name, {
    fontFamily: FONT_SIGN,
    fontSize: '7px',
    color: '#1a1e27',
    fontStyle: 'bold',
    letterSpacing: 0.5,
  }).setOrigin(0.5).setAlpha(0.95);
}

// Dibuja TODAS las paredes estáticas en un solo Graphics (liviano).
function drawAllWalls(scene) {
  const g = scene.add.graphics();
  g.setDepth(1);
  for (const [gx, gy] of WALLS) {
    const px = cx(gx), py = cy(gy);
    const s = CELL - 1;
    // Caja base
    g.fillStyle(0x1a1f2e, 1);
    g.fillRect(px - s / 2, py - s / 2, s, s);
    g.lineStyle(1.2, 0xffd020, 0.9);
    g.strokeRect(px - s / 2, py - s / 2, s, s);
    // Dos líneas cruzadas amarillas (precaución)
    g.lineStyle(2.5, 0xffd020, 0.95);
    g.lineBetween(px - s / 2 + 2, py - s / 2 + 2, px + s / 2 - 2, py + s / 2 - 2);
    g.lineBetween(px + s / 2 - 2, py - s / 2 + 2, px - s / 2 + 2, py + s / 2 - 2);
  }
}

// ============================================================
// HUD
// ============================================================

function createHud(scene) {
  scene.hud = {};

  // Fondo: techo del andén (más oscuro, profundidad)
  scene.add.rectangle(W / 2, PLAY_TOP / 2, W, PLAY_TOP, 0x05070f, 1);
  // Capa con gradiente simulado (tres bandas de luminosidad)
  const ceilTop = scene.add.rectangle(W / 2, 8, W, 16, THEME.bgMid, 0.6);
  const ceilMid = scene.add.rectangle(W / 2, 32, W, 32, 0x0b1020, 0.4);
  const ceilBot = scene.add.rectangle(W / 2, 60, W, 20, 0x060914, 0.8);

  // Cables horizontales colgando del techo
  // Cables + pernos (un único Graphics para todos)
  const cables = scene.add.graphics();
  cables.fillStyle(0x0a0d18, 1); cables.fillRect(0, 3.3, W, 1.4);
  cables.fillStyle(0x1a2030, 0.7); cables.fillRect(0, 6.6, W, 0.8);
  cables.fillStyle(0x2a3146, 1);
  for (let x = 40; x < W; x += 80) cables.fillCircle(x, 5, 2);
  cables.fillStyle(0x1a2030, 0.55);
  for (let x = 40; x < W; x += 80) cables.fillRect(x - 0.5, 5, 1, 14);

  // Tubos fluorescentes a lo ancho del techo (4 tubos con flicker)
  const tubes = [];
  const tubeCount = 4;
  for (let i = 0; i < tubeCount; i += 1) {
    const tx = (i + 0.5) * (W / tubeCount);
    // Glow exterior
    const glow = scene.add.rectangle(tx, 15, 150, 20, 0xffe08a, 0.09);
    // Tubo
    const tube = scene.add.rectangle(tx, 15, 140, 3, 0xfff0c0, 0.9);
    tube.setStrokeStyle(0.5, 0xffd020, 0.4);
    // Pequeño halo
    const halo = scene.add.rectangle(tx, 15, 150, 7, 0xffefb0, 0.18);
    tubes.push({ tube, glow, halo, i });
    // Flicker: ocasionalmente baja a 0.4 de alpha por 80ms
    const flicker = () => {
      scene.time.delayedCall(1800 + Math.random() * 6000, () => {
        const dimTo = 0.35 + Math.random() * 0.2;
        scene.tweens.add({
          targets: [tube, glow, halo],
          alpha: { from: tube.alpha, to: dimTo },
          duration: 70 + Math.random() * 80,
          yoyo: true,
          repeat: 1 + Math.floor(Math.random() * 2),
          onComplete: () => {
            tube.setAlpha(0.9); glow.setAlpha(0.09); halo.setAlpha(0.18);
            flicker();
          },
        });
      });
    };
    flicker();
  }
  // Uno de los tubos apagado permanente (burnt out) en posición random
  const dead = tubes[Math.floor(Math.random() * tubes.length)];
  dead.tube.setAlpha(0.18);
  dead.glow.setAlpha(0.02);
  dead.halo.setAlpha(0.04);

  // Línea de sombra inferior + franja fina sub-techo
  scene.add.rectangle(W / 2, PLAY_TOP - 8, W, 1, 0x1a2030, 0.7);
  scene.add.rectangle(W / 2, PLAY_TOP - 6, W, 1, 0x000000, 0.55);

  // === PLATE P1 === (cartel blanco esmaltado a la izquierda)
  scene.hud.p1Plate = scene.add.rectangle(82, PLAY_TOP / 2 + 4, 128, 52, THEME.signWhite, 1);
  scene.hud.p1Plate.setStrokeStyle(2, THEME.signInk, 1);
  // Sombrita interna
  scene.add.rectangle(82, PLAY_TOP / 2 + 4, 122, 46, 0x000000, 0.04).setStrokeStyle();

  scene.hud.p1Badge = scene.add.circle(40, PLAY_TOP / 2 + 4, 18, LINES[0].color, 1);
  scene.hud.p1Badge.setStrokeStyle(2.5, 0xffffff, 1);
  scene.hud.p1BadgeText = scene.add.text(40, PLAY_TOP / 2 + 4, 'A', {
    fontFamily: FONT_SIGN,
    fontSize: '22px',
    color: '#0f1320',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  scene.hud.p1Label = scene.add.text(88, PLAY_TOP / 2 - 12, 'P1', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#5a5f6e',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5);

  scene.hud.p1Score = scene.add.text(88, PLAY_TOP / 2 + 8, '0', {
    fontFamily: FONT_SIGN,
    fontSize: '26px',
    color: '#0f1320',
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);

  // === CENTRO: tablero de destino ===
  scene.hud.centerPlate = scene.add.rectangle(W / 2, PLAY_TOP / 2 + 4, 300, 52, THEME.signInk, 1);
  scene.hud.centerPlate.setStrokeStyle(2, THEME.subteYellow, 0.9);

  scene.hud.centerTitle = scene.add.text(W / 2, PLAY_TOP / 2 - 6, 'SUBTE DUEL', {
    fontFamily: FONT_DISPLAY,
    fontSize: '22px',
    color: '#ffd020',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5);

  // Ticker LED debajo del título (scrolling)
  const tickerMsg = '  ·  PRÓXIMO SUBTE  ·  NO VIAJE EN LA PUERTA  ·  TARJETA SUBE OBLIGATORIA  ·  LÍNEAS A B C D E H  ·  LÍNEA A · 1913  ·  NO CRUCE DEL AMARILLO  ·  CEDA EL ASIENTO  ·  SBASE · BUENOS AIRES  ·  GRACIAS POR USAR EL SUBTE  ·';
  const tickerWidth = 268;
  const tickerY = PLAY_TOP / 2 + 16;
  // Caja negra donde vive el LED
  const tickerBox = scene.add.rectangle(W / 2, tickerY, tickerWidth, 12, 0x060914, 1);
  tickerBox.setStrokeStyle(1, 0x332000, 0.8);
  scene.hud.centerSub = scene.add.text(W / 2 + tickerWidth / 2, tickerY, tickerMsg, {
    fontFamily: FONT_MONO,
    fontSize: '9px',
    color: '#ffb447',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5);
  scene.hud.centerSub.setDepth(1);
  // Máscara para recortar al ancho de la caja
  const tickerMask = scene.make.graphics({ add: false });
  tickerMask.fillStyle(0xffffff, 1);
  tickerMask.fillRect(W / 2 - tickerWidth / 2 + 1, tickerY - 6, tickerWidth - 2, 12);
  scene.hud.centerSub.setMask(tickerMask.createGeometryMask());
  // Scroll continuo
  scene.tweens.add({
    targets: scene.hud.centerSub,
    x: W / 2 - tickerWidth / 2 - scene.hud.centerSub.width,
    duration: 22000,
    repeat: -1,
    ease: 'Linear',
  });
  scene.hud.tickerMsg = tickerMsg;

  // === PLATE P2 ===
  scene.hud.p2Plate = scene.add.rectangle(W - 82, PLAY_TOP / 2 + 4, 128, 52, THEME.signWhite, 1);
  scene.hud.p2Plate.setStrokeStyle(2, THEME.signInk, 1);

  scene.hud.p2Badge = scene.add.circle(W - 40, PLAY_TOP / 2 + 4, 18, LINES[1].color, 1);
  scene.hud.p2Badge.setStrokeStyle(2.5, 0xffffff, 1);
  scene.hud.p2BadgeText = scene.add.text(W - 40, PLAY_TOP / 2 + 4, 'B', {
    fontFamily: FONT_SIGN,
    fontSize: '22px',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  scene.hud.p2Label = scene.add.text(W - 88, PLAY_TOP / 2 - 12, 'P2', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#5a5f6e',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(1, 0.5);

  scene.hud.p2Score = scene.add.text(W - 88, PLAY_TOP / 2 + 8, '0', {
    fontFamily: FONT_SIGN,
    fontSize: '26px',
    color: '#0f1320',
    fontStyle: 'bold',
  }).setOrigin(1, 0.5);
}

function refreshHud(scene) {
  const st = scene.state;
  const l1 = LINES[st.p1.lineIdx];
  const l2 = LINES[st.p2.lineIdx];

  scene.hud.p1Badge.setFillStyle(l1.color);
  scene.hud.p1BadgeText.setText(l1.id);
  scene.hud.p1BadgeText.setColor(l1.inkOnBadge);
  scene.hud.p1Label.setText(st.p1.isAI ? 'CPU' : 'P1');

  scene.hud.p2Badge.setFillStyle(l2.color);
  scene.hud.p2BadgeText.setText(l2.id);
  scene.hud.p2BadgeText.setColor(l2.inkOnBadge);
  scene.hud.p2Label.setText(st.p2.isAI ? 'CPU' : 'P2');

  scene.hud.p1Score.setText(String(st.p1.score));
  scene.hud.p2Score.setText(String(st.p2.score));

  if (st.phase === 'playing' || st.phase === 'countdown' || st.phase === 'roundend') {
    scene.hud.centerTitle.setText(`RONDA ${st.round}  ·  ${l1.id} vs ${l2.id}`);
  } else {
    scene.hud.centerTitle.setText('SUBTE DUEL');
  }
}

// ============================================================
// Menu
// ============================================================

function createMenu(scene) {
  scene.menu = {};
  const c = scene.add.container(0, 0);
  c.setDepth(20);
  scene.menu.container = c;

  // Fondo tipo túnel
  c.add(scene.add.rectangle(W / 2, H / 2, W, H, THEME.bgDeep, 0.97));

  // Azulejos tenues al fondo
  const wallTex = scene.add.graphics();
  for (let y = 0; y < H; y += 12) {
    const ofs = (y / 12) % 2 === 0 ? 0 : 10;
    for (let x = ofs; x < W; x += 20) {
      wallTex.fillStyle(0x1a2036, 0.22);
      wallTex.fillRect(x, y, 16, 8);
    }
  }
  c.add(wallTex);

  // Franja de seguridad amarilla cruzando la pantalla (divide panel de power-ups / fila inferior)
  const stripeY = 530;
  const stripe = scene.add.graphics();
  stripe.fillStyle(THEME.subteYellow, 0.22);
  stripe.fillRect(0, stripeY, W, 4);
  stripe.fillStyle(0x000000, 0.5);
  for (let x = 2; x < W; x += 14) stripe.fillRect(x, stripeY, 3, 4);
  c.add(stripe);

  // Encabezado: tira horizontal con las 6 líneas (hint visual)
  const header = scene.add.container(W / 2, 46);
  c.add(header);
  for (let i = 0; i < LINE_COUNT; i += 1) {
    const x = (i - (LINE_COUNT - 1) / 2) * 48;
    const circ = scene.add.circle(x, 0, 14, LINES[i].color, 1);
    circ.setStrokeStyle(2, 0xffffff, 1);
    const t = scene.add.text(x, 0, LINES[i].id, {
      fontFamily: FONT_SIGN,
      fontSize: '16px',
      color: LINES[i].inkOnBadge,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    header.add(circ);
    header.add(t);
  }

  // Chapa "PLATANUS HACK 26 / BUENOS AIRES"
  const chapa = scene.add.rectangle(W / 2, 82, 260, 18, THEME.signInk, 1);
  chapa.setStrokeStyle(1, THEME.subteYellow, 0.5);
  c.add(chapa);
  c.add(scene.add.text(W / 2, 82, 'PLATANUS HACK 26 · BUENOS AIRES', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#ffd020',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5));

  // TÍTULO enorme, estático
  const title = scene.add.text(W / 2, 130, 'SUBTE  DUEL', {
    fontFamily: FONT_DISPLAY,
    fontSize: '72px',
    color: '#f6f2de',
    fontStyle: 'bold',
    letterSpacing: 6,
    stroke: '#0f1320',
    strokeThickness: 6,
  }).setOrigin(0.5);
  c.add(title);

  // Subtítulo
  c.add(scene.add.text(W / 2, 170, 'DUELO DE LÍNEAS · RED DEL SUBTE PORTEÑO', {
    fontFamily: FONT_SIGN,
    fontSize: '11px',
    color: '#b8c0d4',
    fontStyle: 'bold',
    letterSpacing: 2.5,
  }).setOrigin(0.5));

  // Panel de rows
  scene.menu.rows = [];
  scene.menu.rows.push(buildMenuRow(scene, c, 222, 'MODO', 'mode'));
  scene.menu.rows.push(buildMenuRow(scene, c, 286, 'P1', 'p1'));
  scene.menu.rows.push(buildMenuRow(scene, c, 350, 'P2', 'p2'));
  scene.menu.rows.push(buildMenuRow(scene, c, 414, '', 'start'));

  // === TABLERO LED "SERVICIOS EN LÍNEA" · estética de cartel ferroviario ===
  buildServicesBoard(scene, c);

  // === STRIP: LÍNEA DOMINANTE (debajo de la franja amarilla) ===
  scene.menu.dominantRow = scene.add.container(W / 2, 552);
  c.add(scene.menu.dominantRow);
  // Contenido se rellena en refreshLeaderboardUi

  // Hint de controles abajo del todo
  c.add(scene.add.text(W / 2, H - 20, 'JOYSTICK ↕ ◀ ▶ · BOTÓN 1 / START CONFIRMA', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#6a7591',
    fontStyle: 'bold',
    letterSpacing: 1.5,
  }).setOrigin(0.5));

  c.setVisible(false);
}

// Panel minimalista de power-ups: ícono + nombre + descripción corta.
function buildServicesBoard(scene, parent) {
  const cx = W / 2;
  const top = 448;
  const boardW = 320;
  const boardH = 74;

  const plate = scene.add.rectangle(cx, top + boardH / 2, boardW, boardH, 0x06080f, 1);
  plate.setStrokeStyle(1, 0x1a1f2e, 1);
  parent.add(plate);

  const services = [
    { icon: '⚡', id: 'TURBO', desc: 'MÁS VELOCIDAD' },
    { icon: '✂', id: 'CORTE', desc: 'BORRA TU ESTELA' },
    { icon: '⦾', id: 'PASE',  desc: 'INMUNIDAD 2S' },
  ];

  const rowLeft = cx - boardW / 2 + 22;
  const nameX = rowLeft + 22;
  const descX = rowLeft + 96;

  services.forEach((svc, i) => {
    const rowY = top + 16 + i * 16;

    parent.add(scene.add.text(rowLeft, rowY, svc.icon, {
      fontFamily: FONT_DISPLAY,
      fontSize: '14px',
      color: '#ffd020',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    parent.add(scene.add.text(nameX, rowY, svc.id, {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#ffb447',
      fontStyle: 'bold',
      letterSpacing: 3,
    }).setOrigin(0, 0.5));

    parent.add(scene.add.text(descX, rowY, svc.desc, {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: '#8a8fa0',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5));
  });
}

function buildMenuRow(scene, container, y, label, id) {
  const row = { id, y };

  // Placa principal (esmaltada)
  row.bg = scene.add.rectangle(W / 2, y, 560, 52, THEME.signWhite, 1);
  row.bg.setStrokeStyle(2, THEME.signInk, 1);
  container.add(row.bg);

  // Borde amarillo de foco (aparece cuando está activo)
  row.focusBorder = scene.add.rectangle(W / 2, y, 568, 60, 0x000000, 0)
    .setStrokeStyle(2.5, THEME.subteYellow, 1);
  row.focusBorder.setVisible(false);
  container.add(row.focusBorder);

  if (id === 'start') {
    // Botón grande "JUGAR"
    row.valueText = scene.add.text(W / 2, y - 5, '▶  SUBIR AL SUBTE  ◀', {
      fontFamily: FONT_DISPLAY,
      fontSize: '28px',
      color: '#0f1320',
      fontStyle: 'bold',
      letterSpacing: 4,
    }).setOrigin(0.5);
    container.add(row.valueText);
    // Pie de texto
    row.valueHint = scene.add.text(W / 2, y + 15, 'PRESIONÁ START', {
      fontFamily: FONT_SIGN,
      fontSize: '9px',
      color: '#5a5f6e',
      fontStyle: 'bold',
      letterSpacing: 2.5,
    }).setOrigin(0.5);
    container.add(row.valueHint);
    row.valueHint.setVisible(false);
    return row;
  }

  // Etiqueta pequeña arriba a la izquierda (dentro de la placa)
  row.label = scene.add.text(W / 2 - 260, y - 14, label, {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#5a5f6e',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5);
  container.add(row.label);

  // Flechas en los extremos
  row.leftArrow = scene.add.text(W / 2 - 255, y + 8, '◀', {
    fontFamily: FONT_DISPLAY,
    fontSize: '22px',
    color: '#5a5f6e',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  row.rightArrow = scene.add.text(W / 2 + 255, y + 4, '▶', {
    fontFamily: FONT_DISPLAY,
    fontSize: '22px',
    color: '#5a5f6e',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(row.leftArrow);
  container.add(row.rightArrow);

  if (id === 'mode') {
    row.valueText = scene.add.text(W / 2, y + 4, 'DOS JUGADORES', {
      fontFamily: FONT_DISPLAY,
      fontSize: '28px',
      color: '#0f1320',
      fontStyle: 'bold',
      letterSpacing: 3,
    }).setOrigin(0.5);
    container.add(row.valueText);
  } else {
    // Fila de línea: [BADGE] [BOLETO + VAGÓN PREVIEW] [NOMBRE] [ERA]
    row.badge = scene.add.circle(W / 2 - 215, y + 4, 20, LINES[0].color, 1);
    row.badge.setStrokeStyle(2.5, 0xffffff, 1);
    row.badgeText = scene.add.text(W / 2 - 215, y + 4, 'A', {
      fontFamily: FONT_SIGN,
      fontSize: '24px',
      color: '#0f1320',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(row.badge);
    container.add(row.badgeText);

    // Boleto/ticket detrás del vagón (rectángulo crema con sombreado)
    const ticketX = W / 2 - 110;
    row.ticket = scene.add.rectangle(ticketX, y + 4, 120, 40, 0xfffaec, 1);
    row.ticket.setStrokeStyle(1, 0x1a1e27, 0.6);
    container.add(row.ticket);
    // Bordes "perforados" a los lados del boleto
    for (let i = -14; i <= 14; i += 5) {
      const dot = scene.add.circle(ticketX - 60, y + 4 + i, 1.4, 0x1a1e27, 0.55);
      const dot2 = scene.add.circle(ticketX + 60, y + 4 + i, 1.4, 0x1a1e27, 0.55);
      container.add(dot);
      container.add(dot2);
    }
    // Micro texto superior del boleto (como cabecera)
    row.ticketHeader = scene.add.text(ticketX, y - 11, 'COCHE  N°', {
      fontFamily: FONT_MONO,
      fontSize: '7px',
      color: '#5a5f6e',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5);
    container.add(row.ticketHeader);
    // Número del coche (cambia por línea)
    row.ticketNumber = scene.add.text(ticketX, y + 14, '1913', {
      fontFamily: FONT_MONO,
      fontSize: '9px',
      color: '#0f1320',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);
    container.add(row.ticketNumber);

    // Placeholder para el vagón (se construye en refresh)
    row.trainCar = null;
    row.trainCarX = ticketX;
    row.trainCarY = y + 2;
    row.container = container;

    row.valueText = scene.add.text(W / 2 + 5, y - 5, 'LÍNEA A', {
      fontFamily: FONT_DISPLAY,
      fontSize: '22px',
      color: '#0f1320',
      fontStyle: 'bold',
      letterSpacing: 3,
    }).setOrigin(0, 0.5);
    container.add(row.valueText);

    row.valueDesc = scene.add.text(W / 2 + 5, y + 14, '1913 · CLÁSICA', {
      fontFamily: FONT_SIGN,
      fontSize: '9px',
      color: '#5a5f6e',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0, 0.5);
    container.add(row.valueDesc);
  }

  return row;
}

function showMenu(scene) {
  const st = scene.state;
  st.phase = 'menu';
  st.menuCursor = 0;
  st.inputCooldown = 240;
  scene.menu.container.setVisible(true);
  refreshMenuUi(scene);
  refreshHud(scene);
}

function refreshMenuUi(scene) {
  const st = scene.state;
  const cursor = st.menuCursor;

  scene.menu.rows.forEach((row, i) => {
    const active = i === cursor;

    row.focusBorder.setVisible(active);
    const arrowColor = active ? '#0f1320' : '#9aa0ae';
    if (row.leftArrow) row.leftArrow.setColor(arrowColor);
    if (row.rightArrow) row.rightArrow.setColor(arrowColor);

    if (row.id === 'mode') {
      row.valueText.setText(st.mode === '1p' ? 'UN JUGADOR · VS CPU' : 'DOS JUGADORES');
    } else if (row.id === 'p1' || row.id === 'p2') {
      const player = row.id === 'p1' ? st.p1 : st.p2;
      const line = LINES[player.lineIdx];
      const isAI = row.id === 'p2' && st.mode === '1p';
      row.badge.setFillStyle(line.color);
      row.badgeText.setText(line.id);
      row.badgeText.setColor(line.inkOnBadge);
      row.valueText.setText(`LÍNEA ${line.id}${isAI ? '  (CPU)' : ''}`);
      row.valueText.setColor('#0f1320');
      row.valueDesc.setText(line.era);

      // Train car preview (sobre el boleto, escala grande)
      if (row.trainCar) {
        row.trainCar.destroy();
        row.trainCar = null;
      }
      const car = buildTrainCar(scene, player.lineIdx, 2.4);
      car.setPosition(row.trainCarX, row.trainCarY);
      row.container.add(car);
      row.container.bringToTop(car);
      row.trainCar = car;
      // Año real de apertura de cada línea del subte de BA
      const cocheNums = { A: '1913', B: '1930', C: '1934', D: '1937', E: '1944', H: '2007' };
      if (row.ticketNumber) row.ticketNumber.setText(cocheNums[line.id] || '----');
    } else if (row.id === 'start') {
      row.valueText.setAlpha(active ? 1 : 0.7);
      if (active) {
        row.valueText.setColor('#e63946');
      } else {
        row.valueText.setColor('#0f1320');
      }
      if (row.valueHint) row.valueHint.setVisible(active);
    }
  });
}

function updateMenu(scene, delta) {
  const st = scene.state;

  const axisY = readAxisY(scene);
  const axisX = readAxisX(scene);

  if (st.inputCooldown <= 0 && axisY !== 0) {
    const prev = st.menuCursor;
    st.menuCursor = Phaser.Math.Wrap(prev + axisY, 0, st.menuItems.length);
    if (st.menuCursor !== prev) {
      st.inputCooldown = 170;
      playSound(scene, 'click');
      refreshMenuUi(scene);
    }
  }

  if (st.inputCooldown <= 0 && axisX !== 0) {
    const row = st.menuItems[st.menuCursor];
    if (row === 'mode') {
      st.mode = st.mode === '1p' ? '2p' : '1p';
      st.p2.isAI = st.mode === '1p';
      playSound(scene, 'click');
      st.inputCooldown = 170;
      refreshMenuUi(scene);
    } else if (row === 'p1') {
      st.p1.lineIdx = Phaser.Math.Wrap(st.p1.lineIdx + axisX, 0, LINE_COUNT);
      if (st.p1.lineIdx === st.p2.lineIdx) {
        st.p1.lineIdx = Phaser.Math.Wrap(st.p1.lineIdx + axisX, 0, LINE_COUNT);
      }
      playSound(scene, 'click');
      st.inputCooldown = 170;
      refreshMenuUi(scene);
      refreshHud(scene);
    } else if (row === 'p2') {
      st.p2.lineIdx = Phaser.Math.Wrap(st.p2.lineIdx + axisX, 0, LINE_COUNT);
      if (st.p2.lineIdx === st.p1.lineIdx) {
        st.p2.lineIdx = Phaser.Math.Wrap(st.p2.lineIdx + axisX, 0, LINE_COUNT);
      }
      playSound(scene, 'click');
      st.inputCooldown = 170;
      refreshMenuUi(scene);
      refreshHud(scene);
    }
  }

  if (consumeAnyPressed(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
    const row = st.menuItems[st.menuCursor];
    if (row === 'start') {
      playSound(scene, 'select');
      beginMatch(scene);
    } else {
      playSound(scene, 'click');
      st.menuCursor = Math.min(st.menuCursor + 1, st.menuItems.length - 1);
      refreshMenuUi(scene);
    }
  }
}

// ============================================================
// Countdown
// ============================================================

function createCountdownUi(scene) {
  scene.cd = {};
  scene.cd.container = scene.add.container(0, 0).setDepth(30).setVisible(false);

  // Marco oscuro semitransparente
  scene.cd.dim = scene.add.rectangle(W / 2, PLAY_TOP + (ROWS * CELL) / 2, COLS * CELL, ROWS * CELL, 0x000000, 0.18);
  scene.cd.container.add(scene.cd.dim);

  // Texto principal
  scene.cd.text = scene.add.text(W / 2, PLAY_TOP + (ROWS * CELL) / 2, '3', {
    fontFamily: FONT_DISPLAY,
    fontSize: '180px',
    color: '#ffd020',
    fontStyle: 'bold',
    stroke: '#0f1320',
    strokeThickness: 10,
  }).setOrigin(0.5);
  scene.cd.container.add(scene.cd.text);

  // Subtítulo cartel
  scene.cd.sub = scene.add.text(W / 2, PLAY_TOP + (ROWS * CELL) / 2 + 110, 'PRÓXIMO SUBTE', {
    fontFamily: FONT_SIGN,
    fontSize: '14px',
    color: '#eee9d5',
    fontStyle: 'bold',
    letterSpacing: 4,
  }).setOrigin(0.5);
  scene.cd.container.add(scene.cd.sub);
}

function startCountdown(scene) {
  const st = scene.state;
  st.phase = 'countdown';
  st.countdown = 3000;
  st.countdownShown = null;
  scene.cd.container.setVisible(true);
  refreshHud(scene);
}

function updateCountdown(scene, delta) {
  const st = scene.state;
  st.countdown -= delta;
  const remaining = Math.ceil(st.countdown / 1000);
  let label;
  let isGo = false;
  if (remaining >= 3) label = '3';
  else if (remaining === 2) label = '2';
  else if (remaining === 1) label = '1';
  else { label = '¡SUBA!'; isGo = true; }

  if (st.countdownShown !== label) {
    st.countdownShown = label;
    scene.cd.text.setText(label);
    scene.cd.text.setScale(1.7);
    scene.cd.text.setAlpha(0);
    scene.cd.text.setColor(isGo ? '#e63946' : '#ffd020');
    scene.cd.sub.setText(isGo ? '¡SEÑAL VERDE · SUBTE EN MARCHA!' : 'PRÓXIMO SUBTE  ·  RETÍRESE DE LAS PUERTAS');
    scene.tweens.add({
      targets: scene.cd.text,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });

    // Anillo de expansión cada tick
    const cx2 = W / 2;
    const cy2 = PLAY_TOP + (ROWS * CELL) / 2;
    const ringColor = isGo ? 0xe63946 : 0xffd020;
    const ringCount = isGo ? 4 : 2;
    for (let i = 0; i < ringCount; i += 1) {
      scene.time.delayedCall(i * (isGo ? 90 : 60), () => {
        const ring = scene.add.circle(cx2, cy2, 30, 0x000000, 0);
        ring.setStrokeStyle(3, ringColor, 1);
        ring.setDepth(31);
        scene.tweens.add({
          targets: ring,
          radius: 240 + i * 40,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });
      });
    }

    if (isGo) {
      // Flash blanco + chispas amarillas + humo de arranque
      const flash = scene.add.rectangle(W / 2, PLAY_TOP + (ROWS * CELL) / 2, COLS * CELL, ROWS * CELL, 0xffffff, 0.6);
      flash.setDepth(29);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => flash.destroy(),
      });
      // Chispas + humo
      for (let s = 0; s < 12; s += 1) {
        const sx = cx2 + (Math.random() - 0.5) * 240;
        const sy = cy2 + (Math.random() - 0.5) * 120;
        const spark = scene.add.rectangle(sx, sy, 3, 3, 0xffd020, 1).setDepth(31);
        scene.tweens.add({
          targets: spark, y: sy - 60 - Math.random() * 80, alpha: 0, scale: 0.2,
          duration: 700 + Math.random() * 400, ease: 'Cubic.easeOut',
          onComplete: () => spark.destroy(),
        });
      }
      playSound(scene, 'go');
    } else {
      playSound(scene, 'count');
    }
  }

  if (st.countdown <= -350) {
    scene.cd.container.setVisible(false);
    beginRound(scene);
  }
}

// ============================================================
// Match / Round flow
// ============================================================

function beginMatch(scene) {
  const st = scene.state;
  st.p1.score = 0;
  st.p2.score = 0;
  st.round = 0;
  st.p1.isAI = false;
  st.p2.isAI = st.mode === '1p';
  st.matchWinner = null;
  scene.menu.container.setVisible(false);
  startNextRound(scene);
}

function startNextRound(scene) {
  const st = scene.state;
  st.round += 1;
  clearArena(scene);
  resetPlayers(scene);
  refreshHud(scene);
  startCountdown(scene);
}

function clearArena(scene) {
  scene.trails.clear(true, true);
  scene.effects.clear(true, true);
  const st = scene.state;
  st.grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = new Array(COLS);
    for (let x = 0; x < COLS; x += 1) row[x] = null;
    st.grid.push(row);
  }
  // Marcar paredes en el grid
  for (const [wx, wy] of WALLS) {
    if (wy >= 0 && wy < ROWS && wx >= 0 && wx < COLS) st.grid[wy][wx] = 'wall';
  }
  // Limpiar power-ups vigentes
  if (st.powerups) {
    for (const p of st.powerups) p.container.destroy();
  }
  st.powerups = [];
  st.powerupTimer = 0;
  st.powerupNext = 2600;

  // Limpiar paredes dinámicas (obras en vía aparecidas durante la ronda)
  if (st.dynWalls) {
    for (const w of st.dynWalls) if (w.obj) w.obj.destroy();
  }
  st.dynWalls = [];
  st.dynWallTimer = 0;
  st.dynWallNext = 5000;

  if (st.p1.head) { st.p1.head.destroy(); st.p1.head = null; }
  if (st.p2.head) { st.p2.head.destroy(); st.p2.head = null; }
  st.p1.cells = [];
  st.p2.cells = [];
  // Reset efectos
  st.p1.turboUntil = 0; st.p1.paseUntil = 0; st.p1.tickAccum = 0;
  st.p2.turboUntil = 0; st.p2.paseUntil = 0; st.p2.tickAccum = 0;
  clearPlayerFx(st.p1);
  clearPlayerFx(st.p2);
}

function clearPlayerFx(player) {
  if (player.fxIcon) { player.fxIcon.destroy(); player.fxIcon = null; }
  if (player.fxText) { player.fxText.destroy(); player.fxText = null; }
  player.fxTimer = 0;
}

function resetPlayers(scene) {
  const st = scene.state;
  const alt = (st.round - 1) % 2 === 0;
  if (alt) {
    st.p1.gridX = 6; st.p1.gridY = 13; st.p1.dir = 'R'; st.p1.nextDir = 'R';
    st.p2.gridX = 33; st.p2.gridY = 13; st.p2.dir = 'L'; st.p2.nextDir = 'L';
  } else {
    st.p1.gridX = 33; st.p1.gridY = 13; st.p1.dir = 'L'; st.p1.nextDir = 'L';
    st.p2.gridX = 6; st.p2.gridY = 13; st.p2.dir = 'R'; st.p2.nextDir = 'R';
  }
  st.p1.alive = true;
  st.p2.alive = true;
  st.tickAccum = 0;

  st.p1.head = buildTrainCar(scene, st.p1.lineIdx, 1);
  st.p1.head.setPosition(cx(st.p1.gridX), cy(st.p1.gridY));
  st.p1.head.setAngle(DIR_ANGLE[st.p1.dir]);

  st.p2.head = buildTrainCar(scene, st.p2.lineIdx, 1);
  st.p2.head.setPosition(cx(st.p2.gridX), cy(st.p2.gridY));
  st.p2.head.setAngle(DIR_ANGLE[st.p2.dir]);
}

function cx(gx) { return gx * CELL + CELL / 2; }
function cy(gy) { return PLAY_TOP + gy * CELL + CELL / 2; }

function beginRound(scene) {
  const st = scene.state;
  st.phase = 'playing';
  st.tickAccum = 0;
  st.roundWinner = null;
}

function updatePlaying(scene, delta) {
  const st = scene.state;

  captureDirectionInputs(scene);
  if (st.p2.isAI && st.p2.alive) aiDecide(scene);

  st.gameTime += delta;
  updateFxIndicators(scene, delta);

  const baseTick = Math.max(60, TICK_MS - (st.round - 1) * 4);
  advancePlayerTicks(scene, st.p1, 'p1', baseTick, delta);
  if (st.phase !== 'playing') return;
  advancePlayerTicks(scene, st.p2, 'p2', baseTick, delta);
  if (st.phase !== 'playing') return;

  updatePowerups(scene, delta);
  updateDynamicWalls(scene, delta);
}

// Obras en vía dinámicas — cada 5s aparece una pared nueva en un lugar random
// a 3+ bloques (Manhattan) de ambos jugadores.
function updateDynamicWalls(scene, delta) {
  const st = scene.state;
  st.dynWallTimer += delta;
  if (st.dynWallTimer < st.dynWallNext) return;
  st.dynWallTimer = 0;
  st.dynWallNext = 5000;

  for (let attempts = 0; attempts < 40; attempts += 1) {
    const gx = 2 + Math.floor(Math.random() * (COLS - 4));
    const gy = 2 + Math.floor(Math.random() * (ROWS - 4));
    if (!inBounds(gx, gy) || st.grid[gy][gx] !== null) continue;
    const d1 = Math.abs(gx - st.p1.gridX) + Math.abs(gy - st.p1.gridY);
    const d2 = Math.abs(gx - st.p2.gridX) + Math.abs(gy - st.p2.gridY);
    if (d1 < 3 || d2 < 3) continue;
    if (st.powerups.some((p) => p.gx === gx && p.gy === gy)) continue;

    st.grid[gy][gx] = 'wall';
    const obj = scene.add.rectangle(cx(gx), cy(gy), CELL - 1, CELL - 1, 0x1a1f2e, 1);
    obj.setStrokeStyle(1.4, 0xffd020, 0.95);
    obj.setDepth(2);
    obj.setScale(1.4);
    obj.setAlpha(0);
    scene.tweens.add({ targets: obj, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    st.dynWalls.push({ gx, gy, obj });
    playSound(scene, 'pop');
    return;
  }
}

function advancePlayerTicks(scene, player, owner, baseTick, delta) {
  if (!player.alive) return;
  const st = scene.state;
  // Turbo reduce tickMs → más rápido
  const mult = st.gameTime < player.turboUntil ? 0.58 : 1.0;
  const tickMs = baseTick * mult;
  player.tickAccum += delta;
  let safety = 4;
  while (player.tickAccum >= tickMs && player.alive && safety > 0) {
    player.tickAccum -= tickMs;
    safety -= 1;
    advancePlayerOne(scene, player, owner);
    if (scene.state.phase !== 'playing') return;
  }
}

function advancePlayerOne(scene, player, owner) {
  const st = scene.state;
  player.dir = player.nextDir;
  const n = nextCell(player);
  const other = player === st.p1 ? st.p2 : st.p1;

  let crashInto = null; // 'wall' | 'trail' | 'oob' | 'head'
  if (!inBounds(n.x, n.y)) {
    crashInto = 'oob';
  } else if (st.grid[n.y][n.x] === 'wall') {
    crashInto = 'wall';
  } else if (st.grid[n.y][n.x] !== null) {
    // Estela propia o ajena
    crashInto = 'trail';
  }
  // Choque frontal: entrar a la celda del otro
  if (crashInto === null && other.alive && n.x === other.gridX && n.y === other.gridY) {
    crashInto = 'head';
  }

  // Pase activo permite ignorar estelas (no paredes ni OOB ni head-on)
  const hasPase = st.gameTime < player.paseUntil;
  if (crashInto === 'trail' && hasPase) {
    crashInto = null;
  }

  if (crashInto !== null) {
    player.alive = false;
    if (crashInto === 'head') {
      // El otro también cae si ambos se metieron en la misma celda esta pasada
      other.alive = false;
      crashEffect(scene, other);
    }
    crashEffect(scene, player);
    checkRoundEndDueToCrash(scene);
    return;
  }

  // Power-up pickup en celda destino
  const pu = pickupAt(scene, n.x, n.y);
  if (pu) applyPowerup(scene, player, pu);

  movePlayer(scene, player, n, owner);
}

function checkRoundEndDueToCrash(scene) {
  const st = scene.state;
  if (!st.p1.alive || !st.p2.alive) {
    const winner = (!st.p1.alive && !st.p2.alive)
      ? 'draw'
      : (!st.p1.alive ? 'p2' : 'p1');
    endRound(scene, winner);
  }
}

function captureDirectionInputs(scene) {
  const st = scene.state;
  const { p1, p2 } = st;
  if (p1.alive) {
    if (isHeld(scene, 'P1_U')) tryTurn(p1, 'U');
    else if (isHeld(scene, 'P1_D')) tryTurn(p1, 'D');
    else if (isHeld(scene, 'P1_L')) tryTurn(p1, 'L');
    else if (isHeld(scene, 'P1_R')) tryTurn(p1, 'R');
  }
  if (p2.alive && !p2.isAI) {
    if (isHeld(scene, 'P2_U')) tryTurn(p2, 'U');
    else if (isHeld(scene, 'P2_D')) tryTurn(p2, 'D');
    else if (isHeld(scene, 'P2_L')) tryTurn(p2, 'L');
    else if (isHeld(scene, 'P2_R')) tryTurn(p2, 'R');
  }
}

function tryTurn(p, dir) {
  if (dir === OPP[p.dir]) return;
  p.nextDir = dir;
}

function nextCell(p) {
  const v = DIRS[p.dir];
  return { x: p.gridX + v.x, y: p.gridY + v.y };
}

function inBounds(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function movePlayer(scene, player, next, owner) {
  const st = scene.state;

  // Dibujar "vía" en la celda vieja orientada según dirección actual
  st.grid[player.gridY][player.gridX] = owner;
  const trackCell = drawTrackCell(scene, player.gridX, player.gridY, player.dir, player.lineIdx);
  scene.trails.add(trackCell);
  player.cells.push(trackCell);

  // Avanzar cabeza
  player.gridX = next.x;
  player.gridY = next.y;
  if (player.head) {
    player.head.setPosition(cx(player.gridX), cy(player.gridY));
    player.head.setAngle(DIR_ANGLE[player.dir]);
  }

  playSound(scene, 'tick');
}

function crashEffect(scene, player) {
  const line = LINES[player.lineIdx];
  const x = cx(player.gridX), y = cy(player.gridY);

  const flash = scene.add.circle(x, y, 8, 0xffffff, 0.95);
  scene.effects.add(flash);
  scene.tweens.add({ targets: flash, radius: 64, alpha: 0, duration: 420, onComplete: () => flash.destroy() });

  const ring = scene.add.circle(x, y, 12, 0, 0).setStrokeStyle(3, line.color, 1);
  scene.effects.add(ring);
  scene.tweens.add({ targets: ring, radius: 80, alpha: 0, duration: 520, onComplete: () => ring.destroy() });

  // Chispas
  for (let i = 0; i < 14; i += 1) {
    const w = i % 3 === 0;
    const sp = scene.add.rectangle(x, y, w ? 2 : 4, w ? 2 : 4, w ? 0xffffff : line.color, 1);
    scene.effects.add(sp);
    const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
    const d = 30 + Math.random() * 46;
    scene.tweens.add({
      targets: sp, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d,
      alpha: 0, angle: Phaser.Math.Between(-180, 180),
      duration: 420 + Math.random() * 220, onComplete: () => sp.destroy(),
    });
  }

  if (player.head) {
    player.head.setAlpha(0.3);
    scene.tweens.add({ targets: player.head, angle: player.head.angle + Phaser.Math.Between(-10, 10), duration: 120, yoyo: true });
  }
  playSound(scene, 'crash');
}

// ============================================================
// Procedural: vagón (head)
// ============================================================

function buildTrainCar(scene, lineIdx, scale) {
  const line = LINES[lineIdx];
  const L = 18; // largo
  const WID = 14; // ancho
  const g = scene.add.graphics();
  g.setDepth(5);

  const roofColor = line.style === 'classic' ? 0xffc857
    : line.style === 'sleek' ? 0xffffff
    : line.style === 'boxy' ? 0x0a1c35
    : line.style === 'sport' ? 0x0e3a18
    : line.style === 'industrial' ? 0x2c0e30
    : 0x0f1320;

  const winColor = line.style === 'classic' ? 0xfff0b8
    : line.style === 'sleek' ? 0xf5f5f5
    : line.style === 'industrial' ? 0xffc56a
    : line.style === 'sport' ? 0xdfffe6
    : line.style === 'modern' ? 0x7fc4ff
    : 0xc4dffa;

  const lightColor = line.style === 'classic' ? 0xffe29a
    : line.style === 'industrial' ? 0xffaa55
    : line.style === 'modern' ? 0xaee0ff
    : 0xffffff;

  // Sombra bajo el vagón (redondeada)
  g.fillStyle(0x000000, 0.55);
  g.fillRoundedRect(-L / 2 + 1, -WID / 2 + 5, L, 4, 2);

  // Cuerpo con esquinas redondeadas
  g.fillStyle(line.color, 1);
  g.fillRoundedRect(-L / 2, -WID / 2, L, WID, 2.5);

  // Subchasis oscuro
  g.fillStyle(line.dark, 1);
  g.fillRect(-L / 2, WID / 2 - 3, L, 3);

  // Techo accent
  g.fillStyle(roofColor, 1);
  g.fillRect(-L / 2 + 1, -WID / 2, L - 2, 1.3);

  // Detalle por línea
  if (line.style === 'classic') {
    g.lineStyle(0.8, line.dark, 0.7);
    for (let x = -L / 2 + 2; x < L / 2; x += 3) {
      g.lineBetween(x, -WID / 2 + 2, x, WID / 2 - 4);
    }
    g.fillStyle(0xfff0b8, 0.22);
    g.fillRect(-L / 2 + 2, -1, L - 4, 2.5);
  } else if (line.style === 'sleek') {
    g.fillStyle(0xffffff, 1);
    g.fillRect(-L / 2, 0, L, 1.4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(-L / 2, WID / 2 - 1.2, L, 1.2);
  } else if (line.style === 'boxy') {
    g.fillStyle(0xeee9d5, 0.85);
    [[-L / 2 + 1.5, -WID / 2 + 2], [L / 2 - 1.5, -WID / 2 + 2],
     [-L / 2 + 1.5, WID / 2 - 2], [L / 2 - 1.5, WID / 2 - 2]]
     .forEach(([rx, ry]) => g.fillCircle(rx, ry, 0.9));
    g.fillStyle(0xeee9d5, 0.3);
    g.fillRect(-L / 2, 0, L, 0.7);
  } else if (line.style === 'sport') {
    g.fillStyle(0xffffff, 1);
    g.fillRect(-L / 2, WID / 2 - 2.3, L, 1.4);
    g.fillStyle(0xffffff, 0.55);
    g.fillRect(-L / 2 + 2, -WID / 2 + 3, L - 4, 0.8);
  } else if (line.style === 'industrial') {
    g.lineStyle(0.7, line.dark, 1);
    for (let x = -L / 2 + 3; x < L / 2 - 1; x += 2) {
      g.lineBetween(x, -WID / 2 + 3, x, WID / 2 - 4);
    }
  } else if (line.style === 'modern') {
    g.fillStyle(0x0f1320, 1);
    g.fillRect(-L / 2 + 2, -2, L - 4, 4.5);
    g.fillStyle(winColor, 0.85);
    g.fillRect(-L / 2 + 2, -1, L - 4, 1.2);
  }

  // Ventanas (excepto modern)
  if (line.style !== 'modern') {
    g.fillStyle(winColor, 0.95);
    g.fillRect(-L / 2 + 3, -WID / 2 + 3, 3, 3);
    g.fillRect(L / 2 - 6, -WID / 2 + 3, 3, 3);
    g.lineStyle(0.5, line.dark, 0.9);
    g.strokeRect(-L / 2 + 3, -WID / 2 + 3, 3, 3);
    g.strokeRect(L / 2 - 6, -WID / 2 + 3, 3, 3);
  }

  // Faro delantero (orientado hacia derecha por defecto; container se rota)
  g.fillStyle(lightColor, 0.15);
  g.fillCircle(L / 2 + 4, 0, 5);
  g.fillStyle(lightColor, 0.45);
  g.fillCircle(L / 2 + 2, 0, 3.2);
  g.fillStyle(lightColor, 1);
  g.fillCircle(L / 2 - 0.4, 0, 1.5);

  // Fanal trasero rojo
  g.fillStyle(0xff3d3d, 0.95);
  g.fillCircle(-L / 2 + 0.7, 0, 1);

  if (scale && scale !== 1) g.setScale(scale);

  return g;
}

// ============================================================
// Procedural: celda de vía (trail)
// ============================================================

function drawTrackCell(scene, gx, gy, dir, lineIdx) {
  const line = LINES[lineIdx];
  const c = scene.add.container(cx(gx), cy(gy));
  const isHoriz = dir === 'L' || dir === 'R';
  const inner = CELL - 2;

  // Fondo tenue del durmiente (balasto)
  const ballast = scene.add.rectangle(0, 0, inner, inner, line.dark, 0.2);
  c.add(ballast);

  // Durmiente (madera / metal) perpendicular al avance
  if (isHoriz) {
    const tie1 = scene.add.rectangle(-5, 0, 2.6, inner - 2, line.dark, 0.88);
    const tie2 = scene.add.rectangle(5, 0, 2.6, inner - 2, line.dark, 0.88);
    c.add(tie1); c.add(tie2);
  } else {
    const tie1 = scene.add.rectangle(0, -5, inner - 2, 2.6, line.dark, 0.88);
    const tie2 = scene.add.rectangle(0, 5, inner - 2, 2.6, line.dark, 0.88);
    c.add(tie1); c.add(tie2);
  }

  // Dos rieles paralelos con el color de la línea
  if (isHoriz) {
    const r1 = scene.add.rectangle(0, -5, inner, 1.8, line.color, 1);
    const r2 = scene.add.rectangle(0, 5, inner, 1.8, line.color, 1);
    // Highlights metálicos
    const h1 = scene.add.rectangle(0, -5.6, inner, 0.6, 0xffffff, 0.55);
    const h2 = scene.add.rectangle(0, 4.4, inner, 0.6, 0xffffff, 0.55);
    c.add(r1); c.add(r2); c.add(h1); c.add(h2);
  } else {
    const r1 = scene.add.rectangle(-5, 0, 1.8, inner, line.color, 1);
    const r2 = scene.add.rectangle(5, 0, 1.8, inner, line.color, 1);
    const h1 = scene.add.rectangle(-5.6, 0, 0.6, inner, 0xffffff, 0.55);
    const h2 = scene.add.rectangle(4.4, 0, 0.6, inner, 0xffffff, 0.55);
    c.add(r1); c.add(r2); c.add(h1); c.add(h2);
  }

  // Destello de entrada (fade rápido)
  const flash = scene.add.rectangle(0, 0, inner, inner, line.color, 0.55);
  c.add(flash);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 260,
    onComplete: () => flash.destroy(),
  });

  c.setDepth(1);
  return c;
}

// ============================================================
// Power-ups: spawn, visual, pickup, efectos
// ============================================================

function updatePowerups(scene, delta) {
  const st = scene.state;

  // Animación de pulsos
  for (const p of st.powerups) {
    p.pulse += delta;
    const s = 1 + Math.sin(p.pulse / 170) * 0.12;
    if (p.container) p.container.setScale(s);
    // Fade inicial al aparecer
    if (p.fadeIn > 0) {
      p.fadeIn -= delta;
      const a = 1 - Math.max(0, p.fadeIn) / 220;
      p.container.setAlpha(Math.min(1, a));
    }
    p.lifetime -= delta;
  }
  // Remover los que expiraron
  st.powerups = st.powerups.filter((p) => {
    if (p.lifetime <= 0) {
      // Mini pop
      const [x, y] = [p.container.x, p.container.y];
      scene.tweens.add({
        targets: p.container,
        alpha: 0,
        scale: 0.4,
        duration: 180,
        onComplete: () => p.container.destroy(),
      });
      return false;
    }
    return true;
  });

  // Spawn tick
  st.powerupTimer += delta;
  if (st.powerupTimer >= st.powerupNext && st.powerups.length < 3) {
    spawnPowerup(scene);
    st.powerupTimer = 0;
    st.powerupNext = 2800 + Math.random() * 2600;
  }
}

function spawnPowerup(scene) {
  const st = scene.state;
  // Buscar celda libre (no pared, no estela, no cerca de heads, no sobre otro power-up)
  const tries = 40;
  for (let i = 0; i < tries; i += 1) {
    const gx = 2 + Math.floor(Math.random() * (COLS - 4));
    const gy = 2 + Math.floor(Math.random() * (ROWS - 4));
    if (st.grid[gy][gx] !== null) continue;
    // Distancia mínima de cada head
    const d1 = Math.abs(gx - st.p1.gridX) + Math.abs(gy - st.p1.gridY);
    const d2 = Math.abs(gx - st.p2.gridX) + Math.abs(gy - st.p2.gridY);
    if (d1 < 4 || d2 < 4) continue;
    // No pisar otro power-up
    const conflict = st.powerups.some((p) => p.gx === gx && p.gy === gy);
    if (conflict) continue;
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    createPowerupVisual(scene, gx, gy, type);
    return;
  }
}

function createPowerupVisual(scene, gx, gy, type) {
  const st = scene.state;
  const container = scene.add.container(cx(gx), cy(gy));
  container.setDepth(3);

  // Halo exterior
  const halo = scene.add.circle(0, 0, 14, type.color, 0.18);
  container.add(halo);
  // Anillo de color
  const ring = scene.add.circle(0, 0, 10, 0x000000, 0);
  ring.setStrokeStyle(2.2, type.color, 1);
  container.add(ring);
  // Fondo oscuro interior
  const fill = scene.add.circle(0, 0, 8, 0x0a0e1a, 0.95);
  container.add(fill);
  // Glyph
  const glyph = scene.add.text(0, 0, type.icon, {
    fontFamily: FONT_DISPLAY,
    fontSize: '14px',
    color: hexColor(type.color),
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(glyph);
  // Destellos rotatorios
  const spark = scene.add.rectangle(0, -10, 1.6, 4, type.color, 1);
  container.add(spark);
  scene.tweens.add({
    targets: spark,
    angle: 360,
    duration: 1400,
    repeat: -1,
  });
  // Rotación sobre el contenedor (suave)
  scene.tweens.add({
    targets: halo,
    alpha: { from: 0.18, to: 0.36 },
    duration: 600,
    yoyo: true,
    repeat: -1,
  });

  st.powerups.push({
    gx, gy, type,
    container,
    pulse: Math.random() * 1000,
    lifetime: 9000,
    fadeIn: 220,
  });

  playSound(scene, 'pop');
}

function pickupAt(scene, gx, gy) {
  const st = scene.state;
  const idx = st.powerups.findIndex((p) => p.gx === gx && p.gy === gy);
  if (idx === -1) return null;
  const pu = st.powerups[idx];
  st.powerups.splice(idx, 1);
  // Pop de colección
  const x = pu.container.x;
  const y = pu.container.y;
  scene.tweens.add({
    targets: pu.container,
    scale: 2.4,
    alpha: 0,
    duration: 240,
    onComplete: () => pu.container.destroy(),
  });
  for (let i = 0; i < 10; i += 1) {
    const dot = scene.add.circle(x, y, 2, pu.type.color, 1);
    scene.effects.add(dot);
    const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
    scene.tweens.add({
      targets: dot,
      x: x + Math.cos(ang) * 26,
      y: y + Math.sin(ang) * 26,
      alpha: 0,
      duration: 320 + Math.random() * 140,
      onComplete: () => dot.destroy(),
    });
  }
  return pu;
}

function applyPowerup(scene, player, pu) {
  const st = scene.state;
  const type = pu.type.id;
  if (type === 'turbo') {
    player.turboUntil = st.gameTime + 2500;
    showPlayerFx(scene, player, pu.type);
  } else if (type === 'corte') {
    // Remover las últimas 10 celdas de la estela del jugador y liberar grid
    const owner = player === st.p1 ? 'p1' : 'p2';
    const take = Math.min(10, player.cells.length);
    for (let i = 0; i < take; i += 1) {
      const cell = player.cells.pop();
      if (cell) {
        // Encontrar su gx/gy desde coordenadas reales
        const gx = Math.round((cell.x - CELL / 2) / CELL);
        const gy = Math.round((cell.y - PLAY_TOP - CELL / 2) / CELL);
        if (inBounds(gx, gy) && st.grid[gy][gx] === owner) st.grid[gy][gx] = null;
        // Destruir con fade
        scene.tweens.add({
          targets: cell,
          alpha: 0,
          scale: 0.2,
          duration: 200,
          onComplete: () => cell.destroy(),
        });
      }
    }
    showPlayerFx(scene, player, pu.type);
  } else if (type === 'pase') {
    player.paseUntil = st.gameTime + 2000;
    showPlayerFx(scene, player, pu.type);
  }
  playSound(scene, 'pickup');
}

function showPlayerFx(scene, player, type) {
  // Indicador flotante junto al head del jugador
  clearPlayerFx(player);
  const isP1 = player === scene.state.p1;
  const x = isP1 ? 168 : W - 168;
  const y = PLAY_TOP - 8;
  const icon = scene.add.text(x, y, type.icon, {
    fontFamily: FONT_DISPLAY,
    fontSize: '16px',
    color: hexColor(type.color),
    fontStyle: 'bold',
  }).setOrigin(0.5);
  icon.setDepth(12);
  const txt = scene.add.text(x + 14, y, type.title, {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: hexColor(type.color),
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5);
  txt.setDepth(12);
  player.fxIcon = icon;
  player.fxText = txt;
  player.fxTimer = 1400;
  scene.tweens.add({
    targets: [icon, txt],
    alpha: { from: 1, to: 0.3 },
    duration: 700,
    yoyo: true,
    repeat: 0,
  });
}

function updateFxIndicators(scene, delta) {
  const st = scene.state;
  for (const p of [st.p1, st.p2]) {
    if (p.fxTimer > 0) {
      p.fxTimer -= delta;
      if (p.fxTimer <= 0) clearPlayerFx(p);
    }
  }
}

// ============================================================
// AI
// ============================================================

function aiDecide(scene) {
  const st = scene.state;
  const me = st.p2;
  const foe = st.p1;
  const opts = ['U', 'D', 'L', 'R'].filter((d) => d !== OPP[me.dir]);

  let best = me.dir;
  let bestScore = -1;
  for (const d of opts) {
    const s = scoreDir(st, me, d, foe);
    const preference = d === me.dir ? 0.3 : 0;
    if (s + preference > bestScore) {
      bestScore = s + preference;
      best = d;
    }
  }
  if (Math.random() < 0.05) {
    const alt = opts[Math.floor(Math.random() * opts.length)];
    if (scoreDir(st, me, alt, foe) > 4) best = alt;
  }
  me.nextDir = best;
}

function scoreDir(st, me, dir, foe) {
  const v = DIRS[dir];
  let x = me.gridX + v.x;
  let y = me.gridY + v.y;
  let free = 0;
  let bonus = 0;
  for (let i = 0; i < 10; i += 1) {
    if (!inBounds(x, y)) break;
    if (st.grid[y][x] !== null) break;
    // Power-up en la línea de visión → bonus (más cercano vale más)
    if (st.powerups) {
      const pu = st.powerups.find((p) => p.gx === x && p.gy === y);
      if (pu) bonus += 3 - Math.min(2, i * 0.3);
    }
    free += 1;
    x += v.x;
    y += v.y;
  }
  const fx = foe.gridX + DIRS[foe.dir].x;
  const fy = foe.gridY + DIRS[foe.dir].y;
  const mx = me.gridX + v.x;
  const my = me.gridY + v.y;
  const penalty = (mx === fx && my === fy) ? -4 : 0;
  return free + penalty + bonus;
}

// ============================================================
// Round end / Match end
// ============================================================

function createRoundEndUi(scene) {
  scene.roundEnd = {};
  const c = scene.add.container(0, 0).setDepth(25).setVisible(false);
  scene.roundEnd.container = c;

  const midY = PLAY_TOP + (ROWS * CELL) / 2;

  // Panel principal estilo cartel negro "salida" con borde amarillo
  const panel = scene.add.rectangle(W / 2, midY, 540, 170, THEME.signInk, 0.97);
  panel.setStrokeStyle(3, THEME.subteYellow, 1);
  c.add(panel);

  // Línea decorativa arriba
  const topBar = scene.add.rectangle(W / 2, midY - 82, 520, 6, THEME.subteYellow, 1);
  c.add(topBar);

  scene.roundEnd.label = scene.add.text(W / 2, midY - 60, 'FIN DE RONDA', {
    fontFamily: FONT_SIGN,
    fontSize: '11px',
    color: '#ffd020',
    fontStyle: 'bold',
    letterSpacing: 4,
  }).setOrigin(0.5);
  c.add(scene.roundEnd.label);

  scene.roundEnd.title = scene.add.text(W / 2, midY - 20, 'GANA LÍNEA A', {
    fontFamily: FONT_DISPLAY,
    fontSize: '42px',
    color: '#eee9d5',
    fontStyle: 'bold',
    letterSpacing: 3,
    stroke: '#0f1320',
    strokeThickness: 2,
  }).setOrigin(0.5);
  c.add(scene.roundEnd.title);

  // Badge grande
  scene.roundEnd.badge = scene.add.circle(W / 2 - 170, midY - 18, 26, LINES[0].color, 1);
  scene.roundEnd.badge.setStrokeStyle(3, 0xffffff, 1);
  scene.roundEnd.badgeText = scene.add.text(W / 2 - 170, midY - 18, 'A', {
    fontFamily: FONT_SIGN,
    fontSize: '32px',
    color: '#0f1320',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  c.add(scene.roundEnd.badge);
  c.add(scene.roundEnd.badgeText);

  scene.roundEnd.score = scene.add.text(W / 2, midY + 28, '0 - 0', {
    fontFamily: FONT_MONO,
    fontSize: '28px',
    color: '#ffd020',
    fontStyle: 'bold',
    letterSpacing: 6,
  }).setOrigin(0.5);
  c.add(scene.roundEnd.score);

  scene.roundEnd.subtitle = scene.add.text(W / 2, midY + 64, '', {
    fontFamily: FONT_SIGN,
    fontSize: '11px',
    color: '#b8c0d4',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5);
  c.add(scene.roundEnd.subtitle);
}

function endRound(scene, winner) {
  const st = scene.state;
  st.phase = 'roundend';
  st.roundWinner = winner;
  st.endTimer = 1900;
  if (winner === 'p1') st.p1.score += 1;
  else if (winner === 'p2') st.p2.score += 1;
  refreshHud(scene);

  scene.roundEnd.container.setVisible(true);

  if (winner === 'draw') {
    scene.roundEnd.label.setText('COLISIÓN DOBLE');
    scene.roundEnd.label.setColor('#ff4d55');
    scene.roundEnd.title.setText('EMPATE');
    scene.roundEnd.title.setColor('#eee9d5');
    scene.roundEnd.badge.setVisible(false);
    scene.roundEnd.badgeText.setVisible(false);
    scene.roundEnd.subtitle.setText('AMBAS LÍNEAS DESCARRILARON');
  } else {
    const wp = winner === 'p1' ? st.p1 : st.p2;
    const line = LINES[wp.lineIdx];
    scene.roundEnd.label.setText('FIN DE RONDA');
    scene.roundEnd.label.setColor('#ffd020');
    scene.roundEnd.title.setText(`GANA LÍNEA ${line.id}`);
    scene.roundEnd.title.setColor('#eee9d5');
    scene.roundEnd.badge.setVisible(true);
    scene.roundEnd.badgeText.setVisible(true);
    scene.roundEnd.badge.setFillStyle(line.color);
    scene.roundEnd.badgeText.setText(line.id);
    scene.roundEnd.badgeText.setColor(line.inkOnBadge);
    scene.roundEnd.subtitle.setText(`${line.era}`);
  }
  scene.roundEnd.score.setText(`${st.p1.score}  -  ${st.p2.score}`);

  playSound(scene, 'roundwin');
}

function updateRoundEnd(scene, delta) {
  const st = scene.state;
  if (st.endTimer > 0) return;
  scene.roundEnd.container.setVisible(false);
  if (st.p1.score >= WIN_ROUNDS || st.p2.score >= WIN_ROUNDS) return endMatch(scene);
  startNextRound(scene);
}

function createMatchEndUi(scene) {
  scene.matchEnd = {};
  const c = scene.add.container(0, 0).setDepth(30).setVisible(false);
  scene.matchEnd.container = c;

  // Fondo túnel oscuro
  c.add(scene.add.rectangle(W / 2, H / 2, W, H, THEME.bgDeep, 0.98));
  // Franja amarilla inferior con dashes
  const stripeG = scene.add.graphics();
  stripeG.fillStyle(THEME.subteYellow, 0.2);
  stripeG.fillRect(0, H - 62, W, 3);
  stripeG.fillStyle(0x0f1320, 1);
  for (let x = 4; x < W; x += 14) stripeG.fillRect(x, H - 62, 4, 3);
  c.add(stripeG);

  // Cartel "ESTACIÓN TERMINAL" (placa esmaltada)
  const plate = scene.add.rectangle(W / 2, 115, 460, 84, THEME.signWhite, 1);
  plate.setStrokeStyle(3, THEME.signInk, 1);
  c.add(plate);
  // Borde decorativo interior
  const plateInner = scene.add.rectangle(W / 2, 115, 446, 70, 0x000000, 0);
  plateInner.setStrokeStyle(1, THEME.signInk, 0.35);
  c.add(plateInner);

  scene.matchEnd.eyebrow = scene.add.text(W / 2, 92, 'ESTACIÓN TERMINAL  ·  FIN DE LA LÍNEA', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#5a5f6e',
    fontStyle: 'bold',
    letterSpacing: 4,
  }).setOrigin(0.5);
  c.add(scene.matchEnd.eyebrow);

  scene.matchEnd.title = scene.add.text(W / 2, 124, 'CAMPEÓN · LÍNEA A', {
    fontFamily: FONT_DISPLAY,
    fontSize: '34px',
    color: '#0f1320',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5);
  c.add(scene.matchEnd.title);

  // Badge gigante del campeón
  scene.matchEnd.badge = scene.add.circle(W / 2, 230, 48, LINES[0].color, 1);
  scene.matchEnd.badge.setStrokeStyle(4, 0xffffff, 1);
  scene.matchEnd.badgeText = scene.add.text(W / 2, 230, 'A', {
    fontFamily: FONT_SIGN,
    fontSize: '60px',
    color: '#0f1320',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  c.add(scene.matchEnd.badge);
  c.add(scene.matchEnd.badgeText);

  // Vagón campeón — claramente debajo del badge, con su propia plataforma crema
  const carPad = scene.add.rectangle(W / 2, 318, 180, 48, 0x10131e, 0.85);
  carPad.setStrokeStyle(1, THEME.subteYellow, 0.55);
  c.add(carPad);
  // Mini vías bajo el vagón (pan de rieles)
  const rails = scene.add.graphics();
  rails.lineStyle(1.5, THEME.railMetal, 0.7);
  rails.lineBetween(W / 2 - 80, 332, W / 2 + 80, 332);
  rails.lineBetween(W / 2 - 80, 342, W / 2 + 80, 342);
  rails.lineStyle(1, 0x222836, 0.9);
  for (let dx = W / 2 - 78; dx < W / 2 + 80; dx += 8) {
    rails.lineBetween(dx, 332, dx, 342);
  }
  c.add(rails);

  scene.matchEnd.championCar = null;

  // Subtítulo con era de la línea
  scene.matchEnd.subtitle = scene.add.text(W / 2, 380, 'JUGADOR 1 GANA LA SERIE', {
    fontFamily: FONT_SIGN,
    fontSize: '13px',
    color: '#eee9d5',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5);
  c.add(scene.matchEnd.subtitle);

  // Tablero de score LED grande
  scene.matchEnd.scoreBg = scene.add.rectangle(W / 2, 425, 220, 46, THEME.signInk, 1);
  scene.matchEnd.scoreBg.setStrokeStyle(2, THEME.subteYellow, 0.9);
  c.add(scene.matchEnd.scoreBg);
  // Pinstripes
  c.add(scene.add.rectangle(W / 2, 406, 210, 1, THEME.subteYellow, 0.5));
  c.add(scene.add.rectangle(W / 2, 444, 210, 1, THEME.subteYellow, 0.5));
  // Label mini
  c.add(scene.add.text(W / 2, 413, 'SCORE FINAL', {
    fontFamily: FONT_MONO,
    fontSize: '8px',
    color: '#ffb447',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5));
  scene.matchEnd.score = scene.add.text(W / 2, 431, '3 - 0', {
    fontFamily: FONT_MONO,
    fontSize: '22px',
    color: '#ffd020',
    fontStyle: 'bold',
    letterSpacing: 8,
  }).setOrigin(0.5);
  c.add(scene.matchEnd.score);

  // Label de la bitácora + 6 contadores con espacio generoso
  c.add(scene.add.text(W / 2, 470, 'VICTORIAS POR LÍNEA', {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: '#8a7040',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5));
  scene.matchEnd.winsRow = scene.add.container(W / 2, 500);
  c.add(scene.matchEnd.winsRow);

  scene.matchEnd.hint = scene.add.text(W / 2, H - 36, '▸ BOTÓN 1 / START  ·  VOLVER AL MENÚ', {
    fontFamily: FONT_MONO,
    fontSize: '10px',
    color: '#8ca0c8',
    fontStyle: 'bold',
    letterSpacing: 3,
  }).setOrigin(0.5);
  c.add(scene.matchEnd.hint);
}

function endMatch(scene) {
  const st = scene.state;
  st.phase = 'matchend';
  st.endTimer = 500;

  const winner = st.p1.score > st.p2.score ? 'p1' : 'p2';
  st.matchWinner = winner;
  const wp = winner === 'p1' ? st.p1 : st.p2;
  const lp = winner === 'p1' ? st.p2 : st.p1;
  const wLine = LINES[wp.lineIdx];
  const lLine = LINES[lp.lineIdx];

  scene.matchEnd.container.setVisible(true);
  // Flip-board reveal estilo Solari — el título "flipea" revelando campeón
  const finalTitle = `CAMPEÓN · LÍNEA ${wLine.id}`;
  scene.matchEnd.title.setText(' ');
  scene.matchEnd.title.setScale(1, 0);
  scene.tweens.add({
    targets: scene.matchEnd.title,
    scaleY: { from: 0, to: 1 },
    duration: 320,
    ease: 'Back.easeOut',
    onComplete: () => scene.matchEnd.title.setText(finalTitle),
  });
  scene.matchEnd.badge.setFillStyle(wLine.color);
  scene.matchEnd.badgeText.setText(wLine.id);
  scene.matchEnd.badgeText.setColor(wLine.inkOnBadge);
  // Burst inicial del badge (el anillo blanco se expande)
  const badgeRing = scene.add.circle(W / 2, 240, 44, 0x000000, 0);
  badgeRing.setStrokeStyle(3, 0xffffff, 1);
  badgeRing.setDepth(31);
  scene.matchEnd.container.add(badgeRing);
  scene.tweens.add({
    targets: badgeRing,
    radius: 140,
    alpha: 0,
    duration: 720,
    ease: 'Cubic.easeOut',
    onComplete: () => badgeRing.destroy(),
  });
  // Segundo anillo del color de la línea
  const badgeRing2 = scene.add.circle(W / 2, 240, 46, 0x000000, 0);
  badgeRing2.setStrokeStyle(2, wLine.color, 1);
  badgeRing2.setDepth(31);
  scene.matchEnd.container.add(badgeRing2);
  scene.tweens.add({
    targets: badgeRing2,
    radius: 180,
    alpha: 0,
    duration: 900,
    delay: 140,
    ease: 'Cubic.easeOut',
    onComplete: () => badgeRing2.destroy(),
  });
  // Confetti en colores de ambas líneas
  for (let i = 0; i < 40; i += 1) {
    const fromLeft = i % 2 === 0;
    const col = fromLeft ? wLine.color : lLine.color;
    const sx = fromLeft ? 60 : W - 60;
    const sy = H / 2 + (Math.random() - 0.5) * 80;
    const conf = scene.add.rectangle(sx, sy, 4, 6, col, 1);
    conf.setDepth(31);
    scene.matchEnd.container.add(conf);
    scene.tweens.add({
      targets: conf,
      x: sx + (fromLeft ? 1 : -1) * (280 + Math.random() * 260),
      y: sy - 120 + Math.random() * 80,
      angle: (fromLeft ? 1 : -1) * (360 + Math.random() * 720),
      alpha: 0,
      duration: 1800 + Math.random() * 600,
      delay: 100 + Math.random() * 400,
      ease: 'Cubic.easeOut',
      onComplete: () => conf.destroy(),
    });
  }

  // Vagón campeón sobre los rieles (abajo del badge, sin superposición)
  if (scene.matchEnd.championCar) scene.matchEnd.championCar.destroy();
  const car = buildTrainCar(scene, wp.lineIdx, 2.4);
  car.setPosition(W / 2, 318);
  scene.matchEnd.championCar = car;
  scene.matchEnd.container.add(car);
  scene.tweens.add({
    targets: car,
    y: 316,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  scene.matchEnd.subtitle.setText(
    `${wp.isAI ? 'CPU' : winner === 'p1' ? 'JUGADOR 1' : 'JUGADOR 2'}  ·  ${wLine.era}`,
  );
  scene.matchEnd.score.setText(`${st.p1.score}  -  ${st.p2.score}`);

  // Actualizar marcador de wins inline
  renderWinsInline(scene, scene.matchEnd.winsRow);

  recordMatchResult(scene, wLine.id, lLine.id).then(() => {
    refreshLeaderboardUi(scene);
    renderWinsInline(scene, scene.matchEnd.winsRow);
  });

  playSound(scene, 'victory');
}

function updateMatchEnd(scene, delta) {
  const st = scene.state;
  if (st.endTimer > 0) return;
  if (consumeAnyPressed(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
    if (scene.matchEnd.championCar) {
      scene.matchEnd.championCar.destroy();
      scene.matchEnd.championCar = null;
    }
    scene.matchEnd.container.setVisible(false);
    showMenu(scene);
  }
}

function renderWinsInline(scene, container) {
  container.removeAll(true);
  const wins = (scene.state.lb || {}).wins || {};
  for (let i = 0; i < LINE_COUNT; i += 1) {
    const wx = (i - (LINE_COUNT - 1) / 2) * 104;
    const n = wins[LINES[i].id] || 0;
    const circ = scene.add.circle(wx - 20, 0, 11, LINES[i].color, 1);
    circ.setStrokeStyle(1.5, 0xffffff, 1);
    const lt = scene.add.text(wx - 20, 0, LINES[i].id, {
      fontFamily: FONT_SIGN, fontSize: '13px', color: LINES[i].inkOnBadge, fontStyle: 'bold',
    }).setOrigin(0.5);
    const cnt = scene.add.text(wx + 2, 0, String(n).padStart(2, '0'), {
      fontFamily: FONT_MONO, fontSize: '18px', color: n > 0 ? '#ffd020' : '#5a5f6e', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    container.add(circ); container.add(lt); container.add(cnt);
  }
}

function hexColor(intColor) {
  return '#' + intColor.toString(16).padStart(6, '0');
}

// ============================================================
// Leaderboard storage
// ============================================================

async function recordMatchResult(scene, winnerLine, loserLine) {
  const st = scene.state;
  const lb = st.lb || { wins: {}, recent: [] };
  lb.wins[winnerLine] = (lb.wins[winnerLine] || 0) + 1;
  lb.recent.unshift({
    w: winnerLine,
    l: loserLine,
    mode: st.mode,
    at: new Date().toISOString().slice(0, 10),
  });
  if (lb.recent.length > MAX_RECENT) lb.recent.length = MAX_RECENT;
  st.lb = lb;
  try { await saveLeaderboard(lb); } catch (_) {}
}

function refreshLeaderboardUi(scene) {
  const lb = scene.state.lb || { wins: {}, recent: [] };
  if (!scene.menu || !scene.menu.dominantRow) return;

  // Reset container
  scene.menu.dominantRow.removeAll(true);

  // Encontrar línea dominante
  let domId = null;
  let domCount = 0;
  let totalRuns = 0;
  const wins = lb.wins || {};
  for (const l of LINES) {
    const w = wins[l.id] || 0;
    totalRuns += w;
    if (w > domCount) { domCount = w; domId = l.id; }
  }

  const c = scene.menu.dominantRow;

  if (totalRuns === 0) {
    // Mensaje "esperando primera victoria"
    c.add(scene.add.text(0, 0, '— ESPERANDO LA PRIMERA VICTORIA DE LA RED —', {
      fontFamily: FONT_MONO,
      fontSize: '10px',
      color: '#5a5f6e',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5));
    return;
  }

  const domLine = LINES.find((l) => l.id === domId);

  // Layout compacto, centrado: LABEL · [BADGE] N VIAJES · ••••••
  const label = scene.add.text(-128, 0, 'LÍNEA DOMINANTE', {
    fontFamily: FONT_MONO,
    fontSize: '9px',
    color: '#8a7040',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5);
  c.add(label);

  const badgeX = -20;
  const dBadge = scene.add.circle(badgeX, 0, 9, domLine.color, 1);
  dBadge.setStrokeStyle(1.5, 0xffffff, 1);
  c.add(dBadge);
  c.add(scene.add.text(badgeX, 0, domLine.id, {
    fontFamily: FONT_SIGN,
    fontSize: '10px',
    color: domLine.inkOnBadge,
    fontStyle: 'bold',
  }).setOrigin(0.5));

  c.add(scene.add.text(badgeX + 14, 0, `${domCount} VIAJE${domCount === 1 ? '' : 'S'}`, {
    fontFamily: FONT_MONO,
    fontSize: '10px',
    color: '#ffb447',
    fontStyle: 'bold',
    letterSpacing: 2,
  }).setOrigin(0, 0.5));

  // Progress dots: una por línea, coloreadas si tienen wins.
  const dotsStartX = 64;
  for (let i = 0; i < LINES.length; i += 1) {
    const hasWin = (wins[LINES[i].id] || 0) > 0;
    const dot = scene.add.circle(dotsStartX + i * 12, 0, 3.5, hasWin ? LINES[i].color : 0x1a1f2e, 1);
    dot.setStrokeStyle(1, hasWin ? 0xffffff : 0x2a3146, hasWin ? 0.6 : 0.8);
    c.add(dot);
  }
}

// ============================================================
// Controls
// ============================================================

function createControls(scene) {
  scene.controls = {
    held: Object.create(null),
    pressed: Object.create(null),
  };

  const onDown = (ev) => {
    const k = normKey(ev.key);
    if (!k) return;
    const code = KEY_TO_ARCADE[k];
    if (!code) return;
    if (!scene.controls.held[code]) scene.controls.pressed[code] = true;
    scene.controls.held[code] = true;
    if (code.startsWith('P') || code.startsWith('START')) ev.preventDefault?.();
  };
  const onUp = (ev) => {
    const k = normKey(ev.key);
    if (!k) return;
    const code = KEY_TO_ARCADE[k];
    if (!code) return;
    scene.controls.held[code] = false;
  };

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  });
}

function isHeld(scene, code) {
  return scene.controls.held[code] === true;
}

function consumeAnyPressed(scene, codes) {
  for (const c of codes) {
    if (scene.controls.pressed[c]) {
      scene.controls.pressed[c] = false;
      return true;
    }
  }
  return false;
}

function readAxisY(scene) {
  let axis = 0;
  if (isHeld(scene, 'P1_U') || isHeld(scene, 'P2_U')) axis -= 1;
  if (isHeld(scene, 'P1_D') || isHeld(scene, 'P2_D')) axis += 1;
  return Phaser.Math.Clamp(axis, -1, 1);
}

function readAxisX(scene) {
  let axis = 0;
  if (isHeld(scene, 'P1_L') || isHeld(scene, 'P2_L')) axis -= 1;
  if (isHeld(scene, 'P1_R') || isHeld(scene, 'P2_R')) axis += 1;
  return Phaser.Math.Clamp(axis, -1, 1);
}

// ============================================================
// Sound (procedural Web Audio)
// ============================================================

function playSound(scene, type) {
  try {
    const ctx = scene.sound && scene.sound.context;
    if (!ctx) return;
    const now = ctx.currentTime;
    const beep = (t, osType, f, f2, gv, ramp, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = osType;
      o.frequency.setValueAtTime(f, t);
      if (f2 != null) o.frequency.exponentialRampToValueAtTime(f2, t + ramp);
      g.gain.setValueAtTime(gv, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    };
    const seq = (freqs, step, osType, gv, dur, ramp) => {
      for (let i = 0; i < freqs.length; i += 1) beep(now + i * step, osType, freqs[i], null, gv, 0, dur);
    };

    if (type === 'tick') return beep(now, 'square', 760, null, 0.018, 0, 0.03);
    if (type === 'click') return beep(now, 'square', 1500, 700, 0.08, 0.04, 0.05);
    if (type === 'select') return beep(now, 'square', 520, 1600, 0.14, 0.16, 0.2);
    if (type === 'pop') return beep(now, 'sine', 880, 1320, 0.06, 0.08, 0.1);
    if (type === 'count') {
      beep(now, 'sine', 520, null, 0.16, 0, 0.28);
      beep(now, 'sine', 780, null, 0.09, 0, 0.24);
      return;
    }
    if (type === 'go') {
      beep(now, 'triangle', 620, 1400, 0.22, 0.26, 0.36);
      beep(now, 'sawtooth', 180, 90, 0.12, 0.3, 0.32);
      return;
    }
    if (type === 'crash') {
      const bufSize = ctx.sampleRate * 0.4;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.9;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(1800, now);
      filt.frequency.exponentialRampToValueAtTime(180, now + 0.4);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      src.start(now);
      beep(now, 'sawtooth', 240, 50, 0.28, 0.32, 0.34);
      return;
    }
    if (type === 'roundwin') return seq([523, 784, 1046], 0.11, 'square', 0.12, 0.16);
    if (type === 'pickup') return seq([660, 880, 1320], 0.05, 'triangle', 0.14, 0.14);
    if (type === 'victory') return seq([523, 659, 784, 1046, 1318, 1568], 0.13, 'triangle', 0.18, 0.26);
  } catch (_) {}
}

// ============================================================
// Storage
// ============================================================

function getStorage() {
  if (window.platanusArcadeStorage) return window.platanusArcadeStorage;
  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null
          ? { found: false, value: null }
          : { found: true, value: JSON.parse(raw) };
      } catch {
        return { found: false, value: null };
      }
    },
    async set(key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    },
  };
}

async function loadLeaderboard() {
  const res = await getStorage().get(STORAGE_KEY);
  if (!res.found || !res.value || typeof res.value !== 'object') {
    return { wins: {}, recent: [] };
  }
  const wins = (res.value.wins && typeof res.value.wins === 'object') ? res.value.wins : {};
  const recent = Array.isArray(res.value.recent) ? res.value.recent.filter(isValidRecent).slice(0, MAX_RECENT) : [];
  return { wins, recent };
}

function isValidRecent(r) {
  return r && typeof r === 'object'
    && typeof r.w === 'string' && typeof r.l === 'string'
    && typeof r.mode === 'string' && typeof r.at === 'string';
}

async function saveLeaderboard(lb) {
  await getStorage().set(STORAGE_KEY, lb);
}
