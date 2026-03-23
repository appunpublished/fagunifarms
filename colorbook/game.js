/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Prevent swipe-down refresh and gestures on mobile browsers globally
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * SPRITES
 *************************************************/
const sprites = {};
function loadSprite(name, src) {
  const img = new Image();
  img.src = src;
  sprites[name] = img;
}

loadSprite("player", "assets/cars/car_yellow.png");
loadSprite("obCar", "assets/obstacles/obstacle_car.png");
loadSprite("obBike", "assets/obstacles/obstacle_bike.png");
loadSprite("obTruck", "assets/obstacles/obstacle_truck.png");
loadSprite("fuel", "assets/items/fuel_can.png");

/*************************************************
 * AUDIO
 *************************************************/
const engineSound = new Audio("assets/audio/engine.mp3");
const crashSound = new Audio("assets/audio/crash.mp3");
const fuelSound = new Audio("assets/audio/fuel.mp3");

engineSound.loop = true;
engineSound.volume = 0.3;
crashSound.volume = 0.6;
fuelSound.volume = 0.5;

/*************************************************
 * GAME STATE
 *************************************************/
const STATE = { PLAY: "play", WIN: "win", LOSE: "lose" };
let gameState = STATE.PLAY;
let loseReason = "";

/*************************************************
 * GAME VARIABLES
 *************************************************/
let obstacles = [];
let fuels = [];
let particles = [];

let speed = 1.5; // Start much slower
let fuel = 100;
let timeAlive = 0;

let score = 0;
let combo = 1;
let nearMissCooldown = 0;

let shakeTime = 0;
let shakeIntensity = 0;

let roadOffset = 0;
let distSinceObstacle = 0;
let distSinceFuel = 0;

/*************************************************
 * PLAYER
 *************************************************/
const car = {
  x: canvas.width / 2,
  y: canvas.height - 180,
  w: 70,
  h: 120,
  hitW: 36,
  hitH: 80,
  hitOffsetY: 30,
  tilt: 0
};

let targetX = car.x;

/*************************************************
 * INPUT
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
  
  // Automatically enter fullscreen on first tap to hide notification/address bars
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(()=>{});
  }
  
  engineSound.play().catch(()=>{});
  if (gameState !== STATE.PLAY) resetGame();
});

/*************************************************
 * HELPERS
 *************************************************/
function carHitbox() {
  const left = car.x - car.hitW / 2;
  const top = car.y + car.hitOffsetY;
  return {
    left,
    right: left + car.hitW,
    top,
    bottom: top + car.hitH
  };
}

function startShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeTime = duration;
}

function createExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      size: Math.random() * 6 + 2
    });
  }
}

/*************************************************
 * SPAWNERS
 *************************************************/
function spawnObstacle(yOffset = 0) {
  if (gameState !== STATE.PLAY) return;

  const types = ["bike", "car", "truck"];
  const type = types[Math.floor(Math.random() * 3)];

  const sizes = {
    bike: { w: 40, h: 90 },
    car: { w: 70, h: 120 },
    truck: { w: 100, h: 160 }
  };

  const base = sizes[type];

  obstacles.push({
    type,
    x: Math.random() * (canvas.width - 160) + 80,
    y: -200 - yOffset,
    ...base,
    hitW: base.w * 0.7,
    hitH: base.h * 0.75,
    vy: Math.random() * 1.5 // Gives traffic slight speed variations
  });
}

function spawnFuel() {
  if (gameState !== STATE.PLAY) return;

  fuels.push({
    x: Math.random() * (canvas.width - 160) + 80,
    y: -120,
    w: 40,
    h: 60,
    bounce: 0
  });
}

/*************************************************
 * DRAWING
 *************************************************/
function drawBackground() {
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, 0, 70, canvas.height);
  ctx.fillRect(canvas.width - 70, 0, 70, canvas.height);

  ctx.fillStyle = "#444";
  ctx.fillRect(70, 0, canvas.width - 140, canvas.height);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 6;
  ctx.setLineDash([30, 30]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = "#fff";
  ctx.font = "20px system-ui";
  ctx.fillText(`⏱ ${Math.floor(timeAlive)}s`, 20, 35);
  ctx.fillText(`⭐ ${Math.floor(score)}`, canvas.width / 2 - 40, 35);
  ctx.fillText(`🔥 x${combo}`, canvas.width / 2 + 50, 35);

  ctx.fillStyle = "#333";
  ctx.fillRect(canvas.width - 160, 18, 130, 20);

  const fc = fuel > 40 ? "#4CAF50" : fuel > 20 ? "#FFC107" : "#F44336";
  ctx.fillStyle = fc;
  ctx.fillRect(canvas.width - 160, 18, fuel * 1.3, 20);
}

