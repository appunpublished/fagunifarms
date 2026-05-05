/*************************************************
 * CANVAS SETUP
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  layout();
}
window.addEventListener("resize", resize);
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

/*************************************************
 * DATA
 *************************************************/
const INSTRUMENTS = [
  { key: "xylophone", color: "#81C784", accent: "#E91E63", sound: "xylophone", word: { en: "Xylophone", es: "Xilofono", fr: "Xylophone", de: "Xylophon" } },
  { key: "piano", color: "#FFFFFF", accent: "#222222", sound: "piano", word: { en: "Piano", es: "Piano", fr: "Piano", de: "Klavier" } },
  { key: "drum", color: "#64B5F6", accent: "#E53935", sound: "drum", word: { en: "Drum", es: "Tambor", fr: "Tambour", de: "Trommel" } },
  { key: "guitar", color: "#FFB74D", accent: "#8D5524", sound: "strings", word: { en: "Guitar", es: "Guitarra", fr: "Guitare", de: "Gitarre" } },
  { key: "flute", color: "#B0BEC5", accent: "#607D8B", sound: "flute", word: { en: "Flute", es: "Flauta", fr: "Flute", de: "Flote" } },
  { key: "trumpet", color: "#FFD54F", accent: "#F57F17", sound: "brass", word: { en: "Trumpet", es: "Trompeta", fr: "Trompette", de: "Trompete" } },
  { key: "violin", color: "#CE8A48", accent: "#5D2F17", sound: "violin", word: { en: "Violin", es: "Violin", fr: "Violon", de: "Violine" } },
  { key: "maracas", color: "#FF8A80", accent: "#43A047", sound: "shake", word: { en: "Maracas", es: "Maracas", fr: "Maracas", de: "Maracas" } }
];

const NOTES = [
  { name: "Do", key: "1", freq: 262, color: "#EF5350" },
  { name: "Re", key: "2", freq: 294, color: "#FFB300" },
  { name: "Mi", key: "3", freq: 330, color: "#66BB6A" },
  { name: "Fa", key: "4", freq: 349, color: "#26A69A" },
  { name: "So", key: "5", freq: 392, color: "#42A5F5" },
  { name: "La", key: "6", freq: 440, color: "#7E57C2" },
  { name: "Ti", key: "7", freq: 494, color: "#EC407A" },
  { name: "Do", key: "8", freq: 523, color: "#FF7043" }
];

const langMap = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" };
function getLangKey() { return localStorage.getItem("appLang") || "en"; }
function getLangCode() { return langMap[getLangKey()] || "en-US"; }

/*************************************************
 * STATE
 *************************************************/
let selectorPads = [];
let playZones = [];
let particles = [];
let selectedIndex = 0;
let activeZone = "";
let activeUntil = 0;
let audioCtx = null;
let stage = { x: 0, y: 0, w: 0, h: 0 };

function selectedInstrument() {
  return INSTRUMENTS[selectedIndex];
}

function layout() {
  const side = Math.max(12, Math.min(28, canvas.width * 0.045));
  const isWide = canvas.width >= 720;
  const cols = isWide ? 8 : 4;
  const gap = 8;
  const top = 92;
  const padW = (canvas.width - side * 2 - gap * (cols - 1)) / cols;
  const padH = Math.max(54, Math.min(76, padW * 0.72));

  selectorPads = INSTRUMENTS.map((instrument, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...instrument,
      x: side + col * (padW + gap),
      y: top + row * (padH + gap),
      w: padW,
      h: padH
    };
  });

  const rows = Math.ceil(INSTRUMENTS.length / cols);
  stage = {
    x: side,
    y: top + rows * (padH + gap) + 30,
    w: canvas.width - side * 2,
    h: canvas.height - (top + rows * (padH + gap) + 58)
  };
  buildPlayZones();
}

