
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
  const requestUrl = new URL(event.request.url);

  // Create a RequestInfo object without query parameters
  const strippedRequestInfo = requestUrl.origin + requestUrl.pathname;

  event.respondWith(
    caches.match(strippedRequestInfo)
      .then(cachedResponse => {
        // Return the cached response if available, otherwise fetch the request
        return cachedResponse || fetch(event.request);
      })
      .catch(err => console.log('Fetch error:', err))
  );
});
