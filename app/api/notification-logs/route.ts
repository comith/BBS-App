import { getSheetData,batchUpdateSheet } from "../config";
import { NextRequest, NextResponse } from 'next/server';

const fetchNotificationLogsFromDB = async () => {
  const data = await getSheetData('notification_log');
  return data;
};


// GET /api/notification-logs
export async function GET() {
  try {
    // ✅ เชื่อมต่อกับ database ของคุณ
    const logs = await fetchNotificationLogsFromDB(); // implement ตาม database ที่ใช้

    const formattedLogs = logs?.slice(1)
    .map((log: any,index: number) => ({
        id: log[0],
        action: log[1],
        action_from: log[2],
        notification_to: log[3],
        isNotification: log[4] ?? false
    }));
    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// PUT /api/notification-logs
export async function PUT(request: NextRequest) {
  try {
    const {id,data} = await request.json();
    const rowupdate = [
      null,
      data.action,
      data.action_from,
      data.notification_to,
      data.isNotification
    ]
    const updates = [
          {
            range: `notification_log!A${id*1 + 1}:E${id*1 + 1}`,
            values: [rowupdate],
          },
        ];
    
        await batchUpdateSheet(updates);

    return NextResponse.json([], { status: 201 });

  } catch (error) {
    console.error('Error creating notification log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
