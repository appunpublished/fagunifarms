const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("scoreText");
const roundText = document.getElementById("waveText");
const healthText = document.getElementById("healthText");
const tipText = document.getElementById("tipText");
const controlButtons = document.querySelectorAll("[data-control]");

const keys = {};
const held = {
  left: false,
  right: false,
  up: false,
  down: false,
  run: false,
  block: false
};

let player;
let opponent;
let particles = [];
let cameraX = 0;
let score = 0;
let round = 1;
let running = false;
let gameOver = false;
let roundWon = false;
let lastTime = 0;
let groundY = 0;
let worldWidth = 1280;
let pendingMove = null;
let shake = 0;
let announceTimer = 0;
let announceText = "";
let roundResetTimer = 0;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  groundY = window.innerHeight - Math.min(132, Math.max(106, window.innerHeight * 0.18));
  worldWidth = Math.max(920, window.innerWidth * 1.14);
  if (player) player.y = Math.min(player.y, groundY);
  if (opponent) opponent.y = Math.min(opponent.y, groundY);
}

window.addEventListener("resize", resize);
document.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
document.addEventListener("gesturestart", event => event.preventDefault());
document.addEventListener("gesturechange", event => event.preventDefault());

function makeFighter(x, facing, name, color, accent, isPlayer) {
  return {
    x,
    y: groundY,
    vx: 0,
    vy: 0,
    h: isPlayer ? 92 : 96,
    facing,
    name,
    color,
    accent,
    hp: 100,
    energy: isPlayer ? 78 : 100,
    grounded: true,
    ducking: false,
    blocking: false,
    attack: null,
    attackTimer: 0,
    attackCooldown: 0,
    hurtTimer: 0,
    invincible: 0,
    jumpCooldown: 0,
    aiCooldown: 24,
    footstep: 0,
    isPlayer
  };
}

function resetRound() {
  const leftStart = Math.max(160, window.innerWidth * 0.25);
  const rightStart = Math.min(worldWidth - 170, leftStart + Math.min(420, window.innerWidth * 0.44));
  player = makeFighter(leftStart, 1, "You", "#172033", "#1d9bf0", true);
  opponent = makeFighter(rightStart, -1, "Rival", "#2f211c", "#c2410c", false);
  particles = [];
  cameraX = 0;
  pendingMove = null;
  roundWon = false;
  gameOver = false;
  roundResetTimer = 0;
  announce("Round " + round, 90);
  updateHud();
}

function startGame() {
  score = 0;
  round = 1;
  running = true;
  resetRound();
  tipText.textContent = "One-on-one fight. Move close, block when the rival swings, and use kick or special for easier hits.";
}

function announce(text, time) {
  announceText = text;
  announceTimer = time;
}

function updateHud() {
  scoreText.textContent = `Score ${score}`;
  roundText.textContent = `Round ${round}`;
  healthText.textContent = `HP ${Math.max(0, Math.round(player.hp))}`;
}

function setHeld(name, value) {
  if (name in held) {
    held[name] = value;
  } else if (value) {
    pendingMove = name;
  }
}

