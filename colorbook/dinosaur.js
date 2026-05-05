/*************************************************
 * DINOSAUR NAME GAME
 * A soft tap-to-match learning game for ages 2-6.
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const langMap = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" };
function getLangKey() { return localStorage.getItem("appLang") || "en"; }
function getLangCode() { return langMap[getLangKey()] || "en-US"; }

const DINOSAURS = [
  { id: "trex", name: "T. rex", say: "Tyrannosaurus rex", hint: "big teeth", color: "#57B894", belly: "#F8D66D", accent: "#2B7A66" },
  { id: "triceratops", name: "Triceratops", say: "Triceratops", hint: "three horns", color: "#F4A261", belly: "#FFE0A3", accent: "#C85C46" },
  { id: "stegosaurus", name: "Stegosaurus", say: "Stegosaurus", hint: "back plates", color: "#7CC7E8", belly: "#EAF7FF", accent: "#EA6F91" },
  { id: "brachiosaurus", name: "Brachiosaurus", say: "Brachiosaurus", hint: "long neck", color: "#A7C957", belly: "#FFF0B8", accent: "#6A994E" },
  { id: "pteranodon", name: "Pteranodon", say: "Pteranodon", hint: "big wings", color: "#B388EB", belly: "#EFE3FF", accent: "#6C5CE7" },
  { id: "ankylosaurus", name: "Ankylosaurus", say: "Ankylosaurus", hint: "tail club", color: "#FFCA3A", belly: "#FFF5BF", accent: "#8A5A44" }
];

let cards = [];
let target = DINOSAURS[0];
let score = 0;
let round = 0;
let feedback = "";
let feedbackUntil = 0;
let particles = [];
let isStarted = false;
let nextRoundAt = 0;
let pressedCard = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildRound(false);
}

window.addEventListener("resize", resize);
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = getLangCode();
  msg.rate = 0.78;
  msg.pitch = 1.2;
  window.speechSynthesis.speak(msg);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function fitText(text, maxWidth, startSize, weight = "800") {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  } while (size > 12);
  return size;
}

function buildRound(announce = false) {
  if (!canvas.width || !canvas.height) return;

  if (isStarted || cards.length === 0) {
    target = shuffle(DINOSAURS)[0];
  }

  const choices = shuffle([
    target,
    ...shuffle(DINOSAURS.filter(dino => dino.id !== target.id)).slice(0, 2)
  ]);

  const top = Math.max(128, canvas.height * 0.24);
  const availableWidth = canvas.width - 32;
  const cardGap = Math.min(18, canvas.width * 0.035);
  const columns = canvas.width < 620 ? 1 : 3;
  const cardWidth = columns === 1 ? Math.min(390, availableWidth) : (availableWidth - cardGap * 2) / 3;
  const cardHeight = columns === 1 ? Math.min(140, (canvas.height - top - 42) / 3) : Math.min(330, canvas.height * 0.5);
  const totalWidth = columns * cardWidth + (columns - 1) * cardGap;
  const startX = (canvas.width - totalWidth) / 2;
  const startY = columns === 1 ? top : Math.max(top, canvas.height * 0.36);

  cards = choices.map((dino, index) => {
    const col = columns === 1 ? 0 : index;
    const row = columns === 1 ? index : 0;
    return {
      dino,
      x: startX + col * (cardWidth + cardGap),
      y: startY + row * (cardHeight + cardGap),
      w: cardWidth,
      h: cardHeight,
      bounce: 0
    };
  });

  if (announce && isStarted) speak(`Find ${target.say}`);
}

function startGame() {
  score = 0;
  round = 1;
  isStarted = true;
  feedback = "";
  buildRound(true);
}

function createSparkles(x, y, color) {
  for (let i = 0; i < 34; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.7) * 9,
      life: 38,
      size: Math.random() * 6 + 3,
      color
    });
  }
}

function cardAt(px, py) {
  return cards.find(card => px >= card.x && px <= card.x + card.w && py >= card.y && py <= card.y + card.h);
}

canvas.addEventListener("pointerdown", e => {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (!isStarted) {
    startGame();
    return;
  }

  pressedCard = cardAt(px, py);
  if (pressedCard) {
    pressedCard.bounce = 1;
    speak(pressedCard.dino.say);
    if ("vibrate" in navigator) navigator.vibrate(20);
  }
});

canvas.addEventListener("pointerup", e => {
  if (!isStarted || !pressedCard) return;

  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const releasedCard = cardAt(px, py);

  if (releasedCard === pressedCard) {
    if (pressedCard.dino.id === target.id) {
      score += 1;
      round += 1;
      feedback = "Great job!";
      feedbackUntil = performance.now() + 1100;
      createSparkles(pressedCard.x + pressedCard.w / 2, pressedCard.y + pressedCard.h / 2, pressedCard.dino.color);
      speak(`${target.say}. Great job!`);
      nextRoundAt = performance.now() + 1200;
      if ("vibrate" in navigator) navigator.vibrate([35, 30, 35]);
    } else {
      feedback = `That is ${pressedCard.dino.name}`;
      feedbackUntil = performance.now() + 1050;
      speak(`That is ${pressedCard.dino.say}. Find ${target.say}`);
    }
  }

  pressedCard = null;
});

function roundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x - size * 0.8, y + size * 0.15, size * 0.55, 0, Math.PI * 2);
  ctx.arc(x, y, size * 0.78, 0, Math.PI * 2);
  ctx.arc(x + size * 0.75, y + size * 0.18, size * 0.58, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#9BE7FF");
  sky.addColorStop(0.62, "#DDF8C6");
  sky.addColorStop(1, "#78C76B");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  drawCloud(canvas.width * 0.18, canvas.height * 0.16, 34);
  drawCloud(canvas.width * 0.78, canvas.height * 0.2, 42);

  ctx.fillStyle = "#5FAE57";
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.16, canvas.height + 18, canvas.width * 0.33, canvas.height * 0.18, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(canvas.width * 0.74, canvas.height + 24, canvas.width * 0.44, canvas.height * 0.22, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

function drawHeader() {
  const titleSize = fitText("Dinosaur Name Game", canvas.width - 180, Math.min(34, canvas.width * 0.07));
  ctx.fillStyle = "#1F513D";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillText("Dinosaur Name Game", canvas.width / 2, 18);

  const prompt = isStarted ? `Find ${target.name}` : "Tap to start";
  const promptSize = fitText(prompt, canvas.width - 40, Math.min(42, canvas.width * 0.09));
  ctx.fillStyle = "#183B2D";
  ctx.font = `900 ${promptSize}px system-ui, sans-serif`;
  ctx.fillText(prompt, canvas.width / 2, Math.max(66, canvas.height * 0.11));

  if (isStarted) {
    ctx.font = `800 ${Math.min(20, canvas.width * 0.05)}px system-ui, sans-serif`;
    ctx.fillStyle = "#325847";
    ctx.fillText(`${target.hint}  |  Stars ${score}`, canvas.width / 2, Math.max(104, canvas.height * 0.18));
  }
}

function drawCard(card, time) {
  const isPressed = card === pressedCard;
  const pulse = Math.sin(time / 260 + card.x) * 2;
  card.bounce *= 0.83;

  ctx.save();
  ctx.translate(card.x + card.w / 2, card.y + card.h / 2);
  const scale = 1 + card.bounce * 0.045 + (isPressed ? 0.025 : 0);
  ctx.scale(scale, scale);
  ctx.translate(-card.w / 2, -card.h / 2);

  ctx.shadowColor = "rgba(33, 79, 61, 0.22)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 7;
  ctx.fillStyle = "#FFFDF4";
  roundedRect(0, 0, card.w, card.h, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.lineWidth = Math.max(3, card.w * 0.012);
  ctx.strokeStyle = "rgba(47, 90, 68, 0.22)";
  ctx.stroke();

  const imageCenterX = card.w / 2;
  const imageCenterY = card.h * (card.h < 170 ? 0.48 : 0.42) + pulse;
  const imageSize = Math.min(card.w * 0.38, card.h * 0.31);
  drawDinosaur(card.dino, imageCenterX, imageCenterY, imageSize);

  const nameSize = fitText(card.dino.name, card.w - 24, Math.min(28, card.h * 0.16));
  ctx.fillStyle = "#22352D";
  ctx.font = `900 ${nameSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(card.dino.name, card.w / 2, card.h - Math.max(28, card.h * 0.16));

  ctx.restore();
}

function drawDinosaur(dino, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(43, 73, 57, 0.25)";
  ctx.lineWidth = Math.max(2, size * 0.08);

  if (dino.id === "trex") drawTrex(size, dino);
  if (dino.id === "triceratops") drawTriceratops(size, dino);
  if (dino.id === "stegosaurus") drawStegosaurus(size, dino);
  if (dino.id === "brachiosaurus") drawBrachiosaurus(size, dino);
  if (dino.id === "pteranodon") drawPteranodon(size, dino);
  if (dino.id === "ankylosaurus") drawAnkylosaurus(size, dino);

  ctx.restore();
}

function eye(x, y, r) {
  ctx.fillStyle = "#17231D";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function smile(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0.1, Math.PI * 0.78);
  ctx.stroke();
}

function drawTrex(s, dino) {
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.1, s * 0.08, s * 1.15, s * 0.62, -0.05, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.78, -s * 0.35, s * 0.48, s * 0.38, 0.15, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 1.05, s * 0.04);
  ctx.quadraticCurveTo(-s * 1.8, -s * 0.28, -s * 1.9, -s * 0.75);
  ctx.quadraticCurveTo(-s * 1.25, -s * 0.25, -s * 0.78, s * 0.12);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = dino.belly;
  ctx.beginPath();
  ctx.ellipse(s * 0.08, s * 0.18, s * 0.62, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.35, s * 0.5);
  ctx.lineTo(s * 0.18, s * 1.05);
  ctx.moveTo(-s * 0.25, s * 0.5);
  ctx.lineTo(-s * 0.42, s * 1.05);
  ctx.moveTo(s * 0.55, s * 0.15);
  ctx.lineTo(s * 0.22, s * 0.4);
  ctx.stroke();
  eye(s * 0.9, -s * 0.45, s * 0.07);
  smile(s * 0.78, -s * 0.33, s * 0.18);
}

function drawTriceratops(s, dino) {
  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.ellipse(s * 0.38, -s * 0.22, s * 0.72, s * 0.58, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, s * 0.16, s * 1.08, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.52, -s * 0.08, s * 0.52, s * 0.38, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#FFF5CF";
  [[s * 0.3, -s * 0.57], [s * 0.7, -s * 0.57], [s * 0.96, -s * 0.08]].forEach(([hx, hy]) => {
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + s * 0.1, hy - s * 0.55);
    ctx.lineTo(hx + s * 0.22, hy);
    ctx.fill(); ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, s * 0.58);
  ctx.lineTo(-s * 0.62, s * 1.02);
  ctx.moveTo(s * 0.18, s * 0.58);
  ctx.lineTo(s * 0.06, s * 1.02);
  ctx.stroke();
  eye(s * 0.72, -s * 0.16, s * 0.06);
  smile(s * 0.7, -s * 0.02, s * 0.16);
}

function drawStegosaurus(s, dino) {
  ctx.fillStyle = dino.accent;
  for (let i = 0; i < 5; i++) {
    const px = -s * 0.8 + i * s * 0.36;
    ctx.beginPath();
    ctx.moveTo(px, -s * 0.2);
    ctx.lineTo(px + s * 0.18, -s * 0.78);
    ctx.lineTo(px + s * 0.38, -s * 0.18);
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.15, s * 0.14, s * 1.18, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.88, -s * 0.03, s * 0.38, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 1.18, s * 0.08);
  ctx.lineTo(-s * 1.75, -s * 0.18);
  ctx.lineTo(-s * 1.22, s * 0.35);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.58, s * 0.5);
  ctx.lineTo(-s * 0.68, s * 0.98);
  ctx.moveTo(s * 0.18, s * 0.5);
  ctx.lineTo(s * 0.08, s * 0.98);
  ctx.stroke();
  eye(s * 0.98, -s * 0.08, s * 0.055);
  smile(s * 0.9, s * 0.02, s * 0.14);
}

function drawBrachiosaurus(s, dino) {
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.25, s * 0.32, s * 1.06, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.35, s * 0.1);
  ctx.quadraticCurveTo(s * 0.5, -s * 0.95, s * 0.92, -s * 1.35);
  ctx.lineTo(s * 1.18, -s * 1.12);
  ctx.quadraticCurveTo(s * 0.78, -s * 0.62, s * 0.72, s * 0.3);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 1.16, -s * 1.25, s * 0.38, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.2);
  ctx.quadraticCurveTo(-s * 1.72, -s * 0.18, -s * 1.86, -s * 0.5);
  ctx.quadraticCurveTo(-s * 1.28, -s * 0.08, -s * 0.9, s * 0.28);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.68, s * 0.72);
  ctx.lineTo(-s * 0.78, s * 1.18);
  ctx.moveTo(s * 0.08, s * 0.72);
  ctx.lineTo(-s * 0.02, s * 1.18);
  ctx.stroke();
  eye(s * 1.28, -s * 1.32, s * 0.055);
  smile(s * 1.13, -s * 1.2, s * 0.13);
}

function drawPteranodon(s, dino) {
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.12);
  ctx.lineTo(-s * 1.72, s * 0.42);
  ctx.lineTo(-s * 0.46, -s * 0.58);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 0.1, -s * 0.12);
  ctx.lineTo(s * 1.72, s * 0.42);
  ctx.lineTo(s * 0.46, -s * 0.58);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.1, s * 0.42, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.45, -s * 0.22, s * 0.34, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.moveTo(s * 0.34, -s * 0.42);
  ctx.lineTo(s * 0.08, -s * 0.95);
  ctx.lineTo(s * 0.58, -s * 0.5);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#FFF2B3";
  ctx.beginPath();
  ctx.moveTo(s * 0.72, -s * 0.2);
  ctx.lineTo(s * 1.22, -s * 0.08);
  ctx.lineTo(s * 0.72, s * 0.02);
  ctx.fill(); ctx.stroke();
  eye(s * 0.5, -s * 0.28, s * 0.05);
}

function drawAnkylosaurus(s, dino) {
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.16, s * 0.14, s * 1.22, s * 0.48, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.88, -s * 0.03, s * 0.36, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = dino.accent;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(-s * 0.82 + i * s * 0.32, -s * 0.18, s * 0.12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = dino.color;
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.12);
  ctx.lineTo(-s * 1.82, s * 0.02);
  ctx.stroke();
  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.ellipse(-s * 2.0, -s * 0.02, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.58, s * 0.5);
  ctx.lineTo(-s * 0.72, s * 0.94);
  ctx.moveTo(s * 0.12, s * 0.5);
  ctx.lineTo(s * 0.0, s * 0.94);
  ctx.stroke();
  eye(s * 0.96, -s * 0.08, s * 0.05);
  smile(s * 0.86, s * 0.02, s * 0.12);
}

function drawStartScreen() {
  const panelX = canvas.width * 0.08;
  const panelY = canvas.height * 0.31;
  const panelW = canvas.width * 0.84;
  const panelH = Math.min(270, canvas.height * 0.42);

  ctx.fillStyle = "rgba(255, 253, 244, 0.92)";
  roundedRect(panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(47, 90, 68, 0.25)";
  ctx.lineWidth = 4;
  ctx.stroke();

  drawDinosaur(DINOSAURS[1], canvas.width / 2, canvas.height * 0.43, Math.min(58, canvas.width * 0.11));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1F513D";
  const title = "Tap a dinosaur picture";
  ctx.font = `900 ${fitText(title, canvas.width * 0.72, 32)}px system-ui, sans-serif`;
  ctx.fillText(title, canvas.width / 2, canvas.height * 0.57);

  ctx.fillStyle = "#325847";
  const line = "Hear its name and find the match";
  ctx.font = `800 ${fitText(line, canvas.width * 0.72, 22)}px system-ui, sans-serif`;
  ctx.fillText(line, canvas.width / 2, canvas.height * 0.64);
}

function drawFeedback(time) {
  if (!feedback || time > feedbackUntil) return;
  const alpha = Math.min(1, (feedbackUntil - time) / 240);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(31, 81, 61, 0.9)";
  roundedRect(canvas.width * 0.18, canvas.height * 0.79, canvas.width * 0.64, 54, 8);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fitText(feedback, canvas.width * 0.55, 24)}px system-ui, sans-serif`;
  ctx.fillText(feedback, canvas.width / 2, canvas.height * 0.79 + 27);
  ctx.globalAlpha = 1;
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= 1;
    ctx.globalAlpha = Math.max(0, p.life / 38);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  particles = particles.filter(p => p.life > 0);
}

function loop(time) {
  requestAnimationFrame(loop);

  if (nextRoundAt && time > nextRoundAt) {
    nextRoundAt = 0;
    buildRound(true);
  }

  drawBackground();
  drawHeader();

  if (!isStarted) {
    drawStartScreen();
  } else {
    cards.forEach(card => drawCard(card, time));
  }

  updateParticles();
  drawFeedback(time);
}

resize();
requestAnimationFrame(loop);
