import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const ADMIN_ID = '3ST19686'

function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
}

export async function GET(request: Request) {
  const employeeId = request.headers.get('x-employee-id')
  if (employeeId !== ADMIN_ID) return unauthorized()

  try {
    const setting = await prisma.maintenanceSetting.findUnique({ where: { id: 1 } })
    return NextResponse.json(
      setting ?? { id: 1, isActive: false, startTime: null, endTime: null, message: null }
    )
  } catch (error) {
    return NextResponse.json({ message: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const employeeId = request.headers.get('x-employee-id')
  if (employeeId !== ADMIN_ID) return unauthorized()

  try {
    const { isActive, startTime, endTime, message } = await request.json()
    console.log("Maintenance API received payload:", { isActive, startTime, endTime, message })

    const setting = await prisma.maintenanceSetting.upsert({
      where: { id: 1 },
      update: {
        isActive: Boolean(isActive),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        message: message?.trim() || null,
        updatedBy: ADMIN_ID,
      },
      create: {
        id: 1,
        isActive: Boolean(isActive),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        message: message?.trim() || null,
        updatedBy: ADMIN_ID,
      },
    })

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    return NextResponse.json({ message: 'Database error' }, { status: 500 })
  }
}
