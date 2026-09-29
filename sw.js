/* อิ่มใจ — service worker: เก็บไฟล์ของแอปไว้ในเครื่อง ให้เปิดได้เร็วและเปิดได้แม้ออฟไลน์
   เมื่อแก้ไฟล์แล้ว deploy ใหม่ ให้เปลี่ยนเลข VERSION เพื่อให้เครื่องผู้ใช้โหลดไฟล์ชุดใหม่ */
const VERSION = 'imjai-v2';
const CORE = [
  './',
  'index.html',
  'css/style.css',
  'js/data/options.js',
  'js/data/shops-1.js',
  'js/data/shops-2.js',
  'js/data/shops-3.js',
  'js/core.js',
  'js/views-shop.js',
  'js/views-cart.js',
  'js/views-order.js',
  'js/main.js',
  'manifest.webmanifest',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ไฟล์ของแอป: ใช้จากแคชก่อนแล้วอัปเดตเบื้องหลัง / ฟอนต์ Google: เก็บแคชหลังโหลดครั้งแรก
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: sameOrigin });
      const net = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
      return hit || net;
    })
  );
});
