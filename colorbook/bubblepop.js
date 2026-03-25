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

// Prevent swipe-down refresh and gestures on mobile browsers globally
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * GAME STATE
 *************************************************/
let bubbles = [];
let particles = [];
let score = 0;
let targetCharacter = "";
let possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
let lastSpawnTime = 0;
let isPlaying = false;
let isGameOver = false;
let lives = 3;

/*************************************************
 * SPEECH UTILS
 *************************************************/
function speakPrompt(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  utterance.pitch = 1.2;
  window.speechSynthesis.speak(utterance);
}

function pickNewTarget() {
  const onScreenChars = bubbles.map(b => b.char);
  if (onScreenChars.length > 0 && Math.random() > 0.3) {
    // 70% chance to pick something already on screen to keep the game moving
    targetCharacter = onScreenChars[Math.floor(Math.random() * onScreenChars.length)];
  } else {
    targetCharacter = possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)];
  }
  speakPrompt(`Pop the ${targetCharacter}`);
}

/*************************************************
 * ENTITIES
 *************************************************/
function spawnBubble() {
  const radius = Math.random() * 20 + 35; // Size between 35 and 55
  const baseX = Math.random() * (canvas.width - radius * 2) + radius;
  const y = canvas.height + radius;
  
  const char = possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)];
  const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#4CAF50", "#5AC8FA", "#007AFF", "#5856D6", "#FF2D55"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  bubbles.push({
    baseX, x: baseX, y, radius, char, color,
    vy: -(Math.random() * 1.5 + 1), // Move up
    wobbleOffset: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.002 + 0.001
  });
  
  // Make sure a target exists
  if (!targetCharacter) pickNewTarget();
}

function createPop(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 30,
      size: Math.random() * 5 + 2,
      color: color
    });
  }
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying || isGameOver) {
    isPlaying = true;
    isGameOver = false;
    score = 0;
    lives = 3;
    bubbles = [];
    particles = [];
    pickNewTarget();
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  
  // Check collisions from top-most bubble to bottom-most
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    const dist = Math.hypot(px - b.x, py - b.y);
    if (dist <= b.radius) {
      if (b.char === targetCharacter || b.char.toLowerCase() === targetCharacter.toLowerCase()) {
        score += 10;
        createPop(b.x, b.y, b.color);
        bubbles.splice(i, 1);
        setTimeout(pickNewTarget, 600); // Give a slight pause before next prompt
      } else {
        // Tapped wrong bubble
        lives--;
        if (lives <= 0) {
          isGameOver = true;
          isPlaying = false;
        }
        if ("vibrate" in navigator) navigator.vibrate(50);
      }
      break; // Only interact with the top-most bubble clicked
    }
  }
});

/*************************************************
 * LOOP
 *************************************************/
function update(time) {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#87CEEB"); // Sky blue
  grad.addColorStop(1, "#E0F7FA"); // Lighter blue
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying && !isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("BUBBLE POP", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  // Spawner
  if (time - lastSpawnTime > 1200) {
    spawnBubble();
    lastSpawnTime = time;
  }

  // Draw HUD
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = "white";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 38);

  ctx.textAlign = "center";
  ctx.fillText(`Find: ${targetCharacter}`, canvas.width / 2, 38);

  ctx.textAlign = "right";
  ctx.fillText(`Lives: ${lives}`, canvas.width - 20, 38);

  // Update & Draw Bubbles
  bubbles.forEach(b => {
    b.y += b.vy;
    b.x = b.baseX + Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * 15;

    // Draw Bubble Outline
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = b.color;
    ctx.stroke();

    // Bubble Shine
    ctx.beginPath();
    ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    // Bubble Text
    ctx.fillStyle = "#333";
    ctx.font = `bold ${b.radius}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.char, b.x, b.y + 4);
  });

  // Clean up offscreen bubbles & check for misses
  bubbles = bubbles.filter(b => {
    if (b.y < -b.radius * 2) {
      if (b.char.toLowerCase() === targetCharacter.toLowerCase()) {
        lives--;
        if (lives <= 0) {
          isGameOver = true;
          isPlaying = false;
        }
      }
      return false;
    }
    return true;
  });

  // Occasionally force the target character to spawn if it's missing
  if (bubbles.length > 4 && !bubbles.some(b => b.char === targetCharacter)) {
    bubbles[Math.floor(Math.random() * bubbles.length)].char = targetCharacter;
  }

  // Draw Particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  particles = particles.filter(p => p.life > 0);

  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 20);
  }
}

requestAnimationFrame(update);