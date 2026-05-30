import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireSuperAdmin } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/institutions - List all institutions
export async function GET() {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const institutions = await db.institution.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        city: true,
        state: true,
        currentSession: true,
        currentSemester: true,
        isActive: true,
        _count: {
          select: {
            faculties: true,
            courses: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return apiResponse(institutions)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/institutions - Create new institution
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { name, shortName, type, city, state, country, website, emailDomain, currentSession } = body

    if (!name || !shortName || !type || !city || !state || !currentSession) {
      return apiError('Missing required fields')
    }

    // Check if shortName already exists
    const existing = await db.institution.findUnique({
      where: { shortName },
    })

    if (existing) {
      return apiError('Institution with this short name already exists')
    }

    const institution = await db.institution.create({
      data: {
        name,
        shortName,
        type,
        city,
        state,
        country: country || 'Nigeria',
        website,
        emailDomain,
        currentSession,
      },
    })

    return apiResponse(institution, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
