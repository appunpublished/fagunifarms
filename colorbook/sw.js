self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("coloring-book-v3").then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/games.html",
        "/dinosaur.html",
        "/dinosaur.js",
        "/game.html",
        "/game.js",
        "/snake.html",
        "/snake.js",
        "/starwars.html",
        "/starwars.js",
        "/instruments.html",
        "/instruments.js",
        "/shapesorter.html",
        "/shapesorter.js",
        "/letterdrop.html",
        "/letterdrop.js",
        "/images.json",
        "/bubblepop.html",
        "/bubblepop.js",
        "/memorymatch.html",
        "/memorymatch.js",
        "/connectdots.html",
        "/connectdots.js",
        "/reaction.html",
        "/reaction.js",
        "/vocabmatch.html",
        "/vocabmatch.js",
        "/wordpuzzle.html",
        "/wordpuzzle.js",
        "/stickman.html",
        "/stickman.js",
        "/punchout.html",
        "/punchout.js",
        "/assets/dinosaurs/trex.jpg",
        "/assets/dinosaurs/triceratops.jpg",
        "/assets/dinosaurs/stegosaurus.jpg",
        "/assets/dinosaurs/brachiosaurus.jpg",
        "/assets/dinosaurs/pteranodon.jpg",
        "/assets/dinosaurs/ankylosaurus.jpg"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
