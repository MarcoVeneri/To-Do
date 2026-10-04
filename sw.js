const CACHE="marco-todo-v1-0-2";
const SHELL=["./","./index.html","./styles.css?v=1.0.1","./theme.css?v=1.0.1","./urgent.css?v=1.0.2","./config.js?v=1.0.0","./app.js?v=1.0.2","./manifest.webmanifest?v=2","./apple-touch-icon.png?v=2","./icon-192.png?v=2","./icon-512.png?v=2"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(
    fetch(event.request,{cache:"no-store"}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request))
  );
});
