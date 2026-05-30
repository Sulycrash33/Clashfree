import { NextRequest } from 'next/server'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { db } from '@/lib/db'

// GET /api/exam-slots - Get exam slots for an exam period
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const examPeriodId = searchParams.get('examPeriodId')

    if (!examPeriodId) {
      return apiError('Exam period ID is required')
    }

    const slots = await db.examSlot.findMany({
      where: { examPeriodId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            isShared: true,
            department: { select: { code: true, name: true } },
            _count: { select: { studentCourses: { where: { status: { in: ['REGISTERED', 'CARRY_OVER', 'SPILLOVER'] } } } } },
          },
        },
        room: { select: { id: true, code: true, name: true, capacity: true } },
      },
      orderBy: [{ date: 'asc' }, { slotNumber: 'asc' }],
    })

    // Group slots by date for easier rendering
    const byDate = slots.reduce((acc, slot) => {
      const dateKey = new Date(slot.date).toISOString().split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(slot)
      return acc
    }, {} as Record<string, typeof slots>)

    // Calculate statistics
    const stats = {
      totalExams: slots.length,
      uniqueCourses: new Set(slots.map(s => s.courseId)).size,
      roomsUsed: new Set(slots.map(s => s.roomId)).size,
      totalStudents: slots.reduce((sum, s) => sum + (s.course._count?.studentCourses || 0), 0),
    }

    return apiResponse({ slots, byDate, stats })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/exam-slots - Create a new exam slot (manual assignment)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    // Only admins can create slots
    if (!['SA', 'IA', 'TO'].includes(authResult.user.role)) {
      return apiError('Insufficient permissions', 403)
    }

    const body = await request.json()
    const { examPeriodId, courseId, roomId, date, slotNumber, startTime, endTime } = body

    if (!examPeriodId || !courseId || !roomId || !date || !slotNumber) {
      return apiError('Missing required fields')
    }

    // Check for conflicts
    const existingSlot = await db.examSlot.findFirst({
      where: {
        examPeriodId,
        date: new Date(date),
        slotNumber,
        OR: [
          { roomId },
          { courseId },
        ],
      },
    })

    if (existingSlot) {
      return apiError('A slot already exists for this room/course at the specified time', 409)
    }

    const slot = await db.examSlot.create({
      data: {
        examPeriodId,
        courseId,
        roomId,
        date: new Date(date),
        dayOfWeek: new Date(date).getDay(),
        slotNumber,
        startTime: startTime || '08:00',
        endTime: endTime || '11:00',
      },
      include: {
        course: true,
        room: true,
      },
    })

    return apiResponse(slot, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/exam-slots - Delete all slots for an exam period
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    if (!['SA', 'IA', 'TO'].includes(authResult.user.role)) {
      return apiError('Insufficient permissions', 403)
    }

    const { searchParams } = new URL(request.url)
    const examPeriodId = searchParams.get('examPeriodId')

    if (!examPeriodId) {
      return apiError('Exam period ID is required')
    }

    await db.examSlot.deleteMany({
      where: { examPeriodId },
    })

    return apiResponse({ message: 'All slots deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
