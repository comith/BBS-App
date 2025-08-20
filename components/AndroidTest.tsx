// components/AndroidTest.tsx
'use client'
import { useState } from 'react';

export default function AndroidTest() {
  const [testResult, setTestResult] = useState('');

  const testNotifications = async () => {
    let results = [];
    
    // Test 1: Basic notification support
    results.push(`Notification API: ${'Notification' in window}`);
    results.push(`ServiceWorker API: ${'serviceWorker' in navigator}`);
    results.push(`PushManager API: ${'PushManager' in window}`);
    
    // Test 2: Permission
    const permission = await Notification.requestPermission();
    results.push(`Permission: ${permission}`);
    
    if (permission === 'granted') {
      // Test 3: Direct notification
      try {
        new Notification('Android Test Direct', {
          body: 'Direct notification ทำงานหรือไม่',
          icon: '/favicon.ico'
        });
        results.push('Direct notification: SUCCESS');
      } catch (error) {
        results.push(
          `Direct notification: FAILED - ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      
      // Test 4: Service Worker notification
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        
        await registration.showNotification('Android Test SW', {
          body: 'Service Worker notification ทำงานหรือไม่',
          icon: '/favicon.ico'
        });
        results.push('Service Worker notification: SUCCESS');
      } catch (error) {
        results.push(
          `Service Worker notification: FAILED - ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    
    setTestResult(results.join('\n'));
  };

  return (
    <div className="fixed top-4 left-4 right-4 bg-yellow-500 text-black p-4 rounded z-50">
      <button 
        onClick={testNotifications}
        className="bg-black text-yellow-500 px-4 py-2 rounded mb-2"
      >
        Test Android Notifications
      </button>
      {testResult && (
        <pre className="text-xs bg-black text-yellow-500 p-2 rounded">
          {testResult}
        </pre>
      )}
    </div>
  );
}