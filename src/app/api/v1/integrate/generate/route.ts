import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { generateTimetablePipeline } from '@/lib/engine'
import { db } from '@/lib/db'

/**
 * POST /api/v1/integrate/generate
 * 
 * Triggers timetable generation for the authenticated institution's exam period.
 * Requires a valid API key with "generate" scope.
 * 
 * Body:
 * {
 *   examPeriodId: string           // Required: ID of the exam period to generate for
 *   maxIterations?: number         // Max solver iterations (default: 10000)
 *   timeLimitMs?: number           // Time limit in ms (default: 120000)
 *   optimizeForSpread?: boolean    // Spread exams across days (default: true)
 *   respectLecturerAvailability?: boolean  // (default: true)
 *   isolateGSTCourses?: boolean    // Isolate general studies (default: true)
 * }
 * 
 * Returns: GenerationResult with assignments, conflicts, and statistics
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, ...('retryAfterSeconds' in auth && { retryAfterSeconds: auth.retryAfterSeconds }) }, { status: auth.status })
  }

  // Check scope
  const scopes = (await db.apiKey.findUnique({ where: { id: auth.keyId }, select: { scopes: true } }))?.scopes || ''
  if (!scopes.includes('generate')) {
    return NextResponse.json({ error: 'API key does not have "generate" scope' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { examPeriodId, maxIterations, timeLimitMs, optimizeForSpread, respectLecturerAvailability, isolateGSTCourses } = body

    if (!examPeriodId) {
      return NextResponse.json({ error: 'examPeriodId is required' }, { status: 400 })
    }

    // Verify the exam period belongs to this institution
    const examPeriod = await db.examPeriod.findUnique({
      where: { id: examPeriodId },
      select: { institutionId: true },
    })

    if (!examPeriod) {
      return NextResponse.json({ error: 'Exam period not found' }, { status: 404 })
    }

    if (examPeriod.institutionId !== auth.institutionId) {
      return NextResponse.json({ error: 'Exam period does not belong to your institution' }, { status: 403 })
    }

    // Run generation
    const result = await generateTimetablePipeline({
      examPeriodId,
      maxIterations: maxIterations || 10000,
      timeLimitMs: timeLimitMs || 120000,
      optimizeForSpread: optimizeForSpread ?? true,
      respectLecturerAvailability: respectLecturerAvailability ?? true,
      isolateGSTCourses: isolateGSTCourses ?? true,
    })

    return NextResponse.json({
      success: result.success,
      message: result.message,
      generation: result.generation,
      validation: result.validation,
      coPrediction: result.coPrediction,
    }, { status: result.success ? 200 : 422 })
  } catch (error) {
    console.error('[Integration API] Generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
