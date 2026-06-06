import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth, requireTimetableOfficer } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/invigilations?lecturerId=...&examPeriodId=...
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const lecturerId = searchParams.get('lecturerId')
    const examPeriodId = searchParams.get('examPeriodId')

    const where: any = {}
    if (lecturerId) where.lecturerId = lecturerId
    if (examPeriodId) where.examSlot = { examPeriodId }

    const assignments = await db.invigilatorAssignment.findMany({
      where,
      select: {
        id: true,
        role: true,
        notes: true,
        createdAt: true,
        lecturer: {
          select: { id: true, staffId: true, name: true, department: { select: { code: true, name: true } } },
        },
        examSlot: {
          select: {
            id: true,
            date: true,
            slotNumber: true,
            startTime: true,
            endTime: true,
            examPeriodId: true,
            course: {
              select: {
                id: true, code: true, name: true, level: true,
                department: { select: { code: true, name: true } },
                _count: { select: { studentCourses: true } },
              },
            },
            room: { select: { id: true, code: true, name: true, capacity: true } },
          },
        },
      },
      orderBy: [{ examSlot: { date: 'asc' } }, { examSlot: { slotNumber: 'asc' } }],
    })

    const stats = {
      total: assignments.length,
      chief: assignments.filter(a => a.role === 'CHIEF').length,
      assistant: assignments.filter(a => a.role === 'ASSISTANT').length,
      supervisor: assignments.filter(a => a.role === 'SUPERVISOR').length,
    }

    return apiResponse({ assignments, stats })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/invigilations — assign a lecturer to an exam slot
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const body = await request.json()
    const { examSlotId, lecturerId, role = 'ASSISTANT', notes } = body

    if (!examSlotId || !lecturerId) return apiError('examSlotId and lecturerId required')

    // Check for conflict: lecturer already assigned same slot
    const existing = await db.invigilatorAssignment.findUnique({
      where: { examSlotId_lecturerId: { examSlotId, lecturerId } },
    })
    if (existing) return apiError('Lecturer already assigned to this exam slot')

    // Check for time clash: lecturer teaching or invigilating another exam at same time
    const slot = await db.examSlot.findUnique({
      where: { id: examSlotId },
      select: { date: true, slotNumber: true, examPeriodId: true },
    })
    if (!slot) return apiError('Exam slot not found', 404)

    const timeClash = await db.invigilatorAssignment.findFirst({
      where: {
        lecturerId,
        examSlot: { date: slot.date, slotNumber: slot.slotNumber },
        id: { not: examSlotId },
      },
    })
    if (timeClash) return apiError('Lecturer has a time clash at this slot')

    const assignment = await db.invigilatorAssignment.create({
      data: { examSlotId, lecturerId, role, notes },
      include: {
        lecturer: { select: { id: true, staffId: true, name: true } },
        examSlot: {
          select: {
            id: true, date: true, slotNumber: true, startTime: true, endTime: true,
            course: { select: { id: true, code: true, name: true, level: true } },
            room: { select: { id: true, code: true, name: true } },
          },
        },
      },
    })

    return apiResponse(assignment, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/invigilations?assignmentId=...
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    if (!assignmentId) return apiError('assignmentId required')

    await db.invigilatorAssignment.delete({ where: { id: assignmentId } })
    return apiResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
