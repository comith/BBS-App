// components/NotificationTest.js
'use client'
import { useNotification } from '@/hooks/useNotification';
import { useState } from 'react';

export default function NotificationTest() {
  const { 
    permission, 
    isPushEnabled,
    unsubscribe,
    sendLocalNotification, 
    sendTestPush,
    sendPushNotification,
    needsHttps
  } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showTestPanel, setShowTestPanel] = useState(false);

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      alert('ยกเลิกการแจ้งเตือนแล้ว');
    }
  };

  const handleSendTest = async () => {
    setIsLoading(true);
    const success = await sendTestPush();
    setIsLoading(false);
    
    if (success) {
      alert('ส่ง notification แล้ว!');
    } else {
      alert('ส่งไม่สำเร็จ');
    }
  };

  const handleSendCustom = async () => {
    if (!customTitle.trim() && !customBody.trim()) {
      alert('กรุณาใส่หัวข้อหรือข้อความ');
      return;
    }

    setIsLoading(true);
    const success = await sendPushNotification(
      customTitle.trim() || 'การแจ้งเตือน',
      customBody.trim() || 'ข้อความแจ้งเตือน'
    );
    setIsLoading(false);
    
    if (success) {
      alert('ส่ง notification แล้ว!');
      setCustomTitle('');
      setCustomBody('');
    } else {
      alert('ส่งไม่สำเร็จ');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {needsHttps && (
        <div style={{ 
          background: '#fff3cd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          สำหรับมือถือต้องใช้ HTTPS
        </div>
      )}

      {/* แสดงสถานะแบบเรียบง่าย */}
      {isPushEnabled && (
        <div style={{ 
          background: '#d4edda', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          color: '#155724'
        }}>
          การแจ้งเตือนเปิดใช้งานอยู่
        </div>
      )}

      {permission === 'denied' && (
        <div style={{ 
          background: '#f8d7da', 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #f5c6cb',
          color: '#721c24'
        }}>
          การแจ้งเตือนถูกปิดใช้งาน กรุณาเปิดในการตั้งค่าเบราว์เซอร์
        </div>
      )}

      {/* แสดง Test Panel เฉพาะเมื่อต้องการ */}
      {showTestPanel && isPushEnabled && (
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => setShowTestPanel(!showTestPanel)}
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            {showTestPanel ? 'ซ่อน' : 'แสดง'} Panel ทดสอบ
          </button>

          <div>
            <h3>ส่งการแจ้งเตือน</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => sendLocalNotification('ทดสอบ Local', 'ข้อความทดสอบแบบ Local')}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Local Notification
              </button>
              
              <button 
                onClick={handleSendTest}
                disabled={isLoading}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: isLoading ? '#6c757d' : '#ff6b35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'กำลังส่ง...' : 'Push Test'}
              </button>
            </div>

            <div style={{ 
              border: '1px solid #ddd', 
              padding: '20px', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>ส่งข้อความกำหนดเอง</h4>
              <input
                type="text"
                placeholder="หัวข้อ"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginBottom: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <textarea
                placeholder="ข้อความ"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                rows="3"
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
              <button 
                onClick={handleSendCustom}
                disabled={isLoading}
                style={{ 
                  padding: '10px 20px',
                  backgroundColor: isLoading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginTop: '10px'
                }}
              >
                {isLoading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
              </button>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={handleUnsubscribe}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ปิดการแจ้งเตือน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}