function buildPlayZones() {
  const instrument = selectedInstrument();
  playZones = [];
  if (instrument.key === "piano") buildPianoZones();
  else if (instrument.key === "xylophone") buildXylophoneZones();
  else if (instrument.key === "drum") buildDrumZones();
  else if (instrument.key === "guitar") buildStringZones("guitar");
  else if (instrument.key === "violin") buildStringZones("violin");
  else if (instrument.key === "flute") buildFluteZones();
  else if (instrument.key === "trumpet") buildTrumpetZones();
  else if (instrument.key === "maracas") buildMaracasZones();
}

function buildPianoZones() {
  const keyW = stage.w / NOTES.length;
  const keyH = Math.min(stage.h * 0.72, 260);
  const y = stage.y + stage.h * 0.18;
  NOTES.forEach((note, i) => {
    playZones.push({ ...note, id: note.name + i, shape: "rect", x: stage.x + i * keyW, y, w: keyW, h: keyH });
  });
}

function buildXylophoneZones() {
  const gap = 8;
  const barW = (stage.w - gap * (NOTES.length - 1)) / NOTES.length;
  const maxH = Math.min(stage.h * 0.78, 250);
  const baseY = stage.y + stage.h * 0.18;
  NOTES.forEach((note, i) => {
    const h = maxH - i * (maxH * 0.045);
    playZones.push({ ...note, id: note.name + i, shape: "rect", x: stage.x + i * (barW + gap), y: baseY + (maxH - h) / 2, w: barW, h });
  });
}

function buildDrumZones() {
  const centers = [
    [0.25, 0.34, 0.18], [0.5, 0.29, 0.2], [0.75, 0.34, 0.18],
    [0.35, 0.66, 0.2], [0.65, 0.66, 0.2]
  ];
  centers.forEach((item, i) => {
    const note = NOTES[i + 1];
    playZones.push({ ...note, id: "drum" + i, shape: "circle", x: stage.x + stage.w * item[0], y: stage.y + stage.h * item[1], r: Math.min(stage.w, stage.h) * item[2] });
  });
}

function buildStringZones(kind) {
  const strings = kind === "guitar" ? 6 : 4;
  const startY = stage.y + stage.h * 0.24;
  const endY = stage.y + stage.h * 0.76;
  for (let i = 0; i < strings; i++) {
    const note = NOTES[Math.min(i, NOTES.length - 1)];
    const y = startY + (endY - startY) * (i / Math.max(1, strings - 1));
    playZones.push({ ...note, id: kind + i, shape: "string", x1: stage.x + stage.w * 0.16, x2: stage.x + stage.w * 0.84, y, hit: 18 + i * 2 });
  }
}

function buildFluteZones() {
  const holes = 7;
  for (let i = 0; i < holes; i++) {
    const note = NOTES[i];
    playZones.push({
      ...note,
      id: "hole" + i,
      shape: "circle",
      x: stage.x + stage.w * (0.2 + i * 0.1),
      y: stage.y + stage.h * 0.5,
      r: Math.max(18, Math.min(34, stage.w * 0.035))
    });
  }
}

function buildTrumpetZones() {
  for (let i = 0; i < 3; i++) {
    playZones.push({
      ...NOTES[i + 3],
      id: "valve" + i,
      shape: "rect",
      x: stage.x + stage.w * (0.36 + i * 0.1),
      y: stage.y + stage.h * 0.23,
      w: Math.max(42, stage.w * 0.08),
      h: stage.h * 0.34
    });
  }
  playZones.push({ ...NOTES[7], id: "bell", shape: "circle", x: stage.x + stage.w * 0.78, y: stage.y + stage.h * 0.5, r: Math.min(stage.w, stage.h) * 0.18 });
}

function buildMaracasZones() {
  playZones.push({ ...NOTES[2], id: "left-maraca", shape: "circle", x: stage.x + stage.w * 0.36, y: stage.y + stage.h * 0.42, r: Math.min(stage.w, stage.h) * 0.2 });
  playZones.push({ ...NOTES[5], id: "right-maraca", shape: "circle", x: stage.x + stage.w * 0.64, y: stage.y + stage.h * 0.42, r: Math.min(stage.w, stage.h) * 0.2 });
}

