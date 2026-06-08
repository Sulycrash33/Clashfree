import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

/**
 * GET /api/courses/bulk
 * Returns a downloadable CSV template for bulk course import.
 */
export async function GET() {
  const csv = [
    'code,name,departmentCode,level,creditUnits,semester,isShared,requiresLab,lecturerStaffId',
    'CSC 201,Data Structures and Algorithms,CSC,200,3,1,false,false,SS001',
    'MTH 101,General Mathematics I,MTH,100,2,1,true,false,',
    'CHM 301,Organic Chemistry I,CHM,300,3,1,false,true,SS045',
    'GST 111,Use of English I,GST,100,2,1,true,false,',
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="clashfree-courses-template.csv"',
    },
  })
}

/**
 * POST /api/courses/bulk
 * Bulk import courses from a JSON rows array (after CSV parsing on the frontend).
 *
 * Body:
 *   rows: Array<{
 *     code: string           e.g. "CSC 201"
 *     name: string
 *     departmentCode: string  e.g. "CSC"
 *     level: number | string  100|200|300|400|500|600
 *     creditUnits?: number    default 2
 *     semester?: number       1 or 2, default 1
 *     isShared?: boolean
 *     requiresLab?: boolean
 *     lecturerStaffId?: string
 *   }>
 *   mode?: 'insert' | 'upsert'   default: 'upsert'
 *
 * Returns: { inserted, updated, skipped, errorCount, errors[], message }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const institutionId = authResult.user.institutionId
    if (!institutionId) return apiError('No institution associated with this account', 403)

    const body = await request.json()
    const { rows, mode = 'upsert' } = body

    if (!rows || !Array.isArray(rows)) return apiError('rows (array) is required')
    if (rows.length === 0) return apiError('rows array is empty')
    if (rows.length > 500) return apiError('Maximum 500 rows per batch. Split and retry.')

    // Pre-load department map: UPPER(code) → { id, code, name }
    const departments = await db.department.findMany({
      where: { faculty: { institutionId } },
      select: { id: true, code: true, name: true },
    })
    const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d]))
    const deptList = departments.map(d => d.code).join(', ')

    // Pre-load lecturer map: UPPER(staffId) → { id, name }
    const lecturers = await db.lecturer.findMany({
      where: { department: { faculty: { institutionId } } },
      select: { id: true, staffId: true, name: true },
    })
    const lecMap = new Map(lecturers.map(l => [l.staffId.toUpperCase(), l]))

    // Pre-load existing courses: UPPER(code) → id
    const existingCourses = await db.course.findMany({
      where: { institutionId },
      select: { id: true, code: true },
    })
    const existingMap = new Map(existingCourses.map(c => [c.code.toUpperCase(), c.id]))

    type RowError = { row: number; code: string; field: string; message: string }

    const errors: RowError[] = []
    const toInsert: any[] = []
    const toUpdate: Array<{ id: string; data: any }> = []
    const skipped: string[] = []
    const VALID_LEVELS = [100, 200, 300, 400, 500, 600]

    rows.forEach((row: any, idx: number) => {
      const rowNum = idx + 1
      const rowCode = (row.code || '').toString().toUpperCase().trim()

      // Validate required fields
      if (!row.code?.toString().trim()) {
        errors.push({ row: rowNum, code: '', field: 'code', message: 'code is required' })
        return
      }
      if (!row.name?.toString().trim()) {
        errors.push({ row: rowNum, code: rowCode, field: 'name', message: 'name is required' })
        return
      }
      if (!row.departmentCode?.toString().trim()) {
        errors.push({ row: rowNum, code: rowCode, field: 'departmentCode', message: 'departmentCode is required' })
        return
      }

      const level = parseInt(row.level)
      if (isNaN(level) || !VALID_LEVELS.includes(level)) {
        errors.push({ row: rowNum, code: rowCode, field: 'level', message: `Invalid level "${row.level}". Must be one of: ${VALID_LEVELS.join(', ')}` })
        return
      }

      // Department lookup
      const dept = deptMap.get(row.departmentCode.toUpperCase().trim())
      if (!dept) {
        errors.push({ row: rowNum, code: rowCode, field: 'departmentCode', message: `Department "${row.departmentCode}" not found. Available: ${deptList}` })
        return
      }

      // Optional field validation
      const creditUnits = row.creditUnits !== undefined ? parseInt(row.creditUnits) : 2
      if (isNaN(creditUnits) || creditUnits < 1 || creditUnits > 6) {
        errors.push({ row: rowNum, code: rowCode, field: 'creditUnits', message: `Invalid creditUnits "${row.creditUnits}". Must be 1–6` })
        return
      }

      const semester = row.semester !== undefined ? parseInt(row.semester) : 1
      if (isNaN(semester) || ![1, 2].includes(semester)) {
        errors.push({ row: rowNum, code: rowCode, field: 'semester', message: `Invalid semester "${row.semester}". Must be 1 or 2` })
        return
      }

      // Optional lecturer lookup
      let lecturerId: string | undefined
      if (row.lecturerStaffId?.toString().trim()) {
        const lec = lecMap.get(row.lecturerStaffId.toString().toUpperCase().trim())
        if (!lec) {
          errors.push({ row: rowNum, code: rowCode, field: 'lecturerStaffId', message: `Lecturer staffId "${row.lecturerStaffId}" not found` })
          return
        }
        lecturerId = lec.id
      }

      const courseData = {
        institutionId,
        departmentId: dept.id,
        code: rowCode,
        name: row.name.toString().trim(),
        level,
        creditUnits,
        semester,
        isShared: ['true', '1', 'yes'].includes(String(row.isShared).toLowerCase()),
        requiresLab: ['true', '1', 'yes'].includes(String(row.requiresLab).toLowerCase()),
        isActive: true,
        ...(lecturerId ? { lecturerId } : {}),
      }

      const existingId = existingMap.get(rowCode)
      if (existingId) {
        if (mode === 'upsert') {
          toUpdate.push({ id: existingId, data: courseData })
        } else {
          skipped.push(rowCode)
        }
      } else {
        toInsert.push(courseData)
      }
    })

    // If more than 50 validation errors, abort early — likely wrong file/format
    if (errors.length > 50) {
      return apiResponse({
        inserted: 0, updated: 0, skipped: skipped.length,
        errorCount: errors.length,
        errors: errors.slice(0, 50),
        message: `❌ Import aborted: ${errors.length} validation errors (showing first 50). Check file format and retry.`,
        aborted: true,
      }, 422)
    }

    // Execute DB writes
    let inserted = 0, updated = 0

    if (toInsert.length > 0) {
      const result = await db.course.createMany({ data: toInsert, skipDuplicates: true })
      inserted = result.count
    }

    for (const { id, data } of toUpdate) {
      await db.course.update({ where: { id }, data })
      updated++
    }

    const statusCode = errors.length > 0 ? 207 : 200
    return apiResponse({
      inserted, updated,
      skipped: skipped.length,
      skippedCodes: skipped,
      errorCount: errors.length,
      errors,
      message: errors.length === 0
        ? `✅ Import complete: ${inserted} inserted, ${updated} updated, ${skipped.length} skipped`
        : `⚠️ Partial import: ${inserted} inserted, ${updated} updated, ${errors.length} row(s) failed`,
    }, statusCode)
  } catch (error) {
    return handleApiError(error)
  }
}
