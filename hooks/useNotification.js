// hooks/useNotification.js
'use client'
import { useEffect, useState } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState('default');
  const [swRegistration, setSwRegistration] = useState(null);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isSwReady, setIsSwReady] = useState(false);
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
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
      
      setSwRegistration(registration);
      setIsSwReady(true);
      
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setPushSubscription(existingSubscription);
        console.log('Existing subscription found:', existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

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
    console.log('Attempting to subscribe to push...');

    if (!swRegistration || !isSwReady) {
      console.warn('Service Worker ยังไม่พร้อม กรุณารอสักครู่');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('ไม่มี permission สำหรับ notification');
      return null;
    }

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCVZmQM7FJ8nidZkk0x825ElILW7mtTm2xxe749klv4Rt8cDnOhlrQ8FWEuujpYKPZUF7i3L9z5HUREm6t4cZEE';
      
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', subscription);
      setPushSubscription(subscription);

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
        const result = await response.json();
        console.log('Subscription saved successfully:', result);
      } else {
        console.error('Failed to save subscription:', response.status);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (swRegistration && isSwReady) {
      try {
        const currentSubscription = await swRegistration.pushManager.getSubscription();
        
        if (!currentSubscription && pushSubscription) {
          console.log('Subscription หายไป กำลัง re-subscribe...');
          setPushSubscription(null);
          // Auto re-subscribe
          await subscribeToPush();
        } else if (currentSubscription && !pushSubscription) {
          console.log('พบ subscription ที่ยังใช้ได้');
          setPushSubscription(currentSubscription);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }
  };

  // useEffect สำหรับเช็คสถานะ subscription
  useEffect(() => {
    if (swRegistration && isSwReady) {
      // เช็คสถานะทุก 30 วินาที
      const interval = setInterval(() => {
        checkSubscriptionStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [swRegistration, isSwReady, pushSubscription]); // เพิ่ม pushSubscription เป็น dependency

  const unsubscribeFromPush = async () => {
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);
        console.log('Unsubscribed from push notifications');
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

    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted' && swRegistration && isSwReady) {
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

  // เพิ่มฟังก์ชันเช็คสถานะแบบ manual
  const manualCheckStatus = async () => {
    console.log('=== Manual Status Check ===');
    console.log('Permission:', permission);
    console.log('SW Ready:', isSwReady);
    console.log('Push Enabled:', pushSubscription !== null);
    console.log('Push Subscription:', pushSubscription);
    
    if (swRegistration) {
      const currentSub = await swRegistration.pushManager.getSubscription();
      console.log('Current SW Subscription:', currentSub);
      
      if (currentSub && !pushSubscription) {
        console.log('Found subscription, updating state...');
        setPushSubscription(currentSub);
      }
    }
  };

  return {
    permission,
    requestPermission,
    swRegistration,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendLocalNotification,
    sendPushNotification,
    sendTestPush,
    manualCheckStatus, // เพิ่มฟังก์ชันนี้
    canSendNotification: permission === 'granted' && canUseNotification,
    isPushEnabled: pushSubscription !== null,
    isSwReady,
    isMobile,
    canUseNotification,
    needsHttps: isMobile && location.protocol !== 'https:'
  };
}