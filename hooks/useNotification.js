// hooks/useNotification.js
'use client'
import { useEffect, useState } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState('default');
  const [swRegistration, setSwRegistration] = useState(null);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [canUseNotification, setCanUseNotification] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      setCanUseNotification('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && isSecure);

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      if ('serviceWorker' in navigator && canUseNotification) {
        registerServiceWorker();
      }
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      setSwRegistration(registration);
      
      // เช็คว่ามี subscription อยู่แล้วหรือไม่
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setPushSubscription(existingSubscription);
        console.log('Existing subscription found:', existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  // ฟังก์ชันแปลง VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!swRegistration || permission !== 'granted') {
      console.warn('ไม่สามารถ subscribe ได้: ไม่มี permission หรือ service worker');
      return null;
    }

    try {
      const applicationServerKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      );

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', subscription);
      setPushSubscription(subscription);

      // ส่ง subscription ไปยัง server
      await saveSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  };

  const saveSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Subscription saved to server');
      } else {
        console.error('Failed to save subscription to server');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);
        console.log('Unsubscribed from push notifications');
        
        // แจ้ง server ว่า unsubscribe แล้ว
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: pushSubscription.endpoint })
        });
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  };

  const requestPermission = async () => {
    if (!canUseNotification) {
      console.warn('Notification ไม่สามารถใช้งานได้ในสภาพแวดล้อมนี้');
      return false;
    }

    if (isMobile && location.protocol !== 'https:') {
      alert('สำหรับมือถือ กรุณาใช้งานผ่าน HTTPS เพื่อเปิดใช้งาน Notification');
      return false;
    }

    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // ถ้าได้ permission แล้ว ให้ subscribe ทันที
      if (result === 'granted' && swRegistration) {
        await subscribeToPush();
      }
      
      return result === 'granted';
    }
    return false;
  };

  const sendLocalNotification = (title, body, options = {}) => {
    if (permission !== 'granted') {
      console.warn('ไม่มีสิทธิ์ส่ง notification');
      return;
    }

    const defaultOptions = {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'local-notification',
      ...options
    };

    if (swRegistration) {
      swRegistration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  };

  // ฟังก์ชันส่ง push notification จาก server
  const sendPushNotification = async (title, body, options = {}) => {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || 'การแจ้งเตือน',
          body: body || 'คุณมีข้อความใหม่',
          icon: options.icon || '/favicon.ico',
          url: options.url || '/'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Push notification sent successfully:', result.message);
        return true;
      } else {
        console.error('Failed to send push notification:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  };


  const sendTestPush = async () => {
    return await sendPushNotification(
      'ทดสอบ Push Notification',
      'นี่คือข้อความทดสอบจาก Server!',
      {
        icon: '/favicon.ico',
        url: '/'
      }
    );
  };

  return {
    permission,
    requestPermission,
    swRegistration,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendLocalNotification,
    canSendNotification: permission === 'granted' && canUseNotification,
    isPushEnabled: pushSubscription !== null,
    isMobile,
    canUseNotification,
    needsHttps: isMobile && location.protocol !== 'https:',
    sendPushNotification,
    sendTestPush,
  };
}