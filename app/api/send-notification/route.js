// app/api/send-notification/route.js
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSubscriptions, removeSubscription, getAllSubscriptionsInfo } from '@/lib/subscriptions';

// ตั้งค่า VAPID
webpush.setVapidDetails(
  'mailto:koronero93@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const { title, body, icon, url } = await request.json();
    
    console.log('=== Send Notification API Called ===');
    
    const subscriptions = getSubscriptions();
    const info = getAllSubscriptionsInfo();
    console.log('Subscriptions info:', info);
    
    if (subscriptions.length === 0) {
      console.log('No subscriptions found, available info:', info);
      return NextResponse.json({ 
        success: false, 
        error: 'No subscriptions found',
        message: 'ไม่พบ subscription ใด ๆ กรุณา Subscribe ใหม่',
        debug: {
          subscriptionsCount: subscriptions.length,
          allSubscriptions: info
        }
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

    console.log('Notification payload:', notificationPayload);

    // ส่ง notification ไปยัง subscription ทั้งหมด
    const sendPromises = subscriptions.map(({ subscription }, index) => {
      console.log(`Sending to subscription ${index + 1}:`, subscription.endpoint.substring(0, 50) + '...');
      
      return webpush.sendNotification(subscription, notificationPayload)
        .then(result => {
          console.log(`✅ Success sending to subscription ${index + 1}`);
          return { success: true, index };
        })
        .catch(error => {
          console.error(`❌ Error sending to subscription ${index + 1}:`, error.message);
          
          // ถ้า subscription หมดอายุ ให้ลบออก
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️ Removing expired subscription ${index + 1}`);
            removeSubscription(subscription.endpoint);
          }
          
          return { success: false, error: error.message, statusCode: error.statusCode, index };
        });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;

    console.log(`📊 Results: ${successCount} success, ${failureCount} failed`);
    console.log('Detailed results:', results);

    return NextResponse.json({ 
      success: successCount > 0, 
      message: `ส่งสำเร็จ ${successCount}/${subscriptions.length} subscriptions`,
      results: {
        total: subscriptions.length,
        success: successCount,
        failed: failureCount,
        details: results
      }
    });

  } catch (error) {
    console.error('❌ Error in send-notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  const info = getAllSubscriptionsInfo();
  return NextResponse.json({
    message: 'Send Notification API Status',
    ...info
  });
}