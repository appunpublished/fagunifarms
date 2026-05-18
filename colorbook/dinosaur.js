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
  {
    id: "trex",
    name: "T. rex",
    say: "Tyrannosaurus rex",
    syllables: "ty-ran-no-SAW-rus rex",
    hint: "big teeth",
    diet: "meat eater",
    fact: "T. rex had huge teeth and very strong jaws.",
    image: "assets/dinosaurs/trex.jpg",
    imageCredit: "T. rex skeleton, Geez-oz, public domain",
    imageSource: "https://commons.wikimedia.org/wiki/File:Fossil-museum1.jpg",
    color: "#57B894",
    belly: "#F8D66D",
    accent: "#2B7A66"
  },
  {
    id: "triceratops",
    name: "Triceratops",
    say: "Triceratops",
    syllables: "try-SAIR-uh-tops",
    hint: "three horns",
    diet: "plant eater",
    fact: "Triceratops used three horns and a big frill for protection.",
    image: "assets/dinosaurs/triceratops.jpg",
    imageCredit: "Triceratops restoration, Conty, public domain",
    imageSource: "https://commons.wikimedia.org/wiki/File:Triceratops3045.JPG",
    color: "#F4A261",
    belly: "#FFE0A3",
    accent: "#C85C46"
  },
  {
    id: "stegosaurus",
    name: "Stegosaurus",
    say: "Stegosaurus",
    syllables: "STEG-uh-SAW-rus",
    hint: "back plates",
    diet: "plant eater",
    fact: "Stegosaurus had tall plates on its back and spikes on its tail.",
    image: "assets/dinosaurs/stegosaurus.jpg",
    imageCredit: "Stegosaurus model, Good Free Photos, CC0/public domain",
    imageSource: "https://www.goodfreephotos.com/animals/prehistoric-animals/stegosaurus.jpg.php",
    color: "#7CC7E8",
    belly: "#EAF7FF",
    accent: "#EA6F91"
  },
  {
    id: "brachiosaurus",
    name: "Brachiosaurus",
    say: "Brachiosaurus",
    syllables: "brak-ee-uh-SAW-rus",
    hint: "long neck",
    diet: "plant eater",
    fact: "Brachiosaurus reached high leaves with its very long neck.",
    image: "assets/dinosaurs/brachiosaurus.jpg",
    imageCredit: "Brachiosaurus restoration, Dmitry Bogdanov, public domain",
    imageSource: "https://commons.wikimedia.org/wiki/File:Brachiosaurus_DB.jpg",
    color: "#A7C957",
    belly: "#FFF0B8",
    accent: "#6A994E"
  },
  {
    id: "pteranodon",
    name: "Pteranodon",
    say: "Pteranodon",
    syllables: "teh-RAN-uh-don",
    hint: "big wings",
    diet: "fish eater",
    fact: "Pteranodon was a flying reptile with wide wings.",
    image: "assets/dinosaurs/pteranodon.jpg",
    imageCredit: "Pteranodon model, Good Free Photos, CC0/public domain",
    imageSource: "https://www.goodfreephotos.com/animals/prehistoric-animals/pteranodon.jpg.php",
    color: "#B388EB",
    belly: "#EFE3FF",
    accent: "#6C5CE7"
  },
  {
    id: "ankylosaurus",
    name: "Ankylosaurus",
    say: "Ankylosaurus",
    syllables: "an-KY-lo-SAW-rus",
    hint: "tail club",
    diet: "plant eater",
    fact: "Ankylosaurus wore body armor and swung a heavy tail club.",
    image: "assets/dinosaurs/ankylosaurus.jpg",
    imageCredit: "Ankylosaurus skeleton restoration, Barnum Brown, public domain",
    imageSource: "https://commons.wikimedia.org/wiki/File:Ankylosaurus.jpg",
    color: "#FFCA3A",
    belly: "#FFF5BF",
    accent: "#8A5A44"
  }
];

const dinoImages = {};

