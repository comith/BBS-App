
console.log('Custom Service Worker Logic Loaded');

// Event สำหรับรับ push notification จาก server
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push Received');
  
  let notificationData = {
    title: 'การแจ้งเตือน',
    body: 'คุณมีข้อความใหม่',
    icon: '/icons/ith.png',
    badge: '/icons/ith.png'
  };

  // ถ้ามีข้อมูลมาจาก server
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {}
      };
    } catch (e) {
      console.log('Error parsing push data:', e);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: notificationData.data,

    requireInteraction: true 
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Event สำหรับจัดการเมื่อผู้ใช้คลิกที่ notification
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification Click');

  event.notification.close();

  const targetUrl = '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // หาหน้าต่าง dashboard ที่เปิดอยู่แล้ว
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          // แจ้งให้ dashboard รีเฟรชข้อมูล
          client.postMessage({ type: 'REFRESH_REPORTS' });
          return client.focus();
        }
      }
      // ถ้าไม่มีหน้าต่างเปิดอยู่ ให้เปิดใหม่
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
