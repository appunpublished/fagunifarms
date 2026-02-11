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

function playCrashSound() {
  crashSound.currentTime = 0;
  crashSound.play();
  if (navigator.vibrate) navigator.vibrate(200);
}

function playFuelSound() {
  fuelSound.currentTime = 0;
  fuelSound.play();
}

/*************************************************
 * GAME STATES
 *************************************************/
const STATE = { PLAY: "play", WIN: "win", LOSE: "lose" };
let gameState = STATE.PLAY;
let loseReason = "";

/*************************************************
 * GAME DATA
 *************************************************/
let obstacles = [];
let fuels = [];
let speed = 3;
let fuel = 100;
let timeAlive = 0;

/*************************************************
 * PLAYER CAR
 *************************************************/
const car = {
  x: canvas.width / 2,
  y: canvas.height - 180,

  w: 70,
  h: 120,

  hitW: 36,
  hitH: 80,
  hitOffsetX: 0,
  hitOffsetY: 30,

  tilt: 0
};

let targetX = car.x;

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointermove", e => {
  if (gameState !== STATE.PLAY) return;
  targetX = e.clientX;
});

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();

  // Start engine on first interaction
  engineSound.play().catch(() => {});

  if (gameState !== STATE.PLAY) {
    resetGame();
  }
});

/*************************************************
 * HITBOX HELPERS
 *************************************************/
function carHitbox() {
  const left = car.x - car.hitW / 2 + car.hitOffsetX;
  const top = car.y + car.hitOffsetY;

  return {
    left,
    right: left + car.hitW,
    top,
    bottom: top + car.hitH
  };
}

/*************************************************
 * SPAWNERS
 *************************************************/
function spawnObstacle() {
  if (gameState !== STATE.PLAY) return;

  const r = Math.random();
  let type = r < 0.33 ? "bike" : r < 0.66 ? "truck" : "car";

  const sizes = {
    bike: { w: 40, h: 90 },
    car: { w: 70, h: 120 },
    truck: { w: 100, h: 160 }
  };

  const base = sizes[type];

  obstacles.push({
    type,
    x: Math.random() * (canvas.width - 160) + 80,
    y: -200,
    ...base,

    // Tight obstacle hitbox
    hitW: base.w * 0.7,
    hitH: base.h * 0.75
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

setInterval(spawnObstacle, 1500);
setInterval(spawnFuel, 4200);

/*************************************************
 * BACKGROUND
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

/*************************************************
 * HUD
 *************************************************/
function drawHUD() {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 60);

  ctx.fillStyle = "#fff";
  ctx.font = "22px system-ui";
  ctx.fillText(`⏱️ ${Math.floor(timeAlive)}s`, 20, 38);

  ctx.fillStyle = "#333";
  ctx.fillRect(canvas.width - 160, 18, 130, 24);

  const fc = fuel > 40 ? "#4CAF50" : fuel > 20 ? "#FFC107" : "#F44336";
  ctx.fillStyle = fc;
  ctx.fillRect(canvas.width - 160, 18, fuel * 1.3, 24);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(canvas.width - 160, 18, 130, 24);
}

/*************************************************
 * DRAW CAR
 *************************************************/
function drawCar() {
  const img = sprites.player;

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.tilt);

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, car.h - 10, car.w / 2, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img && img.complete) {
    ctx.drawImage(img, -car.w / 2, 0, car.w, car.h);
  }

  ctx.restore();
}

/*************************************************
 * MAIN LOOP
 *************************************************/
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawHUD();

  if (gameState === STATE.PLAY) {
    timeAlive += 1 / 60;
    fuel -= speed * 0.03;

    if (fuel <= 0) {
      gameState = STATE.LOSE;
      loseReason = "fuel";
      engineSound.pause();
    }

    if (timeAlive >= 60) {
      gameState = STATE.WIN;
      engineSound.pause();
    }

    const dx = targetX - car.x;
    car.x += dx * 0.1;
    car.tilt = dx * 0.002;

    // Engine pitch increases slightly with speed
    engineSound.playbackRate = 1 + speed * 0.02;
  }

  drawCar();

  const hb = carHitbox();

  obstacles.forEach(o => {
    if (gameState === STATE.PLAY) o.y += speed;

    const img =
      o.type === "bike" ? sprites.obBike :
      o.type === "truck" ? sprites.obTruck :
      sprites.obCar;

    if (img && img.complete) {
      ctx.drawImage(img, o.x, o.y, o.w, o.h);
    }

    // Accurate collision using obstacle hitbox
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
      playCrashSound();
    }
  });

  fuels.forEach(f => {
    if (gameState === STATE.PLAY) {
      f.y += speed;
      f.bounce += 0.1;
    }

    const fy = f.y + Math.sin(f.bounce) * 6;
    const img = sprites.fuel;

    if (img && img.complete) {
      ctx.drawImage(img, f.x, fy, f.w, f.h);
    }

    if (
      gameState === STATE.PLAY &&
      f.x < hb.right &&
      f.x + f.w > hb.left &&
      f.y < hb.bottom &&
      f.y + f.h > hb.top
    ) {
      fuel = Math.min(100, fuel + 40);
      f.collected = true;
      playFuelSound();
    }
  });

  obstacles = obstacles.filter(o => o.y < canvas.height + 200);
  fuels = fuels.filter(f => f.y < canvas.height + 200 && !f.collected);

  if (gameState === STATE.PLAY) speed += 0.0005;
  if (gameState !== STATE.PLAY) drawEndScreen();

  requestAnimationFrame(update);
}

/*************************************************
 * END SCREEN
 *************************************************/
function drawEndScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff";
  ctx.font = "36px system-ui";
  ctx.textAlign = "center";

  const msg =
    gameState === STATE.WIN
      ? "🏁 YOU WIN!"
      : loseReason === "fuel"
      ? "⛽ OUT OF FUEL"
      : "💥 CRASHED";

  ctx.fillText(msg, canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px system-ui";
  ctx.fillText("Tap to play again", canvas.width / 2, canvas.height / 2 + 30);
}

/*************************************************
 * RESET
 *************************************************/
function resetGame() {
  obstacles = [];
  fuels = [];
  speed = 3;
  fuel = 100;
  timeAlive = 0;
  loseReason = "";
  gameState = STATE.PLAY;
  engineSound.currentTime = 0;
  engineSound.play().catch(() => {});
}

/*************************************************
 * START
 *************************************************/
update();
