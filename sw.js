// sw.js — Service Worker for Artefactos PWA
const CACHE_NAME = 'artefactos-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  '/js/catalogo.js',
  '/js/theme.js',
  '/js/search.js',
  '/js/pwa.js',
  '/js/i18n.js',
  '/offline.html',
  '/manifest.json'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Cache First for statics, Network First for dynamic
// Exclude Groq API from cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache Groq API calls
  if (url.hostname.includes('groq.com')) return;

  // Cache First for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
    );
  }
});
