// app/api/send-notification/route.js
import { NextResponse } from 'next/server';
import { sendNotificationToTargets } from '@/lib/notificationService';
import { getAllSubscriptionsInfo } from '@/lib/subscriptions';
import { apiLogger } from '@/lib/logger';

export async function POST(request) {
  try {
    const { title, body, icon, url, targetRoles, targetUserIds } = await request.json();

    apiLogger.info('=== Send Notification API Called ===');
    
    const result = await sendNotificationToTargets(
        { title, body, icon, url },
        targetRoles,
        targetUserIds
    );

    if (!result.success && result.count === 0) {
       const info = getAllSubscriptionsInfo();
       return NextResponse.json({
        success: false,
        error: result.message,
        message: 'ไม่พบผู้รับที่ตรงกับเงื่อนไข',
        debug: { allSubscriptions: info.total }
      }, { status: 200 });
    }

    return NextResponse.json(result);

  } catch (error) {
    apiLogger.error('❌ Error in send-notification:', error);
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