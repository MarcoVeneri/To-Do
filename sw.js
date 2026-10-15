const VERSION="65";
const CACHE=`marco-todo-root-v${VERSION}`;
const SHELL=[
  "/To-Do/",
  "/To-Do/index.html",
  "/To-Do/styles.css?v=2.0.0",
  "/To-Do/interaction-fix.css?v=1.0.4",
  "/To-Do/large-screen.css?v=2",
  "/To-Do/replica.css?v=3",
  "/To-Do/theme-soft.css?v=1",
  "/To-Do/compact-layout.css?v=3",
  "/To-Do/priority-colors.css?v=1",
  "/To-Do/config.js?v=1.0.0",
  "/To-Do/app.js?v=1.0.4",
  "/To-Do/interaction-fix.js?v=1.0.2",
  "/To-Do/row-cleanup.js?v=1",
  "/To-Do/manifest.webmanifest?v=65",
  "/To-Do/hub-todo-180-v8.png?v=65",
  "/To-Do/hub-todo-192-v8.png?v=65",
  "/To-Do/hub-todo-512-v8.png?v=65"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of SHELL){
      try{
        const r=await fetch(url,{cache:"no-store",credentials:"same-origin"});
        if(r.ok) await cache.put(url,r.clone());
      }catch(_){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("marco-todo-")&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const r=await fetch(event.request,{cache:"no-store",credentials:"same-origin"});
        if(r.ok){
          const c=await caches.open(CACHE);
          c.put("/To-Do/index.html",r.clone()).catch(()=>{});
          return r;
        }
      }catch(_){}
      return (await caches.match("/To-Do/index.html")) || (await caches.match("/To-Do/")) || Response.error();
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      const r=await fetch(event.request,{cache:"no-store",credentials:"same-origin"});
      if(r.ok){
        const c=await caches.open(CACHE);
        c.put(event.request,r.clone()).catch(()=>{});
      }
      return r;
    }catch(_){
      return (await caches.match(event.request,{ignoreSearch:true})) || Response.error();
    }
  })());
});