/*************************************************
 * AUDIO
 *************************************************/
function ensureAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type, gainValue, delay = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  const now = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

function playNoise(duration, gainValue, delay = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ac.createBufferSource();
  const gain = ac.createGain();
  const now = ac.currentTime + delay;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(gain);
  gain.connect(ac.destination);
  source.start(now);
}

function playInstrumentSound(sound, freq = 392) {
  if (sound === "drum") {
    playTone(Math.max(70, freq / 3), 0.16, "sine", 0.5);
    playNoise(0.12, 0.24);
  } else if (sound === "strings") {
    playTone(freq, 0.42, "triangle", 0.16);
    playTone(freq * 2.01, 0.22, "sine", 0.04);
  } else if (sound === "piano") {
    playTone(freq, 0.48, "sine", 0.18);
    playTone(freq * 1.5, 0.26, "triangle", 0.05);
  } else if (sound === "brass") {
    playTone(freq, 0.34, "sawtooth", 0.1);
    playTone(freq * 2, 0.18, "square", 0.03);
  } else if (sound === "violin") {
    playTone(freq, 0.55, "triangle", 0.13);
    playTone(freq * 1.01, 0.5, "sine", 0.05);
  } else if (sound === "flute") {
    playTone(freq * 2, 0.38, "sine", 0.12);
  } else if (sound === "xylophone") {
    playTone(freq, 0.2, "square", 0.08);
    playTone(freq * 2, 0.16, "sine", 0.04);
  } else if (sound === "shake") {
    playNoise(0.09, 0.18);
    playNoise(0.09, 0.18, 0.12);
  }
}

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = getLangCode();
    msg.rate = 0.85;
    msg.pitch = 1.12;
    window.speechSynthesis.speak(msg);
  }
}

function instrumentName(instrument) {
  return instrument.word[getLangKey()] || instrument.word.en;
}

function speakInstrumentName(instrument) {
  speak(instrumentName(instrument));
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  const px = e.clientX;
  const py = e.clientY;

  for (let i = 0; i < selectorPads.length; i++) {
    const pad = selectorPads[i];
    if (inRect(px, py, pad)) {
      selectedIndex = i;
      buildPlayZones();
      activeZone = "";
      speakInstrumentName(pad);
      createSparkle(pad.x + pad.w / 2, pad.y + pad.h / 2, pad.accent);
      if ("vibrate" in navigator) navigator.vibrate(20);
      return;
    }
  }

  for (const zone of playZones) {
    if (hitZone(px, py, zone)) {
      playZone(zone);
      return;
    }
  }

  if (inRect(px, py, stage)) {
    speakInstrumentName(selectedInstrument());
    createSparkle(px, py, selectedInstrument().accent);
  }
});

window.addEventListener("keydown", e => {
  const note = NOTES.find(item => item.key === e.key);
  if (!note) return;
  e.preventDefault();
  const zone = playZones[NOTES.indexOf(note) % playZones.length] || note;
  playZone({ ...zone, ...note, id: zone.id || note.key });
});

function playZone(zone) {
  const instrument = selectedInstrument();
  activeZone = zone.id;
  activeUntil = Date.now() + 260;
  playInstrumentSound(instrument.sound, zone.freq);
  createSparkle(zoneCenterX(zone), zoneCenterY(zone), instrument.accent);
  if ("vibrate" in navigator) navigator.vibrate(18);
}

function inRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function hitZone(px, py, zone) {
  if (zone.shape === "rect") return inRect(px, py, zone);
  if (zone.shape === "circle") return Math.hypot(px - zone.x, py - zone.y) <= zone.r;
  if (zone.shape === "string") return px >= zone.x1 && px <= zone.x2 && Math.abs(py - zone.y) <= zone.hit;
  return false;
}

function zoneCenterX(zone) {
  if (zone.shape === "rect") return zone.x + zone.w / 2;
  if (zone.shape === "string") return (zone.x1 + zone.x2) / 2;
  return zone.x;
}

