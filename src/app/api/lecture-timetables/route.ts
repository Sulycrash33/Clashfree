import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireInstitutionAdmin, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/lecture-timetables - List lecture timetables
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (institutionId) {
      if (authResult.user.role !== 'SA' && authResult.user.institutionId !== institutionId) {
        return apiError('Access denied', 403)
      }
      whereClause.institutionId = institutionId
    } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
      whereClause.institutionId = authResult.user.institutionId
    }

    if (status) {
      whereClause.status = status
    }

    const timetables = await db.lectureTimetable.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        session: true,
        semester: true,
        startDate: true,
        endDate: true,
        status: true,
        publishedAt: true,
        institution: {
          select: { id: true, name: true, shortName: true },
        },
        _count: {
          select: { slots: true },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    })

    return apiResponse(timetables)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/lecture-timetables - Create new lecture timetable
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireInstitutionAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { institutionId, name, session, semester, startDate, endDate } = body

    const targetInstitutionId =
      authResult.user.role === 'SA' ? institutionId : authResult.user.institutionId

    if (!targetInstitutionId || !name || !session || !semester || !startDate || !endDate) {
      return apiError('Missing required fields')
    }

    // Check if timetable already exists for this session/semester
    const existing = await db.lectureTimetable.findUnique({
      where: {
        institutionId_session_semester: {
          institutionId: targetInstitutionId,
          session,
          semester,
        },
      },
    })

    if (existing) {
      return apiError('Lecture timetable already exists for this session and semester')
    }

    const timetable = await db.lectureTimetable.create({
      data: {
        institutionId: targetInstitutionId,
        name,
        session,
        semester,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        institution: { select: { id: true, name: true, shortName: true } },
      },
    })

    return apiResponse(timetable, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
