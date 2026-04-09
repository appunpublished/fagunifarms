const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const langMap = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" };

const PLANETS = [
  {
    key: "mercury",
    name: { en: "Mercury", es: "Mercurio", fr: "Mercure", de: "Merkur" },
    line: {
      en: "Mercury is the first planet. Tiny and speedy.",
      es: "Mercurio es el primer planeta. Pequeno y rapido.",
      fr: "Mercure est la premiere planete. Petite et rapide.",
      de: "Merkur ist der erste Planet. Klein und schnell."
    },
    colorA: "#c8c5c1",
    colorB: "#8f8a85",
    stripe: "#e8e3dd",
    order: 1,
    size: 0.46,
    orbitSpeed: 4.8,
    moons: []
  },
  {
    key: "venus",
    name: { en: "Venus", es: "Venus", fr: "Venus", de: "Venus" },
    line: {
      en: "Venus is bright and wrapped in clouds.",
      es: "Venus es brillante y esta cubierta de nubes.",
      fr: "Venus brille et est couverte de nuages.",
      de: "Venus leuchtet hell und hat viele Wolken."
    },
    colorA: "#f6d18b",
    colorB: "#cf8e42",
    stripe: "#ffe7b8",
    order: 2,
    size: 0.9,
    orbitSpeed: 3.5,
    moons: []
  },
  {
    key: "earth",
    name: { en: "Earth", es: "Tierra", fr: "Terre", de: "Erde" },
    line: {
      en: "Earth is our home. Blue water and green land.",
      es: "La Tierra es nuestro hogar. Agua azul y tierra verde.",
      fr: "La Terre est notre maison. Eau bleue et terre verte.",
      de: "Die Erde ist unser Zuhause. Blaues Wasser und grunes Land."
    },
    colorA: "#2d7ff9",
    colorB: "#1a4fb8",
    stripe: "#53d769",
    order: 3,
    size: 0.96,
    orbitSpeed: 2.9,
    moons: [
      { name: { en: "Moon", es: "Luna", fr: "Lune", de: "Mond" }, orbit: 1.15, size: 0.18, speed: 2.4, color: "#e8ebf1" }
    ]
  },
  {
    key: "mars",
    name: { en: "Mars", es: "Marte", fr: "Mars", de: "Mars" },
    line: {
      en: "Mars is the red planet. Dusty and rocky.",
      es: "Marte es el planeta rojo. Polvoriento y rocoso.",
      fr: "Mars est la planete rouge. Poussiereuse et rocheuse.",
      de: "Mars ist der rote Planet. Staubig und steinig."
    },
    colorA: "#e07a45",
    colorB: "#aa4720",
    stripe: "#f3b18a",
    order: 4,
    size: 0.7,
    orbitSpeed: 2.2,
    moons: [
      { name: { en: "Phobos", es: "Fobos", fr: "Phobos", de: "Phobos" }, orbit: 1.1, size: 0.11, speed: 3.2, color: "#d5c0b2" },
      { name: { en: "Deimos", es: "Deimos", fr: "Deimos", de: "Deimos" }, orbit: 1.5, size: 0.09, speed: 2.2, color: "#cab39f" }
    ]
  },
  {
    key: "jupiter",
    name: { en: "Jupiter", es: "Jupiter", fr: "Jupiter", de: "Jupiter" },
    line: {
      en: "Jupiter is the biggest planet. A giant gas ball.",
      es: "Jupiter es el planeta mas grande. Una gigante bola de gas.",
      fr: "Jupiter est la plus grande planete. Une enorme boule de gaz.",
      de: "Jupiter ist der grosste Planet. Eine riesige Gaskugel."
    },
    colorA: "#d8b38a",
    colorB: "#a96c49",
    stripe: "#f5e0bf",
    order: 5,
    size: 1.65,
    orbitSpeed: 1.4,
    moons: [
      { name: { en: "Io", es: "Io", fr: "Io", de: "Io" }, orbit: 1.15, size: 0.1, speed: 3.8, color: "#f7d86f" },
      { name: { en: "Europa", es: "Europa", fr: "Europe", de: "Europa" }, orbit: 1.4, size: 0.11, speed: 3.1, color: "#efe6d3" },
      { name: { en: "Ganymede", es: "Ganimedes", fr: "Ganymede", de: "Ganymed" }, orbit: 1.72, size: 0.13, speed: 2.4, color: "#bfa88f" },
      { name: { en: "Callisto", es: "Calisto", fr: "Callisto", de: "Kallisto" }, orbit: 2.04, size: 0.12, speed: 1.8, color: "#8f7965" }
    ]
  },
  {
    key: "saturn",
    name: { en: "Saturn", es: "Saturno", fr: "Saturne", de: "Saturn" },
    line: {
      en: "Saturn has beautiful rings all around it.",
      es: "Saturno tiene hermosos anillos a su alrededor.",
      fr: "Saturne a de beaux anneaux tout autour.",
      de: "Saturn hat wunderschone Ringe um sich herum."
    },
    colorA: "#dfc98c",
    colorB: "#ad9558",
    stripe: "#f5eab9",
    order: 6,
    size: 1.4,
    ring: true,
    orbitSpeed: 1.05,
    moons: [
      { name: { en: "Titan", es: "Titan", fr: "Titan", de: "Titan" }, orbit: 1.25, size: 0.13, speed: 2.7, color: "#d9b376" },
      { name: { en: "Enceladus", es: "Encelado", fr: "Encelade", de: "Enceladus" }, orbit: 1.55, size: 0.08, speed: 3.6, color: "#eaf1ff" },
      { name: { en: "Rhea", es: "Rea", fr: "Rhea", de: "Rhea" }, orbit: 1.88, size: 0.1, speed: 2.2, color: "#cfcbbe" }
    ]
  },
  {
    key: "uranus",
    name: { en: "Uranus", es: "Urano", fr: "Uranus", de: "Uranus" },
    line: {
      en: "Uranus is chilly and blue-green.",
      es: "Urano es frio y azul verdoso.",
      fr: "Uranus est froid et bleu vert.",
      de: "Uranus ist kalt und blaugrun."
    },
    colorA: "#9be3e8",
    colorB: "#53bbc8",
    stripe: "#d8fbff",
    order: 7,
    size: 1.1,
    orbitSpeed: 0.75,
    moons: [
      { name: { en: "Titania", es: "Titania", fr: "Titania", de: "Titania" }, orbit: 1.2, size: 0.11, speed: 2.0, color: "#d9f0f7" },
      { name: { en: "Oberon", es: "Oberon", fr: "Oberon", de: "Oberon" }, orbit: 1.5, size: 0.1, speed: 1.5, color: "#b8d5dd" },
      { name: { en: "Ariel", es: "Ariel", fr: "Ariel", de: "Ariel" }, orbit: 1.8, size: 0.08, speed: 2.7, color: "#ecfcff" }
    ]
  },
  {
    key: "neptune",
    name: { en: "Neptune", es: "Neptuno", fr: "Neptune", de: "Neptun" },
    line: {
      en: "Neptune is deep blue and very windy.",
      es: "Neptuno es azul profundo y muy ventoso.",
      fr: "Neptune est bleu fonce et tres venteuse.",
      de: "Neptun ist tiefblau und sehr windig."
    },
    colorA: "#537bff",
    colorB: "#2747b0",
    stripe: "#9db3ff",
    order: 8,
    size: 1.06,
    orbitSpeed: 0.58,
    moons: [
      { name: { en: "Triton", es: "Triton", fr: "Triton", de: "Triton" }, orbit: 1.2, size: 0.12, speed: 2.3, color: "#f2d8cb" },
      { name: { en: "Nereid", es: "Nereida", fr: "Nereide", de: "Nereide" }, orbit: 1.62, size: 0.08, speed: 1.6, color: "#d4d7e3" },
      { name: { en: "Proteus", es: "Proteo", fr: "Protee", de: "Proteus" }, orbit: 1.92, size: 0.09, speed: 2.8, color: "#bbb5a8" }
    ]
  },
  {
    key: "pluto",
    name: { en: "Pluto", es: "Pluton", fr: "Pluton", de: "Pluto" },
    line: {
      en: "Pluto is a dwarf planet far away and icy.",
      es: "Pluton es un planeta enano, lejano y helado.",
      fr: "Pluton est une planete naine, lointaine et glacee.",
      de: "Pluto ist ein ferner und eisiger Zwergplanet."
    },
    colorA: "#d8c7be",
    colorB: "#9d8174",
    stripe: "#f2e7dd",
    order: 9,
    size: 0.38,
    orbitSpeed: 0.34,
    dwarf: true,
    moons: [
      { name: { en: "Charon", es: "Caronte", fr: "Charon", de: "Charon" }, orbit: 1.25, size: 0.2, speed: 2.1, color: "#b39d90" },
      { name: { en: "Nix", es: "Nix", fr: "Nix", de: "Nix" }, orbit: 1.7, size: 0.07, speed: 1.5, color: "#ddd7d4" },
      { name: { en: "Hydra", es: "Hidra", fr: "Hydre", de: "Hydra" }, orbit: 2.02, size: 0.07, speed: 1.2, color: "#cbc7bf" }
    ]
  }
];

