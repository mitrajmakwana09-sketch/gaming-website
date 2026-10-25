
"use strict";

const CACHE_NAME = "pixelrush-cache-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./games.html",
  "./leaderboard.html",
  "./profile.html",
  "./login.html",
  "./register.html",
  "./about.html",
  "./404.html",
  "./manifest.json",
  "./css/style.css",
  "./css/responsive.css",
  "./css/animation.css",
  "./css/navbar.css",
  "./css/home.css",
  "./css/games.css",
  "./css/leaderboard.css",
  "./css/profile.css",
  "./css/auth.css",
  "./css/game-play.css",
  "./js/app.js",
  "./js/navbar.js",
  "./js/animations.js",
  "./js/profile.js",
  "./js/leaderboard.js",
  "./js/game-manager.js",
  "./js/games/snake.js",
  "./js/games/tic-tac-toe.js",
  "./js/games/memory-match.js",
  "./js/games/reaction-test.js",
  "./data/games.json",
  "./games/snake.html",
  "./games/tic-tac-toe.html",
  "./games/memory-match.html",
  "./games/reaction-test.html",
  "./games/quiz-game.html"
];

// Install: cache files that are available.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.all(
          APP_FILES.map(async file => {
            try {
              await cache.add(file);
            } catch (error) {
              // One missing optional file should not break installation.
              console.warn("Could not cache:", file);
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old PixelRush caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("pixelrush-cache-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: try network first, then use the cached copy.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // HTML pages: try network first to get updates.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          const fallback = await caches.match("./404.html");
          if (fallback) return fallback;

          return new Response("You are offline. Please reconnect.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        })
    );

    return;
  }

  // Other files: cache first, then update from network.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkRequest = fetch(request)
        .then(response => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }
          return response;
        });

      return cached || networkRequest;
    })
  );
});
