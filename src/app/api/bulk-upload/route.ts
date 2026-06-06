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
            // Find department
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
          } catch (error: any) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error.message}`)
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
          } catch (error: any) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error.message}`)
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
          } catch (error: any) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error.message}`)
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
          } catch (error: any) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error.message}`)
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
          } catch (error: any) {
            errors.push(`Row ${rows.indexOf(row) + 1}: ${error.message}`)
            failed++
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    return NextResponse.json({
      success,
      failed,
      total: rows.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    })

  } catch (error: any) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
