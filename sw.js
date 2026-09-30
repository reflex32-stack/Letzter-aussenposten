// Service Worker – bei jedem Update die VERSION erhöhen
const VERSION='1.1.0';
const CACHE='aussenposten-'+VERSION;
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('message',e=>{ if(e.data==='SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req)));
  } else if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(r=>r||fetch(req).then(res=>{ c.put(req,res.clone()); return res; }))));
  }
});
