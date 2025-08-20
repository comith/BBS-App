// components/NotificationManager.tsx
'use client'
import { useEffect } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationManager() {
  const { requestPermission, permission, isPushEnabled } = useNotification();

  useEffect(() => {
    console.log('NotificationManager mounted');
    console.log('Initial permission:', permission);
    console.log('Initial isPushEnabled:', isPushEnabled);

    // ส่ง notification ทันทีถ้ามี permission แล้ว
    if (permission === 'granted') {
      console.log('Permission already granted, sending test notification...');
      new Notification('ระบบพร้อมใช้งาน', {
        body: 'การแจ้งเตือนทำงานปกติ',
        icon: '/favicon.ico'
      });
    }

    // ขอ permission ถ้ายังไม่มี
    if (permission === 'default') {
      console.log('Requesting permission in 3 seconds...');
      const timer = setTimeout(async () => {
        console.log('Requesting permission now...');
        const success = await requestPermission();
        console.log('Permission request result:', success);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [permission, isPushEnabled, requestPermission]);

  // เช็คการเปลี่ยนแปลง state
  useEffect(() => {
    console.log('Permission changed to:', permission);
  }, [permission]);

  useEffect(() => {
    console.log('isPushEnabled changed to:', isPushEnabled);
  }, [isPushEnabled]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      Permission: {permission}<br/>
      Push: {isPushEnabled ? 'Yes' : 'No'}
    </div>
  );
}