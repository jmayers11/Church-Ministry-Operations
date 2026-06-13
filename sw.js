/* =============================================================
   sw.js  —  Service Worker for Church Dashboard (4.9)
   Caches static assets + offline fallback page
   ============================================================= */

const CACHE_NAME = 'church-dash-v31';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/main.css',
  '/css/dashboard.css',
  '/css/components.css',
  '/css/mobile.css',
  // Core
  '/js/storage.js',
  '/js/app.js',
  '/js/ui-components.js',
  '/js/navigation.js',
  '/js/command-palette.js',
  '/js/profile-drawer.js',
  '/js/auth-gate.js',
  '/js/supabase-config.js',
  // Page modules
  '/js/dashboard.js',
  '/js/members.js',
  '/js/visitors.js',
  '/js/volunteers.js',
  '/js/volunteer-center.js',
  '/js/prayer.js',
  '/js/events.js',
  '/js/foodpantry.js',
  '/js/foodpantry-planning.js',
  '/js/care.js',
  '/js/tasks.js',
  '/js/sermons.js',
  '/js/ministries.js',
  '/js/prompts.js',
  '/js/giving.js',
  '/js/communications.js',
  '/js/facilities.js',
  '/js/impact.js',
  '/js/family-assistance.js',
  '/js/community-events.js',
  '/js/resources.js',
  '/js/scorecard.js',
  '/js/request-inbox.js',
  '/js/board-report.js',
  '/js/checkin.js',
];

// ── Install: pre-cache static assets ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache assets individually so a single 404 doesn't break everything
      return Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Could not cache', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-first for static assets, Network-first for API ─
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin requests (Supabase, Cloudflare, CDN)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/supabase') || url.pathname.includes('/rest/v1/')) return;

  // For navigations: network-first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // For static assets: network-first so deployed updates appear on the next
  // reload. Falls back to the cache only when the network is unavailable
  // (offline support preserved).
  event.respondWith(
    fetch(request).then(response => {
      // Refresh the cache with the latest successful response
      if (response && response.status === 200 && response.type === 'basic') {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
      }
      return response;
    }).catch(() =>
      caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
    )
  );
});

// ── Message: force update ──────────────────────────────