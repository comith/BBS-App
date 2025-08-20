// components/NotificationManager.tsx
'use client'
import { useEffect, useState } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationManager() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <NotificationManagerClient />;
}

function NotificationManagerClient() {
  const { requestPermission, permission } = useNotification();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าอยู่ใน client-side และมี API ที่จำเป็น
    if (
      typeof window === 'undefined' || 
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      console.log('Notification API not supported');
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // สำหรับ mobile ใช้ user interaction แทน auto-request
    if (isMobile) {
      console.log('Mobile detected - waiting for user interaction');
      
      const handleFirstInteraction = async () => {
        if (!hasRequestedPermission && permission === 'default') {
          console.log('Requesting permission after user interaction');
          setHasRequestedPermission(true);
          
          try {
            await requestPermission();
          } catch (error) {
            console.error('Permission request failed:', error);
          }
        }
        
        // ลบ event listener หลังใช้งานครั้งแรก
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('click', handleFirstInteraction);
      };

      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('click', handleFirstInteraction, { once: true });
      
      return () => {
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('click', handleFirstInteraction);
      };
    } 
    
    // สำหรับ desktop ใช้ auto-request
    else {
      if (permission === 'granted') {
        // ส่ง notification หลังจาก delay เล็กน้อย
        const timer = setTimeout(() => {
          try {
            new Notification('ยินดีต้อนรับ!', {
              body: 'ระบบการแจ้งเตือนพร้อมใช้งาน',
              icon: '/favicon.ico'
            });
          } catch (error) {
            console.error('Failed to show notification:', error);
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      if (permission === 'default' && !hasRequestedPermission) {
        const timer = setTimeout(async () => {
          setHasRequestedPermission(true);
          try {
            await requestPermission();
          } catch (error) {
            console.error('Auto permission request failed:', error);
          }
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [permission, requestPermission, hasRequestedPermission]);

  return null;
}