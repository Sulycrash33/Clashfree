import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

/**
 * POST /api/v1/integrate/data
 * 
 * Bulk import data (courses, students, rooms) for an institution.
 * Accepts one entity type per request. Upserts by unique identifiers.
 * 
 * Body:
 * {
 *   type: "courses" | "students" | "rooms" | "lecturers"
 *   data: Array<EntityPayload>
 * }
 * 
 * Course payload: { code, name, departmentCode, level, creditUnits, semester, type? }
 * Student payload: { regNumber, name, departmentCode, level, isSpillover?, courseRegistrations: string[] }
 * Room payload: { code, name, capacity, type?, building?, floor? }
 * Lecturer payload: { staffId, name, departmentCode, email? }
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, ...('retryAfterSeconds' in auth && { retryAfterSeconds: auth.retryAfterSeconds }) }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({
        error: 'Request must include "type" (courses|students|rooms|lecturers) and "data" (array)',
      }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Data array must not be empty' }, { status: 400 })
    }

    if (data.length > 5000) {
      return NextResponse.json({ error: 'Maximum 5000 records per request' }, { status: 400 })
    }

    const institutionId = auth.institutionId
    let result: { created: number; updated: number; errors: string[] }

    switch (type) {
      case 'courses':
        result = await importCourses(institutionId, data)
        break
      case 'students':
        result = await importStudents(institutionId, data)
        break
      case 'rooms':
        result = await importRooms(institutionId, data)
        break
      case 'lecturers':
        result = await importLecturers(institutionId, data)
        break
      default:
        return NextResponse.json({
          error: `Unknown type "${type}". Must be one of: courses, students, rooms, lecturers`,
        }, { status: 400 })
    }

    return NextResponse.json({
      success: result.errors.length === 0,
      type,
      total: data.length,
      created: result.created,
      updated: result.updated,
      errors: result.errors.slice(0, 50),
    })
  } catch (error) {
    console.error('[Integration API] Data import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/v1/integrate/data
 * 
 * Returns data counts and summary for the institution.
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error, ...('retryAfterSeconds' in auth && { retryAfterSeconds: auth.retryAfterSeconds }) }, { status: auth.status })
  }

  const institutionId = auth.institutionId

  const [courses, students, rooms, lecturers, departments, faculties, examPeriods] = await Promise.all([
    db.course.count({ where: { institutionId } }),
    db.student.count({ where: { department: { faculty: { institutionId } } } }),
    db.room.count({ where: { institutionId } }),
    db.lecturer.count({ where: { department: { faculty: { institutionId } } } }),
    db.department.count({ where: { faculty: { institutionId } } }),
    db.faculty.count({ where: { institutionId } }),
    db.examPeriod.count({ where: { institutionId } }),
  ])

  return NextResponse.json({
    institution: auth.institutionName,
    data: { courses, students, rooms, lecturers, departments, faculties, examPeriods },
    readyToGenerate: courses > 0 && students > 0 && rooms > 0 && examPeriods > 0,
  })
}

/* ─── Import Helpers ──────────────────────────────────────────────── */

async function importCourses(institutionId: string, data: any[]) {
  let created = 0, updated = 0
  const errors: string[] = []

  for (const item of data) {
    try {
      if (!item.code || !item.name || !item.departmentCode) {
        errors.push(`Missing required fields for course: ${item.code || 'unknown'}`)
        continue
      }

      const dept = await db.department.findFirst({
        where: { code: item.departmentCode, faculty: { institutionId } },
      })

      if (!dept) {
        errors.push(`Department not found: ${item.departmentCode} (course ${item.code})`)
        continue
      }

      const existing = await db.course.findFirst({
        where: { code: item.code, institutionId },
      })

      if (existing) {
        await db.course.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            level: item.level || existing.level,
            creditUnits: item.creditUnits || existing.creditUnits,
            semester: item.semester || existing.semester,
            departmentId: dept.id,
          },
        })
        updated++
      } else {
        await db.course.create({
          data: {
            code: item.code,
            name: item.name,
            level: item.level || 100,
            creditUnits: item.creditUnits || 3,
            semester: item.semester || 1,
            departmentId: dept.id,
            institutionId,
          },
        })
        created++
      }
    } catch (err: any) {
      errors.push(`Error processing course ${item.code}: ${err.message}`)
    }
  }

  return { created, updated, errors }
}

