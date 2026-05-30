import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/departments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const department = await db.department.findUnique({
      where: { id },
      include: {
        faculty: { select: { name: true, code: true } },
        _count: { select: { students: true, lecturers: true, courses: true } },
      },
    })

    if (!department) return apiError('Department not found', 404)
    return apiResponse(department)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/departments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { name, code, hodName, isActive } = body

    const department = await db.department.update({
      where: { id },
      data: { name, code, hodName, isActive },
    })

    return apiResponse(department)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/departments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.department.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
