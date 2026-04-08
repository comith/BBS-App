// api/put/route.js - Prisma-based employee update
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'

export async function PUT(request) {
  try {
    const { type, id, data } = await request.json()

    if (type !== 'employee') {
      return NextResponse.json(
        { message: 'Invalid type. Only employee updates are supported.' },
        { status: 400 }
      )
    }

    // Find employee by DB primary key (id) or by employeerId
    let employee = null
    if (id) {
      const numId = parseInt(id, 10)
      if (!isNaN(numId)) {
        employee = await prisma.employee.findUnique({ where: { id: numId } })
      }
    }
    if (!employee && data.employeerId) {
      employee = await prisma.employee.findUnique({ where: { employeerId: data.employeerId } })
    }

    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 })
    }

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        employeerId: data.employeerId ?? employee.employeerId,
        fullName: data.fullName ?? employee.fullName,
        department: data.department ?? employee.department,
        group: data.group ?? employee.group,
        position: data.position ?? employee.position,
      },
    })

    return NextResponse.json({ message: 'Employee updated successfully', data: updated })
  } catch (error) {
    apiLogger.error('Error updating employee:', error)
    return NextResponse.json({ message: 'Error updating employee', error: error.message }, { status: 500 })
  }
}
