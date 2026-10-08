// Service Worker – bei jedem Update die VERSION erhöhen
const VERSION='3.2.0';
const CACHE='aussenposten-'+VERSION;
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('message',e=>{ if(e.data==='SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    if(url.pathname.endsWith('sw.js')) return; // immer frisch vom Server
    const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html');
    if(isPage){ // Seite: zuerst Netz (neueste Version), offline aus dem Speicher
      e.respondWith(Promise.race([
        fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); } return res; }),
        new Promise((_,rej)=>setTimeout(()=>rej('timeout'),4000))
      ]).catch(()=>caches.match('index.html').then(r=>r||caches.match('./')).then(r=>r||fetch(req))));
    } else e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req)));
  } else if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(r=>r||fetch(req).then(res=>{ c.put(req,res.clone()); return res; }))));
  }
});
