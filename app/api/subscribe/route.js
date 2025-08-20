// app/api/subscribe/route.js
import { NextResponse } from 'next/server';

let subscriptions = []; // ในการใช้งานจริงควรเก็บใน database

export async function POST(request) {
  try {
    const { subscription, timestamp } = await request.json();
    
    // เช็คว่า subscription มีอยู่แล้วหรือไม่
    const existingIndex = subscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (existingIndex !== -1) {
      // อัพเดท subscription เดิม
      subscriptions[existingIndex] = { subscription, timestamp };
      console.log('Updated existing subscription');
    } else {
      // เพิ่ม subscription ใหม่
      subscriptions.push({ subscription, timestamp });
      console.log('Added new subscription');
    }
    
    console.log(`Total subscriptions: ${subscriptions.length}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved',
      totalSubscriptions: subscriptions.length
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}