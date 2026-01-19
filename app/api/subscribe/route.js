// app/api/subscribe/route.js
import { NextResponse } from 'next/server';
import { addSubscription, clearExpiredSubscriptions, getAllSubscriptionsInfo } from '@/lib/subscriptions';
import { apiLogger } from '@/lib/logger';

export async function POST(request) {
  try {
    const { subscription, timestamp, userId, roles } = await request.json();

    apiLogger.info('=== Subscribe API Called ===');
    apiLogger.info('Received subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
    if (userId) apiLogger.info(`User ID: ${userId}`);
    if (roles) apiLogger.info(`Roles: ${JSON.stringify(roles)}`);

    // ล้าง subscription ที่หมดอายุ
    await clearExpiredSubscriptions();

    // เพิ่ม subscription ใหม่ พร้อมข้อมูล user
    const totalSubscriptions = await addSubscription(subscription, timestamp, userId, roles);

    const info = await getAllSubscriptionsInfo();
    apiLogger.info('All subscriptions info:', info);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      totalSubscriptions,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      allSubscriptions: info
    });
  } catch (error) {
    apiLogger.error('Error saving subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  const info = await getAllSubscriptionsInfo();
  return NextResponse.json(info);
}