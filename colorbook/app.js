const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");
const colorBar = document.getElementById("colorBar");

let drawing = false;
let mode = "draw";
let color = "#FF3B30";
let images = [];
let currentIndex = 0;
let baseImage = null;

// Drawing-only layer
const drawLayer = document.createElement("canvas");
const drawCtx = drawLayer.getContext("2d");

/* -------- CANVAS SETUP (CORRECT) -------- */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  drawLayer.width = canvas.width;
  drawLayer.height = canvas.height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawCtx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.scale(dpr, dpr);
  drawCtx.scale(dpr, dpr);

  redraw();
}

window.addEventListener("resize", resizeCanvas);

/* -------- LOAD IMAGES -------- */
fetch("images.json")
  .then(r => r.json())
  .then(list => {
    images = list;
    renderSidebar();
    loadImage(0);
  });

function renderSidebar() {
  sidebar.innerHTML = "";
  images.forEach((name, index) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.onclick = () => loadImage(index);
    sidebar.appendChild(img);
  });
}

function loadImage(index) {
  currentIndex = index;
  const img = new Image();
  img.src = `images/${images[index]}`;
  img.onload = () => {
    baseImage = img;
    clearDrawing();
    redraw();
    highlightActive();
  };
}

function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
    if (i === currentIndex) {
      img.scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  });
}

/* -------- DRAW STACK -------- */
function redraw() {
  if (!baseImage) return;
  const rect = canvas.getBoundingClientRect();

  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.drawImage(baseImage, 0, 0, rect.width, rect.height);
  ctx.drawImage(drawLayer, 0, 0, rect.width, rect.height);
}

function clearDrawing() {
  const rect = canvas.getBoundingClientRect();
  drawCtx.clearRect(0, 0, rect.width, rect.height);
}

/* -------- TOOLS -------- */
colorBar.querySelectorAll("button[data-color]").forEach(btn => {
  btn.onclick = () => {
    mode = "draw";
    color = btn.dataset.color;
  };
});

document.getElementById("eraser").onclick = () => mode = "erase";
document.getElementById("undo").onclick = () => {
  clearDrawing();
  redraw();
};

/* -------- POINTER -------- */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/* -------- DRAWING -------- */
canvas.addEventListener("pointerdown", e => {
  drawing = true;
  const p = getPos(e);
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  const p = getPos(e);

  if (mode === "erase") {
    drawCtx.globalCompositeOperation = "destination-out";
    drawCtx.lineWidth = 28;
  } else {
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 12;
  }

  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();

  redraw();
});

canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

function stopDraw() {
  drawing = false;
  drawCtx.globalCompositeOperation = "source-over";
}

/* -------- INIT -------- */
resizeCanvas();
