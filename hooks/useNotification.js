// hooks/useNotification.js
"use client";
import { useEffect, useState } from "react";

export function useNotification() {
  const [permission, setPermission] = useState("default");
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      !window.navigator
    ) {
      return;
    }
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );

    if ("Notification" in window) {
      setPermission(Notification.permission);

      // ขอ permission อัตโนมัติเมื่อโหลดหน้า
      if (Notification.permission === "default") {
        // รอ 2 วินาทีก่อนขอ permission เพื่อให้ user เห็นหน้าเว็บก่อน
        setTimeout(() => {
          requestPermission();
        }, 2000);
      }
    }
  }, []);

  // ตรวจสอบว่าสามารถใช้ notification ได้หรือไม่
  
 const canUseNotification = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && isSecure;
  } catch (error) {
    console.error('Error checking notification support:', error);
    return false;
  }
};

  // แปลง VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // บันทึก subscription ไปยัง server
  const saveSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Subscription saved:", result.message);
        return true;
      } else {
        console.error("❌ Failed to save subscription:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error saving subscription:", error);
      return false;
    }
  };

  // ขอ permission และ subscribe ในคำสั่งเดียว
  const requestPermission = async () => {
  if (!canUseNotification()) {
    console.warn('Notification ไม่รองรับในสภาพแวดล้อมนี้');
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result !== 'granted') {
      console.warn('ไม่ได้รับ permission:', result);
      return false;
    }

    console.log('Permission granted, setting up service worker...');

    // ลงทะเบียน service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('Service Worker ready');
    
    // Subscribe to push
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCVZmQM7FJ8nidZkk0x825ElILW7mtTm2xxe749klv4Rt8cDnOhlrQ8FWEuujpYKPZUF7i3L9z5HUREm6t4cZEE';
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    
    setPushSubscription(subscription);
    await saveSubscriptionToServer(subscription);
    
    // ส่ง notification ผ่าน Service Worker แทน (สำหรับ Android)
    await registration.showNotification('ยินดีต้อนรับ!', {
      body: 'ระบบการแจ้งเตือนพร้อมใช้งานแล้ว',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'welcome-notification'
    });
    
    return true;
  } catch (error) {
    console.error('Setup failed:', error);
    return false;
  }
};

  // ยกเลิก subscription
  const unsubscribe = async () => {
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);
        console.log("✅ Unsubscribed successfully");
        return true;
      } catch (error) {
        console.error("❌ Unsubscribe failed:", error);
        return false;
      }
    }
    return false;
  };

  // ส่ง Local Notification
  const sendLocalNotification = async (title, body, options = {}) => {
  if (permission !== 'granted') {
    console.warn('ไม่มีสิทธิ์ส่ง notification');
    return false;
  }

  const defaultOptions = {
    body: body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'local-notification',
    ...options
  };

  try {
    // ลองใช้ Service Worker ก่อน (สำหรับ Android)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }
    
    // Fallback สำหรับ browser อื่น ๆ
    new Notification(title, defaultOptions);
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
};

  // ส่ง Push Notification
  const sendPushNotification = async (title, body, options = {}) => {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "การแจ้งเตือน",
          body: body || "คุณมีข้อความใหม่",
          icon: options.icon || "/favicon.ico",
          url: options.url || "/",
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Push notification sent:", result.message);
        return true;
      } else {
        console.error("❌ Push notification failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error sending push notification:", error);
      return false;
    }
  };

  // ส่ง push notification ทดสอบ
  const sendTestPush = async () => {
    return await sendPushNotification(
      "ทดสอบ Push Notification",
      "นี่คือข้อความทดสอบจาก Server! 🚀"
    );
  };

  return {
    // States
    permission,
    isPushEnabled: pushSubscription !== null,
    isMobile,

    // Actions
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    sendPushNotification,
    sendTestPush,

    // Helper
    canUseNotification: canUseNotification(),
    needsHttps: isMobile && location.protocol !== "https:",
  };
}
