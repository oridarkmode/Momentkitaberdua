const CACHE = "inv-cache-v1";
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
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then((cached)=>{
      if(cached) return cached;
      return fetch(req).then((res)=>{
        const copy = res.clone();
        // cache only GET from same origin
        if(req.method === "GET" && new URL(req.url).origin === self.location.origin){
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
    })
  );
});