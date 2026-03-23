/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileSize = 20;
let cols, rows;

let snake = [];
let food = {};
let velocity = { x: 0, y: 0 };
let score = 0;
let gameOver = false;
let lastRenderTime = 0;
const INITIAL_SPEED = 5; // Slow initial speed
let currentSpeed = INITIAL_SPEED; // Frames (moves) per second

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cols = Math.floor(canvas.width / tileSize);
  rows = Math.floor(canvas.height / tileSize);
}
window.addEventListener("resize", resize);
resize();

// Prevent swipe-down refresh and gestures on mobile browsers globally
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * GAME LOGIC
 *************************************************/
function initGame() {
  snake = [
    { x: Math.floor(cols / 2), y: Math.floor(rows / 2) }
  ];
  velocity = { x: 0, y: 0 };
  score = 0;
  currentSpeed = INITIAL_SPEED;
  gameOver = false;
  spawnFood();
  window.requestAnimationFrame(main);
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
  // Prevent food from spawning directly on the snake body
  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      spawnFood();
      return;
    }
  }
}

/*************************************************
 * INPUT HANDLING
 *************************************************/
// Desktop Keyboard
window.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      if (velocity.y === 0) velocity = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
    case "S":
      if (velocity.y === 0) velocity = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      if (velocity.x === 0) velocity = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
    case "D":
      if (velocity.x === 0) velocity = { x: 1, y: 0 };
      break;
  }
  
  // Start moving if game over (restart)
  if (gameOver) initGame();
});

// Mobile Touch / Swipe
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  
  if (gameOver) initGame();
});

canvas.addEventListener("touchend", e => {
  if (gameOver) return;
  
  let touchEndX = e.changedTouches[0].screenX;
  let touchEndY = e.changedTouches[0].screenY;
  
  let dx = touchEndX - touchStartX;
  let dy = touchEndY - touchStartY;
  
  // Threshold for minimum swipe distance
  if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && velocity.x === 0) velocity = { x: 1, y: 0 };
      else if (dx < 0 && velocity.x === 0) velocity = { x: -1, y: 0 };
    } else {
      // Vertical swipe
      if (dy > 0 && velocity.y === 0) velocity = { x: 0, y: 1 };
      else if (dy < 0 && velocity.y === 0) velocity = { x: 0, y: -1 };
    }
  }
});

/*************************************************
 * MAIN GAME LOOP & DRAWING
 *************************************************/
function main(currentTime) {
  if (gameOver) {
    drawGameOver();
    return;
  }

  window.requestAnimationFrame(main);
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  if (secondsSinceLastRender < 1 / currentSpeed) return;

  lastRenderTime = currentTime;

  update();
  draw();
}

function update() {
  if (velocity.x === 0 && velocity.y === 0) return; // Wait for initial input

  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

  // Wall Collision
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    gameOver = true;
    return;
  }

  // Self Collision
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver = true;
      return;
    }
  }

  snake.unshift(head);

  // Food Collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    currentSpeed += 0.5; // Increase speed gradually as the snake grows
    spawnFood();
  } else {
    snake.pop(); // Remove tail segment if no food eaten (to move forward)
  }
}

function draw() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Compute grid offset to center the grid perfectly on-screen
  const offsetX = (canvas.width - cols * tileSize) / 2;
  const offsetY = (canvas.height - rows * tileSize) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Draw Food (Apple)
  ctx.fillStyle = "#FF3B30";
  ctx.beginPath();
  ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw Snake
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#4CAF50" : "#81C784";
    ctx.fillRect(segment.x * tileSize + 1, segment.y * tileSize + 1, tileSize - 2, tileSize - 2);
  });

  ctx.restore();

  // Draw Score Header
  ctx.fillStyle = "white";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 70);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "bold 40px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
  
  ctx.font = "20px system-ui";
  ctx.fillStyle = "#FFD500";
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  
  ctx.fillStyle = "white";
  ctx.fillText("Tap or press any key to restart", canvas.width / 2, canvas.height / 2 + 65);
}

// Initialize game immediately
initGame();