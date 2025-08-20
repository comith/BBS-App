// public/sw.js
console.log('Service Worker: Loaded');

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
    tag: 'notification-1' // ป้องกัน notification ซ้ำ
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
    clients.matchAll().then(function(clientList) {
      // หาหน้าต่างที่เปิดอยู่แล้ว
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // ถ้าไม่มีหน้าต่างเปิดอยู่ ให้เปิดใหม่
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Event สำหรับการติดตั้ง service worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing');
  self.skipWaiting(); // ข้าม waiting state
});

// Event สำหรับการ activate service worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim()); // ควบคุม clients ทันที
});


self.addEventListener('install', function(event) {
  console.log('SW: Installing on Android');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('SW: Activated on Android');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('SW: Push received on Android');
  
  let notificationData = {
    title: 'การแจ้งเตือน Android',
    body: 'ข้อความจาก service worker',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.log('Error parsing push data:', e);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: 'android-notification',
    requireInteraction: true, // สำคัญสำหรับ Android
    vibrate: [200, 100, 200],
    data: notificationData.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});