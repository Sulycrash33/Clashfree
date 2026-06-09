import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendClashAlert, sendTimetablePublished, batchNotifyWA } from '@/lib/whatsapp'
import { z } from 'zod'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://clashfree.vercel.app'

const NotifySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('CLASH_ALERT'),
    examPeriodId: z.string(),
    conflictId: z.string().optional(), // notify about a specific conflict
  }),
  z.object({
    type: z.literal('TIMETABLE_PUBLISHED'),
    examPeriodId: z.string().optional(),
    lectureTimetableId: z.string().optional(),
  }),
  z.object({
    type: z.literal('EXAM_REMINDER'),
    examPeriodId: z.string(),
    daysAhead: z.number().default(1), // notify for exams N days from now
  }),
])

// POST /api/notify/whatsapp
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string; institutionId?: string } | undefined
    if (!session?.user || !['SA', 'IA', 'TO'].includes(sessionUser?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const payload = NotifySchema.parse(body)

    if (payload.type === 'CLASH_ALERT') {
      return handleClashAlert(payload.examPeriodId, payload.conflictId, sessionUser?.institutionId)
    }

    if (payload.type === 'TIMETABLE_PUBLISHED') {
      return handlePublished(payload.examPeriodId, payload.lectureTimetableId, sessionUser?.institutionId)
    }

    if (payload.type === 'EXAM_REMINDER') {
      return handleExamReminder(payload.examPeriodId, payload.daysAhead)
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('[notify/whatsapp]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── Clash Alert: notify all affected students/lecturers ─────────────────────
async function handleClashAlert(examPeriodId: string, conflictId?: string, institutionId?: string) {
  const where = conflictId
    ? { id: conflictId, examPeriodId }
    : { examPeriodId, status: 'DETECTED' as const }

  const conflicts = await prisma.conflict.findMany({
    where,
    take: 50,
  })

  if (!conflicts.length) {
    return NextResponse.json({ message: 'No conflicts found', sent: 0, failed: 0 })
  }

  // Get institution info
  const examPeriod = await prisma.examPeriod.findUnique({
    where: { id: examPeriodId },
    include: { institution: { select: { name: true } } },
  })

  let sent = 0; let failed = 0

  for (const conflict of conflicts) {
    // Try to find phone — check if it's a student or lecturer conflict
    let phone: string | null = null
    let name = conflict.affectedName

    // Check students
    const student = await prisma.student.findFirst({
      where: { id: conflict.affectedEntity },
      select: { phone: true, name: true },
    })
    if (student?.phone) {
      phone = student.phone
      name = student.name
    } else {
      // Check lecturers
      const lecturer = await prisma.lecturer.findFirst({
        where: { id: conflict.affectedEntity },
        select: { phone: true, name: true },
      })
      if (lecturer?.phone) {
        phone = lecturer.phone
        name = lecturer.name
      }
    }

    if (!phone) { failed++; continue }

    const result = await sendClashAlert({
      to: phone,
      name,
      course: conflict.affectedName,
      conflict: conflict.description,
    })

    if (result.success) sent++
    else failed++
  }

  return NextResponse.json({ sent, failed, total: conflicts.length })
}

// ─── Timetable Published: notify all users in institution ────────────────────
async function handlePublished(examPeriodId?: string, lectureTimetableId?: string, institutionId?: string) {
  let instId = institutionId
  let timetableName = 'Your Timetable'
  let institutionName = 'Your Institution'

  if (examPeriodId) {
    const ep = await prisma.examPeriod.findUnique({
      where: { id: examPeriodId },
      include: { institution: { select: { id: true, name: true } } },
    })
    if (!ep) return NextResponse.json({ error: 'Exam period not found' }, { status: 404 })
    instId = ep.institution.id
    timetableName = ep.name
    institutionName = ep.institution.name
  } else if (lectureTimetableId) {
    const lt = await prisma.lectureTimetable.findUnique({
      where: { id: lectureTimetableId },
      include: { institution: { select: { id: true, name: true } } },
    })
    if (!lt) return NextResponse.json({ error: 'Lecture timetable not found' }, { status: 404 })
    instId = lt.institution.id
    timetableName = lt.name
    institutionName = lt.institution.name
  }

  if (!instId) return NextResponse.json({ error: 'institutionId required' }, { status: 400 })

  // Get all students + lecturers with phones
  const [students, lecturers] = await Promise.all([
    prisma.student.findMany({
      where: { department: { faculty: { institutionId: instId } }, phone: { not: null }, isActive: true },
      select: { phone: true, name: true },
      take: 500,
    }),
    prisma.lecturer.findMany({
      where: { department: { faculty: { institutionId: instId } }, phone: { not: null }, isActive: true },
      select: { phone: true, name: true },
      take: 500,
    }),
  ])

  const recipients = [
    ...students.map(s => ({ phone: s.phone!, name: s.name })),
    ...lecturers.map(l => ({ phone: l.phone!, name: l.name })),
  ]

  if (!recipients.length) {
    return NextResponse.json({ message: 'No recipients with phone numbers', sent: 0, failed: 0 })
  }

  const viewUrl = `${BASE_URL}/dashboard`
  const { sent, failed } = await batchNotifyWA(recipients, async (r) =>
    sendTimetablePublished({
      to: r.phone,
      name: r.name,
      timetableName,
      institutionName,
      viewUrl,
    })
  )

  return NextResponse.json({ sent, failed, total: recipients.length })
}

// ─── Exam Reminder: notify students with exams N days from now ───────────────
async function handleExamReminder(examPeriodId: string, daysAhead: number) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysAhead)
  const dateStr = targetDate.toISOString().split('T')[0]

  const slots = await prisma.examSlot.findMany({
    where: {
      examPeriodId,
      date: {
        gte: new Date(dateStr + 'T00:00:00Z'),
        lt: new Date(dateStr + 'T23:59:59Z'),
      },
    },
    include: {
      course: {
        include: {
          studentCourses: { include: { student: { select: { phone: true, name: true } } } },
        },
      },
      room: { select: { name: true, code: true } },
    },
  })

  let sent = 0; let failed = 0

  for (const slot of slots) {
    const studentsWithPhone = slot.course.studentCourses
      .filter(sc => sc.student.phone)
      .map(sc => ({ phone: sc.student.phone!, name: sc.student.name }))

    const { sent: s, failed: f } = await batchNotifyWA(studentsWithPhone, async (r) =>
      sendExamReminder ? (await import('@/lib/whatsapp')).sendExamReminder({
        to: r.phone,
        name: r.name,
        course: slot.course.name,
        date: new Date(slot.date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: `${slot.startTime} – ${slot.endTime}`,
        room: `${slot.room.name} (${slot.room.code})`,
      }) : { success: false }
    )
    sent += s; failed += f
  }

  return NextResponse.json({ sent, failed, slotsProcessed: slots.length })
}
