// components/NotificationManager.tsx
'use client'
import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationManager() {
  const [mounted, setMounted] = useState(false);
  const { permission } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Desktop เท่านั้นที่แสดง welcome notification
    if (!isMobile && permission === 'granted') {
      const timer = setTimeout(() => {
        try {
          new Notification('ยินดีต้อนรับเข้าสู่ระบบ BBS', {
            body: 'ระบบการแจ้งเตือนพร้อมใช้งาน',
            icon: '/favicon.ico'
          });
        } catch (error) {
          console.error('Failed to show welcome notification:', error);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [mounted, permission]);

  return null;
}