function zoneCenterY(zone) {
  if (zone.shape === "rect") return zone.y + zone.h / 2;
  if (zone.shape === "string") return zone.y;
  return zone.y;
}

function createSparkle(x, y, color) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 32,
      color,
      size: Math.random() * 5 + 2
    });
  }
}

/*************************************************
 * DRAWING HELPERS
 *************************************************/
function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTextFit(text, x, y, maxWidth, startSize, color) {
  let fontSize = startSize;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  do {
    ctx.font = `bold ${fontSize}px system-ui`;
    if (ctx.measureText(text).width <= maxWidth || fontSize <= 10) break;
    fontSize -= 1;
  } while (fontSize > 10);
  ctx.fillText(text, x, y);
}

function drawInstrumentIcon(instrument, cx, cy, s) {
  if (instrument.key === "xylophone") drawMiniXylophone(cx, cy, s);
  else if (instrument.key === "piano") drawMiniPiano(cx, cy, s);
  else if (instrument.key === "drum") drawMiniDrum(cx, cy, s, instrument);
  else if (instrument.key === "guitar") drawMiniGuitar(cx, cy, s, instrument);
  else if (instrument.key === "flute") drawMiniFlute(cx, cy, s, instrument);
  else if (instrument.key === "trumpet") drawMiniTrumpet(cx, cy, s, instrument);
  else if (instrument.key === "violin") drawMiniViolin(cx, cy, s, instrument);
  else if (instrument.key === "maracas") drawMiniMaracas(cx, cy, s, instrument);
}

