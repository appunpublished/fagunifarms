/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateButtons();
}
window.addEventListener("resize", resize);

// Prevent swipe-down refresh and gestures on mobile browsers globally
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * GAME STATE
 *************************************************/
let player, camera, platforms, enemies, coins, particles, flag;
let score = 0;
let isGameOver = false;
let isWin = false;
let isPlaying = false;

// Controls
let keys = {};
let touchControls = { left: false, right: false, jump: false };
let btnLeft = {}, btnRight = {}, btnJump = {};

function updateButtons() {
  const btnSize = 70;
  const margin = 20;
  btnLeft = { x: margin, y: canvas.height - margin - btnSize, w: btnSize, h: btnSize };
  btnRight = { x: margin + btnSize + 20, y: canvas.height - margin - btnSize, w: btnSize, h: btnSize };
  btnJump = { x: canvas.width - margin - btnSize, y: canvas.height - margin - btnSize, w: btnSize, h: btnSize };
}

function initGame() {
  isPlaying = true;
  isGameOver = false;
  isWin = false;
  score = 0;
  camera = { x: 0 };
  particles = [];

  player = {
    x: 100,
    y: canvas.height - 200,
    w: 30,
    h: 40,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: -13,
    isGrounded: false,
    emoji: "🏃"
  };

  platforms = [
    { x: -500, y: canvas.height - 50, w: 1500, h: 100 },
    { x: 1200, y: canvas.height - 50, w: 800, h: 100 },
    { x: 2200, y: canvas.height - 50, w: 2000, h: 100 },
    { x: 500, y: canvas.height - 180, w: 120, h: 30 },
    { x: 800, y: canvas.height - 250, w: 120, h: 30 },
    { x: 1500, y: canvas.height - 200, w: 150, h: 30 },
    { x: 1800, y: canvas.height - 300, w: 150, h: 30 },
    { x: 2500, y: canvas.height - 150, w: 100, h: 30 },
    { x: 2700, y: canvas.height - 250, w: 100, h: 30 },
    { x: 2900, y: canvas.height - 350, w: 100, h: 30 }
  ];

  coins = [
    { x: 550, y: canvas.height - 220, w: 30, h: 30, collected: false },
    { x: 850, y: canvas.height - 290, w: 30, h: 30, collected: false },
    { x: 1550, y: canvas.height - 240, w: 30, h: 30, collected: false },
    { x: 1850, y: canvas.height - 340, w: 30, h: 30, collected: false },
    { x: 2935, y: canvas.height - 390, w: 30, h: 30, collected: false }
  ];

  enemies = [
    { x: 700, y: canvas.height - 90, w: 35, h: 35, vx: -1.5, dead: false, emoji: "🍄" },
    { x: 1400, y: canvas.height - 90, w: 35, h: 35, vx: -2, dead: false, emoji: "🐢" },
    { x: 2400, y: canvas.height - 90, w: 35, h: 35, vx: -1, dead: false, emoji: "🍄" },
    { x: 2600, y: canvas.height - 90, w: 35, h: 35, vx: -2, dead: false, emoji: "🐢" }
  ];

  flag = { x: 3800, y: canvas.height - 350, w: 10, h: 300 };
}

/*************************************************
 * INPUT HANDLING
 *************************************************/
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function checkPointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function handleTouch(e) {
  if (!isPlaying || isGameOver || isWin) return;
  
  touchControls.left = false;
  touchControls.right = false;
  touchControls.jump = false;
  
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i];
    if (checkPointInRect(t.clientX, t.clientY, btnLeft)) touchControls.left = true;
    if (checkPointInRect(t.clientX, t.clientY, btnRight)) touchControls.right = true;
    if (checkPointInRect(t.clientX, t.clientY, btnJump)) touchControls.jump = true;
  }
}

canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });

canvas.addEventListener("pointerdown", e => {
  if (!isPlaying || isGameOver || isWin) {
    initGame();
    return;
  }
  // Fallback for mouse
  if (e.pointerType === "mouse") {
    if (checkPointInRect(e.clientX, e.clientY, btnLeft)) touchControls.left = true;
    if (checkPointInRect(e.clientX, e.clientY, btnRight)) touchControls.right = true;
    if (checkPointInRect(e.clientX, e.clientY, btnJump)) touchControls.jump = true;
  }
});

canvas.addEventListener("pointerup", e => {
  if (e.pointerType === "mouse") {
    touchControls.left = false;
    touchControls.right = false;
    touchControls.jump = false;
  }
});

