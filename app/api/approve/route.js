// api/approve/route.js - Prisma-based record approval
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { sendNotificationToTargets } from '@/lib/notificationService'

export async function POST(request) {
  try {
    const employeeGroup = request.headers.get('x-employee-group') || ''
    if (employeeGroup !== 'SHE') {
      apiLogger.warn(`⛔ Unauthorized approval attempt (group: "${employeeGroup}")`)
      return NextResponse.json({ message: 'Unauthorized: SHE group required' }, { status: 403 })
    }

    apiLogger.info('📥 Receiving approval request...')
    const data = await request.json()

    apiLogger.info('✅ Approval data received:', {
      recordId: data.recordId,
      status: data.status,
      approvedBy: data.approvedBy,
    })

    if (!data.recordId || !data.status) {
      return NextResponse.json(
        { message: 'Missing required fields: recordId and status' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected', 'pending'].includes(data.status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be: approved, rejected, or pending' },
        { status: 400 }
      )
    }

    const record = await prisma.record.findUnique({ where: { id: data.recordId } })

    if (!record) {
      return NextResponse.json(
        { message: `Record with ID ${data.recordId} not found` },
        { status: 404 }
      )
    }

    const currentDateTime = new Date()

    await prisma.record.update({
      where: { id: data.recordId },
      data: {
        status: data.status,
        adminNote: data.adminNote || null,
        approvedDate: currentDateTime,
        approvedBy: data.approvedBy || 'SHE',
      },
    })

    // Send notification to employee
    try {
      const statusThai =
        data.status === 'approved' ? 'อนุมัติ' : data.status === 'rejected' ? 'ปฏิเสธ' : data.status
      const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
      const approverName = data.approvedBy || 'SHE'

      await sendNotificationToTargets(
        {
          title: `📢 รายงาน BBS ของคุณได้รับการ${statusThai}`,
          body: `โดย: ${approverName}\nเวลา: ${now}\nหมายเหตุ: ${data.adminNote || '-'}`,
          icon: data.status === 'approved' ? '/icons/approved.png' : '/icons/rejected.png',
          url: '/dashboard',
          data: { recordId: data.recordId, status: data.status },
        },
        [],
        [record.employeeId]
      )
      apiLogger.info(`🔔 Notification sent to employee ${record.employeeId}`)
    } catch (notifError) {
      apiLogger.error('⚠️ Failed to send notification:', notifError)
    }

    const responseData = {
      recordId: data.recordId,
      status: data.status,
      adminNote: data.adminNote || null,
      approvedDate: currentDateTime.toISOString(),
      approvedBy: data.approvedBy || 'SHE',
    }

    apiLogger.info('✅ Approval successful:', responseData)
    return NextResponse.json({ message: `Record ${data.status} successfully`, data: responseData }, { status: 200 })
  } catch (error) {
    apiLogger.error('❌ Approval API Error:', error)
    return NextResponse.json({ message: 'Error updating record status', error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ message: 'Missing recordId parameter' }, { status: 400 })
    }

    apiLogger.info(`🔍 Getting status for record: ${recordId}`)

    const record = await prisma.record.findUnique({ where: { id: recordId } })

    if (!record) {
      return NextResponse.json(
        { message: `Record with ID ${recordId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Record found',
      data: {
        recordId: record.id,
        status: record.status,
        adminNote: record.adminNote || null,
        approvedDate: record.approvedDate?.toISOString() || null,
        approvedBy: record.approvedBy || null,
        employeeName: record.username,
        department: record.type,
        submittedDate: record.date,
      },
    })
  } catch (error) {
    apiLogger.error('❌ Get Record API Error:', error)
    return NextResponse.json({ message: 'Error getting record status', error: error.message }, { status: 500 })
  }
}