/*************************************************
 * DRAWING
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#F6FBF2");
  grad.addColorStop(0.5, "#E3F2FD");
  grad.addColorStop(1, "#FFF3E0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#263238";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.min(30, Math.max(22, canvas.width * 0.06))}px system-ui`;
  ctx.fillText("Music Instruments", canvas.width / 2, 42);

  ctx.font = `600 ${Math.min(16, Math.max(13, canvas.width * 0.035))}px system-ui`;
  ctx.fillStyle = "#546E7A";
  ctx.fillText("Choose one, then tap the instrument", canvas.width / 2, 74);

  drawSelector();
  drawPlayableInstrument();
  drawParticles();
}

function drawSelector() {
  selectorPads.forEach((pad, index) => {
    const selected = index === selectedIndex;
    ctx.shadowColor = "rgba(38, 50, 56, 0.14)";
    ctx.shadowBlur = selected ? 12 : 5;
    ctx.shadowOffsetY = selected ? 4 : 2;
    ctx.fillStyle = selected ? "#FFFDE7" : "rgba(255, 255, 255, 0.9)";
    roundRect(pad.x, pad.y, pad.w, pad.h, 8);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = selected ? pad.accent : "rgba(84, 110, 122, 0.24)";
    ctx.lineWidth = selected ? 4 : 2;
    ctx.stroke();

    drawInstrumentIcon(pad, pad.x + pad.w / 2, pad.y + pad.h * 0.38, Math.min(pad.w, pad.h) * 0.42);
    drawTextFit(instrumentName(pad), pad.x + pad.w / 2, pad.y + pad.h - 12, pad.w - 8, 13, "#263238");
  });
}

function drawPlayableInstrument() {
  const instrument = selectedInstrument();
  drawTextFit(instrumentName(instrument), canvas.width / 2, stage.y - 14, canvas.width - 32, 20, "#263238");
  if (instrument.key === "xylophone") drawPlayableXylophone();
  else if (instrument.key === "piano") drawPlayablePiano();
  else if (instrument.key === "drum") drawPlayableDrums();
  else if (instrument.key === "guitar") drawPlayableStrings("guitar");
  else if (instrument.key === "violin") drawPlayableStrings("violin");
  else if (instrument.key === "flute") drawPlayableFlute();
  else if (instrument.key === "trumpet") drawPlayableTrumpet();
  else if (instrument.key === "maracas") drawPlayableMaracas();
}

function drawPlayableXylophone() {
  ctx.strokeStyle = "#795548";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(stage.x + 8, stage.y + stage.h * 0.18); ctx.lineTo(stage.x + stage.w - 8, stage.y + stage.h * 0.26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(stage.x + 8, stage.y + stage.h * 0.82); ctx.lineTo(stage.x + stage.w - 8, stage.y + stage.h * 0.74); ctx.stroke();

  playZones.forEach((zone, i) => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.fillStyle = zone.color;
    roundRect(zone.x, zone.y + (active ? -8 : 0), zone.w, zone.h, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = active ? 5 : 2;
    ctx.stroke();
    drawTextFit(zone.name, zone.x + zone.w / 2, zone.y + zone.h / 2 + (active ? -8 : 0), zone.w - 4, 18, "white");
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(zone.x + zone.w / 2, zone.y + 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(zone.x + zone.w / 2, zone.y + zone.h - 16, 4, 0, Math.PI * 2); ctx.fill();
    if (i === 0 || i === playZones.length - 1) drawMallet(zone.x + zone.w / 2, zone.y - 28 + i * 6);
  });
}

function drawPlayablePiano() {
  ctx.fillStyle = "#37474F";
  roundRect(stage.x, stage.y + stage.h * 0.08, stage.w, Math.min(stage.h * 0.76, 290), 10);
  ctx.fill();
  playZones.forEach((zone) => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.fillStyle = active ? "#FFF9C4" : "white";
    roundRect(zone.x + 2, zone.y + (active ? 8 : 0), zone.w - 4, zone.h - (active ? 8 : 0), 5);
    ctx.fill();
    ctx.strokeStyle = "#B0BEC5";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawTextFit(zone.name, zone.x + zone.w / 2, zone.y + zone.h - 26, zone.w - 8, 16, "#263238");
  });

  const blackPattern = [0.72, 1.72, 3.72, 4.72, 5.72];
  const keyW = stage.w / NOTES.length;
  blackPattern.forEach(pos => {
    ctx.fillStyle = "#212121";
    roundRect(stage.x + pos * keyW, playZones[0].y, keyW * 0.55, playZones[0].h * 0.56, 4);
    ctx.fill();
  });
}

function drawPlayableDrums() {
  playZones.forEach((zone, i) => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.fillStyle = active ? "#FFCDD2" : "#E3F2FD";
    ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r + (active ? 8 : 0), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = i === 1 ? "#E53935" : "#1976D2";
    ctx.lineWidth = 8;
    ctx.stroke();
    drawTextFit(i === 1 ? "Boom" : "Tap", zone.x, zone.y, zone.r * 1.4, 20, "#263238");
  });
  drawMallet(stage.x + stage.w * 0.26, stage.y + stage.h * 0.1);
  drawMallet(stage.x + stage.w * 0.74, stage.y + stage.h * 0.1);
}

function drawPlayableStrings(kind) {
  const instrument = selectedInstrument();
  const bodyX = stage.x + stage.w * 0.5;
  const bodyY = stage.y + stage.h * 0.52;
  const s = Math.min(stage.w, stage.h) * (kind === "guitar" ? 0.75 : 0.68);
  if (kind === "guitar") drawLargeGuitar(bodyX, bodyY, s, instrument);
  else drawLargeViolin(bodyX, bodyY, s, instrument);

  playZones.forEach((zone, i) => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.strokeStyle = active ? "#FFEB3B" : "#FFF8E1";
    ctx.lineWidth = active ? 5 : 2 + i * 0.25;
    ctx.beginPath();
    ctx.moveTo(zone.x1, zone.y);
    ctx.lineTo(zone.x2, zone.y);
    ctx.stroke();
  });
}

function drawPlayableFlute() {
  const cy = stage.y + stage.h * 0.5;
  ctx.strokeStyle = "#B0BEC5";
  ctx.lineWidth = Math.max(34, stage.h * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(stage.x + stage.w * 0.12, cy); ctx.lineTo(stage.x + stage.w * 0.9, cy); ctx.stroke();
  ctx.strokeStyle = "#ECEFF1";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(stage.x + stage.w * 0.12, cy - 10); ctx.lineTo(stage.x + stage.w * 0.9, cy - 10); ctx.stroke();

  playZones.forEach(zone => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.fillStyle = active ? "#FFF176" : "#455A64";
    ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r + (active ? 5 : 0), 0, Math.PI * 2); ctx.fill();
  });
}

function drawPlayableTrumpet() {
  const inst = selectedInstrument();
  const cy = stage.y + stage.h * 0.5;
  ctx.strokeStyle = inst.color;
  ctx.lineWidth = Math.max(22, stage.h * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(stage.x + stage.w * 0.1, cy); ctx.lineTo(stage.x + stage.w * 0.74, cy); ctx.stroke();
  ctx.fillStyle = inst.color;
  ctx.beginPath();
  ctx.moveTo(stage.x + stage.w * 0.7, cy - stage.h * 0.17);
  ctx.lineTo(stage.x + stage.w * 0.92, cy - stage.h * 0.3);
  ctx.lineTo(stage.x + stage.w * 0.92, cy + stage.h * 0.3);
  ctx.lineTo(stage.x + stage.w * 0.7, cy + stage.h * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = inst.accent;
  ctx.lineWidth = 5;
  ctx.stroke();

  playZones.forEach(zone => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    if (zone.shape === "rect") {
      ctx.fillStyle = active ? "#FFF176" : inst.accent;
      roundRect(zone.x, zone.y + (active ? 8 : 0), zone.w, zone.h, 8);
      ctx.fill();
    } else {
      ctx.strokeStyle = active ? "#FFF176" : inst.accent;
      ctx.lineWidth = active ? 10 : 5;
      ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2); ctx.stroke();
    }
  });
}

function drawPlayableMaracas() {
  const inst = selectedInstrument();
  playZones.forEach((zone, i) => {
    const active = zone.id === activeZone && Date.now() < activeUntil;
    ctx.strokeStyle = "#795548";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y + zone.r * 0.7);
    ctx.lineTo(zone.x + (i === 0 ? -1 : 1) * zone.r * 0.55, zone.y + zone.r * 1.85);
    ctx.stroke();
    ctx.fillStyle = active ? "#FFE082" : inst.color;
    ctx.beginPath(); ctx.ellipse(zone.x, zone.y, zone.r * 0.78, zone.r, i === 0 ? -0.35 : 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = inst.accent;
    ctx.lineWidth = 6;
    ctx.stroke();
    drawTextFit("Shake", zone.x, zone.y, zone.r * 1.1, 18, "#263238");
  });
}

function drawParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.life--;
    ctx.globalAlpha = Math.max(0, p.life / 32);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
  particles = particles.filter(p => p.life > 0);
}

/*************************************************
 * ICONS AND INSTRUMENT ART
 *************************************************/
