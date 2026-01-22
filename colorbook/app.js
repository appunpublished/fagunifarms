/*************************************************
 * ELEMENTS
 *************************************************/
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");
const colorBar = document.getElementById("colorBar");

/*************************************************
 * STATE
 *************************************************/
let drawing = false;
let activePointerId = null;
let mode = "draw";
let color = "#FF3B30";
let images = [];
let currentIndex = 0;
let baseImage = null;

/*************************************************
 * DRAWING LAYER (COLORS ONLY)
 *************************************************/
const drawLayer = document.createElement("canvas");
const drawCtx = drawLayer.getContext("2d");

/*************************************************
 * CANVAS SETUP
 *************************************************/
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  canvas.width = rect.width;
  canvas.height = rect.height;
  drawLayer.width = rect.width;
  drawLayer.height = rect.height;

  redraw();
}
window.addEventListener("resize", resizeCanvas);

/*************************************************
 * LOAD IMAGE LIST
 *************************************************/
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
  });
}

/*************************************************
 * DRAW STACK (🔥 FIXED ORDER)
 *************************************************/
function redraw() {
  if (!baseImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1️⃣ Draw sketch FIRST
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // 2️⃣ Draw colors using multiply (keeps lines visible)
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(drawLayer, 0, 0);

  // 3️⃣ Reset
  ctx.globalCompositeOperation = "source-over";
}


/*************************************************
 * COLOR SELECTION
 *************************************************/
const colorButtons = colorBar.querySelectorAll("button[data-color]");
colorButtons.forEach(btn => {
  btn.onclick = () => {
    if (drawing) return;
    mode = "draw";
    color = btn.dataset.color;
    colorButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});
if (colorButtons.length) {
  colorButtons[0].classList.add("active");
  color = colorButtons[0].dataset.color;
}

/*************************************************
 * ERASER & RESET
 *************************************************/
document.getElementById("eraser").onclick = () => mode = "erase";
document.getElementById("undo").onclick = () => {
  clearDrawing();
  redraw();
};

/*************************************************
 * POINTER UTILS
 *************************************************/
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/*************************************************
 * DRAWING – SINGLE TOUCH ONLY
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!e.isPrimary || activePointerId !== null) return;
  e.preventDefault();

  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);

  drawing = true;
  const p = getPos(e);
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing || e.pointerId !== activePointerId) return;
  e.preventDefault();

  const p = getPos(e);

  if (mode === "erase") {
    drawCtx.globalCompositeOperation = "destination-out";
    drawCtx.lineWidth = 30;
  } else {
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = 16; // crayon-like
  }

  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();

  redraw();
});

canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointercancel", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

function stopDraw(e) {
  if (e.pointerId !== activePointerId) return;
  drawing = false;
  activePointerId = null;
  drawCtx.globalCompositeOperation = "source-over";
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}

/*************************************************
 * SAFE GALLERY (UNCHANGED, SAFE)
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  const galleryBtn = document.getElementById("galleryBtn");
  const galleryOverlay = document.getElementById("galleryOverlay");
  const galleryGrid = document.getElementById("galleryGrid");
  const closeGallery = document.getElementById("closeGallery");

  if (!galleryBtn || !galleryOverlay || !galleryGrid) return;

  galleryBtn.onclick = async () => {
    galleryGrid.innerHTML = "";
    galleryOverlay.hidden = false;

    try {
      const res = await fetch("100images/index.json");
      const files = await res.json();

      files.forEach(file => {
        const img = document.createElement("img");
        img.src = `100images/${file}`;
        img.onclick = () => {
          const im = new Image();
          im.src = img.src;
          im.onload = () => {
            baseImage = im;
            clearDrawing();
            redraw();
            galleryOverlay.hidden = true;
          };
        };
        galleryGrid.appendChild(img);
      });
    } catch {
      galleryOverlay.hidden = true;
    }
  };

  closeGallery.onclick = () => galleryOverlay.hidden = true;
});

/*************************************************
 * iOS GESTURE BLOCK
 *************************************************/
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());
document.addEventListener("gestureend", e => e.preventDefault());

/*************************************************
 * INIT
 *************************************************/
resizeCanvas();
