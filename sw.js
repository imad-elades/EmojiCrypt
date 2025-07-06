/**
 * EmojiCrypt Service Worker
 * Développé par IMAD ELADES
 * Gère la mise en cache et le fonctionnement hors ligne
 */

const CACHE_NAME = 'emojicrypt-v1.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/encryption.js',
  '/js/emoji-mapping.js',
  '/manifest.json',
  // CDN resources
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js'
];

// Installation du service worker
self.addEventListener('install', event => {
  console.log('[SW] Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des ressources statiques');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-HTTP
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  if (STATIC_CACHE_URLS.some(url => event.request.url.includes(url.replace('/', '')))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('[SW] Ressource servie depuis le cache:', event.request.url);
            return response;
          }
          
          console.log('[SW] Ressource récupérée depuis le réseau:', event.request.url);
          return fetch(event.request)
            .then(response => {
              // Mettre en cache la nouvelle ressource
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            });
        })
        .catch(() => {
          // Fallback en cas d'échec
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  } else {
    // Stratégie Network First pour les autres ressources
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Mettre en cache les réponses réussies
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback vers le cache en cas d'échec réseau
          return caches.match(event.request);
        })
    );
  }
});

// Gestion des messages depuis l'application principale
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      timestamp: new Date().toISOString()
    });
  }
});

// Notification de mise à jour disponible
self.addEventListener('updatefound', () => {
  console.log('[SW] Mise à jour disponible');
  
  // Notifier l'application principale
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_NAME
      });
    });
  });
});

// Gestion des erreurs
self.addEventListener('error', event => {
  console.error('[SW] Erreur:', event.error);
});

// Gestion des erreurs de promesses non capturées
self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Promesse rejetée:', event.reason);
  event.preventDefault();
});

// Synchronisation en arrière-plan (pour les futures fonctionnalités)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Synchronisation en arrière-plan');
    // Ici on pourrait synchroniser les données hors ligne
  }
});

// Notification push (pour les futures fonctionnalités)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Notification push reçue:', data);
    
    const options = {
      body: data.body || 'Nouveau message EmojiCrypt',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'EmojiCrypt', options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker EmojiCrypt initialisé - Développé par IMAD ELADES');