const LABELS = {
  title: {
    en: "Solar System Explorer",
    es: "Explorador del Sistema Solar",
    fr: "Explorateur du Systeme Solaire",
    de: "Sonnensystem Entdecker"
  },
  tapPlanet: {
    en: "Tap the big planet, its moons, or the Sun",
    es: "Toca el planeta grande, sus lunas o el Sol",
    fr: "Touche la grande planete, ses lunes ou le Soleil",
    de: "Tippe den grossen Planeten, seine Monde oder die Sonne an"
  },
  fromSun: {
    en: "from the Sun",
    es: "desde el Sol",
    fr: "depuis le Soleil",
    de: "von der Sonne aus"
  },
  sun: {
    en: "The Sun is a star.",
    es: "El Sol es una estrella.",
    fr: "Le Soleil est une etoile.",
    de: "Die Sonne ist ein Stern."
  },
  moons: {
    en: "Moons",
    es: "Lunas",
    fr: "Lunes",
    de: "Monde"
  },
  noMoons: {
    en: "No known moons here.",
    es: "No tiene lunas conocidas.",
    fr: "Pas de lunes connues ici.",
    de: "Hier gibt es keine bekannten Monde."
  },
  asteroidBelt: {
    en: "Asteroid Belt",
    es: "Cinturon de asteroides",
    fr: "Ceinture d asteroides",
    de: "Asteroidengurtel"
  },
  dwarf: {
    en: "dwarf planet",
    es: "planeta enano",
    fr: "planete naine",
    de: "Zwergplanet"
  },
  planet: {
    en: "planet",
    es: "planeta",
    fr: "planete",
    de: "Planet"
  }
};

