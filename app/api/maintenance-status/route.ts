import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const setting = await prisma.maintenanceSetting.findUnique({ where: { id: 1 } })

    if (!setting || !setting.isActive) {
      return NextResponse.json({ isActive: false })
    }

    // Auto-deactivate if endTime has already passed
    const now = new Date()
    if (setting.endTime && setting.endTime < now) {
      return NextResponse.json({ isActive: false, endTime: setting.endTime })
    }

    return NextResponse.json({
      isActive: true,
      startTime: setting.startTime,
      endTime: setting.endTime,
      message: setting.message,
    })
  } catch {
    // If DB is unreachable, allow through (don't block users)
    return NextResponse.json({ isActive: false })
  }
}
