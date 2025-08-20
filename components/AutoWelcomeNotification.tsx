// components/AutoWelcomeNotification.tsx
'use client'
import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function AutoWelcomeNotification() {
  const { permission, requestPermission } = useNotification();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (hasShownWelcome) return;

    const showWelcome = async () => {
      try {
        // ถ้ามี permission แล้ว ส่งทันที
        if (permission === 'granted') {
          await sendWelcomeNotification();
          setHasShownWelcome(true);
          return;
        }

        // ถ้ายังไม่มี permission ให้ขอก่อน
        if (permission === 'default') {
          const granted = await requestPermission();
          if (granted) {
            // หลังจากได้ permission แล้วจะส่ง welcome notification อัตโนมัติใน hook
            setHasShownWelcome(true);
          }
        }
      } catch (error) {
        console.error('Auto welcome notification error:', error);
      }
    };

    const timer = setTimeout(showWelcome, 2000);
    return () => clearTimeout(timer);
  }, [permission, requestPermission, hasShownWelcome]);

  const sendWelcomeNotification = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification('ยินดีต้อนรับเข้าสู่ระบบ BBS', {
            body: 'Behavior Base Safety - ความปลอดภัยเริ่มต้นที่พฤติกรรม',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'auto-welcome'
          });
          return;
        }
      }
      
      // Fallback
      new Notification('ยินดีต้อนรับเข้าสู่ระบบ BBS', {
        body: 'Behavior Base Safety - ความปลอดภัยเริ่มต้นที่พฤติกรรม',
        icon: '/favicon.ico'
      });
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  };

  return null;
}