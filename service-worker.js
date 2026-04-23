const CACHE_NAME = 'verum-v1';
const ASSETS = [
    'index.html',
    'app.html',
    'css/style.css',
    'js/main.js',
    'js/core/database.js',
    'js/core/ui.js',
    'manifest.json'
];

// Instalação do Service Worker e Cache de arquivos essenciais
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// Estratégia Stale-while-revalidate apenas para recursos estáticos (GET)
self.addEventListener('fetch', event => {
    // IGNORAR chamadas de API (Supabase) e métodos que não sejam GET
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
                return response || fetchPromise;
            })
    );
});
