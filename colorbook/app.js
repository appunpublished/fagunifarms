const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");

let drawing = false;
let color = "#FF3B30";
let images = [];
let currentIndex = 0;
let currentImage = null;

/* -------------------------------
   CANVAS SCALING (MOBILE SAFE)
-------------------------------- */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (currentImage) drawImage(currentImage);
}

window.addEventListener("resize", resizeCanvas);

/* -------------------------------
   LOAD IMAGE LIST
-------------------------------- */
fetch("images.json")
  .then(res => res.json())
  .then(list => {
    images = list;
    renderSidebar();
    loadImage(0);
  });

/* -------------------------------
   SIDEBAR
-------------------------------- */
function renderSidebar() {
  sidebar.innerHTML = "";
  images.forEach((name, index) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.onclick = () => loadImage(index);
    sidebar.appendChild(img);
  });
}

/* -------------------------------
   LOAD IMAGE ON CANVAS
-------------------------------- */
function loadImage(index) {
  currentIndex = index;
  const img = new Image();
  img.src = `images/${images[index]}`;
  img.onload = () => {
    currentImage = img;
    drawImage(img);
    highlightActive();
  };
}

function drawImage(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
}

function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
  });
}

/* -------------------------------
   COLOR PICKER
-------------------------------- */
document.querySelectorAll(".palette button").forEach(btn => {
  btn.onclick = () => color = btn.dataset.color;
});

/* -------------------------------
   POINTER COORDINATES (FIXED)
-------------------------------- */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/* -------------------------------
   DRAWING LOGIC
-------------------------------- */
canvas.addEventListener("pointerdown", e => {
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  const pos = getPos(e);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);

/* -------------------------------
   INIT
-------------------------------- */
resizeCanvas();
