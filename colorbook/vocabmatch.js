/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/*************************************************
 * GAME STATE & DICTIONARY
 *************************************************/
const DICTIONARY = [
  { emoji: "🍎", en: "Apple", es: "Manzana", fr: "Pomme", de: "Apfel" },
  { emoji: "🐶", en: "Dog", es: "Perro", fr: "Chien", de: "Hund" },
  { emoji: "🐱", en: "Cat", es: "Gato", fr: "Chat", de: "Katze" },
  { emoji: "🚗", en: "Car", es: "Coche", fr: "Voiture", de: "Auto" },
  { emoji: "☀️", en: "Sun", es: "Sol", fr: "Soleil", de: "Sonne" },
  { emoji: "🌙", en: "Moon", es: "Luna", fr: "Lune", de: "Mond" },
  { emoji: "⭐", en: "Star", es: "Estrella", fr: "Étoile", de: "Stern" },
  { emoji: "🌳", en: "Tree", es: "Árbol", fr: "Arbre", de: "Baum" },
  { emoji: "💧", en: "Water", es: "Agua", fr: "Eau", de: "Wasser" },
  { emoji: "🔥", en: "Fire", es: "Fuego", fr: "Feu", de: "Feuer" },
  { emoji: "🏠", en: "House", es: "Casa", fr: "Maison", de: "Haus" },
  { emoji: "🎈", en: "Balloon", es: "Globo", fr: "Ballon", de: "Ballon" },
  { emoji: "🐄", en: "Cow", es: "Vaca", fr: "Vache", de: "Kuh" },
  { emoji: "🐷", en: "Pig", es: "Cerdo", fr: "Cochon", de: "Schwein" },
  { emoji: "🍓", en: "Strawberry", es: "Fresa", fr: "Fraise", de: "Erdbeere" }
];

const LANGUAGES = [
  { code: "en-US", label: "🇬🇧 English", key: "en" },
  { code: "es-ES", label: "🇪🇸 Español", key: "es" },
  { code: "fr-FR", label: "🇫🇷 Français", key: "fr" },
  { code: "de-DE", label: "🇩🇪 Deutsch", key: "de" }
];

let currentLangIdx = 1; // Start with Spanish to highlight learning a new language
let isPlaying = false;
let score = 0;
let options = [];
let targetItem = null;
let particles = [];
let waitingForNext = false;

function speak(text, langCode) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = langCode;
    msg.rate = 0.75; // Slower for kids
    msg.pitch = 1.3; // Higher, friendlier pitch
    window.speechSynthesis.speak(msg);
  }
}

function startRound() {
  waitingForNext = false;
  let shuffled = [...DICTIONARY].sort(() => Math.random() - 0.5);
  options = shuffled.slice(0, 3);
  targetItem = options[Math.floor(Math.random() * 3)];

  // Calculate positions for options
  const spacing = canvas.width / 4;
  const radius = Math.min(75, canvas.width / 6); // Bigger targets for kids
  options.forEach((opt, i) => {
    opt.x = spacing * (i + 1);
    opt.y = canvas.height * 0.60;
    opt.radius = radius;
    opt.color = ["#FF3B30", "#34C759", "#007AFF"][i];
    opt.wrong = false;
    opt.baseY = opt.y; // For bouncing animation
  });

  const lang = LANGUAGES[currentLangIdx];
  speak(targetItem[lang.key], lang.code);
}

function initGame() {
  isPlaying = true;
  score = 0;
  particles = [];
  startRound();
}

function createPop(x, y, color) {
  for (let i = 0; i < 30; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
      life: 40, color, size: Math.random() * 6 + 2
    });
  }
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying) {
    initGame();
    return;
  }

  const px = e.clientX;
  const py = e.clientY;

  // Check Language Switch Button
  const btnW = 140;
  const btnH = 40;
  const btnX = canvas.width - btnW - 10;
  const btnY = 10;
  if (px >= btnX && px <= btnX + btnW && py >= btnY && py <= btnY + btnH) {
    currentLangIdx = (currentLangIdx + 1) % LANGUAGES.length;
    const lang = LANGUAGES[currentLangIdx];
    if (targetItem) speak(targetItem[lang.key], lang.code);
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }

  // Check Target Word (Speak again)
  const wordY = canvas.height * 0.35;
  if (py > wordY - 60 && py < wordY + 60 && !waitingForNext) {
    const lang = LANGUAGES[currentLangIdx];
    if (targetItem) speak(targetItem[lang.key], lang.code);
    return;
  }

  if (waitingForNext) return;

  // Check Emojis Option
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (Math.hypot(px - opt.x, py - opt.y) < opt.radius) {
      if (opt === targetItem) {
        score += 10;
        createPop(opt.x, opt.y, opt.color);
        
        const praises = ["Yay!", "Good job!", "Awesome!", "Wow!", "Super!"];
        const praise = praises[Math.floor(Math.random() * praises.length)];
        setTimeout(() => {
          speak(praise, "en-US"); 
        }, 200);
        
        if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]);
        waitingForNext = true;
        setTimeout(startRound, 1500);
      } else {
        opt.wrong = true;
        if ("vibrate" in navigator) navigator.vibrate(100);
      }
      break;
    }
  }
});

/*************************************************
 * GAME LOOP & RENDERING
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#E0F7FA");
  grad.addColorStop(1, "#B2EBF2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isPlaying) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("VOCAB SAFARI", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start learning", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  // HUD Background
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 60);

  // Score & Header
  ctx.fillStyle = "white";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 38);

  const lang = LANGUAGES[currentLangIdx];
  
  // Language Button Frame
  const btnW = 140; const btnH = 40;
  const btnX = canvas.width - btnW - 10; const btnY = 10;
  ctx.fillStyle = "#FF9500";
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  
  // Language Button Text
  ctx.fillStyle = "white";
  ctx.font = "bold 16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(lang.label, btnX + btnW / 2, btnY + 26);

  // Draw the Target Word
  if (targetItem) {
    ctx.fillStyle = "#007AFF"; // More colorful target word
    ctx.font = "bold 56px system-ui";
    ctx.textAlign = "center";
    const word = targetItem[lang.key];
    ctx.fillText(`${word} 🔊`, canvas.width / 2, canvas.height * 0.35);

    ctx.font = "18px system-ui";
    ctx.fillStyle = "#666";
    ctx.fillText("Tap the word to hear it again!", canvas.width / 2, canvas.height * 0.35 + 40);
  }
  
  const time = Date.now();

  // Draw the Emoji Options
  options.forEach((opt, i) => {
    if (opt.wrong) ctx.globalAlpha = 0.3;
    if (!opt.wrong && !waitingForNext) opt.y = opt.baseY + Math.sin(time / 200 + i) * 10; // Bouncing effect

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(opt.x, opt.y, opt.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = opt.wrong ? "#aaa" : opt.color;
    ctx.stroke();

    ctx.font = `${opt.radius * 1.1}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opt.emoji, opt.x, opt.y + 10);

    ctx.globalAlpha = 1.0;
  });

  // Particle Effects
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
  });
  particles = particles.filter(p => p.life > 0);
}

update();