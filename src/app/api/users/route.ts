import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireSuperAdmin } from '@/lib/api-utils'
import { hashPassword } from '@/lib/password'
import { NextRequest } from 'next/server'
import { UserRole } from '@prisma/client'

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as UserRole | null
    const institutionId = searchParams.get('institutionId')

    let whereClause: any = {}

    if (role) {
      whereClause.role = role
    }

    if (institutionId) {
      whereClause.institutionId = institutionId
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        institution: {
          select: { id: true, name: true, shortName: true },
        },
        faculty: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return apiResponse(users)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { email, password, name, role, institutionId, facultyId } = body

    if (!email || !password || !name || !role) {
      return apiError('Missing required fields')
    }

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email },
    })

    if (existing) {
      return apiError('User with this email already exists')
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as UserRole,
        institutionId: role !== 'SA' ? institutionId : null,
        facultyId: role === 'TO' ? facultyId : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        institution: {
          select: { id: true, name: true, shortName: true },
        },
        faculty: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return apiResponse(user, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
