/* Service worker do Cinemax Piraju.
   - Página (HTML): busca na rede primeiro, para atualizações aparecerem na hora; sem internet, usa a cópia guardada.
   - CSS, JS e fontes: vêm do cache e são atualizados em segundo plano.
   Ao publicar uma versão nova, aumente VERSION aqui e o ?v= no index.html. */
const VERSION='v5';
const STATIC=`cinemax-static-${VERSION}`;
const ASSETS=['./','index.html',`css/style.css?v=${VERSION}`,`js/main.js?v=${VERSION}`];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(STATIC).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('cinemax-static-')&&k!==STATIC).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(STATIC).then(c=>c.put('index.html',cp));return r}).catch(()=>caches.match('index.html')));
    return;
  }
  const same=url.origin===location.origin,font=/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!same&&!font)return;
  e.respondWith(caches.open(STATIC).then(async c=>{
    const hit=await c.match(req);
    const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
