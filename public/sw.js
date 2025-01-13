
const CACHE_NAME = 'tmp-v1'

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
        const response = await fetch('/resource-list.json');
        const items = await response.json();
        console.log('caching:', items);
        const cache = await caches.open(CACHE_NAME);
        for (const item of items) {
          try {
            await cache.add(item);
          }
          catch (err) {
            console.log("failed to cache: " + item + " err: " + err);
          }
        }
    })()
  );
  console.log('service worker installed');
});


self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
          // It can update the cache to serve updated content on the next request
          return cachedResponse || fetch(event.request);
        }
      ).catch(err => console.log(err))
  )
});
