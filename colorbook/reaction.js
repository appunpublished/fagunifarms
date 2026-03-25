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
 * GAME LOGIC
 *************************************************/
const STATE = { WAITING: 0, READY: 1, P1_WON: 2, P2_WON: 3, P1_EARLY: 4, P2_EARLY: 5, GAME_OVER: 6 };
let state = STATE.WAITING;
let scoreP1 = 0; // Bottom player
let scoreP2 = 0; // Top player
let timer = null;
const WIN_SCORE = 10;

function resetRound() {
  if (scoreP1 >= WIN_SCORE || scoreP2 >= WIN_SCORE) {
    state = STATE.GAME_OVER;
    return;
  }
  state = STATE.WAITING;
  timer = setTimeout(() => {
    state = STATE.READY;
  }, 2000 + Math.random() * 3000); // 2 to 5 seconds wait
}

canvas.addEventListener("pointerdown", e => {
  if (state === STATE.GAME_OVER) {
    scoreP1 = 0;
    scoreP2 = 0;
    resetRound();
    return;
  }
  if (state !== STATE.WAITING && state !== STATE.READY) {
    resetRound();
    return;
  }

  const isP1 = e.clientY > canvas.height / 2; // Bottom half

  if (state === STATE.WAITING) {
    clearTimeout(timer);
    if (isP1) {
      state = STATE.P1_EARLY;
      scoreP2++;
    } else {
      state = STATE.P2_EARLY;
      scoreP1++;
    }
  } else if (state === STATE.READY) {
    if (isP1) {
      state = STATE.P1_WON;
      scoreP1++;
    } else {
      state = STATE.P2_WON;
      scoreP2++;
    }
  }
});

function drawRotatedText(text, x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let p1Color = "#333", p2Color = "#333";
  let p1Text = "Wait...", p2Text = "Wait...";

  if (state === STATE.READY) {
    p1Color = p2Color = "#34C759";
    p1Text = p2Text = "TAP NOW!";
  } else if (state === STATE.P1_WON) {
    p1Color = "#007AFF"; p2Color = "#FF3B30";
    p1Text = "WINNER!"; p2Text = "TOO SLOW!";
  } else if (state === STATE.P2_WON) {
    p1Color = "#FF3B30"; p2Color = "#007AFF";
    p1Text = "TOO SLOW!"; p2Text = "WINNER!";
  } else if (state === STATE.P1_EARLY) {
    p1Color = "#FF3B30"; p2Color = "#34C759";
    p1Text = "TOO EARLY!"; p2Text = "POINT!";
  } else if (state === STATE.P2_EARLY) {
    p1Color = "#34C759"; p2Color = "#FF3B30";
    p1Text = "POINT!"; p2Text = "TOO EARLY!";
  } else if (state === STATE.GAME_OVER) {
    p1Color = scoreP1 >= WIN_SCORE ? "#FFD500" : "#333";
    p2Color = scoreP2 >= WIN_SCORE ? "#FFD500" : "#333";
    p1Text = scoreP1 >= WIN_SCORE ? "👑 MATCH WINNER!" : "LOSER!";
    p2Text = scoreP2 >= WIN_SCORE ? "👑 MATCH WINNER!" : "LOSER!";
  }

  // Draw halves
  ctx.fillStyle = p2Color; ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = p1Color; ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

  ctx.fillStyle = "white"; ctx.fillRect(0, canvas.height / 2 - 3, canvas.width, 6); // Divider

  // Draw Text for P2 (Top, rotated upside down)
  drawRotatedText(p2Text, canvas.width / 2, canvas.height * 0.25, Math.PI, 40, "white");
  drawRotatedText(`Score: ${scoreP2}`, canvas.width / 2, canvas.height * 0.25 + 50, Math.PI, 20, "white");
  if (state === STATE.GAME_OVER) {
    drawRotatedText("Tap to restart", canvas.width / 2, canvas.height * 0.25 + 90, Math.PI, 16, "white");
  }

  // Draw Text for P1 (Bottom, normal)
  drawRotatedText(p1Text, canvas.width / 2, canvas.height * 0.75, 0, 40, "white");
  drawRotatedText(`Score: ${scoreP1}`, canvas.width / 2, canvas.height * 0.75 + 50, 0, 20, "white");
  if (state === STATE.GAME_OVER) {
    drawRotatedText("Tap to restart", canvas.width / 2, canvas.height * 0.75 + 90, 0, 16, "white");
  }
}

resetRound();
update();