function drawMiniXylophone(cx, cy, s) {
  const colors = ["#EF5350", "#FFCA28", "#66BB6A", "#42A5F5", "#AB47BC"];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i];
    roundRect(cx - s * 0.48 + i * s * 0.23, cy - s * 0.28 + i * 2, s * 0.16, s * 0.58 - i * 3, 4);
    ctx.fill();
  }
}

function drawMiniPiano(cx, cy, s) {
  ctx.fillStyle = "white";
  roundRect(cx - s * 0.5, cy - s * 0.28, s, s * 0.56, 4);
  ctx.fill();
  ctx.strokeStyle = "#455A64"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#222";
  for (let i = 0; i < 3; i++) roundRect(cx - s * 0.28 + i * s * 0.22, cy - s * 0.28, s * 0.11, s * 0.32, 2), ctx.fill();
}

function drawMiniDrum(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  roundRect(cx - s * 0.42, cy - s * 0.2, s * 0.84, s * 0.5, 8);
  ctx.fill();
  ctx.fillStyle = "#E3F2FD";
  ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.2, s * 0.43, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
}

function drawMiniGuitar(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.ellipse(cx - s * 0.1, cy + s * 0.05, s * 0.26, s * 0.32, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.16, cy - s * 0.08, s * 0.18, s * 0.22, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = pad.accent; ctx.lineWidth = s * 0.12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + s * 0.26, cy - s * 0.22); ctx.lineTo(cx + s * 0.5, cy - s * 0.48); ctx.stroke();
}

