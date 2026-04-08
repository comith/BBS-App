// api/delete/route.js - Prisma-based deletion
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

export async function DELETE(request) {
  try {
    const employeeGroup = request.headers.get('x-employee-group') || ''
    if (employeeGroup !== 'SHE') {
      apiLogger.warn(`⛔ Unauthorized delete attempt (group: "${employeeGroup}")`)
      return NextResponse.json({ message: 'Unauthorized: SHE group required' }, { status: 403 })
    }

    const { type, id } = await request.json()

    if (type !== 'employee') {
      return NextResponse.json(
        { message: 'Invalid type. Only employee deletion is supported.' },
        { status: 400 }
      )
    }

    if (!id) {
      return NextResponse.json({ message: 'Missing id parameter' }, { status: 400 })
    }

    const numId = parseInt(id, 10)
    if (isNaN(numId)) {
      return NextResponse.json({ message: 'Invalid id parameter' }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({ where: { id: numId } })
    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
    }

    await prisma.employee.delete({ where: { id: numId } })

    apiLogger.info(`🗑️ Deleted employee id: ${numId}`)
    return NextResponse.json({ message: 'Employee deleted successfully', id: numId })
  } catch (error) {
    apiLogger.error('Error deleting employee:', error)
    return NextResponse.json({ message: 'Error deleting employee', error: error.message }, { status: 500 })
  }
}
