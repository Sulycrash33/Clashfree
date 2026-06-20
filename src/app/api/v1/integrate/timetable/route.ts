import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

/**
 * GET /api/v1/integrate/timetable?examPeriodId=<id>&format=json|csv
 * 
 * Retrieves the generated timetable for an exam period.
 * Returns structured JSON or CSV format.
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, ...('retryAfterSeconds' in auth && { retryAfterSeconds: auth.retryAfterSeconds }) }, { status: auth.status })
  }

  // Check scope
  const scopes = (await db.apiKey.findUnique({ where: { id: auth.keyId }, select: { scopes: true } }))?.scopes || ''
  if (!scopes.includes('export')) {
    return NextResponse.json({ error: 'API key does not have "export" scope' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const examPeriodId = searchParams.get('examPeriodId')
  const format = searchParams.get('format') || 'json'

  if (!examPeriodId) {
    return NextResponse.json({ error: 'examPeriodId query parameter is required' }, { status: 400 })
  }

  // Verify ownership
  const examPeriod = await db.examPeriod.findUnique({
    where: { id: examPeriodId },
    select: { institutionId: true, name: true, session: true, semester: true, status: true },
  })

  if (!examPeriod) {
    return NextResponse.json({ error: 'Exam period not found' }, { status: 404 })
  }

  if (examPeriod.institutionId !== auth.institutionId) {
    return NextResponse.json({ error: 'Exam period does not belong to your institution' }, { status: 403 })
  }

  // Fetch all exam slots
  const slots = await db.examSlot.findMany({
    where: { examPeriodId },
    include: {
      course: {
        include: {
          department: { include: { faculty: true } },
          lecturers: { include: { lecturer: true } },
        },
      },
      room: true,
    },
    orderBy: [{ date: 'asc' }, { slotNumber: 'asc' }],
  })

  if (slots.length === 0) {
    return NextResponse.json({
      error: 'No timetable generated yet. Run POST /api/v1/integrate/generate first.',
    }, { status: 404 })
  }

  if (format === 'csv') {
    const csvRows = [
      'Date,Day,Slot,Start,End,CourseCode,CourseName,Department,Faculty,Room,RoomCapacity,Lecturer',
    ]

    for (const slot of slots) {
      const date = new Date(slot.date)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      const lecturerNames = slot.course.lecturers?.map((cl: any) => cl.lecturer.name).join('; ') || ''

      csvRows.push([
        date.toISOString().split('T')[0],
        dayName,
        slot.slotNumber,
        slot.startTime,
        slot.endTime,
        slot.course.code,
        `"${slot.course.name}"`,
        slot.course.department.code,
        slot.course.department.faculty.code,
        slot.room.code,
        slot.room.capacity,
        `"${lecturerNames}"`,
      ].join(','))
    }

    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="timetable-${examPeriodId}.csv"`,
      },
    })
  }

  // JSON format
  const timetable = slots.map(slot => ({
    date: new Date(slot.date).toISOString().split('T')[0],
    dayOfWeek: new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long' }),
    slot: slot.slotNumber,
    startTime: slot.startTime,
    endTime: slot.endTime,
    course: {
      code: slot.course.code,
      name: slot.course.name,
      level: slot.course.level,
      creditUnits: slot.course.creditUnits,
      department: slot.course.department.code,
      faculty: slot.course.department.faculty.code,
    },
    room: {
      code: slot.room.code,
      name: slot.room.name,
      capacity: slot.room.capacity,
      type: slot.room.type,
    },
    lecturers: slot.course.lecturers?.map((cl: any) => ({
      name: cl.lecturer.name,
      staffId: cl.lecturer.staffId,
    })) || [],
  }))

  return NextResponse.json({
    examPeriod: {
      name: examPeriod.name,
      session: examPeriod.session,
      semester: examPeriod.semester,
      status: examPeriod.status,
    },
    institution: auth.institutionName,
    totalSlots: timetable.length,
    timetable,
  })
}
