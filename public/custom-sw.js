
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
    tag: 'notification-1', // ป้องกัน notification ซ้ำ
    requireInteraction: true 
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Event สำหรับจัดการเมื่อผู้ใช้คลิกที่ notification
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification Click');
  
  // ปิด notification
  event.notification.close();
  
  // เปิดหน้าต่างแอป หรือกลับไปที่แอป
  event.waitUntil(
    self.clients.matchAll().then(function(clientList) {
      // หาหน้าต่างที่เปิดอยู่แล้ว
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // ถ้าไม่มีหน้าต่างเปิดอยู่ ให้เปิดใหม่
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
