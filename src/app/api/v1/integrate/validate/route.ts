import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { quickValidate } from '@/lib/engine'
import { db } from '@/lib/db'

/**
 * POST /api/v1/integrate/validate
 * 
 * Validates the current timetable for an exam period, checking for conflicts,
 * CO clashes, and data completeness.
 * 
 * Body:
 * {
 *   examPeriodId: string  // Required: ID of the exam period to validate
 * }
 * 
 * Returns:
 * {
 *   valid: boolean
 *   violations: ConstraintViolation[]
 *   coClashes: COClashDetail[]
 *   dataCompleteness: { courses, students, rooms, lecturers, examPeriods }
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Check scope
  const scopes = (await db.apiKey.findUnique({ where: { id: auth.keyId }, select: { scopes: true } }))?.scopes || ''
  if (!scopes.includes('validate')) {
    return NextResponse.json({ error: 'API key does not have "validate" scope' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { examPeriodId } = body

    if (!examPeriodId) {
      return NextResponse.json({ error: 'examPeriodId is required' }, { status: 400 })
    }

    // Verify ownership
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

    // Run validation
    const validation = await quickValidate(examPeriodId)

    // Get data completeness
    const [courses, students, rooms, lecturers] = await Promise.all([
      db.course.count({ where: { institutionId: auth.institutionId } }),
      db.student.count({ where: { department: { faculty: { institutionId: auth.institutionId } } } }),
      db.room.count({ where: { institutionId: auth.institutionId } }),
      db.lecturer.count({ where: { department: { faculty: { institutionId: auth.institutionId } } } }),
    ])

    return NextResponse.json({
      valid: validation.valid,
      violations: validation.violations,
      coClashes: validation.coClashes,
      statistics: validation.statistics,
      dataCompleteness: {
        courses,
        students,
        rooms,
        lecturers,
        examPeriods: 1,
        ready: courses > 0 && students > 0 && rooms > 0,
      },
    })
  } catch (error) {
    console.error('[Integration API] Validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
