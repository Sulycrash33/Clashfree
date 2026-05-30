import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/timetable-versions - Get version history for an exam period
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examPeriodId = searchParams.get('examPeriodId')

    if (!examPeriodId) {
      return NextResponse.json({ error: 'examPeriodId is required' }, { status: 400 })
    }

    const versions = await prisma.timetableVersion.findMany({
      where: { examPeriodId },
      orderBy: { version: 'desc' },
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error fetching timetable versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/timetable-versions - Create a new version
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examPeriodId, changes } = body

    if (!examPeriodId) {
      return NextResponse.json({ error: 'examPeriodId is required' }, { status: 400 })
    }

    // Get current max version
    const latestVersion = await prisma.timetableVersion.findFirst({
      where: { examPeriodId },
      orderBy: { version: 'desc' },
    })

    const newVersion = (latestVersion?.version || 0) + 1

    // Mark all previous versions as not current
    await prisma.timetableVersion.updateMany({
      where: { examPeriodId },
      data: { isCurrent: false },
    })

    // Create new version
    const version = await prisma.timetableVersion.create({
      data: {
        examPeriodId,
        version: newVersion,
        changes: changes ? JSON.stringify(changes) : null,
        publishedBy: session.user.name || session.user.id,
        publishedAt: new Date(),
        isCurrent: true,
      },
    })

    return NextResponse.json(version)
  } catch (error) {
    console.error('Error creating timetable version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
