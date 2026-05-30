import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/faculties/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const faculty = await db.faculty.findUnique({
      where: { id },
      include: {
        institution: { select: { name: true, shortName: true } },
        _count: { select: { departments: true, users: true } },
      },
    })

    if (!faculty) return apiError('Faculty not found', 404)
    return apiResponse(faculty)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/faculties/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { name, code, description, deanName, isActive } = body

    const faculty = await db.faculty.update({
      where: { id },
      data: { name, code, description, deanName, isActive },
    })

    return apiResponse(faculty)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/faculties/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.faculty.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
