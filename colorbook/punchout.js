const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("scoreText");
const levelText = document.getElementById("levelText");
const comboText = document.getElementById("comboText");
const tipText = document.getElementById("tipText");
const controlButtons = document.querySelectorAll("[data-control]");

const keys = {};
const held = { left: false, right: false, dash: false };
const lanes = [-1, 0, 1];
const punchZone = { near: 0.72, far: 0.92 };

const levels = [
  {
    name: "Jogger Lane",
    target: 8,
    spawn: 82,
    speed: 0.0042,
    sky: ["#8dd9ff", "#effbff"],
    road: "#6f7f8e",
    people: [
      { name: "Beach Ball", color: "#ff6f61", accent: "#ffffff", kind: "ball" },
      { name: "Foam Block", color: "#2ec4b6", accent: "#fff2a8", kind: "block" }
    ]
  },
  {
    name: "Skate Park",
    target: 10,
    spawn: 72,
    speed: 0.0049,
    sky: ["#ffd36a", "#fff5c5"],
    road: "#686f7d",
    people: [
      { name: "Traffic Cone", color: "#fb5607", accent: "#ffffff", kind: "cone" },
      { name: "Rolling Tire", color: "#2b2d42", accent: "#8d99ae", kind: "tire" }
    ]
  },
  {
    name: "Dance Dash",
    target: 12,
    spawn: 64,
    speed: 0.0055,
    sky: ["#f5a7ff", "#d7fff1"],
    road: "#5b6575",
    people: [
      { name: "Disco Ball", color: "#a7c7e7", accent: "#ffffff", kind: "disco" },
      { name: "Gift Box", color: "#3a86ff", accent: "#ffbe0b", kind: "box" }
    ]
  },
  {
    name: "Festival Sprint",
    target: 14,
    spawn: 56,
    speed: 0.0062,
    sky: ["#73c0ff", "#ffe7a8"],
    road: "#5c6675",
    people: [
      { name: "Pinata", color: "#ef476f", accent: "#06d6a0", kind: "pinata" },
      { name: "Party Drum", color: "#ffd166", accent: "#118ab2", kind: "drum" }
    ]
  }
];

let ratio = 1;
let w = 0;
let h = 0;
let groundY = 0;
let time = 0;
let state = "title";
let levelIndex = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let hitsThisLevel = 0;
let spawnTimer = 0;
let player;
let people = [];
let effects = [];
let floatingTexts = [];
let shake = 0;
let overlayTimer = 0;
let punchQueued = false;
let toastTimerId = null;

function resize() {
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  groundY = h - Math.min(126, Math.max(98, h * 0.16));
  if (player) player.y = groundY;
}

window.addEventListener("resize", resize);
document.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
document.addEventListener("gesturestart", event => event.preventDefault());
document.addEventListener("gesturechange", event => event.preventDefault());

function makePlayer() {
  return {
    lane: 0,
    laneX: 0,
    y: groundY,
    punchTimer: 0,
    punchCooldown: 0,
    dashTimer: 0,
    step: 0,
    fistRecoil: 0
  };
}

function startGame() {
  score = 0;
  combo = 0;
  bestCombo = 0;
  levelIndex = 0;
  startLevel(levelIndex);
  state = "playing";
  showToast("Line up the big fist and punch objects inside the bright zone.");
}

function startLevel(index) {
  levelIndex = index;
  hitsThisLevel = 0;
  people = [];
  effects = [];
  floatingTexts = [];
  spawnTimer = 20;
  overlayTimer = 120;
  player = makePlayer();
  updateHud();
}

function currentLevel() {
  return levels[levelIndex];
}

function showToast(text, duration = 1800) {
  if (!tipText) return;
  window.clearTimeout(toastTimerId);
  tipText.textContent = text;
  tipText.classList.add("is-visible");
  toastTimerId = window.setTimeout(() => {
    tipText.classList.remove("is-visible");
  }, duration);
}

function updateHud() {
  scoreText.textContent = `Score ${score}`;
  levelText.textContent = `Level ${levelIndex + 1}`;
  comboText.textContent = `Combo ${combo}`;
}

