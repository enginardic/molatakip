self.addEventListener('install', (event) => {
    console.log('Service Worker yüklendi');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker aktif');
    event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://enginardic.github.io/molatakip/')
    );
});
