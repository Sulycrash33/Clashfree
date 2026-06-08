import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

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
      select: {
        id: true, version: true, changes: true,
        publishedBy: true, publishedAt: true,
        isCurrent: true, createdAt: true,
      },
    })

    const parsed = versions.map(v => ({
      ...v,
      changes: v.changes ? (() => { try { return JSON.parse(v.changes!) } catch { return v.changes } })() : null,
    }))

    return NextResponse.json({
      versions: parsed,
      currentVersion: parsed.find(v => v.isCurrent)?.version ?? null,
    })
  } catch (error) {
    console.error('Error fetching timetable versions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/timetable-versions
// action='snapshot' — engine ran, save state (does NOT mark as current)
// action='publish'  — mark as published + update exam period status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['SA', 'IA', 'TO'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examPeriodId, changes, action = 'snapshot' } = body

    if (!examPeriodId) {
      return NextResponse.json({ error: 'examPeriodId is required' }, { status: 400 })
    }

    // Get current max version
    const latest = await prisma.timetableVersion.findFirst({
      where: { examPeriodId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const newVersion = (latest?.version ?? 0) + 1
    const isPublish = action === 'publish'

    // If publishing, unmark previous current
    if (isPublish) {
      await prisma.timetableVersion.updateMany({
        where: { examPeriodId, isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const version = await prisma.timetableVersion.create({
      data: {
        examPeriodId,
        version: newVersion,
        changes: changes
          ? JSON.stringify(changes)
          : JSON.stringify({ action, timestamp: new Date().toISOString(), note: isPublish ? 'Published' : 'Engine snapshot' }),
        publishedBy: isPublish ? (session.user.name || session.user.id) : null,
        publishedAt: isPublish ? new Date() : null,
        isCurrent: isPublish,
      },
    })

    // If publishing, update exam period status
    if (isPublish) {
      await prisma.examPeriod.update({
        where: { id: examPeriodId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      })
    }

    return NextResponse.json({
      version: { ...version, changes: version.changes ? (() => { try { return JSON.parse(version.changes!) } catch { return version.changes } })() : null },
      message: isPublish
        ? `✅ Timetable published as version ${newVersion}`
        : `📸 Snapshot saved as version ${newVersion}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating timetable version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/timetable-versions - Rollback to a specific version
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['SA', 'IA', 'TO'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { versionId, examPeriodId } = body
    if (!versionId || !examPeriodId) {
      return NextResponse.json({ error: 'versionId and examPeriodId are required' }, { status: 400 })
    }

    // Verify the version exists for this period
    const target = await prisma.timetableVersion.findFirst({
      where: { id: versionId, examPeriodId },
      select: { id: true, version: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Unmark all current, mark target
    await prisma.timetableVersion.updateMany({
      where: { examPeriodId },
      data: { isCurrent: false },
    })

    await prisma.timetableVersion.update({
      where: { id: versionId },
      data: {
        isCurrent: true,
        publishedAt: new Date(),
        changes: JSON.stringify({
          action: 'rollback',
          rolledBackTo: target.version,
          by: session.user.name || session.user.id,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      message: `✅ Rolled back to version ${target.version}`,
      activeVersion: target.version,
    })
  } catch (error) {
    console.error('Error rolling back timetable version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
