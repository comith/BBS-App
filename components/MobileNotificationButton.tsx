// components/MobileNotificationButton.tsx
'use client'
import { useState, useEffect } from 'react';
import { useNotification } from '@/hooks/useNotification';

export default function MobileNotificationButton() {
  const { requestPermission, permission } = useNotification();
  const [isMobile, setIsMobile] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    setIsMobile(mobile);
    
    const debug = `
      Mobile: ${mobile}
      Permission: ${permission}
      UserAgent: ${userAgent.substring(0, 50)}...
    `;
    setDebugInfo(debug);
    console.log('MobileNotificationButton Debug:', debug);
    
    // แสดงปุ่มถ้าเป็น mobile และ permission ยังเป็น default
    if (mobile && permission === 'default') {
      setShowButton(true);
      console.log('Should show button: true');
    } else {
      console.log('Should show button: false');
    }
  }, [permission]);

  // แสดงปุ่มทดสอบเสมอบน mobile (ชั่วคราว)
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (mobile) {
      setShowButton(true); // บังคับแสดงเพื่อทดสอบ
    }
  }, []);

  const handleEnableNotifications = async () => {
    console.log('Button clicked! Current permission:', permission);
    
    try {
      const success = await requestPermission();
      console.log('Permission result:', success);
      
      if (success) {
        setTimeout(() => {
          new Notification('ทดสอบ Mobile Notification', {
            body: 'การแจ้งเตือนทำงานบนมือถือแล้ว',
            icon: '/favicon.ico'
          });
        }, 500);
      }
    } catch (error) {
      console.error('Permission error:', error);
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  // แสดงปุ่มทดสอบเสมอบน mobile
  if (!isMobile) {
    return (
      <div className="fixed top-4 left-4 bg-red-500 text-white p-2 text-xs">
        Desktop - No button
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg mx-4">
        <div className="mb-2">
          <p className="font-bold">Mobile Notification Test</p>
          <p className="text-xs opacity-75">Permission: {permission}</p>
        </div>
        <button
          onClick={handleEnableNotifications}
          className="w-full bg-white text-blue-600 px-4 py-2 rounded font-medium"
        >
          Enable Notifications
        </button>
        <details className="mt-2">
          <summary className="text-xs cursor-pointer">Debug Info</summary>
          <pre className="text-xs mt-1 opacity-75">{debugInfo}</pre>
        </details>
      </div>
    </div>
  );
}