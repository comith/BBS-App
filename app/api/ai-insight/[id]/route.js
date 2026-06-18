import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request,
  { params }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json(
        { message: 'ID is required' },
        { status: 400 }
      )
    }

    const aiInsight = await prisma.aiInsight.findFirst({
      where: {
        OR: [
          { recordId: id },
          { recordSheId: id }
        ]
      }
    })

    if (!aiInsight) {
      return NextResponse.json(
        { message: 'AI Insight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(aiInsight)
  } catch (error) {
    console.error('Error fetching AI Insight:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
