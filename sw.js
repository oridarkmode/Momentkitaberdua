const CACHE = "glass-invite-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./data/config.json",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE ? caches.delete(k) : null)))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e)=>{
  e.respondWith(
    caches.match(e.request).then((cached)=>{
      if(cached) return cached;
      return fetch(e.request).then((res)=>{
        const copy = res.clone();
        if(e.request.method==="GET" && new URL(e.request.url).origin===self.location.origin){
          caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
    })
  );
});