// api/notification-logs/route.ts - Prisma-based notification logs
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

// GET /api/notification-logs
export async function GET() {
  try {
    const logs = await prisma.notificationLog.findMany({
      orderBy: { timestamp: 'desc' },
    })

    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      action_from: log.actionFrom,
      notification_to: log.notificationTo,
      isNotification: log.isNotification,
    }))

    apiLogger.info(`Fetched ${formattedLogs.length} notification logs`)
    return NextResponse.json({ logs: formattedLogs })
  } catch (error: any) {
    apiLogger.error('Error fetching notification logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

// PUT /api/notification-logs
export async function PUT(request: NextRequest) {
  try {
    const { id, data } = await request.json()

    await prisma.notificationLog.update({
      where: { id: parseInt(id) },
      data: {
        action: data.action,
        actionFrom: data.action_from,
        notificationTo: data.notification_to ?? '',
        isNotification: data.isNotification ?? false,
      },
    })

    apiLogger.info(`Updated notification log ${id}`)
    return NextResponse.json({}, { status: 201 })
  } catch (error: any) {
    apiLogger.error('Error updating notification log:', error)
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }
}

// POST /api/notification-logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    apiLogger.info('Received data for new notification log:', body)

    const log = await prisma.notificationLog.create({
      data: {
        action: body.action,
        actionFrom: body.action_from,
        notificationTo: body.notification_to ?? '',
        isNotification: body.isNotification ?? false,
      },
    })

    apiLogger.info(`Created notification log id: ${log.id}`)
    return NextResponse.json({ success: true, logId: log.id })
  } catch (error: any) {
    apiLogger.error('Error creating notification log:', error)
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}
