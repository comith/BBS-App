// components/NotificationToggleButton.tsx
'use client'
import { useState } from 'react';
import { Bell, BellOff, Info, X } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';

export default function NotificationToggleButton() {
  const { permission, isPushEnabled, requestPermission, unsubscribe } = useNotification();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (permission === 'denied') {
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isPushEnabled) {
        const success = await unsubscribe();
        console.log('Unsubscribe result:', success);
      } else {
        const success = await requestPermission();
        console.log('Permission request result:', success);
      }
    } catch (error) {
      console.error('Toggle notification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonColor = () => {
    if (permission === 'denied') return 'bg-red-500 hover:bg-red-600';
    if (isPushEnabled) return 'bg-green-500 hover:bg-green-600';
    return 'bg-orange-500 hover:bg-orange-600';
  };

  const getButtonIcon = () => {
    if (permission === 'denied') return <BellOff size={20} />;
    if (isPushEnabled) return <Bell size={20} />;
    return <BellOff size={20} />;
  };

  const getTooltipText = () => {
    if (permission === 'denied') return 'การแจ้งเตือนถูกปฏิเสธ - คลิกเพื่อดูวิธีแก้ไข';
    if (isPushEnabled) return 'ปิดการแจ้งเตือน';
    return 'เปิดการแจ้งเตือน';
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 text-white ${getButtonColor()} disabled:opacity-50 relative`}
          title={getTooltipText()}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            getButtonIcon()
          )}
        </button>

        {/* Info button สำหรับดูรายละเอียด */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs"
          title="ดูรายละเอียด"
        >
          <Info size={12} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-gray-900">การตั้งค่าการแจ้งเตือน</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Extracted permission color class */}
              {(() => {
                let permissionColorClass = '';
                if (permission === 'granted') {
                  permissionColorClass = 'text-green-600';
                } else if (permission === 'denied') {
                  permissionColorClass = 'text-red-600';
                } else {
                  permissionColorClass = 'text-orange-600';
                }
                let permissionText = '';
                if (permission === 'granted') {
                  permissionText = 'อนุญาต';
                } else if (permission === 'denied') {
                  permissionText = 'ปฏิเสธ';
                } else {
                  permissionText = 'รอการอนุญาต';
                }
                return (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">สถานะ Permission:</span>
                    <span className={`text-sm font-medium ${permissionColorClass}`}>
                      {permissionText}
                    </span>
                  </div>
                );
              })()}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Push Notifications:</span>
                <span className={`text-sm font-medium ${isPushEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {isPushEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>

              {permission === 'denied' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium mb-2">วิธีเปิดการแจ้งเตือน:</p>
                  <ol className="text-xs text-red-600 space-y-1 list-decimal list-inside">
                    <li>คลิกไอคอน 🔒 ที่แถบ URL</li>
                    <li>เลือก "Notifications" → "Allow"</li>
                    <li>รีเฟรชหน้าเว็บ</li>
                  </ol>
                </div>
              )}

              {permission === 'granted' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    การแจ้งเตือนทำงานปกติ คุณจะได้รับข่าวสารสำคัญจากระบบ BBS
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}