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
let activePointerId = null; // 👈 SINGLE POINTER LOCK
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
 * CANVAS SETUP (NO DPR – STABLE)
 *************************************************/
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return;

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
  .then(res => res.json())
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
 * DRAW STACK
 *************************************************/
function redraw() {
  if (!baseImage) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(drawLayer, 0, 0);
}

function clearDrawing() {
  drawCtx.clearRect(0, 0, canvas.width, canvas.height);
}

/*************************************************
 * COLOR SELECTION (WITH HIGHLIGHT)
 *************************************************/
const colorButtons = colorBar.querySelectorAll("button[data-color]");

colorButtons.forEach(btn => {
  btn.onclick = () => {
    if (drawing) return; // prevent mid-stroke change

    mode = "draw";
    color = btn.dataset.color;

    colorButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

// Default color
if (colorButtons.length > 0) {
  colorButtons[0].classList.add("active");
  color = colorButtons[0].dataset.color;
}

/*************************************************
 * ERASER & RESET
 *************************************************/
document.getElementById("eraser").onclick = () => {
  mode = "erase";
};

document.getElementById("undo").onclick = () => {
  clearDrawing();
  redraw();
};

/*************************************************
 * POINTER UTILS
 *************************************************/
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/*************************************************
 * DRAWING – SINGLE TOUCH ONLY (BULLETPROOF)
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  // Allow ONLY primary finger
  if (!e.isPrimary) return;
  if (activePointerId !== null) return;

  e.preventDefault();

  activePointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId); // 👈 VERY IMPORTANT

  drawing = true;
  const p = getPos(e);
  drawCtx.beginPath();
  drawCtx.moveTo(p.x, p.y);
});

canvas.addEventListener("pointermove", e => {
  // Ignore non-active pointers
  if (!drawing || e.pointerId !== activePointerId) return;

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
canvas.addEventListener("pointercancel", stopDraw);
canvas.addEventListener("pointerleave", stopDraw);

function stopDraw(e) {
  if (e.pointerId !== activePointerId) return;

  drawing = false;
  activePointerId = null;
  drawCtx.globalCompositeOperation = "source-over";

  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {}
}


/*************************************************
 * SAFE GALLERY (RUNS ONLY ON CLICK)
 *************************************************/
window.addEventListener("DOMContentLoaded", () => {
  const galleryBtn = document.getElementById("galleryBtn");
  const galleryOverlay = document.getElementById("galleryOverlay");
  const galleryGrid = document.getElementById("galleryGrid");
  const closeGallery = document.getElementById("closeGallery");

  if (!galleryBtn || !galleryOverlay || !galleryGrid) {
    console.warn("Gallery elements not found – skipping gallery");
    return;
  }

  galleryBtn.addEventListener("click", async () => {
    galleryGrid.innerHTML = "";
    galleryOverlay.hidden = false;

    try {
      const res = await fetch("100images/index.json");
      if (!res.ok) throw new Error("Gallery index not found");

      const files = await res.json();

      files.forEach(file => {
        const img = document.createElement("img");
        img.src = `100images/${file}`;
        img.onclick = () => {
          const image = new Image();
          image.src = img.src;
          image.onload = () => {
            baseImage = image;
            clearDrawing();
            redraw();
            galleryOverlay.hidden = true;
          };
        };
        galleryGrid.appendChild(img);
      });

    } catch (err) {
      console.error(err);
      alert("Gallery images not available");
      galleryOverlay.hidden = true;
    }
  });

  closeGallery.addEventListener("click", () => {
    galleryOverlay.hidden = true;
  });
});



/*************************************************
 * iOS PINCH-ZOOM KILL SWITCH
 *************************************************/
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());
document.addEventListener("gestureend", e => e.preventDefault());

/*************************************************
 * INIT
 *************************************************/
resizeCanvas();
