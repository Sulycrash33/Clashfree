import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/rooms/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const room = await db.room.findUnique({
      where: { id },
      include: {
        faculty: { select: { name: true, code: true } },
      },
    })

    if (!room) return apiError('Room not found', 404)
    return apiResponse(room)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/rooms/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { code, name, building, capacity, type, hasProjector, hasAC, hasComputers, isAccessible, facultyId, isActive } = body

    const room = await db.room.update({
      where: { id },
      data: { code, name, building, capacity, type, hasProjector, hasAC, hasComputers, isAccessible, facultyId, isActive },
    })

    return apiResponse(room)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.room.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
