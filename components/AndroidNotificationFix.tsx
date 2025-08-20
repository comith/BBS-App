// components/AndroidNotificationFix.tsx
'use client'
import { useState, useEffect } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function AndroidNotificationFix() {
  const { requestPermission, permission } = useNotification();
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const android = /Android/i.test(userAgent);
    setIsAndroid(android);

    // เช็คว่าเป็น PWA หรือไม่
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isPWAMode);

    console.log('Android detected:', android);
    console.log('PWA mode:', isPWAMode);
    console.log('Permission:', permission);

    // แสดง install prompt สำหรับ Android ที่ยังไม่ install PWA
    if (android && !isPWAMode && permission === 'default') {
      setShowInstallPrompt(true);
    }
  }, [permission]);


  useEffect(() => {
  // ปิด beforeinstallprompt event
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    console.log('PWA install prompt blocked');
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}, []);

  const handleEnableNotifications = async () => {
    console.log('Android: Attempting to enable notifications...');
    
    try {
      // สำหรับ Android ลอง request หลายครั้ง
      const result = await requestPermission();
      console.log('First attempt result:', result);
      
      if (!result) {
        // ลองอีกครั้งหลัง delay
        setTimeout(async () => {
          const secondResult = await requestPermission();
          console.log('Second attempt result:', secondResult);
        }, 1000);
      }
    } catch (error) {
      console.error('Android notification error:', error);
    }
  };

  const handleInstallPWA = () => {
    alert('กรุณา:\n1. กดปุ่ม "Menu" (⋮) ในเบราว์เซอร์\n2. เลือก "Add to Home screen"\n3. เปิดแอปจาก Home screen\n4. ลองเปิด notification อีกครั้ง');
  };

  if (!isAndroid) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg mx-4">
        <div className="mb-3">
          <p className="font-medium text-sm">การแจ้งเตือนสำหรับ Android</p>
          <p className="text-xs opacity-90 mt-1">
            {isPWA ? 
              'คุณใช้งานในโหมด PWA แล้ว' : 
              'แนะนำให้ติดตั้งเป็น PWA เพื่อการทำงานที่ดีที่สุด'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isPWA && (
            <button
              onClick={handleInstallPWA}
              className="flex-1 bg-white/20 text-white px-3 py-2 rounded text-sm hover:bg-white/30"
            >
              วิธีติดตั้ง PWA
            </button>
          )}
          <button
            onClick={handleEnableNotifications}
            className="flex-1 bg-white text-green-600 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100"
          >
            เปิดการแจ้งเตือน
          </button>
        </div>
        
        {permission === 'denied' && (
          <div className="mt-2 p-2 bg-red-500/20 rounded text-xs">
            การแจ้งเตือนถูกปฏิเสธ กรุณาเปิดในการตั้งค่าเบราว์เซอร์
          </div>
        )}
      </div>
    </div>
  );
}