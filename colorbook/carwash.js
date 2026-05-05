/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const toolButtons = {
  water: document.getElementById("waterTool"),
  soap: document.getElementById("soapTool"),
  scrub: document.getElementById("scrubTool")
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  layoutCar();
}

window.addEventListener("resize", resize);
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * GAME DATA
 *************************************************/
const LEVELS = [
  { name: "Tiny Taxi", body: "#ffca3a", accent: "#fb8500", kind: "car", spots: 18, grime: ["mud", "dust"], requiredClean: 0.88, message: "Wash the tiny taxi!" },
  { name: "Family Car", body: "#06d6a0", accent: "#118ab2", kind: "car", spots: 24, grime: ["mud", "dust", "pollen"], requiredClean: 0.9, message: "The family car needs a shiny wash!" },
  { name: "Delivery Van", body: "#4cc9f0", accent: "#4361ee", kind: "van", spots: 30, grime: ["mud", "dust", "sticky"], requiredClean: 0.91, message: "The delivery van is extra dusty!" },
  { name: "Beach Jeep", body: "#f15bb5", accent: "#fee440", kind: "jeep", spots: 36, grime: ["sand", "dust", "sticky"], requiredClean: 0.92, message: "Rinse the sandy beach jeep!" },
  { name: "Farm Truck", body: "#57cc99", accent: "#386641", kind: "truck", spots: 42, grime: ["mud", "mud", "leaf", "sticky"], requiredClean: 0.93, message: "Use soap and scrub for farm grime!" },
  { name: "City Bus", body: "#ffd166", accent: "#ef476f", kind: "bus", spots: 48, grime: ["dust", "sticky", "tar", "pollen"], requiredClean: 0.94, message: "The city bus has big dirty windows!" },
  { name: "Monster Truck", body: "#8338ec", accent: "#3a0ca3", kind: "monster", spots: 54, grime: ["mud", "mud", "tar", "leaf"], requiredClean: 0.95, message: "Scrub the monster truck!" },
  { name: "Race Car", body: "#ff595e", accent: "#1982c4", kind: "race", spots: 60, grime: ["mud", "dust", "sticky", "tar", "pollen"], requiredClean: 0.96, message: "Final wash! Make it shine!" }
];

const DIRT_STYLE = {
  mud: { color: "#7f4f24", toughness: 2.1, label: "mud" },
  dust: { color: "#a98467", toughness: 1.35, label: "dust" },
  sticky: { color: "#6d4c41", toughness: 3.1, label: "sticky" },
  tar: { color: "#252422", toughness: 4.2, label: "tar" },
  sand: { color: "#c2a878", toughness: 1.55, label: "sand" },
  pollen: { color: "#d6a400", toughness: 1.65, label: "pollen" },
  leaf: { color: "#31572c", toughness: 2.45, label: "leaves" }
};

const TOOL_COPY = {
  water: "Water rinses dirt and soap.",
  soap: "Soap loosens sticky grime.",
  scrub: "Scrub clears tough spots."
};

let levelIndex = 0;
let selectedTool = "water";
let car = null;
let dirtSpots = [];
let bubbles = [];
let droplets = [];
let sparkles = [];
let pointerDown = false;
let brush = { x: -1000, y: -1000 };
let lastBrushTime = 0;
let levelComplete = false;
let started = false;
let bannerTimer = 180;

function layoutCar() {
  const bottomPad = canvas.width < 520 ? 116 : 126;
  const w = Math.min(canvas.width * 0.76, 560);
  const h = Math.min(canvas.height * 0.34, w * 0.45);
  car = {
    x: (canvas.width - w) / 2,
    y: Math.max(135, canvas.height * 0.42 - h * 0.5),
    w,
    h: Math.max(150, h),
    groundY: canvas.height - bottomPad
  };
}

