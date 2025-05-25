// PWA initialization and service worker management

// Define interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global variable for install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initializePWA() {
  // Only register SW in production to avoid dev caching issues
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  } else if (import.meta.env.DEV) {
    // In development, unregister any existing service workers to prevent caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('Unregistered service worker in development mode');
        });
      });
    }
  }

  // Handle app install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Show install button or prompt
    showInstallPromotion();
  });

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallPromotion();
  });
}

function showInstallPromotion() {
  // Create and show install button
  const installButton = document.createElement('button');
  installButton.textContent = 'Install App';
  installButton.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  installButton.id = 'install-button';
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      hideInstallPromotion();
    }
  });

  document.body.appendChild(installButton);
}

function hideInstallPromotion() {
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.remove();
  }
}

// Cache management for offline functionality
export async function clearCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
}

// Check if app is running in standalone mode (installed PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as { standalone?: boolean }).standalone === true;
}

// Network status detection
export function setupNetworkStatusListeners() {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`Network status: ${status}`);
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('networkstatuschange', {
      detail: { isOnline: navigator.onLine }
    }));
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  return updateOnlineStatus;
}

// Background sync for offline score updates
export function registerBackgroundSync(tag: string, data: unknown) {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      // Store data in IndexedDB for sync
      storeForSync(tag, data);
      
      // Register background sync
      return (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
    });
  }
}

// Simple IndexedDB wrapper for offline storage
function storeForSync(tag: string, data: unknown) {
  const request = indexedDB.open('rowdy-cup-sync', 1);
  
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('syncData')) {
      db.createObjectStore('syncData', { keyPath: 'id', autoIncrement: true });
    }
  };
  
  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    const transaction = db.transaction(['syncData'], 'readwrite');
    const store = transaction.objectStore('syncData');
    
    store.add({
      tag,
      data,
      timestamp: Date.now()
    });
  };
}
