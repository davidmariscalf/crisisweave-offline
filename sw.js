const VERSION = 'crisisweave-offline-v8';
const APP_SHELL = [
  './',
  './index.html',
  './volunteer.html',
  './verified.jsonl',
  './alerts.jsonl',
  './worksites.jsonl',
  './manifest.webmanifest',
  './vendor/maplibre-gl.css',
  './vendor/maplibre-gl.js',
  './vendor/MAPLIBRE_LICENSE.txt'
];

const PUBLIC_SNAPSHOT_PATHS = [
  './verified.jsonl',
  './alerts.jsonl',
  './worksites.jsonl'
];

// MapLibre JS/CSS are packaged as same-origin app-shell assets by the
// locked CrisisWeave release build. The worker never depends on a CDN for the
// runtime needed to render the offline no-basemap view.

// The online basemap is useful but not required offline. index.html switches
// to its same-page local style when navigator.onLine is false, so failure to
// warm these resources must not block an otherwise valid offline package.
const OPTIONAL_EXTERNAL = [
  'https://demotiles.maplibre.org/style.json',
  'https://demotiles.maplibre.org/tiles/tiles.json'
];

const SHELL_URLS = new Set(APP_SHELL.map(path => new URL(path, self.location.href).href));
const SNAPSHOT_URLS = new Set(PUBLIC_SNAPSHOT_PATHS.map(path => new URL(path, self.location.href).href));

async function cacheExternal(cache, url, required) {
  try {
    const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!isCacheableResponse(response, true)) {
      throw new Error(`uncacheable response for ${url}`);
    }
    await cache.put(url, response.clone());
  } catch (error) {
    if (required) throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(APP_SHELL);
    await Promise.all(OPTIONAL_EXTERNAL.map(url => cacheExternal(cache, url, false)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function canonicalUrl(request) {
  const url = new URL(request.url);
  url.hash = '';
  return url;
}

function hasCredentials(request) {
  return Boolean(request.headers.get('authorization')) || request.credentials === 'include';
}

function isSnapshot(request) {
  if (request.method !== 'GET' || hasCredentials(request)) return false;
  const url = canonicalUrl(request);
  if (url.origin !== self.location.origin || url.search) return false;
  return SNAPSHOT_URLS.has(url.href);
}

function isShellAsset(request) {
  if (request.method !== 'GET' || hasCredentials(request)) return false;
  const url = canonicalUrl(request);
  if (url.origin !== self.location.origin || url.search) return false;
  return SHELL_URLS.has(url.href);
}

function isMapAsset(request) {
  if (request.method !== 'GET' || hasCredentials(request)) return false;
  const url = new URL(request.url);
  if (url.username || url.password) return false;
  if (url.hostname === 'demotiles.maplibre.org') {
    return url.pathname === '/style.json' || url.pathname.startsWith('/tiles/');
  }
  return false;
}

function isCacheableResponse(response, allowOpaque = false) {
  if (!response) return false;
  if (response.type === 'opaque') return allowOpaque;
  if (!response.ok) return false;
  const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
  if (cacheControl.includes('no-store') || cacheControl.includes('private')) return false;
  if (response.headers.get('set-cookie')) return false;
  return true;
}

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response, false)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, allowOpaque = false) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response, allowOpaque)) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (isSnapshot(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isShellAsset(request)) {
    event.respondWith(cacheFirst(request, false));
    return;
  }
  if (isMapAsset(request)) {
    event.respondWith(cacheFirst(request, true));
  }
});