function setTool(tool) {
  selectedTool = tool;
  Object.keys(toolButtons).forEach(key => {
    toolButtons[key].classList.toggle("active", key === tool);
  });
  speak(TOOL_COPY[tool]);
}

Object.keys(toolButtons).forEach(tool => {
  toolButtons[tool].addEventListener("click", () => setTool(tool));
});

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  msg.rate = 0.88;
  msg.pitch = 1.1;
  window.speechSynthesis.speak(msg);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function carContains(x, y) {
  if (!car) return false;
  const bodyTop = car.y + car.h * 0.34;
  const bodyBottom = car.y + car.h * 0.82;
  const hood = x > car.x + car.w * 0.08 && x < car.x + car.w * 0.92 && y > bodyTop && y < bodyBottom;
  const cabin = x > car.x + car.w * 0.27 && x < car.x + car.w * 0.72 && y > car.y + car.h * 0.08 && y < bodyTop + car.h * 0.18;
  return hood || cabin;
}

function makeSpot(type) {
  let x = 0;
  let y = 0;
  let attempts = 0;
  do {
    x = rand(car.x + car.w * 0.12, car.x + car.w * 0.88);
    y = rand(car.y + car.h * 0.18, car.y + car.h * 0.78);
    attempts++;
  } while (!carContains(x, y) && attempts < 80);

  const style = DIRT_STYLE[type] || DIRT_STYLE.mud;
  const specks = Math.floor(rand(4, type === "dust" || type === "sand" || type === "pollen" ? 11 : 8));
  return {
    x,
    y,
    r: rand(16, 42) * Math.min(1.14, Math.max(0.82, canvas.width / 700)),
    type,
    dirt: style.toughness,
    soap: 0,
    scrubbed: 0,
    wobble: Math.random() * Math.PI * 2,
    drip: rand(0.25, 1),
    specks: Array.from({ length: specks }, () => ({
      ox: rand(-0.8, 0.8),
      oy: rand(-0.55, 0.55),
      s: rand(0.08, 0.22)
    }))
  };
}

function initLevel(index = levelIndex) {
  levelIndex = index % LEVELS.length;
  layoutCar();
  const level = LEVELS[levelIndex];
  dirtSpots = [];
  bubbles = [];
  droplets = [];
  sparkles = [];
  pointerDown = false;
  levelComplete = false;
  bannerTimer = 210;

  for (let i = 0; i < level.spots; i++) {
    const type = level.grime[Math.floor(Math.random() * level.grime.length)];
    dirtSpots.push(makeSpot(type));
  }

  speak(level.message);
}

function cleanPercent() {
  if (!dirtSpots.length) return 1;
  const clean = dirtSpots.reduce((sum, spot) => sum + (spot.dirt <= 0.05 ? 1 : 0), 0);
  return clean / dirtSpots.length;
}

function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function addBrushEffects(x, y) {
  if (selectedTool === "water") {
    for (let i = 0; i < 7; i++) {
      droplets.push({ x: x + rand(-24, 24), y: y + rand(-18, 18), vx: rand(-1.2, 1.2), vy: rand(2.8, 6.4), life: rand(22, 42), r: rand(2, 5) });
    }
  }
  if (selectedTool === "soap") {
    for (let i = 0; i < 5; i++) {
      bubbles.push({ x: x + rand(-24, 24), y: y + rand(-18, 18), vx: rand(-0.6, 0.6), vy: rand(-1.1, -0.2), life: rand(50, 90), r: rand(7, 15) });
    }
  }
  if (selectedTool === "scrub") {
    for (let i = 0; i < 5; i++) {
      sparkles.push({ x: x + rand(-22, 22), y: y + rand(-18, 18), life: rand(12, 26), size: rand(6, 14), color: "#ffd166" });
    }
  }
}

