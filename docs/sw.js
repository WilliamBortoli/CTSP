// Deixa o portal abrir sem internet: com rede busca sempre a versão nova e guarda uma cópia;
// sem rede usa a cópia. Supabase (login/progresso) e vídeos não passam por aqui.
const CACHE = 'ctsp-v1';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'assets/app.css', 'assets/apostila.css', 'assets/extra.css',
  'assets/emblema.jpg', 'assets/icone-192.png', 'js/config.js', 'js/conteudo.js', 'js/app.js', 'dados/banco.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co') || u.pathname.includes('/videos/')) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
