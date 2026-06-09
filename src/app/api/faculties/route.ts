import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireInstitutionAdmin, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/faculties - List faculties (filtered by institution for non-super-admins)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    // Non-super-admins can only see their own institution's faculties
    const whereClause =
      authResult.user.role === 'SA' && institutionId
        ? { institutionId }
        : authResult.user.role !== 'SA' && authResult.user.institutionId
          ? { institutionId: authResult.user.institutionId! }
          : authResult.user.role === 'SA'
            ? {}
            : { institutionId: 'none' } // Will return empty for non-SA without institution

    const faculties = await db.faculty.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        deanName: true,
        isActive: true,
        institution: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        _count: {
          select: {
            departments: true,
            courses: true,
          },
        },
      },
      orderBy: [{ institution: { name: 'asc' } }, { name: 'asc' }],
    })

    return apiResponse(faculties)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/faculties - Create new faculty
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireInstitutionAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { institutionId, name, code, deanName, description } = body

    // Non-SA users can only create faculties in their own institution
    const targetInstitutionId =
      authResult.user.role === 'SA' ? institutionId : authResult.user.institutionId

    if (!targetInstitutionId || !name || !code) {
      return apiError('Missing required fields')
    }

    // Check if code already exists in this institution
    const existing = await db.faculty.findFirst({
      where: { institutionId: targetInstitutionId, code },
    })

    if (existing) {
      return apiError('Faculty with this code already exists in the institution')
    }

    const faculty = await db.faculty.create({
      data: {
        institutionId: targetInstitutionId,
        name,
        code: code.toUpperCase(),
        deanName,
        description,
      },
      include: {
        institution: {
          select: { id: true, name: true, shortName: true },
        },
      },
    })

    return apiResponse(faculty, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