async function importStudents(institutionId: string, data: any[]) {
  let created = 0, updated = 0
  const errors: string[] = []

  for (const item of data) {
    try {
      if (!item.regNumber || !item.name || !item.departmentCode) {
        errors.push(`Missing required fields for student: ${item.regNumber || 'unknown'}`)
        continue
      }

      const dept = await db.department.findFirst({
        where: { code: item.departmentCode, faculty: { institutionId } },
      })

      if (!dept) {
        errors.push(`Department not found: ${item.departmentCode} (student ${item.regNumber})`)
        continue
      }

      const existing = await db.student.findFirst({
        where: { regNumber: item.regNumber, department: { faculty: { institutionId } } },
      })

      if (existing) {
        await db.student.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            level: item.level || existing.level,
            isSpillover: item.isSpillover ?? existing.isSpillover,
            departmentId: dept.id,
          },
        })
        updated++
      } else {
        await db.student.create({
          data: {
            regNumber: item.regNumber,
            name: item.name,
            level: item.level || 100,
            isSpillover: item.isSpillover || false,
            departmentId: dept.id,
          },
        })
        created++
      }

      // Handle course registrations
      if (item.courseRegistrations && Array.isArray(item.courseRegistrations)) {
        const studentId = existing?.id || (await db.student.findFirst({
          where: { regNumber: item.regNumber, departmentId: dept.id },
        }))?.id

        if (studentId) {
          for (const courseCode of item.courseRegistrations) {
            const course = await db.course.findFirst({
              where: { code: courseCode, institutionId },
            })
            if (course) {
              await db.studentCourse.upsert({
                where: { studentId_courseId: { studentId, courseId: course.id } },
                create: { studentId, courseId: course.id, status: 'REGISTERED' },
                update: {},
              })
            }
          }
        }
      }
    } catch (err: any) {
      errors.push(`Error processing student ${item.regNumber}: ${err.message}`)
    }
  }

  return { created, updated, errors }
}

async function importRooms(institutionId: string, data: any[]) {
  let created = 0, updated = 0
  const errors: string[] = []

  for (const item of data) {
    try {
      if (!item.code || !item.name || !item.capacity) {
        errors.push(`Missing required fields for room: ${item.code || 'unknown'}`)
        continue
      }

      const existing = await db.room.findFirst({
        where: { code: item.code, institutionId },
      })

      if (existing) {
        await db.room.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            capacity: item.capacity,
            type: item.type || existing.type,
            building: item.building || existing.building,
            floor: item.floor ?? existing.floor,
          },
        })
        updated++
      } else {
        await db.room.create({
          data: {
            code: item.code,
            name: item.name,
            capacity: item.capacity,
            type: item.type || 'LECTURE_HALL',
            building: item.building || null,
            floor: item.floor ?? null,
            institutionId,
          },
        })
        created++
      }
    } catch (err: any) {
      errors.push(`Error processing room ${item.code}: ${err.message}`)
    }
  }

  return { created, updated, errors }
}

async function importLecturers(institutionId: string, data: any[]) {
  let created = 0, updated = 0
  const errors: string[] = []

  for (const item of data) {
    try {
      if (!item.staffId || !item.name || !item.departmentCode) {
        errors.push(`Missing required fields for lecturer: ${item.staffId || 'unknown'}`)
        continue
      }

      const dept = await db.department.findFirst({
        where: { code: item.departmentCode, faculty: { institutionId } },
      })

      if (!dept) {
        errors.push(`Department not found: ${item.departmentCode} (lecturer ${item.staffId})`)
        continue
      }

      const existing = await db.lecturer.findFirst({
        where: { staffId: item.staffId, department: { faculty: { institutionId } } },
      })

      if (existing) {
        await db.lecturer.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            departmentId: dept.id,
            email: item.email || existing.email,
          },
        })
        updated++
      } else {
        await db.lecturer.create({
          data: {
            staffId: item.staffId,
            name: item.name,
            departmentId: dept.id,
            email: item.email || null,
          },
        })
        created++
      }
    } catch (err: any) {
      errors.push(`Error processing lecturer ${item.staffId}: ${err.message}`)
    }
  }

  return { created, updated, errors }
}
