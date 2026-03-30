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
const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
let items = [];
let particles = [];
let score = 0;
let lives = 3;
let targetChar = "";
let isPlaying = false;
let isGameOver = false;
let lastSpawnTime = 0;
let speedMult = 1;

const basket = { x: canvas.width / 2, y: canvas.height - 80, w: 100, h: 50 };

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.85; msg.pitch = 1.2;
    window.speechSynthesis.speak(msg);
  }
}

function pickTarget() {
  targetChar = possibleChars[Math.floor(Math.random() * possibleChars.length)];
  const isNum = !isNaN(targetChar);
  speak(`Catch the ${isNum ? 'number' : 'letter'} ${targetChar}`);
}

function spawnItem() {
  // 30% chance to force spawn the target character so it stays possible
  const char = (Math.random() < 0.3 && targetChar) 
               ? targetChar 
               : possibleChars[Math.floor(Math.random() * possibleChars.length)];
               
  const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#4CAF50", "#5AC8FA", "#AF52DE"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  items.push({
    char: char,
    x: Math.random() * (canvas.width - 60) + 30,
    y: -40,
    vy: (Math.random() * 1.5 + 1.5) * speedMult,
    color: color,
    size: 30
  });
}

function createPop(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
      life: 30, color, size: Math.random()*5+2
    });
  }
}

function initGame() {
  items = [];
  particles = [];
  score = 0;
  lives = 3;
  speedMult = 1;
  isPlaying = true;
  isGameOver = false;
  lastSpawnTime = performance.now();
  pickTarget();
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying || isGameOver) {
    initGame();
  }
  basket.x = e.clientX;
});

canvas.addEventListener("pointermove", e => {
  if (!isPlaying || isGameOver) return;
  basket.x = e.clientX;
});

/*************************************************
 * LOOP
 *************************************************/
function update(time) {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#FFDAB9");
  grad.addColorStop(1, "#FFF0F5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying && !isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("LETTER DROP", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Tap to play again", canvas.width / 2, canvas.height / 2 + 60);
    return;
  }

  if (time - lastSpawnTime > 1500 / Math.max(1, speedMult * 0.5)) {
    spawnItem();
    lastSpawnTime = time;
  }

  // Basket Drawer
  ctx.fillStyle = "#8E6E53";
  ctx.beginPath();
  ctx.roundRect(basket.x - basket.w/2, basket.y, basket.w, basket.h, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(basket.x - basket.w/2 + 5, basket.y + 5, basket.w - 10, basket.h - 10);

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, 60);
  ctx.fillStyle = "white";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "left"; ctx.fillText(`Score: ${score}`, 20, 38);
  ctx.textAlign = "right"; ctx.fillText(`Lives: ${lives}`, canvas.width - 20, 38);
  
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFCC00";
  ctx.fillText(`Catch: ${targetChar}`, canvas.width / 2, 38);

  // Update & Draw Items
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += item.vy;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.size, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 30px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.char, item.x, item.y + 2);

    // Catch Logic
    if (item.y + item.size > basket.y && item.y - item.size < basket.y + basket.h) {
      if (item.x > basket.x - basket.w/2 && item.x < basket.x + basket.w/2) {
        if (item.char === targetChar) {
          score += 10;
          speedMult += 0.05;
          createPop(item.x, item.y, item.color);
          speak("Good!");
          if ("vibrate" in navigator) navigator.vibrate(30);
          pickTarget();
        } else {
          lives--;
          if ("vibrate" in navigator) navigator.vibrate(100);
        }
        items.splice(i, 1);
        continue;
      }
    }

    if (item.y > canvas.height + item.size) {
      items.splice(i, 1);
    }
  }

  if (lives <= 0) isGameOver = true;

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

requestAnimationFrame(update);