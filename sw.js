const VERSION = 'crisisweave-offline-v5';
const APP_SHELL = [
  './',
  './index.html',
  './volunteer.html',
  './verified.jsonl',
  './alerts.jsonl',
  './worksites.jsonl'
];

const WARM_EXTERNAL = [
  'https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js',
  'https://demotiles.maplibre.org/style.json',
  'https://demotiles.maplibre.org/tiles/tiles.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(WARM_EXTERNAL.map(async url => {
      const response = await fetch(url);
      if (response && (response.ok || response.type === 'opaque')) {
        await cache.put(url, response.clone());
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isSnapshot(request) {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  return request.method === 'GET' && (
    url.pathname.endsWith('.json') || url.pathname.endsWith('.jsonl') ||
    accept.includes('application/json') || url.searchParams.has('feed') ||
    url.searchParams.has('alerts') || url.searchParams.has('worksites')
  );
}

function isMapAsset(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return url.hostname === 'unpkg.com' || url.hostname === 'demotiles.maplibre.org';
}

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isSnapshot(request)) { event.respondWith(networkFirst(request)); return; }
  if (url.origin === self.location.origin || isMapAsset(request)) {
    event.respondWith(cacheFirst(request));
  }
});
