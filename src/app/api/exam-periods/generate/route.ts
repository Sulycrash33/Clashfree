import { NextRequest } from 'next/server'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { generateTimetablePipeline, quickValidate, getTimetableStatistics } from '@/lib/engine'

// POST /api/exam-periods/generate - Generate exam timetable
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { examPeriodId, maxIterations, timeLimitMs } = body

    if (!examPeriodId) {
      return apiError('Exam period ID is required')
    }

    // Run the generation pipeline
    const result = await generateTimetablePipeline({
      examPeriodId,
      maxIterations,
      timeLimitMs,
    })

    if (result.success) {
      return apiResponse(result, 200)
    } else {
      return apiResponse(result, 400) // Return details even on failure
    }
  } catch (error) {
    console.error('Generation error:', error)
    return handleApiError(error)
  }
}