function useTool(x, y) {
  if (!started) {
    started = true;
    initLevel(0);
  }
  if (levelComplete) return;

  const now = performance.now();
  if (now - lastBrushTime < 22) return;
  lastBrushTime = now;
  brush.x = x;
  brush.y = y;
  addBrushEffects(x, y);

  dirtSpots.forEach(spot => {
    const distance = Math.hypot(x - spot.x, y - spot.y);
    if (distance > spot.r + 42) return;

    if (selectedTool === "water") {
      const waterPower = spot.soap > 0.3 || spot.scrubbed > 0.4 ? 0.22 : 0.08;
      spot.dirt -= waterPower;
      spot.soap = Math.max(0, spot.soap - 0.25);
    } else if (selectedTool === "soap") {
      spot.soap = Math.min(1.4, spot.soap + 0.32);
      if (spot.type === "dust" || spot.type === "sand" || spot.type === "pollen") spot.dirt -= 0.09;
    } else if (selectedTool === "scrub") {
      const scrubPower = spot.soap > 0.35 ? 0.38 : 0.13;
      spot.scrubbed = Math.min(1.3, spot.scrubbed + 0.18);
      spot.dirt -= scrubPower;
      spot.soap = Math.max(0, spot.soap - 0.08);
    }

    if ((spot.type === "tar" || spot.type === "sticky") && spot.soap < 0.25 && selectedTool !== "water") {
      spot.dirt += 0.05;
    }
    spot.dirt = Math.max(0, spot.dirt);
  });

  if (cleanPercent() >= LEVELS[levelIndex].requiredClean) finishLevel();
}

function finishLevel() {
  levelComplete = true;
  bannerTimer = 160;
  for (let i = 0; i < 70; i++) {
    sparkles.push({
      x: rand(car.x + car.w * 0.08, car.x + car.w * 0.92),
      y: rand(car.y + car.h * 0.08, car.y + car.h * 0.82),
      life: rand(24, 60),
      size: rand(5, 18),
      color: ["#ffd166", "#ffffff", "#06d6a0", "#4cc9f0"][Math.floor(Math.random() * 4)]
    });
  }
  const doneAll = levelIndex === LEVELS.length - 1;
  speak(doneAll ? "Amazing! Every car is clean!" : "Great wash! Next level!");
  setTimeout(() => {
    if (doneAll) initLevel(0);
    else initLevel(levelIndex + 1);
  }, 2200);
}

canvas.addEventListener("pointerdown", e => {
  pointerDown = true;
  canvas.setPointerCapture(e.pointerId);
  const pos = pointerPos(e);
  useTool(pos.x, pos.y);
});

canvas.addEventListener("pointermove", e => {
  const pos = pointerPos(e);
  brush.x = pos.x;
  brush.y = pos.y;
  if (pointerDown) useTool(pos.x, pos.y);
});

canvas.addEventListener("pointerup", e => {
  pointerDown = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
});

canvas.addEventListener("pointercancel", () => {
  pointerDown = false;
});

