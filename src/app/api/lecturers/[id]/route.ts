import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/lecturers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const lecturer = await db.lecturer.findUnique({
      where: { id },
      include: {
        department: { select: { name: true, code: true } },
        _count: { select: { courses: true, invigilations: true } },
      },
    })

    if (!lecturer) return apiError('Lecturer not found', 404)
    return apiResponse(lecturer)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/lecturers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { staffId, name, email, phone, rank, specialization, departmentId, isActive } = body

    const lecturer = await db.lecturer.update({
      where: { id },
      data: { staffId, name, email, phone, rank, specialization, departmentId, isActive },
    })

    return apiResponse(lecturer)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/lecturers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.lecturer.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