/*************************************************
 * GAME LOOP & PHYSICS
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Sky & Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#87CEEB");
  grad.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying) {
    drawMessage("PLATFORM ADVENTURE", "Tap to Start");
    return;
  }

  if (isGameOver) {
    drawMessage("GAME OVER", "Tap to Try Again");
    return;
  }

  if (isWin) {
    drawMessage("LEVEL CLEARED!", `Final Score: ${score}`);
    return;
  }

  handleInput();
  applyPhysics();
  updateCamera();

  ctx.save();
  ctx.translate(-camera.x, 0);

  drawLevel();
  drawEnemies();
  drawPlayer();
  drawParticles();

  ctx.restore();

  drawHUD();
  drawControls();
}

function handleInput() {
  player.vx = 0;
  if (keys["arrowleft"] || keys["a"] || touchControls.left) player.vx = -player.speed;
  if (keys["arrowright"] || keys["d"] || touchControls.right) player.vx = player.speed;

  if ((keys["arrowup"] || keys["w"] || keys[" "] || touchControls.jump) && player.isGrounded) {
    player.vy = player.jumpPower;
    player.isGrounded = false;
    if ("vibrate" in navigator) navigator.vibrate(20);
  }
}

function applyPhysics() {
  player.vy += 0.6; // Gravity
  player.vy = Math.min(player.vy, 15); // Terminal velocity

  // Move X & Resolve Collisions
  player.x += player.vx;
  let hitPlatform = getCollidingPlatform(player);
  if (hitPlatform) {
    if (player.vx > 0) player.x = hitPlatform.x - player.w;
    else if (player.vx < 0) player.x = hitPlatform.x + hitPlatform.w;
  }

  // Move Y & Resolve Collisions
  player.y += player.vy;
  player.isGrounded = false;
  hitPlatform = getCollidingPlatform(player);
  
  if (hitPlatform) {
    if (player.vy > 0) {
      player.y = hitPlatform.y - player.h;
      player.isGrounded = true;
      player.vy = 0;
    } else if (player.vy < 0) {
      player.y = hitPlatform.y + hitPlatform.h;
      player.vy = 0;
    }
  }

  // Fall out of bounds
  if (player.y > canvas.height + 100) {
    isGameOver = true;
    if ("vibrate" in navigator) navigator.vibrate(100);
  }

  // Coins Collision
  coins.forEach(c => {
    if (!c.collected && checkRectCollision(player, c)) {
      c.collected = true;
      score += 100;
      createPop(c.x + c.w/2, c.y + c.h/2, "#FFCC00");
      if ("vibrate" in navigator) navigator.vibrate(30);
    }
  });

  // Enemy Collision
  enemies.forEach(e => {
    if (e.dead) return;
    
    // Basic enemy patrol
    e.vy = (e.vy || 0) + 0.6;
    e.y += e.vy;
    let ePlatform = getCollidingPlatform(e);
    if (ePlatform && e.vy > 0) {
      e.y = ePlatform.y - e.h;
      e.vy = 0;
    }
    e.x += e.vx;
    
    if (checkRectCollision(player, e)) {
      if (player.vy > 0 && player.y + player.h < e.y + e.h / 2 + 10) {
        // Stomped on enemy
        e.dead = true;
        player.vy = player.jumpPower * 0.8; // Small bounce
        score += 200;
        createPop(e.x + e.w/2, e.y + e.h/2, "#FF3B30");
        if ("vibrate" in navigator) navigator.vibrate([20, 20]);
      } else {
        // Took damage
        isGameOver = true;
        if ("vibrate" in navigator) navigator.vibrate(100);
      }
    }
  });

  // Level Complete Flag
  if (checkRectCollision(player, flag)) {
    isWin = true;
    score += 1000;
    if ("vibrate" in navigator) navigator.vibrate([50, 50, 50]);
  }
}

function updateCamera() {
  const targetCamX = player.x - canvas.width / 3;
  camera.x += (targetCamX - camera.x) * 0.1;
  camera.x = Math.max(0, camera.x); // Prevent reversing camera past the start line
}

function getCollidingPlatform(rect) {
  for (let p of platforms) {
    if (checkRectCollision(rect, p)) return p;
  }
  return null;
}

function checkRectCollision(r1, r2) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

function createPop(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
      life: 30, color, size: Math.random() * 4 + 2
    });
  }
}

/*************************************************
 * DRAWING FUNCTIONS
 *************************************************/
function drawLevel() {
  // Platforms
  platforms.forEach(p => {
    ctx.fillStyle = "#8E6E53"; // Dirt
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#4CAF50"; // Grass topping
    ctx.fillRect(p.x, p.y, p.w, 10);
  });

  // Coins
  ctx.font = "24px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  coins.forEach(c => {
    if (!c.collected) ctx.fillText("🪙", c.x + c.w/2, c.y + c.h/2);
  });

  // Flag Pole
  ctx.fillStyle = "#CCC";
  ctx.fillRect(flag.x, flag.y, flag.w, flag.h);
  ctx.fillStyle = "#FF3B30";
  ctx.beginPath();
  ctx.moveTo(flag.x + flag.w, flag.y);
  ctx.lineTo(flag.x + flag.w + 60, flag.y + 30);
  ctx.lineTo(flag.x + flag.w, flag.y + 60);
  ctx.fill();
}

function drawEnemies() {
  ctx.font = "30px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  enemies.forEach(e => {
    if (!e.dead) ctx.fillText(e.emoji, e.x + e.w/2, e.y + e.h/2);
  });
}

function drawPlayer() {
  ctx.font = "40px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  if (player.vx < 0) ctx.scale(-1, 1);
  ctx.fillText(player.emoji, 0, 0);
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1.0;
  particles = particles.filter(p => p.life > 0);
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, 50);
  ctx.fillStyle = "white";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`Score: ${score}`, 20, 32);
}

function drawControls() {
  // Render touch controls (ideal for mobile layout)
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  
  const drawBtn = (b, text) => {
    ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 15);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, b.x + b.w/2, b.y + b.h/2);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
  };

  drawBtn(btnLeft, "◀");
  drawBtn(btnRight, "▶");
  drawBtn(btnJump, "▲");
}

function drawMessage(title, subtitle) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "bold 40px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px system-ui";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20);
}

// Start the setup
resize();
requestAnimationFrame(update);