controlButtons.forEach(button => {
  const control = button.dataset.control;

  const press = event => {
    event.preventDefault();
    button.classList.add("is-held");
    if (state !== "playing") {
      advanceOverlay();
      return;
    }
    if (control === "punch") {
      queuePunch();
    } else {
      held[control] = true;
    }
  };

  const release = event => {
    event.preventDefault();
    button.classList.remove("is-held");
    if (control in held) held[control] = false;
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (["enter", " "].includes(key) && state !== "playing") advanceOverlay();
  if (state !== "playing") return;
  if (!event.repeat && (key === "j" || key === "k" || key === " ")) queuePunch();
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("pointerdown", event => {
  if (state !== "playing") {
    advanceOverlay();
    return;
  }
  if (!isControlArea(event.clientY)) queuePunch();
});

function isControlArea(y) {
  return y > h - 92;
}

function advanceOverlay() {
  if (state === "title" || state === "complete") {
    startGame();
  } else if (state === "between") {
    startLevel(levelIndex + 1);
    state = "playing";
  }
}

function queuePunch() {
  punchQueued = true;
}

function loop() {
  requestAnimationFrame(loop);
  time++;
  update();
  draw();
}

function update() {
  if (state !== "playing") {
    updateFallingPeople();
    updateEffects();
    return;
  }

  handleMovement();
  updatePlayer();
  updatePeople();
  updateEffects();
  maybeSpawnPerson();
  checkLevelProgress();
  if (shake > 0) shake--;
  overlayTimer = Math.max(0, overlayTimer - 1);
}

function handleMovement() {
  const left = keys.arrowleft || keys.a || held.left;
  const right = keys.arrowright || keys.d || held.right;
  const dash = keys.shift || held.dash;
  const moveDelay = dash ? 7 : 12;

  if (player.dashTimer > 0) player.dashTimer--;
  if (player.punchCooldown > 0) player.punchCooldown--;

  if (player.dashTimer <= 0 && left) {
    player.lane = Math.max(-1, player.lane - 1);
    player.dashTimer = moveDelay;
  }
  if (player.dashTimer <= 0 && right) {
    player.lane = Math.min(1, player.lane + 1);
    player.dashTimer = moveDelay;
  }

  if (punchQueued) {
    punchQueued = false;
    if (player.punchCooldown <= 0) punch();
  }
}

function updatePlayer() {
  player.laneX += (player.lane - player.laneX) * 0.24;
  player.step += 0.14 + Math.abs(player.lane - player.laneX) * 0.4;
  if (player.punchTimer > 0) player.punchTimer--;
}

function punch() {
  player.punchTimer = 16;
  player.punchCooldown = 19;
  const target = people
    .filter(person => !person.falling && Math.round(person.lane) === player.lane)
    .filter(person => person.z >= punchZone.near && person.z <= punchZone.far)
    .sort((a, b) => b.z - a.z)[0];

  if (!target) {
    combo = 0;
    updateHud();
    floatingText(laneToX(player.lane, 0.9), groundY - 160, "Miss", "#ffffff");
    burst(laneToX(player.lane, 0.9), groundY - 130, "#ffffff", 8, 3);
    return;
  }

  knockDown(target);
}

function knockDown(person) {
  person.falling = true;
  person.hit = true;
  person.vx = (person.lane - player.laneX) * 5 + (Math.random() - 0.5) * 4;
  person.vy = -9 - Math.random() * 4;
  person.spin = (Math.random() < 0.5 ? -1 : 1) * (0.16 + Math.random() * 0.15);
  person.floorBounces = 0;
  combo++;
  bestCombo = Math.max(bestCombo, combo);
  hitsThisLevel++;
  const points = 100 + combo * 20;
  score += points;
  shake = 8;
  updateHud();
  floatingText(person.x, person.y - 54, `+${points}`, "#fff2a8");
  burst(person.x, person.y - person.scale * 62, currentLevel().people[person.styleIndex].color, 22, 7);
}

function updatePeople() {
  people.forEach(person => {
    if (person.falling) return;
    person.z += person.speed;
    person.laneWave += 0.04;
    person.laneOffset = Math.sin(person.laneWave) * person.swerve;
    projectPerson(person);
    if (person.z > 1.05) {
      person.missed = true;
      combo = 0;
      updateHud();
      floatingText(person.x, groundY - 110, "Too late", "#ffffff");
    }
  });
  updateFallingPeople();
  people = people.filter(person => !person.done && !person.missed);
}

function updateFallingPeople() {
  people.forEach(person => {
    if (!person.falling) return;
    person.x += person.vx;
    person.y += person.vy;
    person.vy += 0.56;
    person.rotation += person.spin;
    person.scale = Math.max(person.scale * 0.997, 0.5);

    const floor = groundY + 14;
    if (person.y > floor) {
      person.y = floor;
      person.vy *= -0.42;
      person.vx *= 0.76;
      person.spin *= 0.72;
      person.floorBounces++;
      puff(person.x, floor, "#dfe7ef");
    }
    if (person.floorBounces > 2 && Math.abs(person.vy) < 1.5) {
      person.done = true;
    }
  });
}

function maybeSpawnPerson() {
  spawnTimer--;
  if (spawnTimer > 0) return;
  const level = currentLevel();
  spawnTimer = Math.max(28, level.spawn - Math.min(20, hitsThisLevel * 1.2) + Math.random() * 20);
  const styleIndex = Math.floor(Math.random() * level.people.length);
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  people.push({
    lane,
    laneOffset: 0,
    laneWave: Math.random() * Math.PI * 2,
    swerve: Math.random() * 0.12,
    z: 0.03,
    speed: level.speed + Math.random() * 0.0016 + levelIndex * 0.00025,
    x: laneToX(lane, 0.03),
    y: horizonY(),
    scale: 0.3,
    rotation: 0,
    styleIndex,
    falling: false,
    missed: false,
    done: false,
    stride: Math.random() * Math.PI * 2
  });
}

function checkLevelProgress() {
  if (hitsThisLevel < currentLevel().target) return;
  if (people.some(person => !person.falling && !person.done)) return;
  if (levelIndex >= levels.length - 1) {
    state = "complete";
    showToast(`Finished! Best combo ${bestCombo}.`);
  } else {
    state = "between";
    showToast("Level cleared. Tap for the next object wave.");
  }
}

function projectPerson(person) {
  const z = person.z;
  person.x = laneToX(person.lane + person.laneOffset, z);
  person.y = horizonY() + (groundY - horizonY()) * z;
  person.scale = 0.24 + z * 0.95;
}

function laneToX(lane, z) {
  const spread = 72 + z * Math.min(190, w * 0.26);
  return w / 2 + lane * spread;
}

function horizonY() {
  return h * 0.28;
}

function burst(x, y, color, count, power) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * power + 1;
    effects.push({
      type: "spark",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 28 + Math.random() * 20,
      maxLife: 48,
      size: Math.random() * 4 + 2,
      color
    });
  }
}

function puff(x, y, color) {
  for (let i = 0; i < 8; i++) {
    effects.push({
      type: "puff",
      x: x + (Math.random() - 0.5) * 34,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2.5,
      life: 22 + Math.random() * 10,
      maxLife: 32,
      size: Math.random() * 12 + 8,
      color
    });
  }
}

function floatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 58, maxLife: 58 });
}

