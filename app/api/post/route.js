// api/post/route.js - Prisma-based data creation
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { sendNotificationToTargets } from '@/lib/notificationService'
import { invalidateCached } from '@/lib/staticCache'

export async function POST(request) {
  try {
    apiLogger.info('📥 Receiving request...')
    const data = await request.json()

    // Add employee
    if (data.type === 'employee') {
      await prisma.employee.create({
        data: {
          employeerId: data.data.employeerId || null,
          fullName: data.data.fullName || null,
          department: data.data.department || null,
          group: data.data.group || null,
          position: data.data.position || null,
        },
      })
      invalidateCached('employee')
      return NextResponse.json({ message: 'Employee data added successfully' }, { status: 201 })
    }

    apiLogger.info('✅ Data received:', {
      employeeId: data.employeeId,
      username: data.username,
      uploadedFilesCount: data.uploadedFiles?.length || 0,
    })

    const recordId = `BBS_${Date.now()}`
    const selectedOptionsText =
      data.selectedOptions?.map((option) => option.name).join(', ') || ''
    const vehicleEquipment = data.vehicleEquipment || {}
    const attachment =
      data.uploadedFiles?.map((file) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink || '',
        savedDate: new Date().toISOString(),
      })) || []

    const recordData = {
      id: recordId,
      date: data.date || null,
      employeeId: data.employeeId || null,
      username: data.username || null,
      group: data.group || null,
      type: data.type || null,
      safetyCategory: data.safetyCategory || null,
      subSafetyCategory: data.sub_safetyCategory || null,
      observedWork: data.observed_work || null,
      departNotice: data.depart_notice || null,
      vehicleEquipment,
      selectedOptions: selectedOptionsText || null,
      safeActionCount: parseInt(data.safeActionCount) || 0,
      actionType: data.actionType || null,
      unsafeActionCount: parseInt(data.unsafeActionCount) || 0,
      actionTypeUnsafe: data.actionTypeunsafe || null,
      attachment,
      other: data.other || null,
      status: 'pending',
    }

    apiLogger.info('💾 Saving record to database...')
    await prisma.record.create({ data: recordData })

    // If SHE group with codeemployee, also create SHE record
    if (data.group === 'SHE' && data.codeemployee) {
      await prisma.recordShe.create({
        data: {
          id: recordId,
          date: data.date || null,
          employeeId: data.employeeId || null,
          username: data.username || null,
          group: data.group || null,
          type: data.type || null,
          safetyCategory: data.safetyCategory || null,
          subSafetyCategory: data.sub_safetyCategory || null,
          observedWork: data.observed_work || null,
          departNotice: data.depart_notice || null,
          vehicleEquipment,
          selectedOptions: selectedOptionsText || null,
          safeActionCount: parseInt(data.safeActionCount) || 0,
          actionType: data.actionType || null,
          unsafeActionCount: parseInt(data.unsafeActionCount) || 0,
          actionTypeUnsafe: data.actionTypeunsafe || null,
          attachment,
          other: data.other || null,
          codeEmployee: data.codeemployee || null,
          levelOfSafety: data.levelOfSafety || null,
        },
      })
    }

    // Send notification to SHE
    try {
      const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
      const category = data.safetyCategory ? `หมวด: ${data.safetyCategory}` : ''
      const subCategory = data.sub_safetyCategory ? ` (${data.sub_safetyCategory})` : ''
      const observation = data.observed_work
        ? `\nรายละเอียด: ${data.observed_work.substring(0, 50)}${data.observed_work.length > 50 ? '...' : ''}`
        : ''

      await sendNotificationToTargets(
        {
          title: `📝 มีการรายงาน BBS ใหม่ (${now})`,
          body: `ผู้รายงาน: ${data.username || 'พนักงาน'}\nแผนก: ${data.group || '-'}\n${category}${subCategory}${observation}`,
          icon: '/icons/ith.png',
          url: '/dashboard',
          data: { recordId, action: 'create', from: data.employeeId },
        },
        ['SHE']
      )
      apiLogger.info('🔔 Notification sent to SHE')
    } catch (notifError) {
      apiLogger.error('⚠️ Failed to send notification:', notifError)
    }

    // Trigger AI Evaluation in the background for SHE records
    if (data.group === 'SHE' && data.observed_work) {
      apiLogger.info(`🤖 Triggering background AI analysis for new SHE record ${recordId}...`)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/ai-evaluation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_SECRET_KEY || ''
        },
        body: JSON.stringify({
          recordId: recordId,
          recordType: 'SHE',
          observedWork: data.observed_work,
          departNotice: data.depart_notice
        })
      }).catch(e => apiLogger.error('⚠️ Async AI evaluation failed to start:', e))
    }

    const responseData = {
      recordId,
      totalFiles: data.uploadedFiles?.length || 0,
      successCount: data.uploadedFiles?.length || 0,
    }

    apiLogger.info('✅ Save successful:', responseData)
    return NextResponse.json({ message: 'Data added successfully', data: responseData }, { status: 201 })
  } catch (error) {
    apiLogger.error('❌ API Error:', error)
    return NextResponse.json({ message: 'Error adding data', error: error.message }, { status: 500 })
  }
}
