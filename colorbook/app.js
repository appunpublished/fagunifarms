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

let undoStack = []; // Store image data for true undo
const MAX_UNDO = 10;
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

  // Save current drawing to prevent wiping on device rotation
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = colorLayer.width || r.width;
  tempCanvas.height = colorLayer.height || r.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (colorLayer.width > 0 && colorLayer.height > 0) {
    tempCtx.drawImage(colorLayer, 0, 0);
  }

  canvas.width = r.width;
  canvas.height = r.height;
  colorLayer.width = r.width;
  colorLayer.height = r.height;

  colorCtx.drawImage(tempCanvas, 0, 0);
  if (sourceImage) extractLineMask(sourceImage);
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
  undoStack = [];
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
    if (mode === "erase") setMode("draw");
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
 * TOOLS, ERASER & RESET
 *************************************************/
const tools = {
  draw: document.getElementById("drawBtn"),
  fill: document.getElementById("bucketBtn"),
  erase: document.getElementById("eraser")
};

function setMode(newMode) {
  mode = newMode;
  Object.values(tools).forEach(btn => btn?.classList.remove("active-tool"));
  if (tools[newMode]) tools[newMode].classList.add("active-tool");
}

if (tools.draw) tools.draw.onclick = () => setMode("draw");
if (tools.fill) tools.fill.onclick = () => setMode("fill");
if (tools.erase) tools.erase.onclick = () => {
  setMode("erase");
  colorButtons.forEach(b => b.classList.remove("active"));
};

/*************************************************
 * FLOOD FILL ALGORITHM
 *************************************************/
function floodFill(startX, startY, fillColorHex) {
  if (!lineMask) return;
  const w = colorLayer.width;
  const h = colorLayer.height;
  
  const colorData = colorCtx.getImageData(0, 0, w, h);
  const d = colorData.data;
  const lineCtx = lineMask.getContext("2d");
  const ld = lineCtx.getImageData(0, 0, w, h).data;
  
  startX = Math.floor(startX);
  startY = Math.floor(startY);
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;
  
  const startPos = (startY * w + startX) * 4;
  if (ld[startPos + 3] > 128) return; // Clicked on line
  
  const sR = d[startPos], sG = d[startPos + 1], sB = d[startPos + 2], sA = d[startPos + 3];
  
  const fillR = parseInt(fillColorHex.slice(1, 3), 16);
  const fillG = parseInt(fillColorHex.slice(3, 5), 16);
  const fillB = parseInt(fillColorHex.slice(5, 7), 16);
  const fillA = 255;
  
  if (sR === fillR && sG === fillG && sB === fillB && sA === fillA) return;
  
  const stack = [startX, startY];
  const visited = new Uint8Array(w * h);
  visited[startY * w + startX] = 1;
  
  while (stack.length > 0) {
    const y = stack.pop();
    const x = stack.pop();
    const pos = (y * w + x) * 4;
    
    d[pos] = fillR;
    d[pos + 1] = fillG;
    d[pos + 2] = fillB;
    d[pos + 3] = fillA;
    
    const neighbors = [ [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1] ];
    
    for (let i = 0; i < neighbors.length; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const idx = ny * w + nx;
        if (!visited[idx]) {
          const nPos = idx * 4;
          // Only spread if it's the original target color and NOT hitting an extracted line
          if (ld[nPos + 3] < 128 && d[nPos] === sR && d[nPos + 1] === sG && d[nPos + 2] === sB && d[nPos + 3] === sA) {
            visited[idx] = 1;
            stack.push(nx, ny);
          }
        }
      }
    }
  }
  
  colorCtx.putImageData(colorData, 0, 0);
  redraw();
}

document.getElementById("undo").onclick = () => {
  if (undoStack.length > 0) {
    const lastState = undoStack.pop();
    colorCtx.putImageData(lastState, 0, 0);
    redraw();
  }
};

const clearBtn = document.getElementById("clearAll");
if (clearBtn) {
  clearBtn.onclick = () => {
    saveState(); // Allow user to undo clearing the whole board
    colorCtx.clearRect(0, 0, colorLayer.width, colorLayer.height);
    redraw();
  };
}

function saveState() {
  if (colorLayer.width > 0 && colorLayer.height > 0) {
    undoStack.push(colorCtx.getImageData(0, 0, colorLayer.width, colorLayer.height));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }
}

/*************************************************
 * SPEAK BUTTON
 *************************************************/
document.getElementById("speakBtn").onclick = () => {
  speakCurrentSketch();
  if ("vibrate" in navigator) navigator.vibrate(40);
};


/*************************************************
 * GAME BUTTON
 *************************************************/
document.getElementById("gameBtn").addEventListener("click", () => {
  window.location.href = "games.html";
});


/*************************************************
 * FULLSCREEN
 *************************************************/
const fullscreenBtn = document.getElementById("fullscreenBtn");
if (fullscreenBtn) {
  fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };
}

/*************************************************
 * GLOBAL LANGUAGE SELECTOR
 *************************************************/
const langSelect = document.getElementById("globalLangSelect");
if (langSelect) {
  langSelect.value = localStorage.getItem("appLang") || "en";
  langSelect.addEventListener("change", (e) => localStorage.setItem("appLang", e.target.value));
}

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
  saveState();

  const p = getPos(e);

  if (mode === "fill") {
    floodFill(p.x, p.y, color);
    activePointerId = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
    return;
  }

  drawing = true;
  colorCtx.beginPath();
  colorCtx.moveTo(p.x, p.y);

  if (mode === "erase") {
    colorCtx.globalCompositeOperation = "destination-out";
    colorCtx.lineWidth = 30;
    colorCtx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    colorCtx.globalCompositeOperation = "source-over";
    colorCtx.lineWidth = 18;
    colorCtx.strokeStyle = color;
  }
  colorCtx.lineCap = "round";
  colorCtx.lineJoin = "round";
  colorCtx.lineTo(p.x, p.y);
  colorCtx.stroke();
  redraw();
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

/*************************************************
 * SERVICE WORKER REGISTRATION (OFFLINE MODE)
 *************************************************/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
