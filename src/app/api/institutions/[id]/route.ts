import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireSuperAdmin } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/institutions/[id] - Get single institution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { id } = await params
    const institution = await db.institution.findUnique({
      where: { id },
      include: {
        _count: { select: { faculties: true, courses: true, users: true, rooms: true } },
      },
    })

    if (!institution) {
      return apiError('Institution not found', 404)
    }

    return apiResponse(institution)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/institutions/[id] - Update institution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { id } = await params
    const body = await request.json()
    const { name, shortName, type, city, state, country, currentSession, currentSemester, isActive } = body

    const institution = await db.institution.update({
      where: { id },
      data: {
        name,
        shortName,
        type,
        city,
        state,
        country,
        currentSession,
        currentSemester,
        isActive,
      },
    })

    return apiResponse(institution)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/institutions/[id] - Delete institution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { id } = await params
    await db.institution.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
