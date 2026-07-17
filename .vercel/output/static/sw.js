self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/messages'
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Univers', options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
      // Fallback text
      event.waitUntil(
        self.registration.showNotification('Univers', {
          body: event.data.text(),
          icon: '/logo.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/messages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
