import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/students/courses?studentId=...
// Returns full course list for a student with CO/spillover/FYP flags
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return apiError('studentId is required')

    // Fetch student with department
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true, regNumber: true, name: true, level: true,
        isSpillover: true,
        department: { select: { id: true, code: true, name: true, faculty: { select: { id: true, code: true, name: true } } } },
      },
    })
    if (!student) return apiError('Student not found', 404)

    // Fetch all course registrations for student
    const registrations = await db.studentCourse.findMany({
      where: { studentId },
      select: {
        id: true, status: true, semester: true, session: true,
        course: {
          select: {
            id: true, code: true, name: true, level: true, creditUnits: true,
            semester: true, isShared: true,
            department: { select: { id: true, code: true, name: true } },
            _count: { select: { studentCourses: { where: { status: { in: ['REGISTERED', 'CARRY_OVER', 'SPILLOVER'] } } } } },
          },
        },
      },
      orderBy: [{ course: { level: 'asc' } }, { course: { code: 'asc' } }],
    })

    // Classify: CO, Spillover, FYP (400/500L final year project courses)
    const classified = registrations.map(r => {
      const isFYP = r.course.code.toUpperCase().includes('FYP') ||
                    r.course.code.toUpperCase().includes('PROJ') ||
                    r.course.name.toLowerCase().includes('final year project') ||
                    r.course.name.toLowerCase().includes('research project')
      const isCO = r.status === 'CARRY_OVER'
      const isSpillover = r.status === 'SPILLOVER'
      const totalEnrolled = r.course._count?.studentCourses || 0
      // "halved" means multiple rooms needed — show room split indicator
      const roomSplitNeeded = totalEnrolled > 100  // threshold for showing split warning

      return {
        ...r,
        isFYP,
        isCO,
        isSpillover,
        totalEnrolled,
        roomSplitNeeded,
      }
    })

    const summary = {
      total: classified.length,
      registered: classified.filter(c => c.status === 'REGISTERED').length,
      carryOver: classified.filter(c => c.isCO).length,
      spillover: classified.filter(c => c.isSpillover).length,
      fyp: classified.filter(c => c.isFYP).length,
      totalCreditUnits: classified.reduce((sum, c) => sum + c.course.creditUnits, 0),
    }

    return apiResponse({ student, courses: classified, summary })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/students/courses — add a course to a student
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const body = await request.json()
    const { studentId, courseId, status = 'REGISTERED', semester = 1, session = '2025/2026' } = body

    if (!studentId || !courseId) return apiError('studentId and courseId are required')

    // Check not already registered
    const existing = await db.studentCourse.findFirst({ where: { studentId, courseId, session } })
    if (existing) return apiError('Student already registered for this course this session')

    const reg = await db.studentCourse.create({
      data: { studentId, courseId, status, semester, session },
      include: {
        course: { select: { id: true, code: true, name: true, level: true, creditUnits: true } },
      },
    })

    return apiResponse(reg, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/students/courses?regId=...
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const regId = searchParams.get('regId')
    if (!regId) return apiError('regId is required')

    await db.studentCourse.delete({ where: { id: regId } })
    return apiResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