controlButtons.forEach(button => {
  const name = button.dataset.control;

  const press = event => {
    event.preventDefault();
    button.classList.add("is-held");
    if (!running || gameOver) {
      startGame();
      return;
    }
    setHeld(name, true);
  };

  const release = event => {
    event.preventDefault();
    button.classList.remove("is-held");
    setHeld(name, false);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (!running || gameOver) startGame();
  if (key === "j") pendingMove = "punch";
  if (key === "k") pendingMove = "kick";
  if (key === "l") pendingMove = "special";
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("pointerdown", () => {
  if (!running || gameOver) startGame();
});

function isDown(name) {
  if (held[name]) return true;
  if (name === "left") return keys.arrowleft || keys.a;
  if (name === "right") return keys.arrowright || keys.d;
  if (name === "up") return keys.arrowup || keys.w || keys[" "];
  if (name === "down") return keys.arrowdown || keys.s;
  if (name === "run") return keys.shift;
  if (name === "block") return keys.i;
  return false;
}

function consumeMove() {
  const move = pendingMove;
  pendingMove = null;
  return move;
}

function update() {
  if (!running || gameOver) return;

  announceTimer = Math.max(0, announceTimer - 1);
  updatePlayer();
  updateOpponent();
  updateFighterPhysics(player);
  updateFighterPhysics(opponent);
  keepFightersApart();
  updateParticles();
  resolveRound();

  if (roundResetTimer > 0) {
    roundResetTimer--;
    if (roundResetTimer === 0 && running && !gameOver) {
      round++;
      resetRound();
    }
  }

  const midpoint = (player.x + opponent.x) / 2;
  cameraX += (midpoint - window.innerWidth / 2 - cameraX) * 0.08;
  cameraX = Math.max(0, Math.min(worldWidth - window.innerWidth, cameraX));
  shake = Math.max(0, shake - 1);
  updateHud();
}

function updatePlayer() {
  tickFighter(player);
  player.facing = opponent.x >= player.x ? 1 : -1;
  player.ducking = isDown("down") && player.grounded;
  player.blocking = isDown("block") && !player.attack && player.grounded;

  const speed = isDown("run") && !player.ducking && !player.blocking ? 6.5 : 4.0;
  player.vx = 0;
  if (!player.blocking && !player.attack) {
    if (isDown("left")) player.vx -= speed;
    if (isDown("right")) player.vx += speed;
  }

  if (isDown("up") && player.grounded && !player.blocking && !player.ducking) {
    jump(player, -13.4, 18);
  }

  const move = consumeMove();
  if (move) startAttack(player, move);
  if (player.attack) updateAttack(player, opponent);
}

function updateOpponent() {
  tickFighter(opponent);
  opponent.facing = player.x >= opponent.x ? 1 : -1;

  const distance = Math.abs(player.x - opponent.x);
  const playerAttacking = player.attack && player.attackTimer > player.attack.total - 8;
  opponent.blocking = false;
  opponent.ducking = false;
  opponent.vx = 0;

  if (opponent.hurtTimer === 0 && !opponent.attack && !roundWon) {
    if (playerAttacking && distance < 122 && opponent.grounded && Math.random() < 0.2) {
      opponent.blocking = true;
    } else if (distance > 126) {
      opponent.vx = opponent.facing * (2.1 + round * 0.18);
      if (distance > 230 && opponent.grounded && opponent.jumpCooldown <= 0 && Math.random() < 0.018) {
        jump(opponent, -11.8, 70);
        opponent.vx = opponent.facing * 4.5;
      }
    } else {
      opponent.aiCooldown--;
      if (opponent.grounded && opponent.jumpCooldown <= 0 && Math.random() < 0.012) {
        jump(opponent, -10.4, 86);
        opponent.vx = -opponent.facing * 3.4;
      }
      if (opponent.aiCooldown <= 0) {
        const choice = distance > 82 ? "kick" : Math.random() < 0.72 ? "punch" : "kick";
        startAttack(opponent, choice);
        opponent.aiCooldown = Math.max(32, 54 + Math.random() * 42 - round * 3);
      }
    }
  }

  if (opponent.attack) updateAttack(opponent, player);
}

function tickFighter(fighter) {
  fighter.attackCooldown = Math.max(0, fighter.attackCooldown - 1);
  fighter.hurtTimer = Math.max(0, fighter.hurtTimer - 1);
  fighter.invincible = Math.max(0, fighter.invincible - 1);
  fighter.jumpCooldown = Math.max(0, fighter.jumpCooldown - 1);
  fighter.energy = Math.min(100, fighter.energy + (fighter.isPlayer ? 0.24 : 0.16));
  fighter.footstep += Math.abs(fighter.vx) * 0.08;
}

function jump(fighter, power, cooldown) {
  fighter.vy = power;
  fighter.grounded = false;
  fighter.jumpCooldown = cooldown;
}

function updateFighterPhysics(fighter) {
  fighter.vy += 0.72;
  fighter.x += fighter.vx;
  fighter.y += fighter.vy;
  fighter.x = Math.max(58, Math.min(worldWidth - 58, fighter.x));
  if (fighter.y >= groundY) {
    fighter.y = groundY;
    fighter.vy = 0;
    fighter.grounded = true;
  }
}

function keepFightersApart() {
  const minDistance = 38;
  const dx = opponent.x - player.x;
  if (Math.abs(dx) < minDistance) {
    const push = (minDistance - Math.abs(dx)) / 2;
    const dir = dx >= 0 ? 1 : -1;
    player.x -= push * dir;
    opponent.x += push * dir;
  }
}

function startAttack(fighter, kind) {
  if (fighter.attack || fighter.attackCooldown > 0 || fighter.blocking) return;

  const attacks = {
    punch: { name: "punch", range: 86, damage: 13, hitFrame: 7, total: 15, energy: 0, stun: 12 },
    kick: { name: "kick", range: 112, damage: 18, hitFrame: 9, total: 20, energy: 0, stun: 15 },
    special: { name: "special", range: 148, damage: 30, hitFrame: 14, total: 30, energy: 44, stun: 20 }
  };

  const attack = attacks[kind];
  if (!attack || fighter.energy < attack.energy) return;
  fighter.energy -= attack.energy;
  fighter.attack = attack;
  fighter.attackTimer = attack.total;
  fighter.attackCooldown = Math.max(7, Math.round(attack.total * 0.48));
}

function updateAttack(attacker, target) {
  attacker.attackTimer--;
  if (attacker.attackTimer === attacker.attack.hitFrame) strikeTarget(attacker, target, attacker.attack);
  if (attacker.attackTimer <= 0) attacker.attack = null;
}

function strikeTarget(attacker, target, attack) {
  if (target.invincible > 0 || target.hp <= 0) return;

  const dx = target.x - attacker.x;
  const facingTarget = Math.sign(dx || attacker.facing) === attacker.facing;
  const yClose = Math.abs(target.y - attacker.y) < 72;
  if (!facingTarget || !yClose || Math.abs(dx) > attack.range) return;

  const blocked = target.blocking && target.facing === -attacker.facing && target.grounded;
  const damage = blocked ? Math.ceil(attack.damage * 0.28) : attack.damage;
  target.hp -= damage;
  target.hurtTimer = blocked ? 8 : attack.stun;
  target.invincible = blocked ? 9 : 14;
  target.x += attacker.facing * (blocked ? 11 : attack.name === "special" ? 40 : 24);
  target.vy = target.grounded && !blocked ? -2.4 : target.vy;
  score += attacker.isPlayer ? (blocked ? 8 : 30) : 0;
  shake = attack.name === "special" ? 8 : 4;
  spawnHit(target.x, target.y - 52, blocked ? "#6c7cff" : attacker.accent);

  if ("vibrate" in navigator && attacker.isPlayer) {
    navigator.vibrate(blocked ? 10 : attack.name === "special" ? [20, 18, 20] : 18);
  }
}

function resolveRound() {
  if (roundWon) return;

  if (opponent.hp <= 0) {
    roundWon = true;
    score += 500;
    announce("You win", 120);
    tipText.textContent = "Nice. Next round starts in a moment.";
    roundResetTimer = 84;
  }

  if (player.hp <= 0) {
    gameOver = true;
    running = false;
    announce("You lost", 140);
    tipText.textContent = "Game over. Tap any control to try again.";
  }
}

function updateParticles() {
  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.25;
    particle.life--;
  });
  particles = particles.filter(particle => particle.life > 0);
}

function spawnHit(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 5,
      life: 18 + Math.random() * 10,
      size: 3 + Math.random() * 5,
      color
    });
  }
}