let currentIndex = 2;
let particles = [];
let stars = [];
let asteroids = [];
let leftArrow = { x: 40, y: 0, r: 28 };
let rightArrow = { x: 0, y: 0, r: 28 };
let bigPlanet = { x: 0, y: 0, r: 0 };
let sunButton = { x: 0, y: 0, r: 0 };
let timelineButtons = [];
let moonButtons = [];
let overviewCenter = { x: 0, y: 0 };

function getLangKey() {
  return localStorage.getItem("appLang") || "en";
}

function t(entry) {
  return entry[getLangKey()] || entry.en;
}

function getLangCode() {
  return langMap[getLangKey()] || "en-US";
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = getLangCode();
  msg.rate = 0.88;
  msg.pitch = 1.08;
  window.speechSynthesis.speak(msg);
}

function getPlanetAnnouncement(planet) {
  const typeLabel = planet.dwarf ? t(LABELS.dwarf) : t(LABELS.planet);
  const moonCount = planet.moons.length;
  let moonText = t(LABELS.noMoons);
  if (moonCount > 0) {
    const names = planet.moons.map(moon => t(moon.name)).join(", ");
    moonText = `${t(LABELS.moons)}: ${names}.`;
  }
  return `${t(planet.name)}. ${planet.order} ${t(LABELS.fromSun)}. ${typeLabel}. ${t(planet.line)} ${moonText}`;
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildStars();
  buildAsteroids();
  updateHitAreas(Date.now() / 1000);
}

function buildStars() {
  const starCount = Math.max(40, Math.floor((canvas.width * canvas.height) / 11000));
  stars = Array.from({ length: starCount }, (_, index) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2.2 + 0.6,
    phase: index * 0.45 + Math.random() * 4
  }));
}

function buildAsteroids() {
  asteroids = Array.from({ length: 56 }, (_, index) => ({
    orbit: 4.55 + Math.random() * 0.45,
    angle: (Math.PI * 2 * index) / 56 + Math.random() * 0.3,
    speed: 0.18 + Math.random() * 0.22,
    size: 1.8 + Math.random() * 2.8,
    tilt: Math.random() * 0.8 - 0.4
  }));
}

