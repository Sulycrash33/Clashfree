import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/students/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        department: { select: { name: true, code: true, faculty: { select: { code: true } } } },
        _count: { select: { studentCourses: true } },
      },
    })

    if (!student) return apiError('Student not found', 404)
    return apiResponse(student)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/students/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { regNumber, name, email, phone, level, admissionYear, departmentId, isSpillover, isActive } = body

    const student = await db.student.update({
      where: { id },
      data: { regNumber, name, email, phone, level, admissionYear, departmentId, isSpillover, isActive },
    })

    return apiResponse(student)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/students/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.student.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
