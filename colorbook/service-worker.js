const CACHE_NAME = 'fagunifarms-cache-v1';

// Add all the files you want to be available offline
const urlsToCache = [
  './',
  './index.html',
  './games.html',
  './app.js',
  './game.js',
  './memorymatch.js',
  './starwars.js',
  './bubblepop.js',
  './snake.js',
  './letterdrop.js',
  './solar.js',
  './wordpuzzle.js',
  './shapesorter.js',
  './images.json',
  './labels.json',
  './100images/index.json'
  // IMPORTANT: Add all your assets here! 
  // e.g., './assets/cars/car_yellow.png', './assets/audio/engine.mp3', etc.
];

// Install Event - Cache the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches if CACHE_NAME changes
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from Cache, Fallback to Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request);
      })
  );
});