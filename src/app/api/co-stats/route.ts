import { NextRequest } from 'next/server'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { getCOStatistics, getStudentsWithCOs } from '@/lib/engine/co-detector'

// GET /api/co-stats - Get carry-over statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const detailed = searchParams.get('detailed') === 'true'

    if (!institutionId) {
      return apiError('Institution ID is required')
    }

    if (authResult.user.role !== 'SA' && authResult.user.institutionId !== institutionId) {
      return apiError('Access denied', 403)
    }

    const stats = await getCOStatistics(institutionId)

    if (detailed) {
      const studentsWithCOs = await getStudentsWithCOs(institutionId)
      return apiResponse({
        statistics: stats,
        students: studentsWithCOs.slice(0, 50), // Limit to 50 for performance
        totalStudentsWithCOs: studentsWithCOs.length,
      })
    }

    return apiResponse(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
