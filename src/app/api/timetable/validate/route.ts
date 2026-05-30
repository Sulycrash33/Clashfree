import { NextRequest } from 'next/server'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { quickValidate, getTimetableStatistics, predictCOClashes } from '@/lib/engine'
import { db } from '@/lib/db'

// GET /api/timetable/validate - Validate timetable
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const examPeriodId = searchParams.get('examPeriodId')
    const action = searchParams.get('action') || 'validate'

    if (!examPeriodId) {
      return apiError('Exam period ID is required')
    }

    switch (action) {
      case 'validate':
        const validation = await quickValidate(examPeriodId)
        return apiResponse(validation)

      case 'statistics':
        const stats = await getTimetableStatistics(examPeriodId)
        return apiResponse(stats)

      case 'co-predict':
        const examPeriod = await db.examPeriod.findUnique({
          where: { id: examPeriodId },
          select: { institutionId: true },
        })
        if (!examPeriod) {
          return apiError('Exam period not found', 404)
        }
        const prediction = await predictCOClashes(examPeriod.institutionId)
        return apiResponse(prediction)

      default:
        return apiError('Invalid action')
    }
  } catch (error) {
    return handleApiError(error)
  }
}
