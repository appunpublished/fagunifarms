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
 * GAME VARIABLES & STATE
 *************************************************/
const STATE = { PLAY: "play", LOSE: "lose" };
let gameState = STATE.PLAY;

let speed = 2; // Starting space speed
let score = 0;
let distance = 0;
let distSinceObstacle = 0;

let stars = [];
let obstacles = [];
let particles = [];
let lasers = [];
let shootCooldown = 0;
let isPointerDown = false;

/*************************************************
 * PLAYER
 *************************************************/
const ship = {
  x: canvas.width / 2,
  y: canvas.height - 120,
  size: 40, // hit radius
  emoji: "🚀",
  tilt: 0
};

let targetX = ship.x;

/*************************************************
 * INPUT HANDLING
 *************************************************/
let keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("pointermove", e => {
  if (gameState !== STATE.PLAY) return;
  targetX = e.clientX;
});

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  isPointerDown = true;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  if (gameState !== STATE.PLAY) resetGame();
});

canvas.addEventListener("pointerup", e => {
  isPointerDown = false;
});

canvas.addEventListener("pointercancel", e => {
  isPointerDown = false;
});

/*************************************************
 * INITIALIZATION
 *************************************************/
function initStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedMultiplier: Math.random() * 0.8 + 0.2
    });
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 40; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 40,
      size: Math.random() * 5 + 2,
      color: Math.random() > 0.5 ? "#FF3B30" : "#FF9500" // Red or Orange
    });
  }
}

/*************************************************
 * SPAWNERS
 *************************************************/
function spawnObstacle() {
  const isEnemy = Math.random() > 0.6; // 40% chance of enemy ship, 60% asteroid
  
  obstacles.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: -50,
    emoji: isEnemy ? "🛸" : "☄️",
    size: isEnemy ? 35 : 45, // hit radius
    vy: isEnemy ? Math.random() * 2 + 1 : 0, // Enemies move slightly faster than space
    spin: 0,
    spinSpeed: isEnemy ? 0 : (Math.random() - 0.5) * 0.1 // Asteroids rotate
  });
}

/*************************************************
 * DRAWING FUNCTIONS
 *************************************************/
function drawStars() {
  ctx.fillStyle = "#0b0c10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  stars.forEach(star => {
    if (gameState === STATE.PLAY) {
      star.y += speed * star.speedMultiplier * 5; // Stars move very fast to simulate hyperspace
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHUD() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = "white";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${Math.floor(score)}`, 20, 38);
  
  ctx.textAlign = "right";
  ctx.fillText(`Speed: ${Math.floor(speed * 10)}`, canvas.width - 20, 38);
}

function drawEndScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 40px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("MISSION FAILED", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "20px system-ui";
  ctx.fillStyle = "#FFCC00";
  ctx.fillText(`Final Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 20);
  
  ctx.fillStyle = "white";
  ctx.fillText("Tap to launch again", canvas.width / 2, canvas.height / 2 + 65);
}

/*************************************************
 * MAIN GAME LOOP
 *************************************************/
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawStars();
  
  if (gameState === STATE.PLAY) {
    score += speed * 0.1;
    distance += speed;
    distSinceObstacle += speed;
    
    // Increase difficulty gradually
    speed += 0.002;

    // Dynamic Spawning based on speed
    let obThreshold = Math.max(50, 150 - speed * 8);
    if (distSinceObstacle > obThreshold) {
      spawnObstacle();
      // Double spawn chance at high speeds
      if (speed > 5 && Math.random() > 0.6) spawnObstacle();
      distSinceObstacle = 0;
    }

    // Keyboard horizontal movement
    if (keys["arrowleft"] || keys["a"]) targetX -= 8;
    if (keys["arrowright"] || keys["d"]) targetX += 8;
    
    // Clamp target to screen
    targetX = Math.max(ship.size, Math.min(canvas.width - ship.size, targetX));

    // Smooth horizontal moving
    const dx = targetX - ship.x;
    ship.x += dx * 0.15;
    ship.tilt = dx * 0.005; // Tilt ship when moving sideways

    // Shooting
    if (keys[" "] || isPointerDown) {
      if (shootCooldown <= 0) shoot();
    }
    if (shootCooldown > 0) shootCooldown--;
  }

  drawShip();
  handleLasers();
  handleObstacles();
  handleParticles();
  drawHUD();

  if (gameState !== STATE.PLAY) drawEndScreen();

  requestAnimationFrame(update);
}

/*************************************************
 * ENTITY LOGIC
 *************************************************/
function drawShip() {
  if (gameState !== STATE.PLAY) return; // Don't draw ship if dead
  
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.tilt);
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ship.emoji, 0, 0);
  ctx.restore();
}

function shoot() {
  lasers.push({
    x: ship.x,
    y: ship.y - 20,
    vy: -15,
    width: 4,
    height: 20,
    color: "#00FF00"
  });
  shootCooldown = 15; // Fire rate cooldown
}

function handleLasers() {
  lasers.forEach(l => {
    if (gameState === STATE.PLAY) {
      l.y += l.vy;
    }

    ctx.fillStyle = l.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = l.color;
    ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
    ctx.shadowBlur = 0;

    // Collision detection with obstacles
    if (gameState === STATE.PLAY) {
      obstacles.forEach(o => {
        if (o.dead) return;
        const dist = Math.hypot(l.x - o.x, l.y - o.y);
        if (dist < o.size / 2 + l.height / 2) {
          o.dead = true;
          l.dead = true;
          createExplosion(o.x, o.y);
          score += 50; // Bonus score for destroying obstacle
        }
      });
    }
  });

  // Clean up off-screen and dead lasers
  lasers = lasers.filter(l => !l.dead && l.y > -50);
}

function handleObstacles() {
  obstacles.forEach(o => {
    if (o.dead) return;
    if (gameState === STATE.PLAY) {
      o.y += speed * 3 + o.vy;
      o.spin += o.spinSpeed;
    }

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.spin);
    ctx.font = o.size === 45 ? "60px Arial" : "50px Arial"; // Asteroids slightly bigger visually
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.emoji, 0, 0);
    ctx.restore();

    // Collision detection (Circle based)
    if (gameState === STATE.PLAY) {
      const dist = Math.hypot(ship.x - o.x, ship.y - o.y);
      if (dist < ship.size / 2 + o.size / 2) {
        gameState = STATE.LOSE;
        createExplosion(ship.x, ship.y);
      }
    }
  });

  // Clean up off-screen and dead obstacles
  obstacles = obstacles.filter(o => !o.dead && o.y < canvas.height + 100);
}

function handleParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  
  particles = particles.filter(p => p.life > 0);
}

function resetGame() {
  obstacles = [];
  particles = [];
  lasers = [];
  shootCooldown = 0;
  speed = 2;
  score = 0;
  distance = 0;
  distSinceObstacle = 0;
  keys = {};
  ship.x = canvas.width / 2;
  targetX = ship.x;
  gameState = STATE.PLAY;
}

// Start the game
initStars();
update();