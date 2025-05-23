const CACHE_NAME = 'rowdy-cup-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add other static assets that should be cached
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // If fetch fails (offline), try to return cached version
          return caches.match(event.request);
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline score updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(syncOfflineData());
  }
});

// Handle background sync
async function syncOfflineData() {
  try {
    // Open IndexedDB to get pending sync data
    const db = await openDatabase();
    const transaction = db.transaction(['syncData'], 'readonly');
    const store = transaction.objectStore('syncData');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const pendingData = request.result;
      
      for (const item of pendingData) {
        try {
          // Attempt to sync each pending item
          await fetch('/api/hole-scores', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data),
          });
          
          // Remove from IndexedDB after successful sync
          const deleteTransaction = db.transaction(['syncData'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('syncData');
          deleteStore.delete(item.id);
          
          console.log('Synced offline data:', item.id);
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
        }
      }
    };
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Open IndexedDB for offline storage
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rowdy-cup-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncData')) {
        db.createObjectStore('syncData', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Handle push notifications (for future implementation)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New score update available',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'score-update',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Scores',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Rowdy Cup Update', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache API responses for offline access
self.addEventListener('fetch', (event) => {
  // Cache API responses for offline access
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return fetch(event.request).then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached API response when offline
          return cache.match(event.request);
        });
      })
    );
  }
});

console.log('Service worker loaded for Rowdy Cup PWA');
