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
let currentLevel = 0;
const MAX_LEVELS = 14;
let fillColor = "#FFD500";

function initGame() {
  dots = [];
  currentDot = 0;
  isGameOver = false;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.35;

  if (currentLevel === 0) {
    // Star
    fillColor = "#FFD500";
    const numDots = 10;
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
  } else if (currentLevel === 1) {
    // House
    fillColor = "#FF9500";
    const s = radius * 0.8;
    dots = [
      { x: centerX, y: centerY - s, label: "1", connected: false },
      { x: centerX + s, y: centerY - s * 0.2, label: "2", connected: false },
      { x: centerX + s, y: centerY + s, label: "3", connected: false },
      { x: centerX - s, y: centerY + s, label: "4", connected: false },
      { x: centerX - s, y: centerY - s * 0.2, label: "5", connected: false }
    ];
  } else if (currentLevel === 2) {
    // Hexagon
    fillColor = "#34C759";
    const numDots = 6;
    for (let i = 0; i < numDots; i++) {
      const angle = (i * Math.PI * 2) / numDots - Math.PI / 2;
      dots.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: (i + 1).toString(),
        connected: false
      });
    }
  } else if (currentLevel === 3) {
    // Heart
    fillColor = "#FF2D55";
    const numDots = 12;
    for (let i = 0; i < numDots; i++) {
      const t = (i * Math.PI * 2) / numDots + Math.PI; // Start offset at bottom tip
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      dots.push({
        x: centerX - hx * (radius / 18),
        y: centerY + hy * (radius / 18),
        label: (i + 1).toString(),
        connected: false
      });
    }
  } else {
    // 10 Extra Custom Shapes
    const shapeDefs = [
      { // 4: Cat
        color: "#AF52DE",
        pts: [[-0.6, -0.8], [-0.2, -0.4], [0.2, -0.4], [0.6, -0.8], [0.8, -0.1], [0.5, 0.6], [0, 0.8], [-0.5, 0.6], [-0.8, -0.1]]
      },
      { // 5: Dog
        color: "#8E6E53",
        pts: [[-0.4, -0.6], [0.1, -0.6], [0.5, -0.2], [0.9, -0.1], [0.9, 0.2], [0.4, 0.4], [0.2, 0.8], [-0.3, 0.8], [-0.2, 0.2], [-0.6, 0.4], [-0.8, 0], [-0.5, -0.4]]
      },
      { // 6: Elephant
        color: "#5AC8FA",
        pts: [[-0.5, -0.4], [0.4, -0.4], [0.7, -0.1], [0.7, 0.3], [0.8, 0.7], [0.5, 0.7], [0.5, 0.3], [0.1, 0.3], [0.1, 0.7], [-0.2, 0.7], [-0.2, 0.3], [-0.5, 0.3], [-0.8, 0.6], [-0.9, 0.4], [-0.6, 0.1], [-0.6, -0.2]]
      },
      { // 7: Fish
        color: "#FF9500",
        pts: [[-0.8, 0], [-0.4, -0.5], [0.2, -0.6], [0.6, -0.2], [0.9, -0.6], [0.8, 0], [0.9, 0.6], [0.6, 0.2], [0.2, 0.6], [-0.4, 0.5]]
      },
      { // 8: Bird
        color: "#007AFF",
        pts: [[-0.6, -0.3], [-0.9, -0.2], [-0.7, 0], [-0.4, 0.4], [0.2, 0.5], [0.8, 0.6], [0.9, 0.3], [0.6, 0.2], [0.5, -0.1], [0.1, -0.5], [-0.3, -0.5]]
      },
      { // 9: Apple
        color: "#FF3B30",
        pts: [[0.1, -0.8], [0.1, -0.4], [0.6, -0.5], [0.9, -0.1], [0.6, 0.6], [0, 0.4], [-0.6, 0.6], [-0.9, -0.1], [-0.6, -0.5], [-0.1, -0.4], [-0.1, -0.8]]
      },
      { // 10: Moon
        color: "#FFD500",
        pts: [[0, -0.8], [0.4, -0.5], [0.6, 0], [0.4, 0.5], [0, 0.8], [0.2, 0.4], [0.3, 0], [0.2, -0.4]]
      },
      { // 11: Car
        color: "#FF2D55",
        pts: [[-0.8, 0.1], [-0.8, -0.2], [-0.4, -0.2], [-0.2, -0.6], [0.4, -0.6], [0.6, -0.2], [0.9, -0.1], [0.9, 0.3], [0.6, 0.3], [0.5, 0.1], [0.3, 0.1], [0.2, 0.3], [-0.3, 0.3], [-0.4, 0.1], [-0.6, 0.1], [-0.7, 0.3]]
      },
      { // 12: Tree
        color: "#34C759",
        pts: [[0, -0.8], [0.4, -0.5], [0.8, 0], [0.5, 0.3], [0.2, 0.3], [0.2, 0.8], [-0.2, 0.8], [-0.2, 0.3], [-0.5, 0.3], [-0.8, 0], [-0.4, -0.5]]
      },
      { // 13: Crown
        color: "#FFCC00",
        pts: [[-0.8, -0.5], [-0.4, 0.1], [0, -0.6], [0.4, 0.1], [0.8, -0.5], [0.6, 0.6], [-0.6, 0.6]]
      }
    ];

    const def = shapeDefs[currentLevel - 4];
    fillColor = def.color;
    def.pts.forEach((p, i) => {
      dots.push({
        x: centerX + p[0] * radius,
        y: centerY + p[1] * radius,
        label: (i + 1).toString(),
        connected: false
      });
    });
  }
}

canvas.addEventListener("pointerdown", e => {
  if (isGameOver) {
    currentLevel = (currentLevel + 1) % MAX_LEVELS;
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
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.fillStyle = "#333";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GREAT JOB!", canvas.width / 2, 80);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap for next shape", canvas.width / 2, 120);
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