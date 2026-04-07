/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (items && items.length > 0) initNumber(currentIndex); // re-position on resize
}
window.addEventListener("resize", resize);

document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/*************************************************
 * NUMBERS DICTIONARY
 *************************************************/
const NUMBERS = [
  { num: "1", word: {en: "One", es: "Uno", fr: "Un", de: "Eins"}, emoji: "🍎", itemName: {en: "Apple", es: "Manzana", fr: "Pomme", de: "Apfel"}, count: 1 },
  { num: "2", word: {en: "Two", es: "Dos", fr: "Deux", de: "Zwei"}, emoji: "🐱", itemName: {en: "Cats", es: "Gatos", fr: "Chats", de: "Katzen"}, count: 2 },
  { num: "3", word: {en: "Three", es: "Tres", fr: "Trois", de: "Drei"}, emoji: "⭐", itemName: {en: "Stars", es: "Estrellas", fr: "Étoiles", de: "Sterne"}, count: 3 },
  { num: "4", word: {en: "Four", es: "Cuatro", fr: "Quatre", de: "Vier"}, emoji: "🚗", itemName: {en: "Cars", es: "Coches", fr: "Voitures", de: "Autos"}, count: 4 },
  { num: "5", word: {en: "Five", es: "Cinco", fr: "Cinq", de: "Fünf"}, emoji: "🎈", itemName: {en: "Balloons", es: "Globos", fr: "Ballons", de: "Ballons"}, count: 5 },
  { num: "6", word: {en: "Six", es: "Seis", fr: "Six", de: "Sechs"}, emoji: "🍓", itemName: {en: "Strawberries", es: "Fresas", fr: "Fraises", de: "Erdbeeren"}, count: 6 },
  { num: "7", word: {en: "Seven", es: "Siete", fr: "Sept", de: "Sieben"}, emoji: "🦋", itemName: {en: "Butterflies", es: "Mariposas", fr: "Papillons", de: "Schmetterlinge"}, count: 7 },
  { num: "8", word: {en: "Eight", es: "Ocho", fr: "Huit", de: "Acht"}, emoji: "🐟", itemName: {en: "Fish", es: "Peces", fr: "Poissons", de: "Fische"}, count: 8 },
  { num: "9", word: {en: "Nine", es: "Nueve", fr: "Neuf", de: "Neun"}, emoji: "🦆", itemName: {en: "Ducks", es: "Patos", fr: "Canards", de: "Enten"}, count: 9 },
  { num: "10", word: {en: "Ten", es: "Diez", fr: "Dix", de: "Zehn"}, emoji: "🐸", itemName: {en: "Frogs", es: "Ranas", fr: "Grenouilles", de: "Frösche"}, count: 10 }
];

const langMap = { "en": "en-US", "es": "es-ES", "fr": "fr-FR", "de": "de-DE" };
function getLangKey() { return localStorage.getItem('appLang') || 'en'; }
function getLangCode() { return langMap[getLangKey()]; }

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = getLangCode();
    msg.rate = 0.85; 
    msg.pitch = 1.2;
    window.speechSynthesis.speak(msg);
  }
}

/*************************************************
 * STATE
 *************************************************/
let currentIndex = 0;
let items = [];
let particles = [];
let countProgress = 0;
let leftArrow = { x: 50, y: 0, w: 60, h: 60 };
let rightArrow = { x: 0, y: 0, w: 60, h: 60 };
let bigNum = { x: 0, y: 0, r: 80 };

function initNumber(index) {
  currentIndex = index;
  countProgress = 0;
  const data = NUMBERS[index];
  
  setTimeout(() => {
    const word = data.word[getLangKey()] || data.word.en;
    speak(word);
  }, 200);
  
  items = [];
  const total = data.count;
  const topCount = Math.ceil(total / 2);
  const bottomCount = total - topCount;
  
  const startY1 = total > 5 ? canvas.height * 0.55 : canvas.height * 0.65;
  const startY2 = canvas.height * 0.75;
  
  for (let i = 0; i < total; i++) {
    let isTop = i < topCount;
    let rowCount = isTop ? topCount : bottomCount;
    let colIdx = isTop ? i : i - topCount;
    let spacing = canvas.width / (rowCount + 1);
    let maxRadius = Math.min(50, canvas.width / (rowCount * 2.2));

    items.push({
      id: i,
      x: spacing * (colIdx + 1),
      y: isTop ? startY1 : startY2,
      baseY: isTop ? startY1 : startY2,
      r: maxRadius,
      bounce: i * Math.PI / 4,
      tapped: false,
      countIndex: 0,
      emoji: data.emoji
    });
  }
}

