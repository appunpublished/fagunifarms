const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sidebar = document.getElementById("sidebar");

canvas.width = window.innerWidth - 120;
canvas.height = window.innerHeight - 100;

let drawing = false;
let color = "#FF3B30";
let images = [];
let currentIndex = 0;

// Load image list
fetch("images.json")
  .then(res => res.json())
  .then(list => {
    images = list;
    renderSidebar();
    loadImage(0);
  });

// Render thumbnails
function renderSidebar() {
  sidebar.innerHTML = "";
  images.forEach((name, index) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.onclick = () => loadImage(index);
    sidebar.appendChild(img);
  });
}

// Load selected image
function loadImage(index) {
  currentIndex = index;
  const img = new Image();
  img.src = `images/${images[index]}`;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    highlightActive();
  };
}

// Highlight active thumbnail
function highlightActive() {
  document.querySelectorAll("#sidebar img").forEach((img, i) => {
    img.classList.toggle("active", i === currentIndex);
  });
}

// Color selection
document.querySelectorAll(".palette button").forEach(btn => {
  btn.onclick = () => color = btn.dataset.color;
});

// Drawing logic
canvas.addEventListener("pointerdown", e => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);
