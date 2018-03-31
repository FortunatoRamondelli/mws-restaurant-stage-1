const staticCacheName = "mws-restaurant-stage-1v1";

self.addEventListener('install', function(event) {
  const css  = ['styles'];
  const data = ['restaurants'];
  const img  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const js   = ['dbhelper', 'main', 'restaurant_info']
  const html = ['index', 'restaurant'];

  const urlsToCache = [...css.map (fileName => `/css/${fileName}.css`),
                       ...data.map(fileName => `/data/${fileName}.json`),
                       ...img.map (fileName => `/img/${fileName}.jpg`),
                       ...js.map  (fileName => `/js/${fileName}.js`),
                       ...html.map(fileName => `/${fileName}.html`)];

  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(staticCacheName).then(function(cache) {
      return caches.match(event.request).then(function(response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        }).catch(function(error) {
          console.log(error);
          return new Response(`<div class="alertbar"
                                    aria-live="assertive">
                                 <h1>No internet connection!</h1>
                               </div>`, {
                     headers: {'Content-Type': 'text/html'}
                   });
        });
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(name => name.startsWith('mws-')
                               && name != staticCacheName)
        .map(cache => caches.delete(cache)));
    })
  );
});