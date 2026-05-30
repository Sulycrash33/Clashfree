import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireInstitutionAdmin, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/exam-periods - List exam periods
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
      whereClause.institutionId = institutionId
    } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
      whereClause.institutionId = authResult.user.institutionId
    }

    if (status) {
      whereClause.status = status
    }

    const examPeriods = await db.examPeriod.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        session: true,
        semester: true,
        startDate: true,
        endDate: true,
        slotsPerDay: true,
        includeSaturday: true,
        excludeFridays: true,
        status: true,
        publishedAt: true,
        institution: {
          select: { id: true, name: true, shortName: true },
        },
        _count: {
          select: {
            examSlots: true,
            blackoutDates: true,
            conflicts: { where: { status: 'DETECTED' } },
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    })

    return apiResponse(examPeriods)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/exam-periods - Create new exam period
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireInstitutionAdmin()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const {
      institutionId,
      name,
      session,
      semester,
      startDate,
      endDate,
      slotsPerDay,
      slotDuration,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      eveningStart,
      eveningEnd,
      includeSaturday,
      excludeFridays,
    } = body

    const targetInstitutionId =
      authResult.user.role === 'SA' ? institutionId : authResult.user.institutionId

    if (!targetInstitutionId || !name || !session || !semester || !startDate || !endDate) {
      return apiError('Missing required fields')
    }

    const examPeriod = await db.examPeriod.create({
      data: {
        institutionId: targetInstitutionId,
        name,
        session,
        semester,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        slotsPerDay: slotsPerDay || 3,
        slotDuration: slotDuration || 180,
        morningStart: morningStart || '08:00',
        morningEnd: morningEnd || '11:00',
        afternoonStart: afternoonStart || '12:00',
        afternoonEnd: afternoonEnd || '15:00',
        eveningStart: eveningStart || '16:00',
        eveningEnd: eveningEnd || '19:00',
        includeSaturday: includeSaturday !== false,
        excludeFridays: excludeFridays || false,
      },
      include: {
        institution: { select: { id: true, name: true, shortName: true } },
      },
    })

    return apiResponse(examPeriod, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