function getOverviewOrbit(planetIndex) {
  const minR = Math.min(canvas.width, canvas.height) * 0.055;
  const maxR = Math.min(canvas.width, canvas.height) * 0.26;
  const ratio = planetIndex / (PLANETS.length - 1 || 1);
  return minR + (maxR - minR) * ratio;
}

function updateHitAreas(timeSeconds) {
  overviewCenter.x = canvas.width * 0.5;
  overviewCenter.y = canvas.height * 0.25;

  leftArrow.y = canvas.height * 0.52;
  rightArrow.x = canvas.width - 40;
  rightArrow.y = canvas.height * 0.52;

  bigPlanet.r = Math.min(canvas.width, canvas.height) * 0.12 * PLANETS[currentIndex].size;
  bigPlanet.r = Math.max(40, Math.min(bigPlanet.r, 118));
  bigPlanet.x = canvas.width * 0.5;
  bigPlanet.y = canvas.height * 0.56;

  sunButton.r = Math.min(canvas.width, canvas.height) * 0.06;
  sunButton.r = Math.max(28, Math.min(sunButton.r, 54));
  sunButton.x = overviewCenter.x;
  sunButton.y = overviewCenter.y;

  const spacing = canvas.width / (PLANETS.length + 1);
  const timelineY = canvas.height * 0.9;
  timelineButtons = PLANETS.map((planet, index) => ({
    x: spacing * (index + 1),
    y: timelineY,
    r: Math.max(11, Math.min(18, 9 + planet.size * 6)),
    index
  }));

  const planet = PLANETS[currentIndex];
  moonButtons = planet.moons.map((moon, index) => {
    const orbitRadius = bigPlanet.r * moon.orbit;
    const angle = timeSeconds * moon.speed + index * 2.2;
    return {
      x: bigPlanet.x + Math.cos(angle) * orbitRadius,
      y: bigPlanet.y + Math.sin(angle * 0.92) * orbitRadius * 0.72,
      r: Math.max(6, bigPlanet.r * moon.size),
      moon,
      index
    };
  });
}

function setPlanet(index, announce = true) {
  currentIndex = index;
  updateHitAreas(Date.now() / 1000);
  if (announce) {
    const planet = PLANETS[currentIndex];
    setTimeout(() => {
      speak(getPlanetAnnouncement(planet));
    }, 120);
  }
}

function createBurst(x, y, color) {
  for (let i = 0; i < 22; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      life: 34,
      color,
      size: Math.random() * 5 + 2
    });
  }
}

function isInsideCircle(px, py, target) {
  return Math.hypot(px - target.x, py - target.y) <= target.r;
}

