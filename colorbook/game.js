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
  img.onload = () => console.log("Loaded:", src);
  img.onerror = () => console.error("FAILED:", src);
  sprites[name] = img;
}

loadSprite("player", "assets/cars/car_yellow.png");
loadSprite("obCar", "assets/obstacles/obstacle_car.png");
loadSprite("obBike", "assets/obstacles/obstacle_bike.png");
loadSprite("obTruck", "assets/obstacles/obstacle_truck.png");
loadSprite("fuel", "assets/items/fuel_can.png");

/*************************************************
 * GAME STATES
 *************************************************/
const STATE = {
  PLAY: "play",
  WIN: "win",
  LOSE: "lose"
};

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
 * CAR
 *************************************************/
const car = {
  x: canvas.width / 2,
  y: canvas.height - 180,
  w: 70,
  h: 120,
  tilt: 0
};

let targetX = car.x;

/*************************************************
 * INPUT (BULLETPROOF)
 *************************************************/
canvas.addEventListener("pointermove", e => {
  if (gameState !== STATE.PLAY) return;
  targetX = e.clientX;
});

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (gameState !== STATE.PLAY) {
    resetGame();
  }
});

/*************************************************
 * SPAWNERS (STATE-AWARE)
 *************************************************/
function spawnObstacle() {
  if (gameState !== STATE.PLAY) return;

  const r = Math.random();
  let type = "car";

  if (r < 0.33) type = "bike";
  else if (r < 0.66) type = "truck";

  const sizes = {
    bike: { w: 40, h: 90 },
    car: { w: 70, h: 120 },
    truck: { w: 100, h: 160 }
  };

  obstacles.push({
    type,
    x: Math.random() * (canvas.width - 160) + 80,
    y: -200,
    ...sizes[type]
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
 * DRAW BACKGROUND
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
  } else {
    ctx.fillStyle = "red";
    ctx.fillRect(-car.w / 2, 0, car.w, car.h);
  }

  ctx.restore();
}

/*************************************************
 * MAIN LOOP (NEVER STOPS)
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
    }

    if (timeAlive >= 60) {
      gameState = STATE.WIN;
    }

    const dx = targetX - car.x;
    car.x += dx * 0.1;
    car.tilt = dx * 0.002;
  }

  drawCar();

  obstacles.forEach(o => {
    if (gameState === STATE.PLAY) o.y += speed;

    const img =
      o.type === "bike" ? sprites.obBike :
      o.type === "truck" ? sprites.obTruck :
      sprites.obCar;

    if (img && img.complete) {
      ctx.drawImage(img, o.x, o.y, o.w, o.h);
    } else {
      ctx.fillStyle = "#2196F3";
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    if (
      gameState === STATE.PLAY &&
      o.x < car.x + car.w / 2 &&
      o.x + o.w > car.x - car.w / 2 &&
      o.y < car.y + car.h &&
      o.y + o.h > car.y
    ) {
      gameState = STATE.LOSE;
      loseReason = "crash";
    }
  });

  fuels.forEach(f => {
    if (gameState === STATE.PLAY) {
      f.y += speed;
      f.bounce += 0.1;
    }

    const img = sprites.fuel;
    const fy = f.y + Math.sin(f.bounce) * 6;

    if (img && img.complete) {
      ctx.drawImage(img, f.x, fy, f.w, f.h);
    } else {
      ctx.fillStyle = "#FFD600";
      ctx.fillRect(f.x, fy, f.w, f.h);
    }

    if (
      gameState === STATE.PLAY &&
      f.x < car.x + car.w / 2 &&
      f.x + f.w > car.x - car.w / 2 &&
      f.y < car.y + car.h &&
      f.y + f.h > car.y
    ) {
      fuel = Math.min(100, fuel + 40);
      f.collected = true;
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
}

/*************************************************
 * START
 *************************************************/
update();
