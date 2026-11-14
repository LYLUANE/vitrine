/* Rota Junto · service worker: guarda o app para abrir sem internet (projeto demonstrativo) */
const VERSAO = 'rotajunto-v1';
const ARQUIVOS = ['./', './index.html', './app.css', './app.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rotajunto-') && k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // fontes do Google: usa o cache e atualiza em segundo plano
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const cached = await c.match(req);
      const rede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => cached);
      return cached || rede;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // navegação: rede primeiro, cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(VERSAO).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // demais arquivos: cache primeiro
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(c => c || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSAO).then(ca => ca.put(req, cp)); return r; })));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
