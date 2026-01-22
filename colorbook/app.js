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

let labels = {};
let currentFilename = null;   // ⭐ FIX: track current sketch filename

let sourceImage = null;   // original JPG
let lineMask = null;      // extracted line art

/*************************************************
 * LOAD LABELS
 *************************************************/
fetch("labels.json")
  .then(r => r.json())
  .then(data => {
    labels = data;
  });

/*************************************************
 * SPEAK FUNCTION (MANUAL ONLY)
 *************************************************/
function speakCurrentSketch() {
  if (!currentFilename) return;
  if (!labels[currentFilename]) return;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(labels[currentFilename]);
  utterance.lang = "en-US";
  utterance.rate = 0.8;   // kid-friendly
  utterance.pitch = 1.1;

  window.speechSynthesis.speak(utterance);
}

/*************************************************
 * COLOR LAYER
 *************************************************/
const colorLayer = document.createElement("canvas");
const colorCtx = colorLayer.getContext("2d");

/*************************************************
 * CANVAS SETUP
 *************************************************/
function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;

  canvas.width = r.width;
  canvas.height = r.height;
  colorLayer.width = r.width;
  colorLayer.height = r.height;

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
  images.forEach((name, i) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.onclick = () => loadImage(i);
    sidebar.appendChild(img);
  });
}

/*************************************************
 * LOAD IMAGE + EXTRACT LINES
 *************************************************/
function loadImage(index) {
  currentIndex = index;
  currentFilename = images[index]; // ⭐ FIX

  const img = new Image();
  img.src = `images/${images[index]}`;

  img.onload = () => {
    sourceImage = img;
    extractLineMask(img);
    clearColors();
    redraw();
    highlightActive();
  };
}

/*************************************************
 * LINE EXTRACTION (JPG SAFE)
 *************************************************/
function extractLineMask(img) {
  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;

  const octx = off.getContext("2d");
  octx.drawImage(img, 0, 0, off.width, off.height);

  const data = octx.getImageData(0, 0, off.width, off.height);
  const d = data.data;

  for (let i = 0; i < d.length; i += 4) {
    const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;

    if (brightness < 100) {
      d[i] = d[i + 1] = d[i + 2] = 0;
      d[i + 3] = 255;
    } else {
      d[i + 3] = 0;
    }
  }

  octx.putImageData(data, 0, 0);
  lineMask = off;
}

/*************************************************
 * RENDER STACK
 *************************************************/
function redraw() {
  if (!sourceImage || !lineMask) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(colorLayer, 0, 0);
  ctx.drawImage(lineMask, 0, 0);
}

function clearColors() {
  colorCtx.clearRect(0, 0, colorLayer.width, colorLayer.height);
}

function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
  });
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

    if ("vibrate" in navigator) navigator.vibrate(30);
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
  clearColors();
  redraw();
};

/*************************************************
 * SPEAK BUTTON
 *************************************************/
document.getElementById("speakBtn").onclick = () => {
  speakCurrentSketch();
  if ("vibrate" in navigator) navigator.vibrate(40);
};

/*************************************************
 * POINTER UTILS
 *************************************************/
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/*************************************************
 * DRAWING (SINGLE TOUCH)
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!e.isPrimary || activePointerId !== null) return;
  e.preventDefault();

  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  drawing = true;

  const p = getPos(e);
  colorCtx.beginPath();
  colorCtx.moveTo(p.x, p.y);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing || e.pointerId !== activePointerId) return;
  e.preventDefault();

  const p = getPos(e);

  if (mode === "erase") {
    colorCtx.globalCompositeOperation = "destination-out";
    colorCtx.lineWidth = 30;
  } else {
    colorCtx.globalCompositeOperation = "source-over";
    colorCtx.strokeStyle = color;
    colorCtx.lineWidth = 18;
  }

  colorCtx.lineCap = "round";
  colorCtx.lineJoin = "round";
  colorCtx.lineTo(p.x, p.y);
  colorCtx.stroke();

  redraw();
});

canvas.addEventListener("pointerup", stopDraw);
canvas.addEventListener("pointercancel", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

function stopDraw(e) {
  if (e.pointerId !== activePointerId) return;
  drawing = false;
  activePointerId = null;
  colorCtx.globalCompositeOperation = "source-over";
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
}

/*************************************************
 * GALLERY (100images)
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  const galleryBtn = document.getElementById("galleryBtn");
  const galleryOverlay = document.getElementById("galleryOverlay");
  const galleryGrid = document.getElementById("galleryGrid");
  const closeGallery = document.getElementById("closeGallery");

  if (!galleryBtn || !galleryOverlay || !galleryGrid || !closeGallery) return;

  galleryBtn.onclick = async () => {
    galleryGrid.innerHTML = "";
    galleryOverlay.hidden = false;

    try {
      const res = await fetch("100images/index.json");
      const files = await res.json();

      files.forEach(file => {
        const thumb = document.createElement("img");
        thumb.src = `100images/${file}`;

        thumb.onclick = () => {
          const img = new Image();
          img.src = thumb.src;

          img.onload = () => {
            sourceImage = img;
            currentFilename = file; // ⭐ FIX
            extractLineMask(img);
            clearColors();
            redraw();
            galleryOverlay.hidden = true;
          };
        };

        galleryGrid.appendChild(thumb);
      });

    } catch {
      galleryOverlay.hidden = true;
      alert("Gallery images not available");
    }
  };

  closeGallery.onclick = () => {
    galleryOverlay.hidden = true;
  };
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
