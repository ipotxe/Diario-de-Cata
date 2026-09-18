// Service Worker Registration for Offline Capabilities

export function registerServiceWorker(onSuccess?: () => void, onUpdate?: () => void) {
  if ('serviceWorker' in navigator) {
    // Only register service worker in production builds to avoid caching dev server modules
    if (!import.meta.env.PROD) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registrado con éxito:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available
                  console.log('[SW] Nueva versión de la app disponible.');
                  onUpdate?.();
                } else {
                  // Content is cached for offline use
                  console.log('[SW] Contenido en caché para uso offline.');
                  onSuccess?.();
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[SW] Error registrando Service Worker:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