/*************************************************
 * MAIN LOOP
 *************************************************/
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (shakeTime > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
    shakeTime--;
  }

  drawBackground();
  drawHUD();

  if (gameState === STATE.PLAY) {
    timeAlive += 1 / 60;
    fuel -= speed * 0.03;
    score += combo * 0.5;
    roadOffset += speed * 3;

    distSinceObstacle += speed;
    distSinceFuel += speed;

    // Dynamically spawn traffic based on speed and distance traveled
    let obThreshold = Math.max(80, 200 - speed * 10);
    if (distSinceObstacle > obThreshold) {
      spawnObstacle();
      // Spawn additional multiple lanes of traffic side-by-side at higher speeds
      if (speed > 4 && Math.random() > 0.5) spawnObstacle(150);
      distSinceObstacle = -Math.random() * 50;
    }

    if (distSinceFuel > 600) {
      spawnFuel();
      distSinceFuel = -Math.random() * 200;
    }

    if (nearMissCooldown > 0) nearMissCooldown--;

    if (fuel <= 0) {
      gameState = STATE.LOSE;
      loseReason = "fuel";
      engineSound.pause();
    }

    if (keys["arrowleft"] || keys["a"]) targetX -= 7;
    if (keys["arrowright"] || keys["d"]) targetX += 7;
    targetX = Math.max(70 + car.w / 2, Math.min(canvas.width - 70 - car.w / 2, targetX));

    const dx = targetX - car.x;
    car.x += dx * 0.1;
    car.tilt = dx * 0.002;

    speed += 0.0015; // Noticeable speed scaling as the game progresses
    engineSound.playbackRate = 1 + speed * 0.02;
  }

  drawCar();
  handleObstacles();
  handleFuel();
  handleParticles();
  drawSpeedLines();

  if (gameState !== STATE.PLAY) drawEndScreen();

  ctx.restore();
  requestAnimationFrame(update);
}

/*************************************************
 * SUB SYSTEMS
 *************************************************/
function drawCar() {
  const img = sprites.player;
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.tilt);
  if (img && img.complete)
    ctx.drawImage(img, -car.w / 2, 0, car.w, car.h);
  ctx.restore();
}

function handleObstacles() {
  const hb = carHitbox();

  obstacles.forEach(o => {
    if (gameState === STATE.PLAY) o.y += speed + (o.vy || 0);

    const img =
      o.type === "bike" ? sprites.obBike :
      o.type === "truck" ? sprites.obTruck :
      sprites.obCar;

    if (img && img.complete)
      ctx.drawImage(img, o.x, o.y, o.w, o.h);

    const obLeft = o.x + (o.w - o.hitW) / 2;
    const obTop = o.y + (o.h - o.hitH) / 2;
    const obRight = obLeft + o.hitW;
    const obBottom = obTop + o.hitH;

    if (
      gameState === STATE.PLAY &&
      obLeft < hb.right &&
      obRight > hb.left &&
      obTop < hb.bottom &&
      obBottom > hb.top
    ) {
      gameState = STATE.LOSE;
      loseReason = "crash";
      engineSound.pause();
      crashSound.play();
      startShake(15, 25);
      createExplosion(car.x, car.y);
    }

    // Near miss bonus
    if (
      gameState === STATE.PLAY &&
      nearMissCooldown <= 0 &&
      o.y > hb.bottom - 20 &&
      o.y < hb.bottom + 20 &&
      Math.abs(o.x - car.x) < 80
    ) {
      score += 50;
      combo++;
      nearMissCooldown = 60;
    }
  });

  obstacles = obstacles.filter(o => o.y < canvas.height + 200);
}

function handleFuel() {
  const hb = carHitbox();

  fuels.forEach(f => {
    if (gameState === STATE.PLAY) {
      f.y += speed;
      f.bounce += 0.1;
    }

    const fy = f.y + Math.sin(f.bounce) * 6;
    if (sprites.fuel.complete)
      ctx.drawImage(sprites.fuel, f.x, fy, f.w, f.h);

    if (
      gameState === STATE.PLAY &&
      f.x < hb.right &&
      f.x + f.w > hb.left &&
      f.y < hb.bottom &&
      f.y + f.h > hb.top
    ) {
      fuel = Math.min(100, fuel + 40);
      f.collected = true;
      fuelSound.play();
    }
  });

  fuels = fuels.filter(f => !f.collected && f.y < canvas.height + 200);
}

function handleParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    ctx.fillStyle = `rgba(255, ${Math.random()*150}, 0, ${p.life/30})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  particles = particles.filter(p => p.life > 0);
}

function drawSpeedLines() {
  if (gameState === STATE.PLAY && speed > 5) {
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    }
  }
}

function drawEndScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "36px system-ui";
  ctx.textAlign = "center";

  const msg =
    loseReason === "fuel" ? "⛽ OUT OF FUEL" :
    loseReason === "crash" ? "💥 CRASHED" :
    "🏁 YOU WIN!";

  ctx.fillText(msg, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px system-ui";
  ctx.fillText("Tap to play again", canvas.width / 2, canvas.height / 2 + 30);
}

function resetGame() {
  obstacles = [];
  fuels = [];
  particles = [];
  speed = 1.5; // Reset to slow starting speed
  fuel = 100;
  timeAlive = 0;
  score = 0;
  combo = 1;
  nearMissCooldown = 0;
  loseReason = "";
  roadOffset = 0;
  distSinceObstacle = 0;
  distSinceFuel = 0;
  keys = {};
  gameState = STATE.PLAY;
  engineSound.currentTime = 0;
  engineSound.play().catch(()=>{});
}

update();