function drawMiniFlute(cx, cy, s, pad) {
  ctx.strokeStyle = pad.color; ctx.lineWidth = s * 0.16; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy + s * 0.08); ctx.lineTo(cx + s * 0.5, cy - s * 0.08); ctx.stroke();
  ctx.fillStyle = pad.accent;
  for (let i = 0; i < 4; i++) ctx.beginPath(), ctx.arc(cx - s * 0.22 + i * s * 0.14, cy, s * 0.025, 0, Math.PI * 2), ctx.fill();
}

function drawMiniTrumpet(cx, cy, s, pad) {
  ctx.strokeStyle = pad.color; ctx.lineWidth = s * 0.14; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - s * 0.48, cy); ctx.lineTo(cx + s * 0.2, cy); ctx.stroke();
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.moveTo(cx + s * 0.18, cy - s * 0.22); ctx.lineTo(cx + s * 0.5, cy - s * 0.34); ctx.lineTo(cx + s * 0.5, cy + s * 0.34); ctx.lineTo(cx + s * 0.18, cy + s * 0.22); ctx.closePath(); ctx.fill();
}

function drawMiniViolin(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.ellipse(cx - s * 0.1, cy - s * 0.05, s * 0.22, s * 0.28, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.08, cy + s * 0.08, s * 0.24, s * 0.3, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = pad.accent; ctx.lineWidth = s * 0.09; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + s * 0.22, cy - s * 0.2); ctx.lineTo(cx + s * 0.45, cy - s * 0.45); ctx.stroke();
}

function drawMiniMaracas(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.ellipse(cx - s * 0.2, cy - s * 0.08, s * 0.18, s * 0.26, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.2, cy - s * 0.08, s * 0.18, s * 0.26, 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#795548"; ctx.lineWidth = s * 0.08; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - s * 0.18, cy + s * 0.12); ctx.lineTo(cx - s * 0.32, cy + s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.18, cy + s * 0.12); ctx.lineTo(cx + s * 0.32, cy + s * 0.42); ctx.stroke();
}

function drawLargeGuitar(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.ellipse(cx - s * 0.13, cy + s * 0.05, s * 0.27, s * 0.34, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.17, cy - s * 0.05, s * 0.2, s * 0.25, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = pad.accent; ctx.lineWidth = s * 0.1; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + s * 0.26, cy - s * 0.16); ctx.lineTo(cx + s * 0.55, cy - s * 0.18); ctx.stroke();
  ctx.fillStyle = "#5D4037";
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2); ctx.fill();
}

function drawLargeViolin(cx, cy, s, pad) {
  ctx.fillStyle = pad.color;
  ctx.beginPath(); ctx.ellipse(cx - s * 0.1, cy - s * 0.06, s * 0.2, s * 0.28, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.12, cy + s * 0.07, s * 0.23, s * 0.31, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = pad.accent; ctx.lineWidth = s * 0.08; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + s * 0.23, cy - s * 0.2); ctx.lineTo(cx + s * 0.5, cy - s * 0.25); ctx.stroke();
  ctx.strokeStyle = "#6D4C41"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.44, cy + s * 0.34); ctx.lineTo(cx + s * 0.44, cy - s * 0.34); ctx.stroke();
}

function drawMallet(x, y) {
  ctx.strokeStyle = "#6D4C41";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x - 18, y - 16); ctx.lineTo(x + 18, y + 16); ctx.stroke();
  ctx.fillStyle = "#FFE082";
  ctx.beginPath(); ctx.arc(x - 20, y - 18, 9, 0, Math.PI * 2); ctx.fill();
}

resize();
setTimeout(() => speak("Music Instruments"), 350);
update();
