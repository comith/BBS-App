// app/api/send-notification/route.js
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// ตั้งค่า VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ในการใช้งานจริงควรเก็บใน database
let subscriptions = [];

export async function POST(request) {
  try {
    const { title, body, icon, url } = await request.json();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No subscriptions found' 
      }, { status: 400 });
    }

    const notificationPayload = JSON.stringify({
      title: title || 'การแจ้งเตือน',
      body: body || 'คุณมีข้อความใหม่',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      url: url || '/',
      timestamp: Date.now()
    });

    // ส่ง notification ไปยัง subscription ทั้งหมด
    const sendPromises = subscriptions.map(({ subscription }) => {
      return webpush.sendNotification(subscription, notificationPayload)
        .catch(error => {
          console.error('Error sending notification:', error);
          return { success: false, error: error.message };
        });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(result => result && result.success !== false).length;

    return NextResponse.json({ 
      success: true, 
      message: `Sent to ${successCount}/${subscriptions.length} subscriptions`,
      results: results.length
    });

  } catch (error) {
    console.error('Error in send-notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}