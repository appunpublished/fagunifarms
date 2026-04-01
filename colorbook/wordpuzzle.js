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
 * GAME STATE & DICTIONARY
 *************************************************/
const DICTIONARY = [
  { word: "CAT", emoji: "🐱" },
  { word: "DOG", emoji: "🐶" },
  { word: "SUN", emoji: "☀️" },
  { word: "CAR", emoji: "🚗" },
  { word: "COW", emoji: "🐄" },
  { word: "PIG", emoji: "🐷" },
  { word: "BUG", emoji: "🐛" },
  { word: "ANT", emoji: "🐜" },
  { word: "FOX", emoji: "🦊" },
  { word: "OWL", emoji: "🦉" },
  { word: "TREE", emoji: "🌳" },
  { word: "FISH", emoji: "🐟" },
  { word: "BIRD", emoji: "🐦" },
  { word: "MOON", emoji: "🌙" }
];

let targets = [];
let draggables = [];
let particles = [];
let draggedItem = null;
let isWin = false;
let isPlaying = false;
let currentItem = null;

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.85; 
    msg.pitch = 1.2;
    window.speechSynthesis.speak(msg);
  }
}

function initGame() {
  targets = [];
  draggables = [];
  particles = [];
  isWin = false;
  isPlaying = true;

  // Pick a random word
  currentItem = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
  const chars = currentItem.word.split("");

  const spacing = canvas.width / (chars.length + 1);
  const targetY = canvas.height * 0.50;
  const dragY = canvas.height * 0.75;
  
  // Size based on screen width so it fits perfectly
  const size = Math.min(35, (canvas.width / (chars.length + 1)) * 0.4); 

  // Create Targets
  chars.forEach((char, i) => {
    const x = spacing * (i + 1);
    targets.push({ char: char, x, y: targetY, size, matched: false });
  });

  // Create Scrambled Draggables
  let shuffled = [...chars].sort(() => Math.random() - 0.5);
  const colors = ["#FF3B30", "#34C759", "#007AFF", "#FFCC00", "#AF52DE", "#FF9500"];
  
  shuffled.forEach((char, i) => {
    const x = spacing * (i + 1);
    draggables.push({ 
      char: char, x, y: dragY, startX: x, startY: dragY, 
      size, color: colors[i % colors.length], matched: false 
    });
  });

  setTimeout(() => speak(`Spell... ${currentItem.word}`), 500);
}

function createPop(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
      life: 30, color, size: Math.random()*6+2
    });
  }
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying) { initGame(); return; }
  if (isWin) return;

  const px = e.clientX;
  const py = e.clientY;

  // Click Emoji to repeat word
  if (py < canvas.height * 0.35) {
    if (currentItem) speak(currentItem.word);
    return;
  }

  // Pick up letter
  for (let i = draggables.length - 1; i >= 0; i--) {
    const d = draggables[i];
    if (!d.matched && Math.hypot(px - d.x, py - d.y) < d.size * 1.5) {
      draggedItem = d;
      d.x = px;
      d.y = py;
      // Move to top layer
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

  // Find closest matching valid target (handles duplicate letters safely)
  let bestTarget = null;
  let bestDist = Infinity;

  targets.forEach(t => {
    if (!t.matched && t.char === draggedItem.char) {
      const dist = Math.hypot(draggedItem.x - t.x, draggedItem.y - t.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = t;
      }
    }
  });

  if (bestTarget && bestDist < bestTarget.size * 2) {
    // Snap to the target outline
    draggedItem.x = bestTarget.x;
    draggedItem.y = bestTarget.y;
    draggedItem.matched = true;
    bestTarget.matched = true;
    createPop(bestTarget.x, bestTarget.y, draggedItem.color);
    speak(draggedItem.char);
    if ("vibrate" in navigator) navigator.vibrate(50);
  } else {
    // Return to tray
    draggedItem.x = draggedItem.startX;
    draggedItem.y = draggedItem.startY;
    if ("vibrate" in navigator) navigator.vibrate([20, 30, 20]);
  }
  
  draggedItem = null;

  // Check Win Condition
  if (targets.every(t => t.matched)) {
    isWin = true;
    setTimeout(() => speak(`${currentItem.word}! Good job!`), 800);
    setTimeout(initGame, 2500);
  }
});

/*************************************************
 * DRAWING
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.fillStyle = "#FFF3E0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("WORD PUZZLE", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  // Draw Emoji
  if (currentItem) {
    ctx.font = `${Math.min(100, canvas.width / 3)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Bounce animation if won
    let emojiY = canvas.height * 0.25;
    if (isWin) emojiY += Math.sin(Date.now() / 150) * 15;
    
    ctx.fillText(currentItem.emoji, canvas.width / 2, emojiY);
  }

  // Draw Target Outlines
  targets.forEach(t => {
    if (!t.matched) {
      ctx.beginPath();
      ctx.roundRect(t.x - t.size, t.y - t.size, t.size * 2, t.size * 2, 8);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ccc";
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Draw Draggable Letters
  draggables.forEach(d => {
    const scale = d === draggedItem ? 1.2 : 1.0;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(scale, scale);
    
    // Tile Background
    ctx.beginPath();
    ctx.roundRect(-d.size, -d.size, d.size * 2, d.size * 2, 8);
    ctx.fillStyle = d.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();

    // Tile Letter
    ctx.fillStyle = "white";
    ctx.font = `bold ${d.size * 1.2}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.char, 0, 2);
    
    ctx.restore();
  });

  // Particles
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  particles = particles.filter(p => p.life > 0);
}

update();