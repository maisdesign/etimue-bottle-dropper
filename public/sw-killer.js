// Killer Service Worker - Unregisters all existing service workers and clears cache
console.log('🔥 KILLER SERVICE WORKER: Starting cleanup of zombie workbox...');

self.addEventListener('install', function(event) {
  console.log('🔥 Killer SW installed, force activating...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('🔥 Killer SW activated, cleaning up...');

  event.waitUntil(
    (async function() {
      // Clear all caches
      const cacheNames = await caches.keys();
      console.log('🗑️ Found caches to delete:', cacheNames);

      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔥 Found SW registrations to unregister:', registrations.length);

        await Promise.all(
          registrations.map(registration => {
            console.log('🔥 Unregistering SW:', registration.scope);
            return registration.unregister();
          })
        );
      }

      console.log('✅ KILLER SW: Cleanup complete, reloading page...');

      // Force reload all clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'FORCE_RELOAD' });
      });
    })()
  );
});

// Intercept all fetch requests and pass through without caching
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});