function preloadDinosaurImages() {
  DINOSAURS.forEach(dino => {
    const img = new Image();
    img.onload = () => {
      dinoImages[dino.id] = img;
    };
    img.onerror = () => {
      dinoImages[dino.id] = null;
    };
    img.src = dino.image;
  });
}

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

  const top = isStarted
    ? Math.max(230, Math.min(canvas.height * 0.42, canvas.height - 430))
    : Math.max(128, canvas.height * 0.24);
  const availableWidth = canvas.width - 32;
  const cardGap = Math.min(18, canvas.width * 0.035);
  const columns = canvas.width < 620 ? 1 : 3;
  const cardWidth = columns === 1 ? Math.min(390, availableWidth) : (availableWidth - cardGap * 2) / 3;
  const cardHeight = columns === 1
    ? Math.max(106, Math.min(136, (canvas.height - top - 38) / 3))
    : Math.min(310, Math.max(220, canvas.height * 0.43));
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
      feedback = `${target.name}: ${target.fact}`;
      feedbackUntil = performance.now() + 1700;
      createSparkles(pressedCard.x + pressedCard.w / 2, pressedCard.y + pressedCard.h / 2, pressedCard.dino.color);
      speak(`${target.say}. ${target.fact}`);
      nextRoundAt = performance.now() + 1900;
      if ("vibrate" in navigator) navigator.vibrate([35, 30, 35]);
    } else {
      feedback = `${pressedCard.dino.name}: ${pressedCard.dino.hint}`;
      feedbackUntil = performance.now() + 1300;
      speak(`That is ${pressedCard.dino.say}. It has ${pressedCard.dino.hint}. Find ${target.say}`);
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
  const titleSize = fitText("Dino Picture & Name", canvas.width - 180, Math.min(32, canvas.width * 0.066));
  ctx.fillStyle = "#1F513D";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillText("Dino Picture & Name", canvas.width / 2, 18);

  const prompt = isStarted ? `Find the ${target.name} picture` : "Tap to start";
  const promptSize = fitText(prompt, canvas.width - 40, Math.min(42, canvas.width * 0.09));
  ctx.fillStyle = "#183B2D";
  ctx.font = `900 ${promptSize}px system-ui, sans-serif`;
  ctx.fillText(prompt, canvas.width / 2, Math.max(58, canvas.height * 0.09));

  if (isStarted) {
    ctx.font = `800 ${Math.min(18, canvas.width * 0.045)}px system-ui, sans-serif`;
    ctx.fillStyle = "#325847";
    ctx.fillText(`Stars ${score}  |  Say: ${target.syllables}`, canvas.width / 2, Math.max(94, canvas.height * 0.145));
  }
}

