// api/notification-logs/route.ts
import { getSheetData, batchUpdateSheet } from "../config";
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSubscriptions, removeSubscription } from '@/lib/subscriptions';
import { apiLogger } from '@/lib/logger';

// ตั้งค่า VAPID
webpush.setVapidDetails(
  'mailto:koronero93@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const fetchNotificationLogsFromDB = async () => {
  const data = await getSheetData('notification_log');
  return data;
};

// GET /api/notification-logs
export async function GET() {
  try {
    const logs = await fetchNotificationLogsFromDB();

    const formattedLogs = logs?.slice(1)
      .map((log: any, index: number) => ({
        id: index + 1, // Use row index as ID for simplicity
        timestamp: log[0],
        action: log[1],
        action_from: log[2],
        notification_to: log[3],
        isNotification: log[4] ?? false
      }));

    apiLogger.info(`Fetched ${formattedLogs?.length || 0} notification logs`);

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    apiLogger.error('Error fetching notification logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// PUT /api/notification-logs
export async function PUT(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    const rowIndex = parseInt(id) + 1; // logical ID to Sheet Row (assuming 1-based + 1 header)

    apiLogger.info(`Updating notification log ${id}`, data);

    const rowupdate = [
      data.timestamp || new Date().toISOString(),
      data.action,
      data.action_from,
      data.notification_to,
      data.isNotification
    ];

    const updates = [
      {
        range: `notification_log!A${rowIndex}:E${rowIndex}`,
        values: [rowupdate],
      },
    ];

    await batchUpdateSheet(updates);
    return NextResponse.json([], { status: 201 });

  } catch (error) {
    apiLogger.error('Error updating notification log:', error);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}

// POST /api/notification-logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    apiLogger.info('Received data for new notification log:', body);

    // บันทึกลง Google Sheets
    const newId = Date.now();

    // ส่ง push notification โดยตรง
    const subscriptions = getSubscriptions();

    if (subscriptions.length > 0) {
      const notificationPayload = JSON.stringify({
        title: "แจ้งเตือน BBS ITH",
        body: `${body.action_from} ได้รายงานพฤติกรรมใหม่`,
        icon: "/icons/ith.png",
        badge: "/icons/ith.png",
        url: "/dashboard",
        data: {
          action: body.action,
          from: body.action_from,
          logId: newId
        }
      });

      const sendPromises = subscriptions.map(async ({ subscription }, index) => {
        try {
          await webpush.sendNotification(subscription, notificationPayload);
          // apiLogger.info(`Push notification sent successfully to subscription ${index + 1}`);
          return { success: true, index };
        } catch (error: any) {
          apiLogger.error(`Failed to send notification to subscription ${index + 1}:`, error.message);

          // ถ้า subscription หมดอายุ ให้ลบออก
          if (error.statusCode === 410 || error.statusCode === 404) {
            removeSubscription(subscription.endpoint);
          }

          return { success: false, error: error.message, index };
        }
      });

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(result => result.success).length;

      apiLogger.info(`Push notifications sent: ${successCount}/${subscriptions.length} successful`);

      return NextResponse.json({
        success: true,
        logId: newId,
        notification: {
          sent: successCount,
          total: subscriptions.length,
          results
        }
      });
    } else {
      apiLogger.info('No subscriptions found, notification log saved but no push sent');
      return NextResponse.json({
        success: true,
        logId: newId,
        notification: { message: 'No subscriptions found' }
      });
    }

  } catch (error) {
    apiLogger.error('Error creating notification log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}