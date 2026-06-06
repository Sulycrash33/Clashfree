import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/lecture-slots?timetableId=...&departmentId=...&facultyId=...&level=...
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const timetableId = searchParams.get('timetableId')
    const departmentId = searchParams.get('departmentId')
    const facultyId = searchParams.get('facultyId')
    const level = searchParams.get('level')

    if (!timetableId) return apiError('timetableId is required')

    let courseWhere: any = {}
    if (departmentId) courseWhere.departmentId = departmentId
    else if (facultyId) courseWhere.department = { facultyId }
    if (level) courseWhere.level = parseInt(level)

    const slots = await db.lectureSlot.findMany({
      where: {
        lectureTimetableId: timetableId,
        ...(Object.keys(courseWhere).length > 0 ? { course: courseWhere } : {}),
        status: 'ACTIVE',
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isRecurring: true,
        notes: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            creditUnits: true,
            isShared: true,
            department: {
              select: { id: true, code: true, name: true, faculty: { select: { id: true, code: true, name: true } } },
            },
          },
        },
        room: {
          select: { id: true, code: true, name: true, capacity: true, faculty: { select: { id: true, code: true } } },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    // Stats
    const uniqueCourses = new Set(slots.map(s => s.course.id)).size
    const uniqueRooms = new Set(slots.map(s => s.room.id)).size
    const uniqueDays = new Set(slots.map(s => s.dayOfWeek)).size

    return apiResponse({ slots, stats: { totalSlots: slots.length, uniqueCourses, uniqueRooms, uniqueDays } })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/lecture-slots — create a single slot
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const body = await request.json()
    const { lectureTimetableId, courseId, roomId, dayOfWeek, startTime, endTime, notes } = body

    if (!lectureTimetableId || !courseId || !roomId || dayOfWeek === undefined || !startTime || !endTime) {
      return apiError('Missing required fields')
    }

    // Check for room clash at same day/time
    const roomClash = await db.lectureSlot.findFirst({
      where: { lectureTimetableId, roomId, dayOfWeek, startTime, status: 'ACTIVE' },
    })
    if (roomClash) return apiError('Room already booked at this time')

    // Check for course clash
    const courseClash = await db.lectureSlot.findFirst({
      where: { lectureTimetableId, courseId, dayOfWeek, startTime, status: 'ACTIVE' },
    })
    if (courseClash) return apiError('Course already scheduled at this time')

    const slot = await db.lectureSlot.create({
      data: { lectureTimetableId, courseId, roomId, dayOfWeek, startTime, endTime, notes },
      include: {
        course: { select: { id: true, code: true, name: true, level: true, isShared: true, department: { select: { id: true, code: true, name: true } } } },
        room: { select: { id: true, code: true, name: true, capacity: true } },
      },
    })

    return apiResponse(slot, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/lecture-slots?slotId=...
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('slotId')
    if (!slotId) return apiError('slotId is required')

    await db.lectureSlot.delete({ where: { id: slotId } })
    return apiResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
