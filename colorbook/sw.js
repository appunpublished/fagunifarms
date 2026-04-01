self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("coloring-book").then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/games.html",
        "/game.html",
        "/game.js",
        "/snake.html",
        "/snake.js",
        "/starwars.html",
        "/starwars.js",
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
        "/wordpuzzle.js"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
