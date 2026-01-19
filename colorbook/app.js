/***********************
 * ELEMENTS
 ***********************/
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");
const colorBar = document.getElementById("colorBar");

/***********************
 * STATE
 ***********************/
let drawing = false;
let mode = "draw";
let color = "#FF3B30";
let images = [];
let currentIndex = 0;
let baseImage = null;

/***********************
 * DRAW LAYER
 ***********************/
const drawLayer = document.createElement("canvas");
const drawCtx = drawLayer.getContext("2d");

/***********************
 * CANVAS SETUP (CORRECT)
 ***********************/
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  // CSS size = drawing size (NO DPR SCALING)
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawLayer.width = rect.width;
  drawLayer.height = rect.height;

  redraw();
}

window.addEventListener("resize", resizeCanvas);

/***********************
 * LOAD IMAGES
 ***********************/
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
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
    highlightActive();
  };
}

function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
  });
}

/***********************
 * DRAW STACK
 ***********************/
function redraw() {
  if (!baseImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(drawLayer, 0, 0);
}

/***********************
 * TOOLS
 ***********************/
colorBar.querySelectorAll("button[data-color]").forEach(btn => {
  btn.onclick = () => {
    mode = "draw";
    color = btn.dataset.color;
  };
});

document.getElementById("eraser").onclick = () => {
  mode = "erase";
};

document.getElementById("undo").onclick = () => {
  drawCtx.clearRect(0, 0, canvas.width, canvas.height);
  redraw();
};

/***********************
 * POINTER UTILS
 ***********************/
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/***********************
 * DRAWING (ROBUST)
 ***********************/
canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  drawing = true;

  const p = getPos(e);
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  e.preventDefault();

  const p = getPos(e);

  if (mode === "erase") {
    drawCtx.globalCompositeOperation = "destination-out";
    drawCtx.lineWidth = 30;
  } else {
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 14;
  }

  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();

  redraw();
});

canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);
canvas.addEventListener("pointercancel", stopDraw);

function stopDraw() {
  drawing = false;
  drawCtx.globalCompositeOperation = "source-over";
}

/***********************
 * INIT
 ***********************/
resizeCanvas();
