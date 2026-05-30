import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/courses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const course = await db.course.findUnique({
      where: { id },
      include: {
        department: { select: { name: true, code: true } },
        lecturer: { select: { name: true } },
        _count: { select: { studentCourses: true } },
      },
    })

    if (!course) return apiError('Course not found', 404)
    return apiResponse(course)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/courses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { name, code, creditUnits, level, semester, departmentId, isShared, isActive } = body

    const course = await db.course.update({
      where: { id },
      data: { name, code, creditUnits, level, semester, departmentId, isShared, isActive },
    })

    return apiResponse(course)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/courses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.course.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