function updateEffects() {
  effects.forEach(effect => {
    effect.x += effect.vx;
    effect.y += effect.vy;
    effect.vy += effect.type === "spark" ? 0.16 : -0.02;
    effect.life--;
  });
  effects = effects.filter(effect => effect.life > 0);

  floatingTexts.forEach(text => {
    text.y -= 0.8;
    text.life--;
  });
  floatingTexts = floatingTexts.filter(text => text.life > 0);
}

function draw() {
  const level = currentLevel();
  drawBackground(level);

  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  drawRoad(level);
  drawPunchZone();
  drawPeople();
  drawPlayer();
  drawEffects();
  ctx.restore();

  drawFloatingTexts();
  drawLevelBanner();
  drawOverlay();
}

function drawBackground(level) {
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, level.sky[0]);
  grd.addColorStop(1, level.sky[1]);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 250 + time * 0.18) % (w + 180)) - 90;
    cloud(x, 58 + i * 24, 0.72 + i * 0.06);
  }

  ctx.fillStyle = "rgba(65, 87, 102, 0.18)";
  for (let i = -1; i < 8; i++) {
    const x = i * 220 - (time * 0.35) % 220;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + 85, horizonY() + 32);
    ctx.lineTo(x + 180, groundY);
    ctx.fill();
  }
}

function cloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 24 * scale, y - 9 * scale, 27 * scale, 0, Math.PI * 2);
  ctx.arc(x + 56 * scale, y, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoad(level) {
  const hy = horizonY();
  ctx.fillStyle = level.road;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 82, hy);
  ctx.lineTo(w / 2 + 82, hy);
  ctx.lineTo(w + 110, h);
  ctx.lineTo(-110, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 3;
  lanes.forEach(lane => {
    ctx.beginPath();
    ctx.moveTo(laneToX(lane, 0.04), hy + 4);
    ctx.lineTo(laneToX(lane, 1.05), h);
    ctx.stroke();
  });

  for (let i = 0; i < 10; i++) {
    const z = ((time * 0.008 + i / 10) % 1);
    const y = hy + (groundY - hy) * z;
    const width = 12 + z * 32;
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    roundRect(w / 2 - width / 2, y, width, 6 + z * 14, 5);
    ctx.fill();
  }
}

function drawPunchZone() {
  const y1 = horizonY() + (groundY - horizonY()) * punchZone.near;
  const y2 = horizonY() + (groundY - horizonY()) * punchZone.far;
  ctx.fillStyle = "rgba(255, 240, 150, 0.2)";
  ctx.beginPath();
  ctx.moveTo(laneToX(-1.34, punchZone.near), y1);
  ctx.lineTo(laneToX(1.34, punchZone.near), y1);
  ctx.lineTo(laneToX(1.2, punchZone.far), y2);
  ctx.lineTo(laneToX(-1.2, punchZone.far), y2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(laneToX(-1.22, punchZone.near), y1);
  ctx.lineTo(laneToX(1.22, punchZone.near), y1);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPeople() {
  const sorted = [...people].sort((a, b) => a.z - b.z);
  sorted.forEach(person => drawObject(person, currentLevel().people[person.styleIndex]));
}

function drawObject(person, style) {
  const scale = person.scale;
  const x = person.x;
  const y = person.y;
  const wobble = Math.sin(time * 0.16 + person.stride) * (person.falling ? 0.08 : 0.18);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(person.rotation + wobble);
  ctx.scale(scale, scale);

  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 8;
  drawObjectShape(style);
  ctx.shadowColor = "transparent";

  if (person.hit) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "900 22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("POW", 0, -96);
  }

  ctx.restore();
}

function drawObjectShape(style) {
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#273142";

  if (style.kind === "ball" || style.kind === "disco") {
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(0, -42, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = style.kind === "disco" ? 4 : 8;
    ctx.beginPath();
    ctx.arc(0, -42, 25, 0.15, Math.PI * 1.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-36, -42);
    ctx.lineTo(36, -42);
    ctx.stroke();
  } else if (style.kind === "block" || style.kind === "box") {
    ctx.fillStyle = style.color;
    roundRect(-42, -84, 84, 84, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = style.accent;
    ctx.fillRect(-7, -84, 14, 84);
    ctx.fillRect(-42, -49, 84, 14);
  } else if (style.kind === "cone") {
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.moveTo(0, -102);
    ctx.lineTo(48, -4);
    ctx.lineTo(-48, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = style.accent;
    ctx.fillRect(-28, -48, 56, 12);
    ctx.fillRect(-40, -18, 80, 12);
  } else if (style.kind === "tire") {
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(0, -46, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = style.accent;
    ctx.beginPath();
    ctx.arc(0, -46, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (style.kind === "pinata") {
    ctx.fillStyle = style.color;
    roundRect(-48, -86, 96, 62, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = style.accent;
    for (let i = 0; i < 4; i++) ctx.fillRect(-42, -78 + i * 14, 84, 7);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(48, -72, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.kind === "drum") {
    ctx.fillStyle = style.color;
    roundRect(-46, -88, 92, 82, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = style.accent;
    ctx.fillRect(-46, -72, 92, 13);
    ctx.fillRect(-46, -28, 92, 13);
  }
}

function drawPlayer() {
  if (!player) return;
  const x = laneToX(player.laneX, 1);
  const punchProgress = player.punchTimer > 0 ? 1 - player.punchTimer / 16 : 0;
  const thrust = Math.sin(punchProgress * Math.PI);
  const fistY = groundY + 62 - thrust * 128;
  const fistScale = 1.28 + thrust * 0.28;

  ctx.save();
  ctx.translate(x, fistY);
  ctx.scale(fistScale, fistScale);
  ctx.rotate((player.laneX - player.lane) * 0.18);
  drawFist(thrust);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, groundY - 112, 42 + thrust * 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawFist(thrust) {
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#172033";
  roundRect(-32, 22, 64, 82, 24);
  ctx.fill();

  ctx.fillStyle = "#ffd8b8";
  roundRect(-48, -48, 96, 74, 24);
  ctx.fill();
  ctx.strokeStyle = "#273142";
  ctx.lineWidth = 5;
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const fx = -38 + i * 25;
    ctx.fillStyle = "#ffe1c7";
    roundRect(fx, -68 - thrust * 8, 23, 42, 11);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#f0b890";
  roundRect(32, -26, 30, 34, 14);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
}

function drawEffects() {
  effects.forEach(effect => {
    ctx.globalAlpha = Math.max(0, effect.life / effect.maxLife);
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  floatingTexts.forEach(text => {
    ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
    ctx.fillStyle = text.color;
    ctx.strokeStyle = "rgba(27,39,56,0.45)";
    ctx.lineWidth = 4;
    ctx.font = "900 22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
  });
  ctx.globalAlpha = 1;
}

function drawLevelBanner() {
  if (state !== "playing" || overlayTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, overlayTimer / 30);
  ctx.fillStyle = "rgba(27,39,56,0.74)";
  roundRect(w / 2 - 150, 84, 300, 54, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(currentLevel().name, w / 2, 111);
  ctx.restore();
}

function drawOverlay() {
  if (state === "playing") return;

  ctx.fillStyle = "rgba(20, 29, 43, 0.62)";
  ctx.fillRect(0, 0, w, h);

  const boxW = Math.min(560, w - 36);
  const boxH = state === "title" ? 286 : 250;
  const x = (w - boxW) / 2;
  const y = (h - boxH) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(x, y, boxW, boxH, 16);
  ctx.fill();

  ctx.fillStyle = "#1b2738";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (state === "title") {
    ctx.font = "900 38px system-ui";
    ctx.fillText("Punch Parade", w / 2, y + 58);
    ctx.font = "700 17px system-ui";
    wrapText("Objects rush toward you. Move the big fist between lanes and punch inside the bright zone.", w / 2, y + 118, boxW - 72, 25);
    ctx.font = "800 16px system-ui";
    ctx.fillText("Arrows/A-D move   J/Space punches", w / 2, y + 184);
    ctx.fillText("Tap to start", w / 2, y + 226);
  } else if (state === "between") {
    ctx.font = "900 32px system-ui";
    ctx.fillText("Level Clear", w / 2, y + 62);
    ctx.font = "700 18px system-ui";
    ctx.fillText(`Score ${score}   Best combo ${bestCombo}`, w / 2, y + 120);
    ctx.font = "800 16px system-ui";
    ctx.fillText("Tap for the next object wave", w / 2, y + 190);
  } else if (state === "complete") {
    ctx.font = "900 32px system-ui";
    ctx.fillText("Parade Complete", w / 2, y + 62);
    ctx.font = "700 18px system-ui";
    wrapText(`Final score ${score}. Best combo ${bestCombo}.`, w / 2, y + 118, boxW - 72, 28);
    ctx.font = "800 16px system-ui";
    ctx.fillText("Tap to play again", w / 2, y + 190);
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

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

resize();
requestAnimationFrame(loop);
