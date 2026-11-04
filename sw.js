var CACHE = 'yt-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.all(ASSETS.map(function(a) {
        return c.add(a).catch(function() {});
      }));
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  // Video/API/YouTube isteklerine karışma
  if (u.hostname.indexOf('piped') !== -1 || u.hostname.indexOf('youtube') !== -1 ||
      u.hostname.indexOf('ytimg') !== -1 || u.hostname.indexOf('googlevideo') !== -1) return;

  // Önce ağ, olmazsa önbellek
  e.respondWith(
    fetch(req).then(function(res) {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c) { c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      return caches.match(req).then(function(m) {
        return m || new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
