import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireSuperAdmin } from '@/lib/api-utils'
import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        institutionId: true,
        facultyId: true,
        institution: { select: { name: true, shortName: true } },
        faculty: { select: { name: true, code: true } },
        createdAt: true,
      },
    })

    if (!user) return apiError('User not found', 404)
    return apiResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    const body = await request.json()
    const { name, email, role, institutionId, facultyId, isActive } = body

    const user = await db.user.update({
      where: { id },
      data: { name, email, role, institutionId, facultyId, isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    return apiResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { id } = await params
    await db.user.delete({ where: { id } })
    return apiResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
