const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");

let drawing = false;
let mode = "draw"; // draw | erase
let color = "#FF3B30";
let images = [];
let currentIndex = 0;
let currentImage = null;

/* ---------------------------------
   CANVAS SETUP (FIXED PROPERLY)
---------------------------------- */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale ONCE

  if (currentImage) drawBaseImage();
}

window.addEventListener("resize", resizeCanvas);

/* ---------------------------------
   LOAD IMAGE LIST
---------------------------------- */
fetch("images.json")
  .then(res => res.json())
  .then(list => {
    images = list;
    renderSidebar();
    loadImage(0);
  });

/* ---------------------------------
   SIDEBAR
---------------------------------- */
function renderSidebar() {
  sidebar.innerHTML = "";
  images.forEach((name, index) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.onclick = () => loadImage(index);
    sidebar.appendChild(img);
  });
}

/* ---------------------------------
   IMAGE LOADING
---------------------------------- */
function loadImage(index) {
  currentIndex = index;
  const img = new Image();
  img.src = `images/${images[index]}`;
  img.onload = () => {
    currentImage = img;
    drawBaseImage();
    highlightActive();
  };
}

function drawBaseImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    currentImage,
    0,
    0,
    canvas.clientWidth,
    canvas.clientHeight
  );
}

function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
  });
}

/* ---------------------------------
   COLOR + ERASER
---------------------------------- */
document.querySelectorAll(".palette button").forEach(btn => {
  btn.onclick = () => {
    mode = "draw";
    color = btn.dataset.color;
  };
});

// ERASER BUTTON (create once)
const eraser = document.createElement("button");
eraser.textContent = "🧽";
eraser.style.fontSize = "28px";
eraser.onclick = () => mode = "erase";
document.querySelector(".palette").appendChild(eraser);

/* ---------------------------------
   POINTER COORDINATES (FINAL FIX)
---------------------------------- */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/* ---------------------------------
   DRAWING / ERASING
---------------------------------- */
canvas.addEventListener("pointerdown", e => {
  drawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;

  const pos = getPos(e);

  if (mode === "erase") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 28;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

function stopDraw() {
  drawing = false;
  ctx.globalCompositeOperation = "source-over";
}

/* ---------------------------------
   INIT
---------------------------------- */
resizeCanvas();
