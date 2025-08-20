// components/NotificationTest.js
"use client";
import { useNotification } from "@/hooks/useNotification";
import { useState } from "react";

export default function NotificationTest() {
  const {
    permission,
    requestPermission,
    sendLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
    sendPushNotification,
    sendTestPush,
    canSendNotification,
    isPushEnabled,
    pushSubscription,
    isMobile,
    needsHttps,
    isSwReady,
    waitForServiceWorkerReady
  } = useNotification();

  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert("ได้รับอนุญาตและ subscribe แล้ว!");
    } else {
      alert("ไม่ได้รับอนุญาต");
    }
  };

  const handleSendLocalNotification = () => {
    sendLocalNotification(
      "ทดสอบ Local Notification",
      "นี่คือข้อความทดสอบแบบ Local",
      {
        icon: "/favicon.ico",
        vibrate: [200, 100, 200],
      }
    );
  };

  const handleSendTestPush = async () => {
    setIsLoading(true);
    const success = await sendTestPush();
    setIsLoading(false);

    if (success) {
      alert("ส่ง Push Notification สำเร็จ! (อาจใช้เวลาสักครู่)");
    } else {
      alert("ส่ง Push Notification ไม่สำเร็จ");
    }
  };

  const handleSendCustomPush = async () => {
    if (!customTitle.trim() && !customBody.trim()) {
      alert("กรุณาใส่หัวข้อหรือข้อความ");
      return;
    }

    setIsLoading(true);
    const success = await sendPushNotification(
      customTitle.trim() || "การแจ้งเตือน",
      customBody.trim() || "ข้อความแจ้งเตือน"
    );
    setIsLoading(false);

    if (success) {
      alert("ส่ง Push Notification สำเร็จ!");
      setCustomTitle("");
      setCustomBody("");
    } else {
      alert("ส่ง Push Notification ไม่สำเร็จ");
    }
  };

  const handleSubscribe = async () => {
    const subscription = await subscribeToPush();
    if (subscription) {
      alert("Subscribe สำเร็จ!");
    } else {
      alert("Subscribe ไม่สำเร็จ");
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribeFromPush();
    alert("Unsubscribe แล้ว");
  };

  const handleCheckStatus = async () => {
    console.log("=== Checking Status ===");
    console.log("Permission:", permission);
    console.log("SW Ready:", isSwReady);
    console.log("Push Enabled:", isPushEnabled);
    console.log("Push Subscription:", pushSubscription);

    if (swRegistration) {
      const currentSub = await swRegistration.pushManager.getSubscription();
      console.log("Current SW Subscription:", currentSub);
    }
  };

  const handleViewSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscribe");
      const data = await response.json();
      console.log("All subscriptions:", data);
      alert(`พบ ${data.total} subscriptions (ดู Console สำหรับรายละเอียด)`);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const handleTestSwReady = async () => {
  try {
    console.log('Testing Service Worker readiness...');
    const registration = await waitForServiceWorkerReady();
    console.log('Service Worker is ready:', registration);
    alert('Service Worker พร้อมแล้ว!');
  } catch (error) {
    console.error('Service Worker test failed:', error);
    alert('Service Worker ไม่พร้อม: ' + error.message);
  }
};

const handleManualSubscribe = async () => {
  try {
    console.log('Manual subscribe attempt...');
    const subscription = await subscribeToPush();
    if (subscription) {
      alert('Subscribe สำเร็จ!');
    } else {
      alert('Subscribe ไม่สำเร็จ');
    }
  } catch (error) {
    console.error('Manual subscribe error:', error);
    alert('Error: ' + error.message);
  }
};

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        margin: "20px",
        maxWidth: "600px",
        display:'none'
      }}
    >
      <h3>🔔 PWA Notification Test</h3>

      <div style={{ marginBottom: "15px" }}>
        <p>
          <strong>สถานะ Permission:</strong>{" "}
          <span style={{ color: permission === "granted" ? "green" : "red" }}>
            {permission}
          </span>
        </p>
        <p>
          <strong>Device:</strong> {isMobile ? "Mobile 📱" : "Desktop 💻"}
        </p>
        <p>
          <strong>Push Enabled:</strong>{" "}
          <span style={{ color: isPushEnabled ? "green" : "red" }}>
            {isPushEnabled ? "Yes ✅" : "No ❌"}
          </span>
        </p>
      </div>

      {needsHttps && (
        <div
          style={{
            background: "#fff3cd",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "4px",
            border: "1px solid #ffeaa7",
          }}
        >
          <strong>⚠️ คำแนะนำ:</strong> สำหรับมือถือ ใช้ HTTPS หรือ ngrok
          เพื่อทดสอบ Notification
        </div>
      )}

      {/* Section 1: Permission & Subscription */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#f8f9fa",
          borderRadius: "4px",
        }}
      >
        <h4>1. Permission & Subscription</h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {permission === "default" && (
            <button
              onClick={handleRequestPermission}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔑 ขอสิทธิ์ + Subscribe
            </button>
          )}

          {permission === "granted" && !isPushEnabled && (
            <button
              onClick={handleSubscribe}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📢 Subscribe Push
            </button>
          )}

          {isPushEnabled && (
            <button
              onClick={handleUnsubscribe}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔕 Unsubscribe Push
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Local Notification */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#e8f5e8",
          borderRadius: "4px",
        }}
      >
        <h4>2. Local Notification</h4>
        {canSendNotification && (
          <button
            onClick={handleSendLocalNotification}
            style={{
              padding: "8px 16px",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            📱 ส่ง Local Notification
          </button>
        )}
        {!canSendNotification && (
          <p style={{ color: "#666" }}>ต้องได้รับ permission ก่อน</p>
        )}
      </div>

      {/* Section 3: Push Notification */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#fff3e0",
          borderRadius: "4px",
        }}
      >
        <h4>3. Push Notification (จาก Server)</h4>

        {isPushEnabled ? (
          <div>
            <div style={{ marginBottom: "15px" }}>
              <button
                onClick={handleSendTestPush}
                disabled={isLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoading ? "#6c757d" : "#ff6b35",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "⏳ กำลังส่ง..." : "🚀 ส่ง Push Test"}
              </button>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "4px",
                background: "white",
              }}
            >
              <h5>📝 ส่ง Push Notification แบบกำหนดเอง</h5>
              <div style={{ marginBottom: "10px" }}>
                <input
                  type="text"
                  placeholder="หัวข้อ (Title)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
                <textarea
                  placeholder="ข้อความ (Body)"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    resize: "vertical",
                  }}
                />
              </div>
              <button
                onClick={handleSendCustomPush}
                disabled={isLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoading ? "#6c757d" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "⏳ กำลังส่ง..." : "📤 ส่ง Push Custom"}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: "#666" }}>ต้อง Subscribe Push ก่อน</p>
        )}
      </div>

      {permission === "denied" && (
        <div
          style={{
            background: "#f8d7da",
            padding: "15px",
            borderRadius: "4px",
            border: "1px solid #f5c6cb",
          }}
        >
          <p style={{ color: "#721c24", margin: 0 }}>
            <strong>❌ Notification ถูกปิดใช้งาน</strong>
            <br />
            กรุณาเปิดในการตั้งค่า browser แล้วรีเฟรชหน้า
          </p>
        </div>
      )}

      {pushSubscription && (
        <details style={{ marginTop: "20px" }}>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            🔍 Push Subscription Details
          </summary>
          <pre
            style={{
              fontSize: "12px",
              background: "#f5f5f5",
              padding: "10px",
              overflow: "auto",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            {JSON.stringify(pushSubscription.toJSON(), null, 2)}
          </pre>
        </details>
      )}

      <button onClick={handleCheckStatus}>🔍 เช็คสถานะ</button>

      <button
        onClick={handleViewSubscriptions}
        style={{
          padding: "8px 16px",
          backgroundColor: "#17a2b8",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        📋 ดู Subscriptions
      </button>

      <button 
  onClick={handleTestSwReady}
  style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
>
  ⏳ ทดสอบ SW Ready
</button>

{permission === 'granted' && !isPushEnabled && (
  <button 
    onClick={handleManualSubscribe}
    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
  >
    🔄 Manual Subscribe
  </button>
)}

      <p>
        <strong>Service Worker Ready:</strong>{" "}
        <span style={{ color: isSwReady ? "green" : "red" }}>
          {isSwReady ? "Yes ✅" : "No ❌"}
        </span>
      </p>
    </div>
  );
}
