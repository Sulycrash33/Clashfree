import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

// Parse CSV string into array of objects
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      rows.push(row)
    }
  }

  return rows
}

// POST /api/bulk-upload - Bulk upload data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['SA', 'IA', 'TO'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const institutionId = formData.get('institutionId') as string

    if (!file || !type || !institutionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 })
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    // Process based on type
    switch (type) {
      case 'students':
        for (const row of rows) {
          try {
            const department = await prisma.department.findFirst({
              where: {
                code: row.departmentCode,
                faculty: { institutionId }
              }
            })

            if (!department) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Department ${row.departmentCode} not found`)
              failed++
              continue
            }

            await prisma.student.create({
              data: {
                regNumber: row.regNumber,
                name: row.name,
                email: row.email || null,
                level: parseInt(row.level) || 100,
                admissionYear: parseInt(row.admissionYear) || 2020,
                departmentId: department.id,
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break

      case 'courses':
        for (const row of rows) {
          try {
            const department = await prisma.department.findFirst({
              where: {
                code: row.departmentCode,
                faculty: { institutionId }
              }
            })

            if (!department) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Department ${row.departmentCode} not found`)
              failed++
              continue
            }

            await prisma.course.create({
              data: {
                institutionId,
                departmentId: department.id,
                code: row.code,
                name: row.name,
                creditUnits: parseInt(row.creditUnits) || 2,
                level: parseInt(row.level) || 100,
                semester: parseInt(row.semester) || 1,
                isShared: row.isShared?.toLowerCase() === 'true',
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break

      case 'lecturers':
        for (const row of rows) {
          try {
            const department = await prisma.department.findFirst({
              where: {
                code: row.departmentCode,
                faculty: { institutionId }
              }
            })

            if (!department) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Department ${row.departmentCode} not found`)
              failed++
              continue
            }

            await prisma.lecturer.create({
              data: {
                staffId: row.staffId,
                name: row.name,
                email: row.email,
                rank: row.rank || null,
                departmentId: department.id,
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break

      case 'rooms':
        for (const row of rows) {
          try {
            await prisma.room.create({
              data: {
                institutionId,
                code: row.code,
                name: row.name,
                capacity: parseInt(row.capacity) || 100,
                type: row.type || 'CLASSROOM',
                hasProjector: row.hasProjector?.toLowerCase() === 'true',
                hasAC: row.hasAC?.toLowerCase() === 'true',
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break

      case 'departments':
        for (const row of rows) {
          try {
            await prisma.department.create({
              data: {
                code: row.code,
                name: row.name,
                facultyId: row.facultyId,
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break

      case 'exam-slots': {
        for (const row of rows) {
          try {
            // Resolve course
            const course = await prisma.course.findFirst({
              where: { code: row.courseCode, institutionId }
            })
            if (!course) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Course ${row.courseCode} not found`)
              failed++
              continue
            }

            // Resolve room
            const room = await prisma.room.findFirst({
              where: { code: row.roomCode, institutionId }
            })
            if (!room) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Room ${row.roomCode} not found`)
              failed++
              continue
            }

            // Build datetime objects
            const startAt = new Date(`${row.date}T${row.startTime}:00`)
            const endAt = new Date(`${row.date}T${row.endTime}:00`)

            if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Invalid date/time format`)
              failed++
              continue
            }

            await prisma.examSlot.create({
              data: {
                courseId: course.id,
                roomId: room.id,
                startTime: startAt,
                endTime: endAt,
                ...(row.examPeriodId ? { examPeriodId: row.examPeriodId } : {}),
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break
      }

      case 'timetable-slots': {
        for (const row of rows) {
          try {
            // Resolve course
            const course = await prisma.course.findFirst({
              where: { code: row.courseCode, institutionId }
            })
            if (!course) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Course ${row.courseCode} not found`)
              failed++
              continue
            }

            // Resolve room
            const room = await prisma.room.findFirst({
              where: { code: row.roomCode, institutionId }
            })
            if (!room) {
              errors.push(`Row ${rows.indexOf(row) + 1}: Room ${row.roomCode} not found`)
              failed++
              continue
            }

            // Optionally resolve lecturer
            let lecturerId: string | undefined
            if (row.lecturerStaffId) {
              const lecturer = await prisma.lecturer.findFirst({
                where: { staffId: row.lecturerStaffId }
              })
              if (lecturer) lecturerId = lecturer.id
            }

            await prisma.timetableSlot.create({
              data: {
                courseId: course.id,
                roomId: room.id,
                day: row.day,
                startTime: row.startTime,
                endTime: row.endTime,
                ...(lecturerId ? { lecturerId } : {}),
              }
            })
            success++
          } catch (error: unknown) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    return NextResponse.json({
      success,
      failed,
      total: rows.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })

  } catch (error: unknown) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 })
  }
}
