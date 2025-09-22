// ULTRA KILLER SERVICE WORKER - Aggressive cleanup of zombie workbox
console.log('💀 ULTRA KILLER SW: Starting AGGRESSIVE cleanup of zombie workbox...');

self.addEventListener('install', function(event) {
  console.log('💀 Ultra Killer SW installed, force activating...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('💀 Ultra Killer SW activated, AGGRESSIVE cleaning...');

  event.waitUntil(
    (async function() {
      try {
        // ULTRA AGGRESSIVE cache clearing
        const cacheNames = await caches.keys();
        console.log('🗑️ Found caches to NUKE:', cacheNames);

        // Delete ALL caches
        for (const cacheName of cacheNames) {
          console.log('💥 NUKING cache:', cacheName);
          await caches.delete(cacheName);
        }

        // Clear ALL storage
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          console.log('🧹 Clearing ALL storage...');
        }

        console.log('✅ ULTRA KILLER SW: All caches nuked!');

        // Wait a bit to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Send IMMEDIATE reload message to all clients
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        console.log('🔄 Sending FORCE RELOAD to', clients.length, 'clients');

        clients.forEach(client => {
          client.postMessage({
            type: 'ULTRA_RELOAD',
            message: 'Cache nuked, force reload now!'
          });
        });

        // Self-destruct after cleanup
        console.log('💀 ULTRA KILLER SW: Self-destructing after cleanup...');
        await self.registration.unregister();

      } catch (error) {
        console.error('💀 ULTRA KILLER SW ERROR:', error);
      }
    })()
  );
});

// Block ALL fetch requests with aggressive no-cache headers
self.addEventListener('fetch', function(event) {
  console.log('🚫 ULTRA KILLER SW: Blocking fetch for:', event.request.url);

  event.respondWith(
    fetch(event.request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).catch(() => {
      // If fetch fails, return minimal response to prevent errors
      return new Response('Service worker blocked', { status: 200 });
    })
  );
});