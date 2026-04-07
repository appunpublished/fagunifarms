/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (items && items.length > 0) initLetter(currentIndex); // re-position on resize
}
window.addEventListener("resize", resize);

document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/*************************************************
 * ALPHABET DICTIONARY
 *************************************************/
const ALPHABET = [
  { letter: "A", items: [{emoji: "🍎", word: {en: "Apple", es: "Manzana", fr: "Pomme", de: "Apfel"}}, {emoji: "🐜", word: {en: "Ant", es: "Hormiga", fr: "Fourmi", de: "Ameise"}}, {emoji: "✈️", word: {en: "Aeroplane", es: "Avión", fr: "Avion", de: "Flugzeug"}}] },
  { letter: "B", items: [{emoji: "🎈", word: {en: "Balloon", es: "Globo", fr: "Ballon", de: "Ballon"}}, {emoji: "🐻", word: {en: "Bear", es: "Oso", fr: "Ours", de: "Bär"}}, {emoji: "🍌", word: {en: "Banana", es: "Plátano", fr: "Banane", de: "Banane"}}] },
  { letter: "C", items: [{emoji: "🐱", word: {en: "Cat", es: "Gato", fr: "Chat", de: "Katze"}}, {emoji: "🚗", word: {en: "Car", es: "Coche", fr: "Voiture", de: "Auto"}}, {emoji: "🥕", word: {en: "Carrot", es: "Zanahoria", fr: "Carotte", de: "Karotte"}}] },
  { letter: "D", items: [{emoji: "🐶", word: {en: "Dog", es: "Perro", fr: "Chien", de: "Hund"}}, {emoji: "🦆", word: {en: "Duck", es: "Pato", fr: "Canard", de: "Ente"}}, {emoji: "🥁", word: {en: "Drum", es: "Tambor", fr: "Tambour", de: "Trommel"}}] },
  { letter: "E", items: [{emoji: "🐘", word: {en: "Elephant", es: "Elefante", fr: "Éléphant", de: "Elefant"}}, {emoji: "🥚", word: {en: "Egg", es: "Huevo", fr: "Œuf", de: "Ei"}}, {emoji: "🌍", word: {en: "Earth", es: "Tierra", fr: "Terre", de: "Erde"}}] },
  { letter: "F", items: [{emoji: "🐸", word: {en: "Frog", es: "Rana", fr: "Grenouille", de: "Frosch"}}, {emoji: "🐟", word: {en: "Fish", es: "Pez", fr: "Poisson", de: "Fisch"}}, {emoji: "🔥", word: {en: "Fire", es: "Fuego", fr: "Feu", de: "Feuer"}}] },
  { letter: "G", items: [{emoji: "🦒", word: {en: "Giraffe", es: "Jirafa", fr: "Girafe", de: "Giraffe"}}, {emoji: "🎸", word: {en: "Guitar", es: "Guitarra", fr: "Guitare", de: "Gitarre"}}, {emoji: "🍇", word: {en: "Grapes", es: "Uvas", fr: "Raisins", de: "Trauben"}}] },
  { letter: "H", items: [{emoji: "🏠", word: {en: "House", es: "Casa", fr: "Maison", de: "Haus"}}, {emoji: "🐴", word: {en: "Horse", es: "Caballo", fr: "Cheval", de: "Pferd"}}, {emoji: "🚁", word: {en: "Helicopter", es: "Helicóptero", fr: "Hélicoptère", de: "Hubschrauber"}}] },
  { letter: "I", items: [{emoji: "🍦", word: {en: "Ice Cream", es: "Helado", fr: "Glace", de: "Eiscreme"}}, {emoji: "🧊", word: {en: "Ice", es: "Hielo", fr: "Glaçon", de: "Eis"}}, {emoji: "🏝️", word: {en: "Island", es: "Isla", fr: "Île", de: "Insel"}}] },
  { letter: "J", items: [{emoji: "🧃", word: {en: "Juice", es: "Jugo", fr: "Jus", de: "Saft"}}, {emoji: "👖", word: {en: "Jeans", es: "Pantalones", fr: "Jeans", de: "Jeans"}}, {emoji: "🐆", word: {en: "Jaguar", es: "Jaguar", fr: "Jaguar", de: "Jaguar"}}] },
  { letter: "K", items: [{emoji: "🔑", word: {en: "Key", es: "Llave", fr: "Clé", de: "Schlüssel"}}, {emoji: "🪁", word: {en: "Kite", es: "Cometa", fr: "Cerf-volant", de: "Drachen"}}, {emoji: "🐨", word: {en: "Koala", es: "Koala", fr: "Koala", de: "Koala"}}] },
  { letter: "L", items: [{emoji: "🦁", word: {en: "Lion", es: "León", fr: "Lion", de: "Löwe"}}, {emoji: "🍋", word: {en: "Lemon", es: "Limón", fr: "Citron", de: "Zitrone"}}, {emoji: "🐞", word: {en: "Ladybug", es: "Mariquita", fr: "Coccinelle", de: "Marienkäfer"}}] },
  { letter: "M", items: [{emoji: "🐒", word: {en: "Monkey", es: "Mono", fr: "Singe", de: "Affe"}}, {emoji: "🌙", word: {en: "Moon", es: "Luna", fr: "Lune", de: "Mond"}}, {emoji: "🍄", word: {en: "Mushroom", es: "Champiñón", fr: "Champignon", de: "Pilz"}}] },
  { letter: "N", items: [{emoji: "🥜", word: {en: "Nut", es: "Nuez", fr: "Noix", de: "Nuss"}}, {emoji: "📰", word: {en: "News", es: "Noticias", fr: "Nouvelles", de: "Nachrichten"}}, {emoji: "🌃", word: {en: "Night", es: "Noche", fr: "Nuit", de: "Nacht"}}] },
  { letter: "O", items: [{emoji: "🦉", word: {en: "Owl", es: "Búho", fr: "Hibou", de: "Eule"}}, {emoji: "🐙", word: {en: "Octopus", es: "Pulpo", fr: "Pieuvre", de: "Oktopus"}}, {emoji: "🍊", word: {en: "Orange", es: "Naranja", fr: "Orange", de: "Orange"}}] },
  { letter: "P", items: [{emoji: "🐧", word: {en: "Penguin", es: "Pingüino", fr: "Pingouin", de: "Pinguin"}}, {emoji: "🐷", word: {en: "Pig", es: "Cerdo", fr: "Cochon", de: "Schwein"}}, {emoji: "🍕", word: {en: "Pizza", es: "Pizza", fr: "Pizza", de: "Pizza"}}] },
  { letter: "Q", items: [{emoji: "👑", word: {en: "Queen", es: "Reina", fr: "Reine", de: "Königin"}}, {emoji: "❓", word: {en: "Question", es: "Pregunta", fr: "Question", de: "Frage"}}] },
  { letter: "R", items: [{emoji: "🐇", word: {en: "Rabbit", es: "Conejo", fr: "Lapin", de: "Hase"}}, {emoji: "🚀", word: {en: "Rocket", es: "Cohete", fr: "Fusée", de: "Rakete"}}, {emoji: "🌈", word: {en: "Rainbow", es: "Arcoíris", fr: "Arc-en-ciel", de: "Regenbogen"}}] },
  { letter: "S", items: [{emoji: "☀️", word: {en: "Sun", es: "Sol", fr: "Soleil", de: "Sonne"}}, {emoji: "⭐", word: {en: "Star", es: "Estrella", fr: "Étoile", de: "Stern"}}, {emoji: "🍓", word: {en: "Strawberry", es: "Fresa", fr: "Fraise", de: "Erdbeere"}}] },
  { letter: "T", items: [{emoji: "🐯", word: {en: "Tiger", es: "Tigre", fr: "Tigre", de: "Tiger"}}, {emoji: "🌳", word: {en: "Tree", es: "Árbol", fr: "Arbre", de: "Baum"}}, {emoji: "🍅", word: {en: "Tomato", es: "Tomate", fr: "Tomate", de: "Tomate"}}] },
  { letter: "U", items: [{emoji: "☂️", word: {en: "Umbrella", es: "Paraguas", fr: "Parapluie", de: "Regenschirm"}}, {emoji: "🦄", word: {en: "Unicorn", es: "Unicornio", fr: "Licorne", de: "Einhorn"}}] },
  { letter: "V", items: [{emoji: "🌋", word: {en: "Volcano", es: "Volcán", fr: "Volcan", de: "Vulkan"}}, {emoji: "🎻", word: {en: "Violin", es: "Violín", fr: "Violon", de: "Violine"}}] },
  { letter: "W", items: [{emoji: "🍉", word: {en: "Watermelon", es: "Sandía", fr: "Pastèque", de: "Wassermelone"}}, {emoji: "🐋", word: {en: "Whale", es: "Ballena", fr: "Baleine", de: "Wal"}}, {emoji: "💧", word: {en: "Water", es: "Agua", fr: "Eau", de: "Wasser"}}] },
  { letter: "X", items: [{emoji: "🎹", word: {en: "Xylophone", es: "Xilófono", fr: "Xylophone", de: "Xylophon"}}] },
  { letter: "Y", items: [{emoji: "🪀", word: {en: "Yo-yo", es: "Yo-yo", fr: "Yo-yo", de: "Jo-Jo"}}, {emoji: "🛥️", word: {en: "Yacht", es: "Yate", fr: "Yacht", de: "Yacht"}}] },
  { letter: "Z", items: [{emoji: "🦓", word: {en: "Zebra", es: "Cebra", fr: "Zèbre", de: "Zebra"}}] }
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
let leftArrow = { x: 50, y: 0, w: 60, h: 60 };
let rightArrow = { x: 0, y: 0, w: 60, h: 60 };
let bigLetter = { x: 0, y: 0, r: 80 };

function initLetter(index) {
  currentIndex = index;
  const data = ALPHABET[index];
  
  setTimeout(() => {
    const isEn = getLangKey() === 'en';
    if (isEn && data.items.length > 0) {
      speak(`${data.letter} is for ${data.items[0].word.en}`);
    } else {
      speak(data.letter);
    }
  }, 200);
  
  const spacing = canvas.width / (data.items.length + 1);
  const maxRadius = Math.min(65, canvas.width / (data.items.length * 2));
  
  items = data.items.map((item, i) => {
    return {
      ...item,
      x: spacing * (i + 1),
      y: canvas.height * 0.65,
      baseY: canvas.height * 0.65,
      r: maxRadius,
      bounce: i * Math.PI / 2
    };
  });
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
    initLetter(currentIndex - 1);
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }
  // Right arrow
  if (currentIndex < ALPHABET.length - 1 && Math.abs(px - rightArrow.x) < rightArrow.w && Math.abs(py - rightArrow.y) < rightArrow.h) {
    initLetter(currentIndex + 1);
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }

  // Big Letter
  if (Math.hypot(px - bigLetter.x, py - bigLetter.y) < bigLetter.r) {
    speak(ALPHABET[currentIndex].letter);
    createPop(bigLetter.x, bigLetter.y, "#FFCC00");
    if ("vibrate" in navigator) navigator.vibrate(30);
    return;
  }

  // Items
  for (let item of items) {
    if (Math.hypot(px - item.x, py - item.y) < item.r * 1.5) {
      const word = item.word[getLangKey()] || item.word.en;
      speak(word);
      createPop(item.x, item.y, ["#FF3B30", "#34C759", "#007AFF"][Math.floor(Math.random() * 3)]);
      if ("vibrate" in navigator) navigator.vibrate(30);
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

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#FFF9C4"); 
  grad.addColorStop(1, "#FFCC80"); 
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  leftArrow.y = canvas.height / 2;
  leftArrow.x = 40;
  rightArrow.x = canvas.width - 40;
  rightArrow.y = canvas.height / 2;
  
  bigLetter.r = Math.min(90, canvas.width / 5);
  bigLetter.x = canvas.width / 2;
  bigLetter.y = canvas.height * 0.3;

  // Title
  ctx.fillStyle = "#333";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("ABC Explorer", canvas.width / 2, 40);

  // Draw Arrows
  if (currentIndex > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath(); ctx.arc(leftArrow.x, leftArrow.y, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("◀", leftArrow.x, leftArrow.y + 2);
  }
  
  if (currentIndex < ALPHABET.length - 1) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath(); ctx.arc(rightArrow.x, rightArrow.y, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("▶", rightArrow.x, rightArrow.y + 2);
  }

  // Draw Big Letter
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(bigLetter.x, bigLetter.y, bigLetter.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#FF9500";
  ctx.stroke();

  ctx.fillStyle = "#FF3B30";
  ctx.font = `bold ${bigLetter.r * 1.1}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const letter = ALPHABET[currentIndex].letter;
  ctx.fillText(`${letter} ${letter.toLowerCase()}`, bigLetter.x, bigLetter.y + 4);

  const time = Date.now();

  // Draw Items
  items.forEach((item, i) => {
    item.y = item.baseY + Math.sin(time / 300 + item.bounce) * 15;
    
    // Bubble
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = ["#4CAF50", "#007AFF", "#AF52DE"][i % 3];
    ctx.stroke();

    // Emoji
    ctx.font = `${item.r * 1.1}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.emoji, item.x, item.y + 5);

    // Word text
    ctx.fillStyle = "#333";
    ctx.font = `bold ${Math.max(14, item.r * 0.35)}px system-ui`;
    const word = item.word[getLangKey()] || item.word.en;
    ctx.fillText(word, item.x, item.y + item.r + 25);
  });

  // Particles
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
initLetter(0);
update();