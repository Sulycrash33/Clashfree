import { NextRequest } from 'next/server'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { detectCOClashes, getCOStatistics, predictCOClashes } from '@/lib/engine'

// GET /api/conflicts - Get conflicts for an exam period
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const examPeriodId = searchParams.get('examPeriodId')
    const action = searchParams.get('action') || 'list'

    if (action === 'detect-co') {
      // Run CO clash detection
      if (!examPeriodId) {
        return apiError('Exam period ID is required for CO detection')
      }

      const coClashes = await detectCOClashes(examPeriodId)
      
      // Convert to conflict format
      const conflicts = []
      for (const clash of coClashes) {
        for (const detail of clash.clashes) {
          conflicts.push({
            id: `co-${clash.studentId}-${detail.courseA.id}-${detail.courseB.id}`,
            type: 'CO_CLASH',
            severity: detail.severity,
            status: 'DETECTED',
            description: detail.message,
            affectedEntity: clash.studentId,
            affectedName: `${clash.studentName} (${clash.studentRegNumber})`,
            createdAt: new Date().toISOString(),
            details: {
              courseA: detail.courseA,
              courseB: detail.courseB,
              examSlot: detail.examSlot,
            },
          })
        }
      }

      return apiResponse({
        conflicts,
        totalAffected: coClashes.length,
        summary: {
          critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
          warnings: conflicts.filter(c => c.severity === 'WARNING').length,
        },
      })
    }

    if (action === 'predict-co') {
      // Predict potential CO clashes before timetable generation
      const institutionId = searchParams.get('institutionId')
      if (!institutionId) {
        return apiError('Institution ID is required for CO prediction')
      }

      const prediction = await predictCOClashes(institutionId)
      return apiResponse(prediction)
    }

    if (action === 'co-stats') {
      // Get CO statistics for an institution
      const institutionId = searchParams.get('institutionId')
      if (!institutionId) {
        return apiError('Institution ID is required for CO statistics')
      }

      const stats = await getCOStatistics(institutionId)
      return apiResponse(stats)
    }

    // Default: list stored conflicts from database
    const whereClause: any = {}
    if (examPeriodId) {
      whereClause.examPeriodId = examPeriodId
    }

    const conflicts = await db.conflict.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    // Get summary
    const summary = {
      total: conflicts.length,
      critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
      warning: conflicts.filter(c => c.severity === 'WARNING').length,
      resolved: conflicts.filter(c => c.status === 'RESOLVED').length,
    }

    return apiResponse({ conflicts, summary })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/conflicts - Update conflict status
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { id, status, resolution } = body

    if (!id) {
      return apiError('Conflict ID is required')
    }

    const updateData: any = { status }
    if (resolution) {
      updateData.resolution = resolution
    }
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    const conflict = await db.conflict.update({
      where: { id },
      data: updateData,
    })

    return apiResponse(conflict)
  } catch (error) {
    return handleApiError(error)
  }
}