function drawWrappedText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let drawY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = `${line}${words[i]} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, drawY);
      line = `${words[i]} `;
      drawY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line.trim(), x, drawY);
}

function drawPlanetBody(planet, x, y, radius, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(
    x - radius * 0.28,
    y - radius * 0.35,
    radius * 0.15,
    x,
    y,
    radius
  );
  grad.addColorStop(0, planet.stripe);
  grad.addColorStop(0.55, planet.colorA);
  grad.addColorStop(1, planet.colorB);

  if (planet.ring) {
    ctx.strokeStyle = "rgba(232, 218, 177, 0.85)";
    ctx.lineWidth = Math.max(4, radius * 0.18);
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.55, radius * 0.55, -0.24, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(2, radius * 0.05);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.28;
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = planet.stripe;
    ctx.beginPath();
    ctx.ellipse(x, y + i * radius * 0.3, radius * 0.78, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (planet.key === "earth") {
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = "#49c56c";
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.22, y - radius * 0.08, radius * 0.18, radius * 0.26, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.16, y + radius * 0.08, radius * 0.24, radius * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (planet.key === "jupiter") {
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = "#c96c49";
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.28, y + radius * 0.2, radius * 0.16, radius * 0.11, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (planet.key === "pluto") {
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = "#7d5e56";
    ctx.beginPath();
    ctx.arc(x + radius * 0.2, y + radius * 0.18, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

canvas.addEventListener("pointerdown", event => {
  const px = event.clientX;
  const py = event.clientY;

  if (currentIndex > 0 && isInsideCircle(px, py, leftArrow)) {
    setPlanet(currentIndex - 1);
    createBurst(leftArrow.x, leftArrow.y, "#b7d3ff");
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }

  if (currentIndex < PLANETS.length - 1 && isInsideCircle(px, py, rightArrow)) {
    setPlanet(currentIndex + 1);
    createBurst(rightArrow.x, rightArrow.y, "#b7d3ff");
    if ("vibrate" in navigator) navigator.vibrate(20);
    return;
  }

  for (const button of timelineButtons) {
    if (isInsideCircle(px, py, button)) {
      setPlanet(button.index);
      createBurst(button.x, button.y, PLANETS[button.index].stripe);
      if ("vibrate" in navigator) navigator.vibrate(20);
      return;
    }
  }

  for (const button of moonButtons) {
    if (isInsideCircle(px, py, button)) {
      speak(`${t(button.moon.name)}. ${t(LABELS.moons)} of ${t(PLANETS[currentIndex].name)}.`);
      createBurst(button.x, button.y, button.moon.color);
      if ("vibrate" in navigator) navigator.vibrate(20);
      return;
    }
  }

  if (isInsideCircle(px, py, sunButton)) {
    speak(t(LABELS.sun));
    createBurst(sunButton.x, sunButton.y, "#ffd55a");
    if ("vibrate" in navigator) navigator.vibrate(30);
    return;
  }

  if (isInsideCircle(px, py, bigPlanet)) {
    const planet = PLANETS[currentIndex];
    speak(getPlanetAnnouncement(planet));
    createBurst(bigPlanet.x, bigPlanet.y, planet.stripe);
    if ("vibrate" in navigator) navigator.vibrate(30);
  }
});

document.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
window.addEventListener("resize", resize);

function drawArrowButton(button, direction) {
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(button.x, button.y, button.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (direction === "left") {
    ctx.moveTo(button.x + 8, button.y - 12);
    ctx.lineTo(button.x - 8, button.y);
    ctx.lineTo(button.x + 8, button.y + 12);
  } else {
    ctx.moveTo(button.x - 8, button.y - 12);
    ctx.lineTo(button.x + 8, button.y);
    ctx.lineTo(button.x - 8, button.y + 12);
  }
  ctx.stroke();
}

function drawOverview(time) {
  const minPlanetSize = Math.max(4, Math.min(canvas.width, canvas.height) * 0.008);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < PLANETS.length; i++) {
    const orbitRadius = getOverviewOrbit(i);
    ctx.beginPath();
    ctx.ellipse(overviewCenter.x, overviewCenter.y, orbitRadius * 1.15, orbitRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  asteroids.forEach(asteroid => {
    const angle = time * asteroid.speed + asteroid.angle;
    const x = overviewCenter.x + Math.cos(angle) * getOverviewOrbit(4) * 1.15;
    const y = overviewCenter.y + Math.sin(angle + asteroid.tilt) * getOverviewOrbit(4) * 0.5;
    ctx.fillStyle = "rgba(214, 196, 178, 0.8)";
    ctx.beginPath();
    ctx.ellipse(x, y, asteroid.size, asteroid.size * 0.7, angle, 0, Math.PI * 2);
    ctx.fill();
  });

  const sunGlow = ctx.createRadialGradient(
    sunButton.x,
    sunButton.y,
    sunButton.r * 0.2,
    sunButton.x,
    sunButton.y,
    sunButton.r * 2.3
  );
  sunGlow.addColorStop(0, "rgba(255, 232, 143, 0.98)");
  sunGlow.addColorStop(0.55, "rgba(255, 196, 71, 0.55)");
  sunGlow.addColorStop(1, "rgba(255, 196, 71, 0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunButton.x, sunButton.y, sunButton.r * 2.3, 0, Math.PI * 2);
  ctx.fill();

  drawPlanetBody({ colorA: "#ffc533", colorB: "#ff8f1f", stripe: "#fff1a1", key: "sun" }, sunButton.x, sunButton.y, sunButton.r);

  for (let i = 0; i < PLANETS.length; i++) {
    const planet = PLANETS[i];
    const orbitRadius = getOverviewOrbit(i);
    const angle = time * planet.orbitSpeed * 0.15 + i * 0.58;
    const x = overviewCenter.x + Math.cos(angle) * orbitRadius * 1.15;
    const y = overviewCenter.y + Math.sin(angle) * orbitRadius * 0.5;
    const radius = Math.max(minPlanetSize, minPlanetSize * (0.8 + planet.size * 0.9));
    const alpha = i === currentIndex ? 1 : 0.8;

    if (i === currentIndex) {
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawPlanetBody(planet, x, y, radius, alpha);
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "600 12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(t(LABELS.asteroidBelt), overviewCenter.x + getOverviewOrbit(4) * 0.9, overviewCenter.y - 6);
}

function drawBigPlanetMoons(time, planet) {
  moonButtons.forEach((moonButton, index) => {
    const orbitRadius = bigPlanet.r * planet.moons[index].orbit;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(bigPlanet.x, bigPlanet.y, orbitRadius, orbitRadius * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = planet.moons[index].color;
    ctx.beginPath();
    ctx.arc(moonButton.x, moonButton.y, moonButton.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (index < 3) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = "600 12px system-ui";
      ctx.textAlign = moonButton.x < bigPlanet.x ? "right" : "left";
      const dx = moonButton.x < bigPlanet.x ? -8 : 8;
      ctx.fillText(t(planet.moons[index].name), moonButton.x + dx, moonButton.y + 4);
    }
  });
}

function update() {
  requestAnimationFrame(update);

  const time = Date.now() / 1000;
  const planet = PLANETS[currentIndex];
  updateHitAreas(time);

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#04101d");
  bg.addColorStop(0.5, "#10254f");
  bg.addColorStop(1, "#17386f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    const glow = 0.45 + Math.sin(time * 2 + star.phase) * 0.35;
    ctx.globalAlpha = Math.max(0.2, glow);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawOverview(time);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 26px system-ui";
  ctx.fillText(t(LABELS.title), canvas.width / 2, 40);

  ctx.font = "600 16px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText(t(LABELS.tapPlanet), canvas.width / 2, 64);

  const pulse = 1 + Math.sin(time * 3) * 0.03;
  drawBigPlanetMoons(time, planet);
  drawPlanetBody(planet, bigPlanet.x, bigPlanet.y, bigPlanet.r * pulse);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.max(28, bigPlanet.r * 0.38)}px system-ui`;
  ctx.fillText(t(planet.name), canvas.width / 2, canvas.height * 0.73);

  ctx.font = "600 18px system-ui";
  ctx.fillStyle = "#cfe1ff";
  const typeLabel = planet.dwarf ? t(LABELS.dwarf) : t(LABELS.planet);
  ctx.fillText(`${planet.order} ${t(LABELS.fromSun)} - ${typeLabel}`, canvas.width / 2, canvas.height * 0.78);

  ctx.font = "600 16px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  drawWrappedText(t(planet.line), canvas.width / 2, canvas.height * 0.83, canvas.width * 0.8, 22);

  ctx.font = "600 14px system-ui";
  ctx.fillStyle = "#ffe6b3";
  const moonText = planet.moons.length
    ? `${t(LABELS.moons)}: ${planet.moons.map(moon => t(moon.name)).join(", ")}`
    : t(LABELS.noMoons);
  drawWrappedText(moonText, canvas.width / 2, canvas.height * 0.875, canvas.width * 0.84, 20);

  for (const button of timelineButtons) {
    const item = PLANETS[button.index];
    const isActive = button.index === currentIndex;

    ctx.strokeStyle = isActive ? "#ffffff" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = isActive ? 4 : 2;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(button.x, button.y, button.r + (isActive ? 8 : 4), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawPlanetBody(item, button.x, button.y, button.r, isActive ? 1 : 0.95);

    ctx.fillStyle = isActive ? "#ffffff" : "rgba(255,255,255,0.75)";
    ctx.font = "600 11px system-ui";
    ctx.fillText(item.order, button.x, button.y + button.r + 16);
  }

  if (currentIndex > 0) drawArrowButton(leftArrow, "left");
  if (currentIndex < PLANETS.length - 1) drawArrowButton(rightArrow, "right");

  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    ctx.globalAlpha = particle.life / 34;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  particles = particles.filter(particle => particle.life > 0);
}

resize();
setPlanet(currentIndex, false);
setTimeout(() => {
  speak(getPlanetAnnouncement(PLANETS[currentIndex]));
}, 250);
update();