function createPop(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
      life: 30, color, size: Math.random() * 6 + 2
    });
  }
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  const px = e.clientX;
  const py = e.clientY;

  // Left arrow
  if (currentIndex > 0 && Math.abs(px - leftArrow.x) < leftArrow.w && Math.abs(py - leftArrow.y) < leftArrow.h) {
    initNumber(currentIndex - 1);
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }
  // Right arrow
  if (currentIndex < NUMBERS.length - 1 && Math.abs(px - rightArrow.x) < rightArrow.w && Math.abs(py - rightArrow.y) < rightArrow.h) {
    initNumber(currentIndex + 1);
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }

  // Big Number
  if (Math.hypot(px - bigNum.x, py - bigNum.y) < bigNum.r) {
    const word = NUMBERS[currentIndex].word[getLangKey()] || NUMBERS[currentIndex].word.en;
    speak(word);
    createPop(bigNum.x, bigNum.y, "#00BCD4");
    if ("vibrate" in navigator) navigator.vibrate(30);
    return;
  }

  // Items (Counting mechanics)
  for (let item of items) {
    if (Math.hypot(px - item.x, py - item.y) < item.r * 1.5) {
      if (!item.tapped) {
        item.tapped = true;
        countProgress++;
        item.countIndex = countProgress;
        speak(countProgress.toString());
        createPop(item.x, item.y, ["#FF3B30", "#34C759", "#FFCC00"][Math.floor(Math.random() * 3)]);
        if ("vibrate" in navigator) navigator.vibrate(30);
        
        // If all counted, speak the final phrase
        if (countProgress === NUMBERS[currentIndex].count) {
          setTimeout(() => {
            const data = NUMBERS[currentIndex];
            const itemName = data.itemName[getLangKey()] || data.itemName.en;
            speak(`${data.count} ${itemName}`);
          }, 1000);
        }
      } else {
        speak(item.countIndex.toString());
        createPop(item.x, item.y, "rgba(255,255,255,0.5)");
        if ("vibrate" in navigator) navigator.vibrate(10);
      }
      return;
    }
  }
});

/*************************************************
 * DRAWING
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#E0F7FA"); 
  grad.addColorStop(1, "#80DEEA"); 
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  leftArrow.y = canvas.height / 2;
  leftArrow.x = 40;
  rightArrow.x = canvas.width - 40;
  rightArrow.y = canvas.height / 2;
  
  bigNum.r = Math.min(90, canvas.width / 5);
  bigNum.x = canvas.width / 2;
  bigNum.y = canvas.height * 0.25;

  ctx.fillStyle = "#333";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Number Explorer", canvas.width / 2, 40);

  if (currentIndex > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath(); ctx.arc(leftArrow.x, leftArrow.y, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("◀", leftArrow.x, leftArrow.y + 2);
  }
  
  if (currentIndex < NUMBERS.length - 1) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath(); ctx.arc(rightArrow.x, rightArrow.y, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("▶", rightArrow.x, rightArrow.y + 2);
  }

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(bigNum.x, bigNum.y, bigNum.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#00BCD4";
  ctx.stroke();

  ctx.fillStyle = "#007AFF";
  ctx.font = `bold ${bigNum.r * 1.2}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const data = NUMBERS[currentIndex];
  ctx.fillText(data.num, bigNum.x, bigNum.y + 4);

  ctx.fillStyle = "#333";
  ctx.font = `bold ${bigNum.r * 0.4}px system-ui`;
  const word = data.word[getLangKey()] || data.word.en;
  ctx.fillText(word, bigNum.x, bigNum.y + bigNum.r + 25);

  const time = Date.now();

  items.forEach((item, i) => {
    if (!item.tapped) {
      item.y = item.baseY + Math.sin(time / 200 + item.bounce) * 10;
    } else {
      item.y = item.baseY + Math.sin(time / 500 + item.bounce) * 3;
    }
    
    ctx.fillStyle = item.tapped ? "#E0E0E0" : "white";
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = item.tapped ? "#9E9E9E" : ["#4CAF50", "#007AFF", "#AF52DE", "#FF9500"][i % 4];
    ctx.stroke();

    ctx.globalAlpha = item.tapped ? 0.5 : 1.0;
    ctx.font = `${item.r * 1.1}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.emoji, item.x, item.y + 5);
    ctx.globalAlpha = 1.0;

    if (item.tapped) {
      ctx.fillStyle = "#FF3B30";
      ctx.beginPath();
      ctx.arc(item.x + item.r * 0.7, item.y - item.r * 0.7, item.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "white";
      ctx.font = `bold ${item.r * 0.5}px system-ui`;
      ctx.fillText(item.countIndex, item.x + item.r * 0.7, item.y - item.r * 0.7 + 2);
    }
  });

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  particles = particles.filter(p => p.life > 0);
}

resize();
initNumber(0);
update();