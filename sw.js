/* Home Shopping offline app shell. The shopping list remains in this device's local storage. */
var CACHE_NAME = 'home-shopping-shell-v1';
var SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (event) {
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(SHELL_FILES);
    }).then(function () {
        return self.skipWaiting();
    }));
});

self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
            return key.indexOf('home-shopping-shell-') === 0 && key !== CACHE_NAME ? caches.delete(key) : Promise.resolve(false);
        }));
    }).then(function () {
        return self.clients.claim();
    }));
});

self.addEventListener('fetch', function (event) {
    var request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).then(function (response) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
            return response;
        }).catch(function () {
            return caches.match(request).then(function (cached) {
                return cached || caches.match('./index.html');
            });
        }));
        return;
    }

    event.respondWith(caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
            if (response.ok) {
                var copy = response.clone();
                caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
            }
            return response;
        });
    }));
});