/*************************************************
 * DRAWING
 *************************************************/
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#9be7ff");
  sky.addColorStop(0.48, "#edfaff");
  sky.addColorStop(1, "#c8f3dd");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.36;
  for (let x = 0; x < canvas.width; x += 58) {
    for (let y = 120; y < car.groundY; y += 58) {
      roundRect(x + 6, y + 6, 46, 46, 6);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#53c67a";
  ctx.fillRect(0, car.groundY, canvas.width, canvas.height - car.groundY);
  ctx.fillStyle = "rgba(31, 113, 88, 0.2)";
  for (let x = -40; x < canvas.width; x += 72) {
    ctx.beginPath();
    ctx.ellipse(x, car.groundY + 21, 55, 8, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(canvas.width - 72, 72, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (let i = 0; i < 7; i++) {
    const x = (i * 210 + 40) % Math.max(canvas.width, 1);
    ctx.beginPath();
    ctx.ellipse(x, 70 + (i % 3) * 34, 42, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 32, 70 + (i % 3) * 34, 32, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(0, 122, 255, 0.22)";
  ctx.lineWidth = 7;
  for (let i = 0; i < 5; i++) {
    const x = car.x + car.w * (0.16 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(x, 110);
    ctx.quadraticCurveTo(x + 18, car.y - 34, x - 10, car.y + 28);
    ctx.stroke();
  }

  ctx.fillStyle = "#e9fbff";
  roundRect(car.x - 52, car.y - 46, car.w + 104, 34, 8);
  ctx.fill();
  ctx.fillStyle = "#118ab2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 18px system-ui";
  ctx.fillText("SUPER SHINE WASH", car.x + car.w / 2, car.y - 29);

  ctx.fillStyle = "#77c7d7";
  roundRect(car.x - 34, car.groundY - 24, car.w + 68, 26, 8);
  ctx.fill();
}

function drawCar() {
  const level = LEVELS[levelIndex];
  const x = car.x;
  const y = car.y;
  const w = car.w;
  const h = car.h;

  const bodyGradient = ctx.createLinearGradient(x, y, x, y + h);
  bodyGradient.addColorStop(0, "#ffffff");
  bodyGradient.addColorStop(0.12, level.body);
  bodyGradient.addColorStop(1, level.accent);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = bodyGradient;
  const bodyTop = level.kind === "bus" || level.kind === "van" ? h * 0.24 : h * 0.34;
  const bodyHeight = level.kind === "monster" ? h * 0.5 : h * 0.45;
  roundRect(x + w * 0.06, y + bodyTop, w * 0.88, bodyHeight, 20);
  ctx.fill();

  if (level.kind !== "bus" && level.kind !== "van") {
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.39);
    ctx.lineTo(x + w * 0.35, y + h * 0.09);
    ctx.lineTo(x + w * 0.66, y + h * 0.09);
    ctx.lineTo(x + w * 0.8, y + h * 0.39);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = level.accent;
  roundRect(x + w * 0.13, y + h * 0.59, w * 0.72, h * 0.08, 8);
  ctx.fill();

  ctx.fillStyle = "#b8ecff";
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  if (level.kind === "bus" || level.kind === "van") {
    for (let i = 0; i < 4; i++) {
      roundRect(x + w * (0.18 + i * 0.15), y + h * 0.3, w * 0.1, h * 0.16, 6);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    roundRect(x + w * 0.36, y + h * 0.15, w * 0.13, h * 0.2, 6);
    ctx.fill();
    ctx.stroke();
    roundRect(x + w * 0.52, y + h * 0.15, w * 0.13, h * 0.2, 6);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#263238";
  ctx.beginPath();
  const wheelSize = level.kind === "monster" ? h * 0.2 : h * 0.14;
  ctx.arc(x + w * 0.25, y + h * 0.79, wheelSize, 0, Math.PI * 2);
  ctx.arc(x + w * 0.75, y + h * 0.79, wheelSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9f3f7";
  ctx.beginPath();
  ctx.arc(x + w * 0.25, y + h * 0.79, wheelSize * 0.48, 0, Math.PI * 2);
  ctx.arc(x + w * 0.75, y + h * 0.79, wheelSize * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#90a4ae";
  ctx.lineWidth = 3;
  for (const wheelX of [x + w * 0.25, x + w * 0.75]) {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.moveTo(wheelX, y + h * 0.79);
      ctx.lineTo(wheelX + Math.cos(a) * wheelSize * 0.45, y + h * 0.79 + Math.sin(a) * wheelSize * 0.45);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#fff7a8";
  roundRect(x + w * 0.11, y + h * 0.52, w * 0.08, h * 0.08, 6);
  ctx.fill();
  roundRect(x + w * 0.81, y + h * 0.52, w * 0.08, h * 0.08, 6);
  ctx.fill();

  ctx.fillStyle = "#263238";
  roundRect(x + w * 0.06, y + h * 0.66, w * 0.1, h * 0.05, 6);
  ctx.fill();
  roundRect(x + w * 0.84, y + h * 0.66, w * 0.1, h * 0.05, 6);
  ctx.fill();

  ctx.strokeStyle = "rgba(38, 50, 56, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.36);
  ctx.lineTo(x + w * 0.5, y + h * 0.73);
  ctx.stroke();

  if (level.kind === "race") {
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(24, h * 0.18)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("7", x + w * 0.5, y + h * 0.55);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
  roundRect(x + w * 0.16, y + h * 0.42, w * 0.66, h * 0.07, 8);
  ctx.fill();
}

function drawDirt() {
  dirtSpots.forEach(spot => {
    if (spot.dirt <= 0.05 && spot.soap <= 0.05) return;
    const dirtAlpha = Math.min(0.9, spot.dirt / 4);
    const style = DIRT_STYLE[spot.type] || DIRT_STYLE.mud;
    if (spot.dirt > 0.05) {
      ctx.save();
      ctx.globalAlpha = dirtAlpha;
      ctx.fillStyle = style.color;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9 + spot.wobble;
        const radius = spot.r * (0.65 + ((i * 37) % 20) / 100);
        const px = spot.x + Math.cos(angle) * radius;
        const py = spot.y + Math.sin(angle) * radius * 0.62;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      if (spot.type === "mud" || spot.type === "sticky" || spot.type === "tar") {
        ctx.fillStyle = style.color;
        roundRect(spot.x - spot.r * 0.12, spot.y + spot.r * 0.2, spot.r * 0.22, spot.r * spot.drip, spot.r * 0.1);
        ctx.fill();
        roundRect(spot.x + spot.r * 0.22, spot.y + spot.r * 0.1, spot.r * 0.16, spot.r * spot.drip * 0.72, spot.r * 0.08);
        ctx.fill();
      }

      spot.specks.forEach(speck => {
        const sx = spot.x + speck.ox * spot.r;
        const sy = spot.y + speck.oy * spot.r;
        ctx.globalAlpha = dirtAlpha * 0.8;
        ctx.fillStyle = spot.type === "pollen" ? "#ffe169" : spot.type === "leaf" ? "#4f772d" : "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();
        if (spot.type === "leaf") {
          ctx.ellipse(sx, sy, spot.r * speck.s * 1.7, spot.r * speck.s, spot.wobble, 0, Math.PI * 2);
        } else {
          ctx.arc(sx, sy, spot.r * speck.s, 0, Math.PI * 2);
        }
        ctx.fill();
      });

      ctx.restore();
    }

    if (spot.soap > 0.04) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.78, spot.soap);
      ctx.fillStyle = "#f7fdff";
      ctx.strokeStyle = "#b5eef7";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(spot.x + Math.cos(i * 2.2) * spot.r * 0.28, spot.y + Math.sin(i * 2.1) * spot.r * 0.2, spot.r * (0.28 + i * 0.06), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  });
}

function drawEffects() {
  droplets.forEach(drop => {
    ctx.fillStyle = "rgba(0, 122, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(drop.x, drop.y, drop.r * 0.72, drop.r * 1.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  bubbles.forEach(bubble => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillStyle = "rgba(231, 253, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  sparkles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.life / 24);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.x - s.size * 0.5, s.y);
    ctx.lineTo(s.x + s.size * 0.5, s.y);
    ctx.moveTo(s.x, s.y - s.size * 0.5);
    ctx.lineTo(s.x, s.y + s.size * 0.5);
    ctx.stroke();
    ctx.restore();
  });
}

function drawBrush() {
  if (!pointerDown) return;
  ctx.save();
  ctx.globalAlpha = 0.55;
  if (selectedTool === "water") {
    ctx.strokeStyle = "#007aff";
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(brush.x + i * 9, brush.y - 36);
      ctx.lineTo(brush.x + i * 4, brush.y + 28);
      ctx.stroke();
    }
  } else if (selectedTool === "soap") {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#7bdff2";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(brush.x, brush.y, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = "#ffb703";
    roundRect(brush.x - 34, brush.y - 17, 68, 34, 8);
    ctx.fill();
    ctx.strokeStyle = "#8d5524";
    ctx.lineWidth = 3;
    for (let i = -24; i <= 24; i += 12) {
      ctx.beginPath();
      ctx.moveTo(brush.x + i, brush.y + 12);
      ctx.lineTo(brush.x + i + 4, brush.y + 24);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHud() {
  const level = LEVELS[levelIndex];
  const clean = Math.floor(cleanPercent() * 100);
  const panelW = Math.min(canvas.width - 28, 520);
  const x = (canvas.width - panelW) / 2;
  const y = 18;

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeStyle = "#b7dce8";
  ctx.lineWidth = 2;
  roundRect(x, y, panelW, 86, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#263238";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "800 23px system-ui";
  ctx.fillText(`Level ${levelIndex + 1}: ${level.name}`, canvas.width / 2, y + 10);

  const barX = x + 22;
  const barY = y + 50;
  const barW = panelW - 44;
  ctx.fillStyle = "#d7f2f8";
  roundRect(barX, barY, barW, 18, 8);
  ctx.fill();
  ctx.fillStyle = clean >= level.requiredClean * 100 ? "#06d6a0" : "#007aff";
  roundRect(barX, barY, barW * cleanPercent(), 18, 8);
  ctx.fill();
  ctx.fillStyle = "#263238";
  ctx.font = "700 13px system-ui";
  ctx.textBaseline = "middle";
  ctx.fillText(`${clean}% clean`, canvas.width / 2, barY + 9);

  if (bannerTimer > 0) {
    ctx.fillStyle = "rgba(38, 50, 56, 0.78)";
    roundRect(canvas.width / 2 - Math.min(260, canvas.width * 0.44), y + 98, Math.min(520, canvas.width * 0.88), 44, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px system-ui";
    ctx.textBaseline = "middle";
    ctx.fillText(levelComplete ? "Sparkly clean!" : level.message, canvas.width / 2, y + 120);
  }
}

function updateEffects() {
  droplets.forEach(drop => {
    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.life--;
  });
  bubbles.forEach(bubble => {
    bubble.x += bubble.vx;
    bubble.y += bubble.vy;
    bubble.life--;
  });
  sparkles.forEach(s => s.life--);
  droplets = droplets.filter(drop => drop.life > 0 && drop.y < canvas.height + 40);
  bubbles = bubbles.filter(bubble => bubble.life > 0);
  sparkles = sparkles.filter(s => s.life > 0);
  if (bannerTimer > 0) bannerTimer--;
}

function drawStart() {
  drawBackground();
  drawCar();
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  const w = Math.min(canvas.width - 30, 500);
  const h = 190;
  const x = (canvas.width - w) / 2;
  const y = Math.max(122, canvas.height * 0.2);
  roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "#b7dce8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#263238";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "900 30px system-ui";
  ctx.fillText("Car Wash", canvas.width / 2, y + 22);
  ctx.font = "700 17px system-ui";
  ctx.fillText("Pick water, soap, or scrub.", canvas.width / 2, y + 76);
  ctx.fillText("Drag over the dirty car to clean it.", canvas.width / 2, y + 104);
  ctx.fillStyle = "#007aff";
  ctx.font = "900 19px system-ui";
  ctx.fillText("Tap the car to start", canvas.width / 2, y + 146);
}

function gameLoop() {
  if (!car) layoutCar();
  if (!started) {
    drawStart();
    requestAnimationFrame(gameLoop);
    return;
  }
  updateEffects();
  drawBackground();
  drawCar();
  drawDirt();
  drawEffects();
  drawBrush();
  drawHud();
  requestAnimationFrame(gameLoop);
}

resize();
gameLoop();