function draw() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const shakeX = shake ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * shake : 0;

  drawBackground(width, height);

  ctx.save();
  ctx.translate(-cameraX + shakeX, shakeY);
  drawWorld();
  drawShadow(player);
  drawShadow(opponent);
  drawFighter(opponent);
  drawFighter(player);
  drawParticles();
  ctx.restore();

  drawTopBars();

  if (announceTimer > 0) drawAnnouncement(announceText);

  if (!running && !gameOver) {
    drawOverlay("STICKMAN DUEL", "Tap to start");
  } else if (gameOver) {
    drawOverlay("GAME OVER", `Score ${score}`);
  }
}

function drawBackground(width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#8fd0ee");
  sky.addColorStop(0.48, "#e6f7fb");
  sky.addColorStop(1, "#f3ecd4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(36, 47, 64, 0.16)";
  for (let x = -120; x < width + 160; x += 110) {
    const bx = x - cameraX * 0.18;
    ctx.fillRect(bx, groundY - 220 - (x % 3) * 18, 70, 230);
    ctx.fillRect(bx + 14, groundY - 248 - (x % 2) * 14, 42, 28);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  for (let i = 0; i < 4; i++) {
    const x = (i * 310 - cameraX * 0.22) % (width + 280) - 140;
    cloud(x, 74 + (i % 3) * 34, 46 + (i % 2) * 16);
  }
}

function cloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.42, y - size * 0.2, size * 0.58, 0, Math.PI * 2);
  ctx.arc(x + size, y, size * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorld() {
  const ringLeft = 42;
  const ringRight = worldWidth - 42;

  ctx.fillStyle = "#2b3345";
  ctx.fillRect(0, groundY + 8, worldWidth, 150);
  ctx.fillStyle = "#d8d3c1";
  ctx.fillRect(ringLeft, groundY - 6, ringRight - ringLeft, 26);
  ctx.fillStyle = "#b5ac96";
  ctx.fillRect(ringLeft, groundY + 20, ringRight - ringLeft, 18);

  ctx.strokeStyle = "rgba(23, 32, 51, 0.16)";
  ctx.lineWidth = 2;
  for (let x = ringLeft; x < ringRight; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, groundY - 5);
    ctx.lineTo(x + 28, groundY + 36);
    ctx.stroke();
  }

  ctx.strokeStyle = "#263044";
  ctx.lineWidth = 5;
  [ringLeft, ringRight].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, groundY - 118);
    ctx.lineTo(x, groundY + 20);
    ctx.stroke();
  });

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 4;
  for (let y = groundY - 102; y <= groundY - 44; y += 29) {
    ctx.beginPath();
    ctx.moveTo(ringLeft, y);
    ctx.lineTo(ringRight, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fillRect(ringLeft + 24, groundY - 5, ringRight - ringLeft - 48, 6);
}

function drawShadow(fighter) {
  const width = fighter.grounded ? 54 : 42;
  const alpha = fighter.grounded ? 0.22 : 0.12;
  ctx.fillStyle = `rgba(23, 32, 51, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(fighter.x, groundY + 4, width, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFighter(fighter) {
  const height = fighter.ducking ? 68 : fighter.h;
  const headY = fighter.y - height + 16;
  const chestY = fighter.y - height + 43;
  const hipY = fighter.y - 30;
  const walk = Math.sin(fighter.footstep) * Math.min(9, Math.abs(fighter.vx) * 1.8);
  const color = fighter.hurtTimer > 0 ? "#ef4444" : fighter.color;
  const attack = fighter.attack ? fighter.attack.name : null;

  ctx.save();
  ctx.translate(fighter.x, fighter.y);
  ctx.scale(fighter.facing, 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 11;
  drawSkeleton(headY, chestY, hipY, walk, fighter, attack, true);

  ctx.strokeStyle = color;
  ctx.lineWidth = 6.2;
  drawSkeleton(headY, chestY, hipY, walk, fighter, attack, false);

  ctx.fillStyle = fighter.accent;
  ctx.beginPath();
  ctx.arc(0, headY - fighter.y, 5, 0, Math.PI * 2);
  ctx.fill();

  if (fighter.blocking) {
    ctx.strokeStyle = "#5b6cff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(27, chestY - fighter.y, 24, -Math.PI * 0.58, Math.PI * 0.58);
    ctx.stroke();
  }

  if (attack) drawAttackPose(attack, fighter.attackTimer, fighter.attack.total, fighter.accent);
  ctx.restore();

  drawNameTag(fighter);
}

function drawSkeleton(headY, chestY, hipY, walk, fighter, attack, outline) {
  const fy = fighter.y;
  const armReach = attack ? 10 : 0;
  const rearArm = fighter.blocking ? -4 : -28 - walk * 0.6;
  const frontArm = fighter.blocking ? 25 : 28 + walk * 0.6 + armReach;

  ctx.beginPath();
  ctx.arc(0, headY - fy, 13, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, headY + 14 - fy);
  ctx.lineTo(0, hipY - fy);
  ctx.stroke();

  drawLimb(0, chestY - fy, frontArm, chestY + 9 - fy, frontArm + 16, chestY + 26 - fy);
  drawLimb(0, chestY - fy, rearArm, chestY + 9 - fy, rearArm - 14, chestY + 25 - fy);
  drawLimb(0, hipY - fy, 21 + walk, -12, 35 + walk, 0);
  drawLimb(0, hipY - fy, -21 - walk, -12, -35 - walk, 0);

  if (!outline) {
    ctx.fillStyle = fighter.accent;
    ctx.fillRect(-9, chestY + 2 - fy, 18, 7);
  }
}

function drawLimb(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.stroke();
}

function drawAttackPose(name, timer, total, accent) {
  const progress = 1 - timer / total;
  ctx.strokeStyle = name === "special" ? "#f59f00" : accent;
  ctx.lineWidth = name === "special" ? 8 : 6;
  if (name === "punch") {
    drawLimb(0, -50, 48 + progress * 18, -49, 76 + progress * 9, -47);
  } else if (name === "kick") {
    drawLimb(0, -31, 38 + progress * 19, -18, 88, -25);
  } else {
    ctx.beginPath();
    ctx.arc(54, -49, 44 + Math.sin(progress * Math.PI) * 13, -0.95, 0.95);
    ctx.stroke();
  }
}

function drawNameTag(fighter) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.fillRect(fighter.x - 33, fighter.y - fighter.h - 34, 66, 18);
  ctx.fillStyle = fighter.color;
  ctx.font = "800 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fighter.name, fighter.x, fighter.y - fighter.h - 25);
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.globalAlpha = Math.max(0, particle.life / 28);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawTopBars() {
  const margin = 16;
  const barWidth = Math.min(280, window.innerWidth * 0.34);
  const y = 56;
  drawFighterMeter(margin, y, barWidth, player, false);
  drawFighterMeter(window.innerWidth - margin - barWidth, y, barWidth, opponent, true);

  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  ctx.fillRect(window.innerWidth / 2 - 44, y - 4, 88, 32);
  ctx.fillStyle = "#172033";
  ctx.font = "900 16px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`R${round}`, window.innerWidth / 2, y + 12);
}

function drawFighterMeter(x, y, width, fighter, reverse) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fillRect(x, y - 22, width, 48);
  ctx.fillStyle = fighter.color;
  ctx.font = "900 13px system-ui";
  ctx.textAlign = reverse ? "right" : "left";
  ctx.textBaseline = "middle";
  ctx.fillText(fighter.name, reverse ? x + width - 8 : x + 8, y - 10);

  drawMeter(x + 8, y + 2, width - 16, 12, fighter.hp / 100, "#ef4444", reverse);
  drawMeter(x + 8, y + 18, width - 16, 7, fighter.energy / 100, "#f59f00", reverse);
}

function drawMeter(x, y, width, height, pct, color, reverse) {
  const fill = width * Math.max(0, Math.min(1, pct));
  ctx.fillStyle = "rgba(23, 32, 51, 0.16)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(reverse ? x + width - fill : x, y, fill, height);
  ctx.strokeStyle = "rgba(23, 32, 51, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

function drawAnnouncement(text) {
  ctx.fillStyle = "rgba(23, 32, 51, 0.74)";
  ctx.fillRect(window.innerWidth / 2 - 130, window.innerHeight * 0.28 - 32, 260, 64);
  ctx.fillStyle = "white";
  ctx.font = "900 30px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, window.innerWidth / 2, window.innerHeight * 0.28);
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(23, 32, 51, 0.58)";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 42px system-ui";
  ctx.fillText(title, window.innerWidth / 2, window.innerHeight / 2 - 28);
  ctx.font = "800 20px system-ui";
  ctx.fillText(subtitle, window.innerWidth / 2, window.innerHeight / 2 + 24);
}

function loop(time) {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;
  const steps = Math.min(3, Math.max(1, Math.round(delta / 16.67)));
  for (let i = 0; i < steps; i++) update();
  draw();
  requestAnimationFrame(loop);
}

resize();
player = makeFighter(180, 1, "You", "#172033", "#1d9bf0", true);
opponent = makeFighter(560, -1, "Rival", "#2f211c", "#c2410c", false);
updateHud();
requestAnimationFrame(loop);
