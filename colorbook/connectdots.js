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

let dots = [];
let currentDot = 0;
let isDrawing = false;
let currentX = 0;
let currentY = 0;
let isGameOver = false;

function initGame() {
  dots = [];
  currentDot = 0;
  isGameOver = false;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.35;
  const numDots = 10;

  // Generate a Star Shape
  for (let i = 0; i < numDots; i++) {
    const angle = (i * Math.PI * 2) / numDots - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius * 0.4;
    dots.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      label: (i + 1).toString(),
      connected: false
    });
  }
}

canvas.addEventListener("pointerdown", e => {
  if (isGameOver) {
    initGame();
    return;
  }
  isDrawing = true;
  currentX = e.clientX;
  currentY = e.clientY;
  checkDot(currentX, currentY);
});

canvas.addEventListener("pointermove", e => {
  if (!isDrawing || isGameOver) return;
  currentX = e.clientX;
  currentY = e.clientY;
  checkDot(currentX, currentY);
});

canvas.addEventListener("pointerup", () => isDrawing = false);
canvas.addEventListener("pointercancel", () => isDrawing = false);

function checkDot(x, y) {
  if (currentDot >= dots.length) return;
  const dot = dots[currentDot];
  const dist = Math.hypot(x - dot.x, y - dot.y);
  
  if (dist < 40) { // Hit radius
    dot.connected = true;
    currentDot++;
    if ("vibrate" in navigator) navigator.vibrate(30);
    
    if (currentDot === dots.length) {
      isGameOver = true;
      if ("vibrate" in navigator) navigator.vibrate([50, 50, 50]);
    }
  }
}

function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFDE7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw lines
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#007AFF";

  ctx.beginPath();
  for (let i = 0; i < currentDot; i++) {
    if (i === 0) ctx.moveTo(dots[i].x, dots[i].y);
    else ctx.lineTo(dots[i].x, dots[i].y);
  }
  
  if (isGameOver) {
    ctx.lineTo(dots[0].x, dots[0].y); // Close shape
    ctx.stroke();
    ctx.fillStyle = "#FFD500";
    ctx.fill();
  } else {
    ctx.stroke();
    // Draw active drag line
    if (isDrawing && currentDot > 0 && currentDot < dots.length) {
      ctx.beginPath();
      ctx.moveTo(dots[currentDot - 1].x, dots[currentDot - 1].y);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "rgba(0, 122, 255, 0.4)";
      ctx.stroke();
    }
  }

  // Draw dots
  if (!isGameOver) {
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    dots.forEach((dot, i) => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = dot.connected ? "#34C759" : "#FF3B30";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.fillText(dot.label, dot.x, dot.y + 1);
    });
  }
}
initGame();
update();