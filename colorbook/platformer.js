/*************************************************
 * PLATFORM QUEST
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRAVITY = 0.54;
const MAX_FALL = 15;
const FRICTION = 0.84;
const JUMP_BUFFER = 12;
const COYOTE_TIME = 12;

let state = "title";
let levelIndex = 0;
let player;
let camera;
let particles = [];
let keys = {};
let touchControls = { left: false, right: false, jump: false };
let score = 0;
let gems = 0;
let levelStartScore = 0;
let time = 0;
let btnLeft = {};
let btnRight = {};
let btnJump = {};

const levels = [
  {
    name: "Sprout Path",
    chapter: "Chapter 1",
    story: "Mira finds the first lost color seed beside the sleepy farm trail.",
    sky: ["#78d8ff", "#eafaff"],
    ground: "#8a6041",
    grass: "#5ac45b",
    accent: "#ffcf4a",
    start: { x: 100, y: 0 },
    goal: { x: 2820, y: 0 },
    platforms: [
      { x: -400, y: 0, w: 900, h: 90 },
      { x: 650, y: 0, w: 440, h: 90 },
      { x: 1240, y: 0, w: 360, h: 90 },
      { x: 1780, y: 0, w: 520, h: 90 },
      { x: 2460, y: 0, w: 650, h: 90 },
      { x: 430, y: -140, w: 140, h: 26 },
      { x: 760, y: -205, w: 150, h: 26 },
      { x: 1120, y: -150, w: 130, h: 26 },
      { x: 1540, y: -195, w: 165, h: 26 },
      { x: 2060, y: -170, w: 150, h: 26 },
      { x: 2350, y: -245, w: 165, h: 26 }
    ],
    moving: [
      { x: 1680, y: -95, w: 120, h: 24, axis: "x", range: 150, speed: 1.2 }
    ],
    coins: [
      [480, -185], [815, -265], [1165, -195], [1380, -65], [1615, -255],
      [1880, -55], [2135, -215], [2395, -315], [2620, -55], [2750, -55]
    ],
    enemies: [
      { x: 820, y: 0, kind: "slug", min: 680, max: 1040, speed: 1.1 },
      { x: 1910, y: 0, kind: "beetle", min: 1800, max: 2280, speed: 1.45 }
    ],
    hazards: [
      { x: 1140, y: -16, w: 80, h: 16 },
      { x: 2320, y: -16, w: 80, h: 16 }
    ]
  },
  {
    name: "Moonlit Orchard",
    chapter: "Chapter 2",
    story: "The orchard has gone quiet. Follow the firefly trail over the branches.",
    sky: ["#6d7cff", "#c8f2ff"],
    ground: "#704a39",
    grass: "#63c98b",
    accent: "#a8fff5",
    start: { x: 80, y: 0 },
    goal: { x: 3350, y: 0 },
    platforms: [
      { x: -420, y: 0, w: 720, h: 90 },
      { x: 520, y: 0, w: 380, h: 90 },
      { x: 1080, y: 0, w: 300, h: 90 },
      { x: 1680, y: 0, w: 400, h: 90 },
      { x: 2320, y: 0, w: 320, h: 90 },
      { x: 2930, y: 0, w: 680, h: 90 },
      { x: 360, y: -155, w: 130, h: 26 },
      { x: 650, y: -220, w: 145, h: 26 },
      { x: 980, y: -165, w: 130, h: 26 },
      { x: 1400, y: -205, w: 155, h: 26 },
      { x: 2170, y: -175, w: 130, h: 26 },
      { x: 2700, y: -225, w: 130, h: 26 },
      { x: 3080, y: -275, w: 175, h: 26 }
    ],
    moving: [
      { x: 1510, y: -95, w: 120, h: 24, axis: "y", range: 110, speed: 1.1 },
      { x: 2690, y: -105, w: 125, h: 24, axis: "x", range: 180, speed: 1.25 }
    ],
    coins: [
      [405, -200], [700, -290], [1015, -210], [1150, -55], [1460, -275],
      [1740, -55], [2205, -220], [2520, -55], [2735, -270], [3135, -355], [3280, -55]
    ],
    enemies: [
      { x: 610, y: 0, kind: "moth", min: 540, max: 870, speed: 1.45 },
      { x: 1810, y: 0, kind: "slug", min: 1700, max: 2050, speed: 1.25 },
      { x: 3050, y: 0, kind: "beetle", min: 2960, max: 3500, speed: 1.65 }
    ],
    hazards: [
      { x: 930, y: -16, w: 120, h: 16 },
      { x: 2110, y: -16, w: 170, h: 16 },
      { x: 2670, y: -16, w: 105, h: 16 }
    ]
  },
  {
    name: "Rainbow Ridge",
    chapter: "Final Chapter",
    story: "One seed remains at the ridge. Bring every color home before sunset.",
    sky: ["#ffb36b", "#fff1b8"],
    ground: "#76523b",
    grass: "#57b96d",
    accent: "#ff75a0",
    start: { x: 80, y: 0 },
    goal: { x: 3950, y: 0 },
    platforms: [
      { x: -420, y: 0, w: 640, h: 90 },
      { x: 470, y: 0, w: 300, h: 90 },
      { x: 1030, y: 0, w: 300, h: 90 },
      { x: 1580, y: 0, w: 290, h: 90 },
      { x: 2130, y: 0, w: 320, h: 90 },
      { x: 2760, y: 0, w: 360, h: 90 },
      { x: 3580, y: 0, w: 650, h: 90 },
      { x: 285, y: -170, w: 125, h: 26 },
      { x: 800, y: -175, w: 150, h: 26 },
      { x: 1375, y: -205, w: 155, h: 26 },
      { x: 1950, y: -190, w: 130, h: 26 },
      { x: 2500, y: -220, w: 165, h: 26 },
      { x: 3230, y: -220, w: 130, h: 26 },
      { x: 3730, y: -265, w: 180, h: 26 }
    ],
    moving: [
      { x: 620, y: -110, w: 120, h: 24, axis: "x", range: 210, speed: 1.45 },
      { x: 1500, y: -120, w: 120, h: 24, axis: "y", range: 125, speed: 1.15 },
      { x: 3130, y: -110, w: 125, h: 24, axis: "x", range: 230, speed: 1.5 }
    ],
    coins: [
      [325, -215], [650, -155], [860, -235], [1080, -55], [1430, -275],
      [1620, -55], [1990, -235], [2180, -55], [2560, -295], [2840, -55],
      [3270, -265], [3630, -55], [3800, -345], [4010, -55]
    ],
    enemies: [
      { x: 520, y: 0, kind: "beetle", min: 480, max: 740, speed: 1.8 },
      { x: 1120, y: 0, kind: "moth", min: 1040, max: 1300, speed: 1.7 },
      { x: 2210, y: 0, kind: "slug", min: 2140, max: 2420, speed: 1.45 },
      { x: 3680, y: 0, kind: "beetle", min: 3600, max: 4180, speed: 1.9 }
    ],
    hazards: [
      { x: 250, y: -16, w: 190, h: 16 },
      { x: 800, y: -16, w: 200, h: 16 },
      { x: 1360, y: -16, w: 190, h: 16 },
      { x: 1900, y: -16, w: 200, h: 16 },
      { x: 2495, y: -16, w: 225, h: 16 },
      { x: 3185, y: -16, w: 330, h: 16 }
    ]
  }
];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateButtons();
  if (player) positionLevelToScreen();
}

function updateButtons() {
  const size = Math.max(58, Math.min(74, canvas.width * 0.13));
  const margin = 18;
  btnLeft = { x: margin, y: canvas.height - margin - size, w: size, h: size };
  btnRight = { x: margin + size + 16, y: canvas.height - margin - size, w: size, h: size };
  btnJump = { x: canvas.width - margin - size, y: canvas.height - margin - size, w: size, h: size };
}

window.addEventListener("resize", resize);
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

window.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (state === "playing" && !e.repeat && ["arrowup", "w", " "].includes(key)) queueJump();
  if (["enter", " "].includes(key) && state !== "playing") advanceFromOverlay();
  if (key === "r") startLevel(levelIndex);
});

window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });
canvas.addEventListener("pointerdown", e => {
  if (state !== "playing") {
    advanceFromOverlay();
    return;
  }
  if (e.pointerType === "mouse") {
    updatePointerButtons(e.clientX, e.clientY, true);
  }
});
canvas.addEventListener("pointerup", e => {
  if (e.pointerType === "mouse") {
    touchControls.left = false;
    touchControls.right = false;
    touchControls.jump = false;
  }
});

function handleTouch(e) {
  e.preventDefault();
  if (state !== "playing") {
    if (e.type === "touchstart") advanceFromOverlay();
    return;
  }
  const wasJumping = touchControls.jump;
  const nextControls = { left: false, right: false, jump: false };
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    if (pointInRect(touch.clientX, touch.clientY, btnLeft)) nextControls.left = true;
    if (pointInRect(touch.clientX, touch.clientY, btnRight)) nextControls.right = true;
    if (pointInRect(touch.clientX, touch.clientY, btnJump)) nextControls.jump = true;
  }
  if (nextControls.jump && !wasJumping) queueJump();
  touchControls = nextControls;
}

function updatePointerButtons(x, y, active) {
  if (pointInRect(x, y, btnLeft)) touchControls.left = active;
  if (pointInRect(x, y, btnRight)) touchControls.right = active;
  if (pointInRect(x, y, btnJump)) {
    if (!touchControls.jump && active) queueJump();
    touchControls.jump = active;
  }
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function baseY() {
  return canvas.height - 82;
}

function worldY(offset) {
  return baseY() + offset;
}

function buildLevel(raw) {
  return {
    ...raw,
    platforms: raw.platforms.map(p => ({ ...p, y: worldY(p.y), baseX: p.x, baseY: worldY(p.y), lastX: p.x, lastY: worldY(p.y) })),
    moving: raw.moving.map(p => ({ ...p, y: worldY(p.y), baseX: p.x, baseY: worldY(p.y), lastX: p.x, lastY: worldY(p.y) })),
    coins: raw.coins.map(([x, y]) => ({ x, y: worldY(y), w: 24, h: 24, collected: false, bob: Math.random() * Math.PI * 2 })),
    enemies: raw.enemies.map(e => ({ ...e, y: worldY(-35), w: 36, h: 34, vx: e.speed, dead: false, squish: 0 })),
    hazards: raw.hazards.map(h => ({ ...h, y: worldY(h.y) })),
    goal: { x: raw.goal.x, y: worldY(-230), w: 48, h: 230 }
  };
}

let level = buildLevel(levels[0]);

function positionLevelToScreen() {
  level = buildLevel(levels[levelIndex]);
  if (player) player.y = Math.min(player.y, baseY() - player.h);
}

function startLevel(index) {
  levelIndex = index;
  level = buildLevel(levels[levelIndex]);
  levelStartScore = score;
  gems = 0;
  particles = [];
  camera = { x: 0, shake: 0 };
  player = {
    x: level.start.x,
    y: worldY(-120),
    w: 34,
    h: 46,
    vx: 0,
    vy: 0,
    maxSpeed: 6.8,
    jumpPower: -15.8,
    airJumps: 1,
    maxAirJumps: 1,
    grounded: false,
    coyote: 0,
    jumpBuffer: 0,
    facing: 1,
    anim: 0,
    hurt: 0,
    respawns: 0
  };
  state = "story";
}

function advanceFromOverlay() {
  if (state === "title") {
    score = 0;
    startLevel(0);
  } else if (state === "story") {
    state = "playing";
  } else if (state === "dead") {
    score = levelStartScore;
    startLevel(levelIndex);
    state = "playing";
  } else if (state === "levelComplete") {
    if (levelIndex < levels.length - 1) {
      startLevel(levelIndex + 1);
    } else {
      state = "complete";
    }
  } else if (state === "complete") {
    score = 0;
    startLevel(0);
  }
}

function queueJump() {
  if (player) player.jumpBuffer = JUMP_BUFFER;
}

function update() {
  requestAnimationFrame(update);
  time++;
  drawBackground();

  if (state === "playing") {
    updateGame();
  }

  ctx.save();
  ctx.translate(-camera.x, 0);
  drawScenery();
  drawLevel();
  drawEnemies();
  drawPlayer();
  drawParticles();
  ctx.restore();

  drawHUD();
  if (state === "playing") drawControls();
  drawOverlay();
}

function updateGame() {
  updateMovingPlatforms();
  handleInput();
  applyPhysics();
  updateEnemies();
  updateCamera();
}

function handleInput() {
  const left = keys.arrowleft || keys.a || touchControls.left;
  const right = keys.arrowright || keys.d || touchControls.right;
  const jumpHeld = keys.arrowup || keys.w || keys[" "] || touchControls.jump;

  if (left) {
    player.vx -= 0.78;
    player.facing = -1;
  }
  if (right) {
    player.vx += 0.78;
    player.facing = 1;
  }
  if (!left && !right) player.vx *= FRICTION;
  player.vx = clamp(player.vx, -player.maxSpeed, player.maxSpeed);

  if (player.jumpBuffer > 0) player.jumpBuffer--;
  if (player.coyote > 0) player.coyote--;
  if (player.jumpBuffer > 0 && (player.coyote > 0 || player.airJumps > 0)) {
    const groundJump = player.coyote > 0;
    player.vy = groundJump ? player.jumpPower : player.jumpPower * 0.9;
    player.grounded = false;
    if (!groundJump) player.airJumps--;
    player.coyote = 0;
    player.jumpBuffer = 0;
    burst(player.x + player.w / 2, player.y + player.h, groundJump ? "#ffffff" : level.accent, groundJump ? 9 : 16, groundJump ? 4 : 5);
    vibrate(18);
  }
  if (!jumpHeld && player.vy < -5.5) player.vy *= 0.9;
}

function applyPhysics() {
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL);

  player.x += player.vx;
  let hit = collidingPlatform(player);
  if (hit) {
    if (player.vx > 0) player.x = hit.x - player.w;
    if (player.vx < 0) player.x = hit.x + hit.w;
    player.vx = 0;
  }

  player.y += player.vy;
  player.grounded = false;
  hit = collidingPlatform(player);
  if (hit) {
    if (player.vy > 0) {
      player.y = hit.y - player.h;
      player.vy = 0;
      player.grounded = true;
      player.airJumps = player.maxAirJumps;
      player.coyote = COYOTE_TIME;
      if (hit.dx) player.x += hit.dx;
    } else if (player.vy < 0) {
      player.y = hit.y + hit.h;
      player.vy = 0;
    }
  }

  collectCoins();
  checkHazards();
  checkGoal();

  if (player.y > canvas.height + 140) hurtPlayer();
  player.anim += Math.abs(player.vx) * 0.13 + (player.grounded ? 0.08 : 0.03);
  player.hurt = Math.max(0, player.hurt - 1);
}

function updateMovingPlatforms() {
  level.moving.forEach(p => {
    p.lastX = p.x;
    p.lastY = p.y;
    const wave = Math.sin(time * 0.018 * p.speed);
    if (p.axis === "x") p.x = p.baseX + wave * p.range;
    if (p.axis === "y") p.y = p.baseY + wave * p.range;
    p.dx = p.x - p.lastX;
    p.dy = p.y - p.lastY;
  });
}

function updateEnemies() {
  level.enemies.forEach(enemy => {
    if (enemy.dead) {
      enemy.squish++;
      return;
    }
    enemy.x += enemy.vx;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
    enemy.y += Math.sin(time * 0.08 + enemy.x) * (enemy.kind === "moth" ? 0.8 : 0.2);

    if (rectsOverlap(player, enemy)) {
      const stomp = player.vy > 0 && player.y + player.h < enemy.y + enemy.h * 0.72;
      if (stomp) {
        enemy.dead = true;
        player.vy = player.jumpPower * 0.78;
        score += 150;
        burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, level.accent, 18, 6);
        vibrate([18, 18]);
      } else {
        hurtPlayer();
      }
    }
  });
}

function collectCoins() {
  level.coins.forEach(coin => {
    if (!coin.collected && rectsOverlap(player, coin)) {
      coin.collected = true;
      score += 100;
      gems++;
      burst(coin.x + coin.w / 2, coin.y + coin.h / 2, "#ffd84a", 16, 5);
      vibrate(24);
    }
  });
}

function checkHazards() {
  level.hazards.forEach(h => {
    if (rectsOverlap(player, h)) hurtPlayer();
  });
}

function checkGoal() {
  if (rectsOverlap(player, level.goal)) {
    score += 750 + gems * 25;
    state = "levelComplete";
    burst(level.goal.x + 30, level.goal.y + 40, level.accent, 40, 8);
    vibrate([40, 40, 40]);
  }
}

function hurtPlayer() {
  if (player.hurt > 0) return;
  player.hurt = 30;
  player.respawns++;
  camera.shake = 14;
  burst(player.x + player.w / 2, player.y + player.h / 2, "#ff5d5d", 26, 7);
  vibrate(90);
  state = "dead";
}

function updateCamera() {
  const target = player.x - canvas.width * 0.38;
  camera.x += (target - camera.x) * 0.09;
  camera.x = Math.max(0, camera.x);
  if (camera.shake > 0) camera.shake--;
}

function collidingPlatform(rect) {
  const allPlatforms = level.platforms.concat(level.moving);
  for (const p of allPlatforms) {
    if (rectsOverlap(rect, p)) return p;
  }
  return null;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function vibrate(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function burst(x, y, color, count, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * power + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 26 + Math.random() * 18,
      maxLife: 44,
      color,
      size: Math.random() * 4 + 2
    });
  }
}

function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, level.sky[0]);
  grd.addColorStop(1, level.sky[1]);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sunX = canvas.width - 105;
  const sunY = 90 + Math.sin(time * 0.01) * 8;
  ctx.fillStyle = "rgba(255, 237, 132, 0.9)";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 260 - camera.x * 0.18 + time * 0.12) % (canvas.width + 220)) - 120;
    cloud(x, 82 + i * 34, 0.75 + i * 0.08);
  }
}

function drawScenery() {
  const shakeX = camera.shake ? (Math.random() - 0.5) * camera.shake : 0;
  ctx.translate(shakeX, 0);
  for (let i = -1; i < 18; i++) {
    const x = i * 300;
    const y = baseY() - 18;
    ctx.fillStyle = "rgba(65, 105, 77, 0.24)";
    ctx.beginPath();
    ctx.moveTo(x - 100, y);
    ctx.lineTo(x + 60, y - 160 - (i % 3) * 30);
    ctx.lineTo(x + 220, y);
    ctx.fill();
  }
}

function cloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 26 * scale, y - 10 * scale, 28 * scale, 0, Math.PI * 2);
  ctx.arc(x + 58 * scale, y, 21 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawLevel() {
  level.platforms.forEach(drawPlatform);
  level.moving.forEach(p => drawPlatform(p, true));
  drawHazards();
  drawCoins();
  drawGoal();
}

function drawPlatform(p, moving = false) {
  ctx.fillStyle = moving ? "#996a53" : level.ground;
  roundRect(p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.fillStyle = moving ? level.accent : level.grass;
  roundRect(p.x, p.y, p.w, 12, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(p.x + 8, p.y + 17, p.w - 16, 4);
}

function drawHazards() {
  level.hazards.forEach(h => {
    const spikes = Math.max(3, Math.floor(h.w / 24));
    ctx.fillStyle = "#f04f4f";
    for (let i = 0; i < spikes; i++) {
      const x = h.x + (i / spikes) * h.w;
      ctx.beginPath();
      ctx.moveTo(x, h.y + h.h);
      ctx.lineTo(x + h.w / spikes / 2, h.y + Math.sin(time * 0.18 + i) * 2);
      ctx.lineTo(x + h.w / spikes, h.y + h.h);
      ctx.fill();
    }
  });
}

function drawCoins() {
  level.coins.forEach(c => {
    if (c.collected) return;
    const bob = Math.sin(time * 0.08 + c.bob) * 6;
    ctx.save();
    ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + bob);
    ctx.scale(0.72 + Math.sin(time * 0.12 + c.bob) * 0.15, 1);
    ctx.fillStyle = "#ffca38";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff0a6";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawGoal() {
  const g = level.goal;
  ctx.fillStyle = "#f7f7f7";
  ctx.fillRect(g.x, g.y, 8, g.h);
  ctx.fillStyle = level.accent;
  ctx.beginPath();
  ctx.moveTo(g.x + 8, g.y + 8);
  ctx.quadraticCurveTo(g.x + 88, g.y + 26 + Math.sin(time * 0.1) * 8, g.x + 8, g.y + 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(g.x + 38, g.y + 36, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  level.enemies.forEach(enemy => {
    if (enemy.dead && enemy.squish > 20) return;
    const squish = enemy.dead ? 0.35 : 1 + Math.sin(time * 0.14) * 0.05;
    ctx.save();
    ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
    ctx.scale(enemy.vx < 0 ? -1 : 1, squish);
    ctx.fillStyle = enemy.kind === "moth" ? "#8e65ff" : enemy.kind === "beetle" ? "#2f9259" : "#c06a4b";
    roundRect(-enemy.w / 2, -enemy.h / 2, enemy.w, enemy.h, 16);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(8, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2933";
    ctx.beginPath();
    ctx.arc(10, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.kind === "moth") {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.ellipse(-12, -9, 13, 8 + Math.sin(time * 0.5) * 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawPlayer() {
  if (!player) return;
  const walk = Math.sin(player.anim) * (player.grounded ? 1 : 0.25);
  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.facing, 1);
  if (player.hurt > 0 && Math.floor(player.hurt / 3) % 2 === 0) ctx.globalAlpha = 0.55;

  ctx.strokeStyle = "#2b3753";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 13);
  ctx.lineTo(-13 - walk * 4, 22);
  ctx.moveTo(8, 13);
  ctx.lineTo(13 + walk * 4, 22);
  ctx.stroke();

  ctx.fillStyle = "#ff7d5c";
  roundRect(-15, -8, 30, 27, 10);
  ctx.fill();
  ctx.fillStyle = "#ffd6b8";
  ctx.beginPath();
  ctx.arc(0, -20 + Math.sin(player.anim * 0.8) * 1.5, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#34344a";
  ctx.beginPath();
  ctx.arc(5, -22, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#34344a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(2, -17, 5, 0.2, 1.2);
  ctx.stroke();

  ctx.fillStyle = "#4b7bec";
  ctx.beginPath();
  ctx.moveTo(-16, -29);
  ctx.quadraticCurveTo(-2, -45, 14, -29);
  ctx.quadraticCurveTo(0, -24, -16, -29);
  ctx.fill();

  ctx.strokeStyle = "#2b3753";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-22, 7 - walk * 3);
  ctx.moveTo(12, 0);
  ctx.lineTo(21, 5 + walk * 3);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  particles = particles.filter(p => p.life > 0);
}

function drawHUD() {
  ctx.fillStyle = "rgba(24, 33, 49, 0.72)";
  roundRect(14, 14, Math.min(canvas.width - 28, 460), 54, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 17px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${level.chapter}: ${level.name}`, 30, 33);
  ctx.font = "700 16px system-ui";
  ctx.fillText(`Score ${score}   Gems ${gems}/${level.coins.length}`, 30, 56);
}

function drawControls() {
  drawControlButton(btnLeft, "<", touchControls.left);
  drawControlButton(btnRight, ">", touchControls.right);
  drawControlButton(btnJump, "^", touchControls.jump);
}

function drawControlButton(btn, label, active) {
  ctx.save();
  ctx.globalAlpha = active ? 0.88 : 0.62;
  ctx.fillStyle = active ? "#ffffff" : "rgba(255,255,255,0.72)";
  ctx.strokeStyle = "rgba(32,45,66,0.32)";
  ctx.lineWidth = 2;
  roundRect(btn.x, btn.y, btn.w, btn.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#24324a";
  ctx.font = "800 28px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2 - 2);
  ctx.restore();
}

function drawOverlay() {
  if (state === "playing") return;
  ctx.fillStyle = "rgba(14, 22, 38, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxW = Math.min(560, canvas.width - 36);
  const boxH = state === "title" ? 270 : 250;
  const x = (canvas.width - boxW) / 2;
  const y = (canvas.height - boxH) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(x, y, boxW, boxH, 18);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1d2740";

  if (state === "title") {
    ctx.font = "800 38px system-ui";
    ctx.fillText("Platform Quest", canvas.width / 2, y + 58);
    ctx.font = "600 18px system-ui";
    wrapText("Run, double-jump, collect color seeds, and bring the farm story back to life.", canvas.width / 2, y + 112, boxW - 70, 25);
    ctx.font = "700 17px system-ui";
    ctx.fillText("Tap, Space, or Enter to start", canvas.width / 2, y + 205);
    return;
  }

  if (state === "story") {
    ctx.font = "800 22px system-ui";
    ctx.fillText(`${level.chapter}: ${level.name}`, canvas.width / 2, y + 52);
    ctx.font = "600 18px system-ui";
    wrapText(level.story, canvas.width / 2, y + 105, boxW - 70, 28);
    ctx.font = "700 16px system-ui";
    ctx.fillText("Tap to play", canvas.width / 2, y + 195);
  } else if (state === "dead") {
    ctx.font = "800 34px system-ui";
    ctx.fillText("Try Again", canvas.width / 2, y + 65);
    ctx.font = "600 18px system-ui";
    wrapText("Watch the spikes, double-jump across gaps, and bounce on enemies from above.", canvas.width / 2, y + 120, boxW - 70, 28);
    ctx.font = "700 16px system-ui";
    ctx.fillText("Tap to restart this level", canvas.width / 2, y + 195);
  } else if (state === "levelComplete") {
    ctx.font = "800 32px system-ui";
    ctx.fillText("Seed Rescued!", canvas.width / 2, y + 62);
    ctx.font = "600 18px system-ui";
    ctx.fillText(`Score ${score}   Gems ${gems}/${level.coins.length}`, canvas.width / 2, y + 118);
    ctx.font = "700 16px system-ui";
    ctx.fillText(levelIndex < levels.length - 1 ? "Tap for the next chapter" : "Tap for the finale", canvas.width / 2, y + 190);
  } else if (state === "complete") {
    ctx.font = "800 32px system-ui";
    ctx.fillText("Colors Restored!", canvas.width / 2, y + 62);
    ctx.font = "600 18px system-ui";
    wrapText(`Mira brought every color seed home. Final score: ${score}.`, canvas.width / 2, y + 118, boxW - 70, 28);
    ctx.font = "700 16px system-ui";
    ctx.fillText("Tap to play again", canvas.width / 2, y + 195);
  }
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  });
  ctx.fillText(line, x, currentY);
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

resize();
startLevel(0);
state = "title";
requestAnimationFrame(update);
