// hooks/useNotification.js
"use client";
import { useEffect, useState } from "react";

export function useNotification() {
  const [permission, setPermission] = useState("default");
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const NOTIFICATION_STORAGE_KEY = "bbs_notification_settings";

  const saveNotificationSettings = (settings) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          NOTIFICATION_STORAGE_KEY,
          JSON.stringify(settings)
        );
      } catch (error) {
        console.error("Error saving notification settings:", error);
      }
    }
  };

  const loadNotificationSettings = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error("Error loading notification settings:", error);
        return null;
      }
    }
    return null;
  };

  const restoreSubscription = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const existingSubscription =
            await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setPushSubscription(existingSubscription);
            console.log("Restored existing subscription");
          }
        }
      }
    } catch (error) {
      console.error("Error restoring subscription:", error);
    }
  };

  // รวม useEffect เป็นอันเดียว
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ตั้งค่า isMobile
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );

    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // โหลดการตั้งค่าที่บันทึกไว้
      const savedSettings = loadNotificationSettings();
      if (savedSettings) {
        console.log("Loaded notification settings:", savedSettings);
        if (savedSettings.isEnabled && currentPermission === "granted") {
          restoreSubscription();
        }
      }
    }
  }, []);

  const canUseNotification = () => {
    if (typeof window === "undefined") return false;

    try {
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost";
      return (
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        isSecure
      );
    } catch (error) {
      console.error("Error checking notification support:", error);
      return false;
    }
  };

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

  const saveSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Subscription saved:", result.message);
        return true;
      } else {
        console.error("Failed to save subscription:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error saving subscription:", error);
      return false;
    }
  };

  const requestPermission = async () => {
    if (!canUseNotification()) {
      console.warn("Notification ไม่รองรับในสภาพแวดล้อมนี้");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        console.warn("ไม่ได้รับ permission:", result);
        return false;
      }

      // บันทึกการตั้งค่า
      saveNotificationSettings({
        isEnabled: true,
        enabledAt: new Date().toISOString(),
      });

      console.log("Permission granted, setting up service worker...");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BCVZmQM7FJ8nidZkk0x825ElILW7mtTm2xxe749klv4Rt8cDnOhlrQ8FWEuujpYKPZUF7i3L9z5HUREm6t4cZEE";
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      setPushSubscription(subscription);
      await saveSubscriptionToServer(subscription);

      return true;
    } catch (error) {
      console.error("Setup failed:", error);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);

        saveNotificationSettings({
          isEnabled: false,
          disabledAt: new Date().toISOString(),
        });

        console.log("Unsubscribed successfully");
        return true;
      } catch (error) {
        console.error("Unsubscribe failed:", error);
        return false;
      }
    }
    return false;
  };

  const sendLocalNotification = async (title, body, options = {}) => {
    if (permission !== "granted") {
      console.warn("ไม่มีสิทธิ์ส่ง notification");
      return false;
    }

    const defaultOptions = {
      body: body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "local-notification",
      ...options,
    };

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, defaultOptions);
          return true;
        }
      }
      new Notification(title, defaultOptions);
      return true;
    } catch (error) {
      console.error("Failed to show notification:", error);
      return false;
    }
  };

  const sendPushNotification = async (title, body, options = {}) => {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "การแจ้งเตือน",
          body: body || "คุณมีข้อความใหม่",
          icon: options.icon || "/favicon.ico",
          url: options.url || "/",
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("Push notification sent:", result.message);
        return true;
      } else {
        console.error("Push notification failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  };

  const sendTestPush = async () => {
    return await sendPushNotification(
      "ทดสอบ Push Notification",
      "นี่คือข้อความทดสอบจาก Server!"
    );
  };

  return {
    permission,
    isPushEnabled: pushSubscription !== null,
    isMobile,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    sendPushNotification,
    sendTestPush,
    loadNotificationSettings,
    canUseNotification: canUseNotification(),
    needsHttps:
      typeof window !== "undefined"
        ? isMobile && window.location.protocol !== "https:"
        : false,
  };
}
