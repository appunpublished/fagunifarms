/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/*************************************************
 * GAME STATE
 *************************************************/
const SHAPE_TYPES = ["Circle", "Square", "Triangle", "Star", "Hexagon"];
const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBERS = "0123456789".split("");
const ALL_TYPES = [...SHAPE_TYPES, ...ALPHABETS, ...NUMBERS];
const COLORS = ["#FF3B30", "#34C759", "#007AFF", "#FFCC00", "#AF52DE", "#FF9500", "#E91E63", "#00BCD4"];

const langMap = { "en": "en-US", "es": "es-ES", "fr": "fr-FR", "de": "de-DE" };
function getLangKey() { return localStorage.getItem('appLang') || 'en'; }
function getLangCode() { return langMap[getLangKey()]; }

const SHAPE_NAMES = {
  "Circle": { en: "Circle", es: "Círculo", fr: "Cercle", de: "Kreis" },
  "Square": { en: "Square", es: "Cuadrado", fr: "Carré", de: "Quadrat" },
  "Triangle": { en: "Triangle", es: "Triángulo", fr: "Triangle", de: "Dreieck" },
  "Star": { en: "Star", es: "Estrella", fr: "Étoile", de: "Stern" },
  "Hexagon": { en: "Hexagon", es: "Hexágono", fr: "Hexagone", de: "Sechseck" }
};

let targets = [];
let draggables = [];
let particles = [];
let draggedItem = null;
let isWin = false;
let isPlaying = false;

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = getLangCode();
    msg.rate = 0.85; msg.pitch = 1.1;
    window.speechSynthesis.speak(msg);
  }
}

function initGame() {
  targets = [];
  draggables = [];
  particles = [];
  isWin = false;
  isPlaying = true;

  let types = [...ALL_TYPES].sort(() => Math.random() - 0.5).slice(0, 3);
  let colors = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 3);

  const spacing = canvas.width / 4;
  const targetY = canvas.height * 0.25;
  const dragY = canvas.height * 0.75;
  const size = Math.min(45, canvas.width / 10); // responsive size

  types.forEach((type, i) => {
    const x = spacing * (i + 1);
    targets.push({ id: type, type: type, x, y: targetY, size, matched: false });
  });

  let dragOrder = [...types].sort(() => Math.random() - 0.5);
  dragOrder.forEach((type, i) => {
    const x = spacing * (i + 1);
    const color = colors[types.indexOf(type)];
    draggables.push({ 
      id: type, type: type, x, y: dragY, startX: x, startY: dragY, 
      size, color: color, matched: false 
    });
  });

  const INTRO = { en: "Match the shapes!", es: "¡Empareja las formas!", fr: "Associez les formes!", de: "Ordne die Formen zu!" };
  speak(INTRO[getLangKey()]);
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying) { initGame(); return; }
  if (isWin) return;

  const px = e.clientX;
  const py = e.clientY;

  for (let i = draggables.length - 1; i >= 0; i--) {
    const d = draggables[i];
    if (!d.matched && Math.hypot(px - d.x, py - d.y) < d.size * 1.5) {
      draggedItem = d;
      d.x = px;
      d.y = py;
      // Move to top rendering layer
      draggables.splice(i, 1);
      draggables.push(d);
      if ("vibrate" in navigator) navigator.vibrate(20);
      break;
    }
  }
});

canvas.addEventListener("pointermove", e => {
  if (draggedItem) {
    draggedItem.x = e.clientX;
    draggedItem.y = e.clientY;
  }
});

canvas.addEventListener("pointerup", e => {
  if (!draggedItem) return;

  const target = targets.find(t => t.id === draggedItem.id);
  const dist = Math.hypot(draggedItem.x - target.x, draggedItem.y - target.y);

  if (dist < target.size * 1.5) {
    // Snap to the target outline
    draggedItem.x = target.x;
    draggedItem.y = target.y;
    draggedItem.matched = true;
    target.matched = true;
    createPop(target.x, target.y, draggedItem.color);
    const shapeName = SHAPE_NAMES[draggedItem.type] ? SHAPE_NAMES[draggedItem.type][getLangKey()] : draggedItem.type;
    speak(shapeName);
    if ("vibrate" in navigator) navigator.vibrate(50);
  } else {
    // Return to starting tray
    draggedItem.x = draggedItem.startX;
    draggedItem.y = draggedItem.startY;
  }
  
  draggedItem = null;

  if (targets.every(t => t.matched)) {
    isWin = true;
    const WIN_MSG = { en: "Great job!", es: "¡Buen trabajo!", fr: "Bon travail!", de: "Gut gemacht!" };
    speak(WIN_MSG[getLangKey()]);
    setTimeout(initGame, 2000);
  }
});

/*************************************************
 * DRAWING
 *************************************************/
function drawShape(type, x, y, size, color, isOutline) {
  // Handle letters and numbers
  if (type.length === 1) {
    ctx.font = `bold ${size * 2}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (isOutline) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#aaa";
      ctx.setLineDash([6, 6]);
      ctx.strokeText(type, x, y);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(type, x, y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.strokeText(type, x, y);
    }
    return;
  }

  ctx.beginPath();
  if (type === "Circle") {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  } else if (type === "Square") {
    ctx.rect(x - size, y - size, size * 2, size * 2);
  } else if (type === "Triangle") {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
  } else if (type === "Star") {
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * size + x,
                 -Math.sin((18 + i * 72) / 180 * Math.PI) * size + y);
      ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (size/2) + x,
                 -Math.sin((54 + i * 72) / 180 * Math.PI) * (size/2) + y);
    }
  } else if (type === "Hexagon") {
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(x + size * Math.cos(i * Math.PI / 3), y + size * Math.sin(i * Math.PI / 3));
    }
  }
  ctx.closePath();

  if (isOutline) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();
  }
}

function createPop(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
      life: 30, color, size: Math.random()*5+2
    });
  }
}

function update() {
  requestAnimationFrame(update);
  ctx.fillStyle = "#E6E6FA";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("SHAPE SORTER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  targets.forEach(t => {
    if (!t.matched) drawShape(t.type, t.x, t.y, t.size, null, true);
  });

  draggables.forEach(d => {
    const scale = d === draggedItem ? 1.2 : 1.0;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(scale, scale);
    drawShape(d.type, 0, 0, d.size, d.color, false);
    ctx.restore();
  });

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  particles = particles.filter(p => p.life > 0);

  if (isWin && particles.length === 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GOOD JOB!", canvas.width / 2, canvas.height / 2);
  }
}

update();