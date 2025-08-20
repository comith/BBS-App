// app/api/subscribe/route.js
import { NextResponse } from 'next/server';
import { addSubscription, clearExpiredSubscriptions, getAllSubscriptionsInfo } from '@/lib/subscriptions';

export async function POST(request) {
  try {
    const { subscription, timestamp } = await request.json();
    
    console.log('=== Subscribe API Called ===');
    console.log('Received subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
    
    // ล้าง subscription ที่หมดอายุ
    clearExpiredSubscriptions();
    
    // เพิ่ม subscription ใหม่
    const totalSubscriptions = addSubscription(subscription, timestamp);
    
    const info = getAllSubscriptionsInfo();
    console.log('All subscriptions info:', info);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully',
      totalSubscriptions,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      allSubscriptions: info
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  const info = getAllSubscriptionsInfo();
  return NextResponse.json(info);
}