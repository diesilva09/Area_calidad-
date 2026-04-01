self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notificación', message: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Notificación';
  const options = {
    body: data.message || '',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    data: {
      url: data.url || '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification && event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of allClients) {
        if (client.url && client.url.includes(url)) {
          return client.focus();
        }
      }

      return clients.openWindow(url);
    })()
  );
});
