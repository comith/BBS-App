// api/get/route.js - Prisma-based data fetching
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { getCached } from '@/lib/staticCache'

function recordToApiFormat(r) {
  return {
    record_id: r.id,
    date: r.date || '',
    employee_id: r.employeeId || '',
    fullname: r.username || '',
    group: r.group || '',
    depart: r.type || '',
    safetycategory_id: r.safetyCategory || '',
    sub_safetycategory_id: r.subSafetyCategory || '',
    observed_Work: r.observedWork || '',
    department_notice: r.departNotice || '',
    vehicleEquipment: r.vehicleEquipment || {},
    selectedOptions: r.selectedOptions
      ? r.selectedOptions.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    safeActionCount: r.safeActionCount,
    actionType: r.actionType || '',
    unsafeActionCount: r.unsafeActionCount,
    actionTypeunsafe: r.actionTypeUnsafe || '',
    attachment: Array.isArray(r.attachment) ? r.attachment : [],
    other: r.other || '',
    status: r.status || 'pending',
    adminNote: r.adminNote || null,
    approvedDate: r.approvedDate ? r.approvedDate.toISOString() : null,
    approvedBy: r.approvedBy || null,
    aiInsight: r.aiInsight || null,
  }
}

export async function GET(request) {
  apiLogger.info('🔗 GET request received at /api/get')
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '800')

    if (!type) {
      return NextResponse.json({ message: 'Type parameter is required' }, { status: 400 })
    }

    apiLogger.info(`📝 Request type: ${type}, page: ${page}, limit: ${limit}`)

    switch (type) {
      case 'record': {
        const year = searchParams.get('year')
        const where = year
          ? {
              date: {
                gte: `${year}-01-01`,
                lte: `${year}-12-31`,
              },
            }
          : {}
        const records = await prisma.record.findMany({
          where,
          include: { aiInsight: { select: { updatedAt: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        })
        apiLogger.info(`📊 Returning ${records.length} records (year: ${year || 'all'})`)
        return NextResponse.json(records.map(recordToApiFormat))
      }

      case 'employee': {
        const employees = await getCached('employee', () =>
          prisma.employee.findMany({ orderBy: { id: 'asc' } })
        )
        return NextResponse.json(employees)
      }

      case 'category': {
        const categories = await getCached('category', () =>
          prisma.category.findMany({ orderBy: { id: 'asc' } })
        )
        return NextResponse.json(categories)
      }

      case 'subcategory': {
        const formatted = await getCached('subcategory', async () => {
          const [subCategories, departments] = await Promise.all([
            prisma.subCategory.findMany({
              include: { options: true },
              orderBy: { id: 'asc' },
            }),
            prisma.department.findMany({ orderBy: { id: 'asc' } }),
          ])
          const deptById = Object.fromEntries(departments.map((d) => [d.id, d.name]))

          return subCategories.map((sub) => {
            let departcategory_id = []
            if (Array.isArray(sub.departcategory)) {
              departcategory_id = sub.departcategory
                .map((item) => {
                  if (typeof item === 'object' && item !== null) {
                    return { id: item.id, shortname: item.name || item.shortname || '' }
                  }
                  const num = parseInt(String(item), 10)
                  return { id: num, shortname: deptById[num] || String(item) }
                })
                .filter((d) => d.shortname)
            }
            return {
              id: sub.id,
              category_id: sub.categoryId,
              name: sub.name,
              imagePath: sub.imagePath || '',
              alt: sub.alt || '',
              type: sub.type || '',
              subject: sub.subject || '',
              placeholder: sub.placeholder || '',
              title: sub.title || '',
              departcategory_id,
              option: sub.options.map((o) => ({ id: o.id, name: o.name })),
            }
          })
        })
        return NextResponse.json(formatted)
      }

      case 'department': {
        const departments = await getCached('department', () =>
          prisma.department.findMany({ orderBy: { id: 'asc' } })
        )
        return NextResponse.json(
          departments.map((d) => ({
            id: d.id,
            name: d.name,
            shortname: d.name,
            group: d.groupName || '',
          }))
        )
      }

      case 'group': {
        const groups = await getCached('group', () =>
          prisma.group.findMany({ orderBy: { id: 'asc' } })
        )
        return NextResponse.json(
          groups.map((g) => ({
            id: g.id,
            name: g.name,
            departmentId: g.departmentId,
          }))
        )
      }

      case 'she_violations': {
        const sheYear = searchParams.get('year')
        const sheWhere = sheYear
          ? { date: { gte: `${sheYear}-01-01`, lte: `${sheYear}-12-31` } }
          : {}
        const sheRecords = await prisma.recordShe.findMany({
          where: sheWhere,
          orderBy: { createdAt: 'desc' },
          take: 9999,
        })
        return NextResponse.json(
          sheRecords.map((r) => ({
            record_id: r.id,
            date: r.date || '',
            employee_id: r.employeeId || '',
            fullname: r.username || '',
            group: r.group || '',
            depart: r.type || '',
            safetycategory_id: r.safetyCategory || '',
            sub_safetycategory_id: r.subSafetyCategory || '',
            observed_Work: r.observedWork || '',
            department_notice: r.departNotice || '',
            vehicleEquipment: r.vehicleEquipment || {},
            selectedOptions: r.selectedOptions
              ? r.selectedOptions.split(',').map((s) => s.trim()).filter(Boolean)
              : [],
            safeActionCount: r.safeActionCount,
            actionType: r.actionType || '',
            unsafeActionCount: r.unsafeActionCount,
            actionTypeunsafe: r.actionTypeUnsafe || '',
            attachment: Array.isArray(r.attachment) ? r.attachment : [],
            other: r.other || '',
            employee_code: r.codeEmployee || '',
            level_accident: r.levelOfSafety || '',
          }))
        )
      }

      default:
        return NextResponse.json(
          { message: 'Invalid type parameter. Use: record, category, subcategory, department, group, employee, or she_violations' },
          { status: 400 }
        )
    }
  } catch (error) {
    apiLogger.error('💥 Unexpected error in GET handler:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
