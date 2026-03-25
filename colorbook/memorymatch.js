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

// Prevent swipe-down refresh and gestures on mobile browsers globally
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());

/*************************************************
 * GAME STATE
 *************************************************/
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let isPlaying = false;
let isShowing = false;
let isGameOver = false;
let lives = 3;
let columns = 4;
let rows = 4; // 16 cards = 8 pairs

// Pair configuration (Uppercase matched to Lowercase)
const pairs = [
  { a: "A", b: "a" }, { a: "B", b: "b" },
  { a: "C", b: "c" }, { a: "D", b: "d" },
  { a: "E", b: "e" }, { a: "F", b: "f" },
  { a: "G", b: "g" }, { a: "H", b: "h" }
];

function initGame() {
  cards = [];
  flippedCards = [];
  matchedPairs = 0;
  lives = 3;
  isPlaying = true;
  isShowing = true;
  isGameOver = false;
  
  let deck = [];
  pairs.forEach(p => {
    // Both cards share the same matchId so they resolve as a pair
    deck.push({ text: p.a, matchId: p.a, isFlipped: true, isMatched: false });
    deck.push({ text: p.b, matchId: p.a, isFlipped: true, isMatched: false });
  });
  
  // Shuffle Deck
  deck.sort(() => Math.random() - 0.5);

  // Responsive Card Sizing
  const maxCardWidth = 80;
  const cardWidth = Math.min(maxCardWidth, (canvas.width - 40) / columns);
  const cardHeight = cardWidth * 1.3; 
  
  const startX = (canvas.width - (columns * cardWidth + (columns - 1) * 10)) / 2;
  const startY = (canvas.height - (rows * cardHeight + (rows - 1) * 10)) / 2 + 30;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const idx = r * columns + c;
      if (idx < deck.length) {
        cards.push({
          ...deck[idx],
          x: startX + c * (cardWidth + 10),
          y: startY + r * (cardHeight + 10),
          w: cardWidth,
          h: cardHeight,
          color: `hsl(${Math.random() * 360}, 70%, 80%)` // Soft pastel back
        });
      }
    }
  }
  
  // Hide cards after 3 seconds
  setTimeout(() => {
    if (!isPlaying) return;
    cards.forEach(c => c.isFlipped = false);
    isShowing = false;
  }, 3000);
}

/*************************************************
 * INPUT
 *************************************************/
canvas.addEventListener("pointerdown", e => {
  if (!isPlaying || isGameOver) {
    initGame();
    return;
  }
  
  if (isShowing) return; // Prevent clicking while memorizing

  // Prevent flipping more than 2 cards while animations wait
  if (flippedCards.length >= 2) return; 

  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  for (let card of cards) {
    if (!card.isMatched && !card.isFlipped &&
        px > card.x && px < card.x + card.w &&
        py > card.y && py < card.y + card.h) {
      
      card.isFlipped = true;
      flippedCards.push(card);

      // Speak the letter
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(card.text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

      if (flippedCards.length === 2) {
        setTimeout(checkMatch, 1000); // 1-second delay so they can see both cards
      }
      break;
    }
  }
});

function checkMatch() {
  const [c1, c2] = flippedCards;
  if (c1.matchId === c2.matchId) {
    c1.isMatched = true;
    c2.isMatched = true;
    matchedPairs++;
    if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]); // Happy vibration
  } else {
    c1.isFlipped = false;
    c2.isFlipped = false;
    lives--;
    if (lives <= 0) {
      isPlaying = false;
      isGameOver = true;
    }
    if ("vibrate" in navigator) navigator.vibrate(50); // Error vibration
  }
  flippedCards = [];
  
  if (matchedPairs === pairs.length) {
    isPlaying = false;
  }
}

/*************************************************
 * LOOP
 *************************************************/
function update() {
  requestAnimationFrame(update);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#F0F8FF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Main Menu State
  if (!isPlaying && !isGameOver && matchedPairs === 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("MEMORY MATCH", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to start", canvas.width / 2, canvas.height / 2 + 20);
    return;
  }

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, canvas.width, 60);
  ctx.fillStyle = "white";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`Pairs: ${matchedPairs} / ${pairs.length}`, 20, 38);
  
  ctx.textAlign = "right";
  ctx.fillText(`Lives: ${lives}`, canvas.width - 20, 38);

  // Draw Cards
  cards.forEach(card => {
    if (card.isMatched) ctx.globalAlpha = 0.3;

    // Card Background
    ctx.fillStyle = card.isFlipped || card.isMatched ? "white" : "#007AFF";
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.w, card.h, 12);
    ctx.fill();
    
    // Card Outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = card.isFlipped || card.isMatched ? card.color : "#005bb5";
    ctx.stroke();

    // Text inside card
    if (card.isFlipped || card.isMatched) {
      ctx.fillStyle = "#333";
      ctx.font = `bold ${card.w * 0.5}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.text, card.x + card.w / 2, card.y + card.h / 2);
    } else {
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${card.w * 0.4}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", card.x + card.w / 2, card.y + card.h / 2);
    }
    ctx.globalAlpha = 1.0;
  });

  // Game Over State
  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 20);
  }

  // Win State
  if (!isPlaying && matchedPairs === pairs.length) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px system-ui";
    ctx.fillText("Tap to play again", canvas.width / 2, canvas.height / 2 + 20);
  }
}

requestAnimationFrame(update);