function drawTargetSpotlight(time) {
  if (!isStarted) return;

  const panelW = Math.min(canvas.width - 30, 720);
  const panelH = canvas.width < 620 ? 110 : 132;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = Math.max(118, canvas.height * 0.18);

  ctx.save();
  ctx.shadowColor = "rgba(33, 79, 61, 0.18)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "rgba(255, 253, 244, 0.94)";
  roundedRect(panelX, panelY, panelW, panelH, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(47, 90, 68, 0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const imageSize = Math.min(panelH * 0.42, panelW * 0.13);
  const imageX = panelX + Math.max(70, panelW * 0.16);
  const imageY = panelY + panelH * 0.55 + Math.sin(time / 280) * 2;
  drawReferenceImage(target, imageX, imageY, imageSize * 2.45, panelH * 0.72, 10, imageSize);

  const textX = canvas.width < 520 ? panelX + panelW * 0.55 : panelX + panelW * 0.58;
  const maxTextW = panelX + panelW - textX - 18;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#193D2E";
  ctx.font = `900 ${fitText(target.name, maxTextW, canvas.width < 520 ? 24 : 32)}px system-ui, sans-serif`;
  ctx.fillText(target.name, textX, panelY + panelH * 0.32);

  ctx.fillStyle = target.accent;
  ctx.font = `900 ${fitText(target.syllables, maxTextW, canvas.width < 520 ? 14 : 17)}px system-ui, sans-serif`;
  ctx.fillText(target.syllables, textX, panelY + panelH * 0.55);

  const clue = `${target.hint} | ${target.diet}`;
  ctx.fillStyle = "#41614E";
  ctx.font = `800 ${fitText(clue, maxTextW, canvas.width < 520 ? 13 : 15)}px system-ui, sans-serif`;
  ctx.fillText(clue, textX, panelY + panelH * 0.76);

  if (dinoImages[target.id]) {
    ctx.fillStyle = "#6A7A6E";
    ctx.font = `700 ${fitText("Public domain/CC0 reference", maxTextW, 11)}px system-ui, sans-serif`;
    ctx.fillText("Public domain/CC0 reference", textX, panelY + panelH * 0.92);
  }
  ctx.restore();
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

  ctx.shadowColor = "rgba(33, 79, 61, 0.24)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 9;
  const cardGrad = ctx.createLinearGradient(0, 0, 0, card.h);
  cardGrad.addColorStop(0, "#ffffff");
  cardGrad.addColorStop(1, "#fff6dc");
  ctx.fillStyle = cardGrad;
  roundedRect(0, 0, card.w, card.h, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.lineWidth = Math.max(3, card.w * 0.012);
  ctx.strokeStyle = "rgba(47, 90, 68, 0.22)";
  ctx.stroke();

  const imageCenterX = card.w / 2;
  const imageCenterY = card.h * (card.h < 170 ? 0.39 : 0.37) + pulse;
  const imageSize = Math.min(card.w * 0.48, card.h * 0.37);
  drawDinoStage(imageCenterX, imageCenterY + imageSize * 0.48, imageSize * 1.8, imageSize * 0.48, card.dino);
  drawReferenceImage(card.dino, imageCenterX, imageCenterY, card.w * 0.78, card.h * 0.43, 10, imageSize);

  const nameY = card.h - Math.max(44, card.h * 0.22);
  const nameSize = fitText(card.dino.name, card.w - 24, Math.min(27, card.h * 0.15));
  ctx.fillStyle = "#22352D";
  ctx.font = `900 ${nameSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(card.dino.name, card.w / 2, nameY);

  const smallText = card.h < 126 ? card.dino.hint : `${card.dino.syllables} | ${card.dino.hint}`;
  ctx.fillStyle = "#57705E";
  ctx.font = `800 ${fitText(smallText, card.w - 26, Math.min(15, card.h * 0.09))}px system-ui, sans-serif`;
  ctx.fillText(smallText, card.w / 2, card.h - Math.max(20, card.h * 0.1));

  ctx.restore();
}

function drawReferenceImage(dino, x, y, w, h, radius, fallbackSize) {
  const img = dinoImages[dino.id];
  ctx.save();
  ctx.translate(x - w / 2, y - h / 2);

  const frameGrad = ctx.createLinearGradient(0, 0, 0, h);
  frameGrad.addColorStop(0, "#ffffff");
  frameGrad.addColorStop(1, lighten(dino.color, 0.74));
  ctx.fillStyle = frameGrad;
  roundedRect(0, 0, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = "rgba(47, 90, 68, 0.16)";
  ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.stroke();

  if (img) {
    const pad = Math.max(6, Math.min(w, h) * 0.055);
    const boxW = w - pad * 2;
    const boxH = h - pad * 2;
    const scale = Math.min(boxW / img.width, boxH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = pad + (boxW - drawW) / 2;
    const drawY = pad + (boxH - drawH) / 2;

    ctx.save();
    roundedRect(pad, pad, boxW, boxH, Math.max(4, radius - 3));
    ctx.clip();
    ctx.fillStyle = "#f8f3df";
    ctx.fillRect(pad, pad, boxW, boxH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.translate(w / 2, h / 2 - fallbackSize * 0.05);
    drawDinosaur(dino, 0, 0, fallbackSize);
  }

  ctx.restore();
}

function drawDinosaur(dino, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(30, 55, 42, 0.42)";
  ctx.lineWidth = Math.max(2, size * 0.055);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#163827";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.9, size * 1.48, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (dino.id === "trex") drawTrex(size, dino);
  if (dino.id === "triceratops") drawTriceratops(size, dino);
  if (dino.id === "stegosaurus") drawStegosaurus(size, dino);
  if (dino.id === "brachiosaurus") drawBrachiosaurus(size, dino);
  if (dino.id === "pteranodon") drawPteranodon(size, dino);
  if (dino.id === "ankylosaurus") drawAnkylosaurus(size, dino);

  ctx.restore();
}

function drawDinoStage(x, y, w, h, dino) {
  const grad = ctx.createLinearGradient(0, y - h, 0, y + h);
  grad.addColorStop(0, "rgba(255,255,255,0.8)");
  grad.addColorStop(1, `${dino.color}33`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(76, 139, 86, 0.22)";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * w * 0.16, y + h * 0.05, w * 0.08, h * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bodyFill(dino, x0, y0, x1, y1) {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, lighten(dino.color, 0.36));
  grad.addColorStop(0.55, dino.color);
  grad.addColorStop(1, shade(dino.color, 0.28));
  ctx.fillStyle = grad;
}

function lighten(hex, amount) {
  return tint(hex, amount, 255);
}

function shade(hex, amount) {
  return tint(hex, amount, 0);
}

function tint(hex, amount, target) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = value => Math.round(value + (target - value) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function fillStroke() {
  ctx.fill();
  ctx.stroke();
}

function eye(x, y, r) {
  ctx.fillStyle = "#13231A";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + r * 0.32, y - r * 0.35, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function smile(x, y, r) {
  ctx.strokeStyle = "rgba(19, 35, 26, 0.72)";
  ctx.lineWidth = Math.max(1.5, r * 0.18);
  ctx.beginPath();
  ctx.arc(x, y, r, 0.1, Math.PI * 0.78);
  ctx.stroke();
}

function nostril(x, y, r) {
  ctx.fillStyle = "rgba(19, 35, 26, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.62, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function leg(x, y, s, color) {
  ctx.fillStyle = color;
  roundedRect(x, y, s * 0.22, s * 0.56, s * 0.08);
  fillStroke();
  ctx.fillStyle = shade(color, 0.22);
  ctx.beginPath();
  ctx.ellipse(x + s * 0.14, y + s * 0.56, s * 0.2, s * 0.09, 0, 0, Math.PI * 2);
  fillStroke();
}

function drawSpots(points, color, s) {
  ctx.fillStyle = color;
  points.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, r * s, r * s * 0.74, 0.15, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawTrex(s, dino) {
  bodyFill(dino, -s * 0.9, -s * 0.58, s * 1.1, s * 0.75);
  ctx.beginPath();
  ctx.moveTo(-s * 1.05, s * 0.05);
  ctx.quadraticCurveTo(-s * 1.85, -s * 0.16, -s * 1.98, -s * 0.66);
  ctx.quadraticCurveTo(-s * 1.35, -s * 0.42, -s * 0.72, s * 0.12);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(-s * 0.1, s * 0.08, s * 1.15, s * 0.62, -0.05, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(s * 0.76, -s * 0.35, s * 0.55, s * 0.42, 0.08, 0, Math.PI * 2);
  fillStroke();

  ctx.fillStyle = shade(dino.color, 0.15);
  ctx.beginPath();
  ctx.moveTo(s * 0.52, -s * 0.25);
  ctx.quadraticCurveTo(s * 0.95, -s * 0.18, s * 1.28, -s * 0.1);
  ctx.quadraticCurveTo(s * 0.92, s * 0.02, s * 0.53, -s * 0.02);
  ctx.fill();

  ctx.fillStyle = dino.belly;
  ctx.beginPath();
  ctx.ellipse(s * 0.08, s * 0.18, s * 0.62, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  leg(-s * 0.35, s * 0.46, s, shade(dino.color, 0.08));
  leg(s * 0.28, s * 0.48, s, dino.color);

  ctx.strokeStyle = shade(dino.color, 0.35);
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(s * 0.52, s * 0.12);
  ctx.lineTo(s * 0.18, s * 0.34);
  ctx.moveTo(s * 0.6, s * 0.18);
  ctx.lineTo(s * 0.36, s * 0.38);
  ctx.stroke();

  ctx.fillStyle = "#fff7d5";
  for (let i = 0; i < 4; i++) {
    const tx = s * (0.58 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(tx, -s * 0.14);
    ctx.lineTo(tx + s * 0.05, -s * 0.01);
    ctx.lineTo(tx + s * 0.1, -s * 0.14);
    ctx.fill();
  }
  drawSpots([[-0.5, -0.18, 0.09], [-0.1, -0.31, 0.07], [0.35, -0.12, 0.06]], dino.accent, s);
  eye(s * 0.9, -s * 0.48, s * 0.07);
  nostril(s * 1.16, -s * 0.33, s * 0.035);
  smile(s * 0.82, -s * 0.3, s * 0.2);
}

function drawTriceratops(s, dino) {
  bodyFill(dino, -s, -s * 0.6, s * 1.1, s * 0.8);
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, s * 0.16, s * 1.13, s * 0.55, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.ellipse(s * 0.42, -s * 0.22, s * 0.78, s * 0.62, 0, 0, Math.PI * 2);
  fillStroke();

  bodyFill(dino, s * 0.08, -s * 0.4, s * 1.1, s * 0.25);
  ctx.beginPath();
  ctx.ellipse(s * 0.54, -s * 0.08, s * 0.54, s * 0.39, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.fillStyle = "#FFF5CF";
  [[s * 0.24, -s * 0.56, s * 0.2], [s * 0.68, -s * 0.57, s * 0.2], [s * 0.98, -s * 0.1, s * 0.16]].forEach(([hx, hy, hw]) => {
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + hw * 0.45, hy - s * 0.62);
    ctx.lineTo(hx + hw, hy);
    fillStroke();
  });

  leg(-s * 0.6, s * 0.5, s, shade(dino.color, 0.08));
  leg(s * 0.04, s * 0.5, s, dino.color);
  drawSpots([[-0.58, 0.0, 0.08], [-0.08, -0.16, 0.07], [0.28, 0.18, 0.06]], shade(dino.accent, 0.12), s);
  eye(s * 0.72, -s * 0.16, s * 0.06);
  nostril(s * 0.98, -s * 0.03, s * 0.032);
  smile(s * 0.7, -s * 0.02, s * 0.16);
}

function drawStegosaurus(s, dino) {
  for (let i = 0; i < 6; i++) {
    const px = -s * 0.88 + i * s * 0.34;
    const plateH = s * (0.46 + (i % 2) * 0.14);
    ctx.fillStyle = i % 2 ? lighten(dino.accent, 0.12) : dino.accent;
    ctx.beginPath();
    ctx.moveTo(px, -s * 0.2);
    ctx.lineTo(px + s * 0.17, -s * 0.2 - plateH);
    ctx.lineTo(px + s * 0.36, -s * 0.18);
    fillStroke();
  }
  bodyFill(dino, -s * 1.1, -s * 0.45, s * 1.1, s * 0.65);
  ctx.beginPath();
  ctx.ellipse(-s * 0.15, s * 0.14, s * 1.18, s * 0.5, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(s * 0.88, -s * 0.03, s * 0.38, s * 0.3, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.moveTo(-s * 1.18, s * 0.08);
  ctx.lineTo(-s * 1.75, -s * 0.18);
  ctx.lineTo(-s * 1.22, s * 0.35);
  fillStroke();

  ctx.fillStyle = dino.belly;
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, s * 0.28, s * 0.64, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  leg(-s * 0.66, s * 0.47, s, shade(dino.color, 0.08));
  leg(s * 0.12, s * 0.47, s, dino.color);
  ctx.strokeStyle = "#fff7d5";
  ctx.lineWidth = Math.max(2, s * 0.055);
  ctx.beginPath();
  ctx.moveTo(-s * 1.68, -s * 0.15);
  ctx.lineTo(-s * 1.9, -s * 0.32);
  ctx.moveTo(-s * 1.62, -s * 0.1);
  ctx.lineTo(-s * 1.88, -s * 0.04);
  ctx.stroke();
  eye(s * 0.98, -s * 0.08, s * 0.055);
  nostril(s * 1.16, -s * 0.02, s * 0.028);
  smile(s * 0.9, s * 0.02, s * 0.14);
}

function drawBrachiosaurus(s, dino) {
  bodyFill(dino, -s, -s * 1.4, s * 1.3, s * 0.85);
  ctx.beginPath();
  ctx.ellipse(-s * 0.25, s * 0.32, s * 1.06, s * 0.5, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.35, s * 0.1);
  ctx.quadraticCurveTo(s * 0.48, -s * 0.96, s * 0.94, -s * 1.36);
  ctx.lineTo(s * 1.2, -s * 1.12);
  ctx.quadraticCurveTo(s * 0.78, -s * 0.62, s * 0.72, s * 0.31);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(s * 1.16, -s * 1.25, s * 0.38, s * 0.28, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.2);
  ctx.quadraticCurveTo(-s * 1.72, -s * 0.18, -s * 1.86, -s * 0.5);
  ctx.quadraticCurveTo(-s * 1.28, -s * 0.08, -s * 0.9, s * 0.28);
  fillStroke();

  ctx.fillStyle = dino.belly;
  ctx.beginPath();
  ctx.ellipse(-s * 0.18, s * 0.42, s * 0.62, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  leg(-s * 0.72, s * 0.68, s, shade(dino.color, 0.08));
  leg(s * 0.02, s * 0.68, s, dino.color);
  drawSpots([[-0.58, 0.15, 0.08], [-0.12, 0.02, 0.07], [0.58, -0.56, 0.06], [0.82, -0.93, 0.052]], dino.accent, s);
  eye(s * 1.28, -s * 1.32, s * 0.055);
  nostril(s * 1.46, -s * 1.23, s * 0.028);
  smile(s * 1.13, -s * 1.2, s * 0.13);
}

function drawPteranodon(s, dino) {
  bodyFill(dino, -s * 1.5, -s * 0.8, s * 1.5, s * 0.45);
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.13);
  ctx.lineTo(-s * 1.82, s * 0.48);
  ctx.quadraticCurveTo(-s * 0.95, -s * 0.05, -s * 0.46, -s * 0.62);
  ctx.closePath();
  fillStroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.12, -s * 0.13);
  ctx.lineTo(s * 1.82, s * 0.48);
  ctx.quadraticCurveTo(s * 0.95, -s * 0.05, s * 0.46, -s * 0.62);
  ctx.closePath();
  fillStroke();

  ctx.strokeStyle = "rgba(38, 48, 67, 0.22)";
  ctx.lineWidth = Math.max(1.5, s * 0.035);
  [-1, 1].forEach(dir => {
    ctx.beginPath();
    ctx.moveTo(dir * s * 0.16, -s * 0.12);
    ctx.lineTo(dir * s * 1.35, s * 0.32);
    ctx.moveTo(dir * s * 0.4, -s * 0.43);
    ctx.lineTo(dir * s * 0.82, s * 0.08);
    ctx.stroke();
  });

  bodyFill(dino, -s * 0.3, -s * 0.45, s * 0.8, s * 0.2);
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.1, s * 0.42, s * 0.3, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(s * 0.45, -s * 0.22, s * 0.34, s * 0.22, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.moveTo(s * 0.34, -s * 0.42);
  ctx.lineTo(s * 0.08, -s * 0.95);
  ctx.lineTo(s * 0.58, -s * 0.5);
  fillStroke();

  ctx.fillStyle = "#FFF2B3";
  ctx.beginPath();
  ctx.moveTo(s * 0.72, -s * 0.2);
  ctx.lineTo(s * 1.3, -s * 0.08);
  ctx.lineTo(s * 0.72, s * 0.02);
  fillStroke();
  eye(s * 0.5, -s * 0.28, s * 0.05);
  nostril(s * 0.82, -s * 0.16, s * 0.02);
}

function drawAnkylosaurus(s, dino) {
  bodyFill(dino, -s * 1.1, -s * 0.42, s * 1.1, s * 0.62);
  ctx.beginPath();
  ctx.ellipse(-s * 0.16, s * 0.14, s * 1.22, s * 0.48, 0, 0, Math.PI * 2);
  fillStroke();

  ctx.beginPath();
  ctx.ellipse(s * 0.88, -s * 0.03, s * 0.36, s * 0.28, 0, 0, Math.PI * 2);
  fillStroke();

  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? lighten(dino.accent, 0.16) : dino.accent;
    ctx.beginPath();
    ctx.moveTo(-s * 0.95 + i * s * 0.3, -s * 0.08);
    ctx.lineTo(-s * 0.86 + i * s * 0.3, -s * 0.38);
    ctx.lineTo(-s * 0.72 + i * s * 0.3, -s * 0.08);
    fillStroke();
  }

  ctx.strokeStyle = shade(dino.color, 0.36);
  ctx.lineWidth = Math.max(3, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(-s * 1.1, s * 0.12);
  ctx.quadraticCurveTo(-s * 1.45, s * 0.02, -s * 1.82, s * 0.02);
  ctx.stroke();

  ctx.fillStyle = dino.accent;
  ctx.beginPath();
  ctx.ellipse(-s * 2.0, -s * 0.02, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
  fillStroke();

  leg(-s * 0.64, s * 0.48, s, shade(dino.color, 0.08));
  leg(s * 0.08, s * 0.48, s, dino.color);
  drawSpots([[-0.55, 0.14, 0.07], [-0.1, 0.2, 0.06], [0.38, 0.08, 0.055]], shade(dino.accent, 0.18), s);
  eye(s * 0.96, -s * 0.08, s * 0.05);
  nostril(s * 1.13, -s * 0.02, s * 0.025);
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

  drawReferenceImage(
    DINOSAURS[1],
    canvas.width / 2,
    canvas.height * 0.43,
    Math.min(340, canvas.width * 0.58),
    Math.min(150, canvas.height * 0.2),
    10,
    Math.min(58, canvas.width * 0.11)
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1F513D";
  const title = "Learn each dinosaur";
  ctx.font = `900 ${fitText(title, canvas.width * 0.72, 32)}px system-ui, sans-serif`;
  ctx.fillText(title, canvas.width / 2, canvas.height * 0.57);

  ctx.fillStyle = "#325847";
  const line = "See the picture, hear the name, then find the match";
  ctx.font = `800 ${fitText(line, canvas.width * 0.72, 22)}px system-ui, sans-serif`;
  ctx.fillText(line, canvas.width / 2, canvas.height * 0.64);
}

function drawFeedback(time) {
  if (!feedback || time > feedbackUntil) return;
  const alpha = Math.min(1, (feedbackUntil - time) / 240);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(31, 81, 61, 0.9)";
  roundedRect(canvas.width * 0.08, canvas.height * 0.78, canvas.width * 0.84, 62, 8);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fitText(feedback, canvas.width * 0.76, 22)}px system-ui, sans-serif`;
  ctx.fillText(feedback, canvas.width / 2, canvas.height * 0.78 + 31);
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
    drawTargetSpotlight(time);
    cards.forEach(card => drawCard(card, time));
  }

  updateParticles();
  drawFeedback(time);
}

preloadDinosaurImages();
resize();
requestAnimationFrame(loop);
