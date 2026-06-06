import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/students - List students
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const facultyId = searchParams.get('facultyId')
    const institutionId = searchParams.get('institutionId')
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    let whereClause: any = {}

    if (departmentId) {
      whereClause.departmentId = departmentId
    } else if (facultyId) {
      whereClause.department = { facultyId }
    } else if (institutionId) {
      whereClause.department = { faculty: { institutionId } }
    } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
      whereClause.department = { faculty: { institutionId: authResult.user.institutionId } }
    }

    if (level) {
      whereClause.level = parseInt(level)
    }

    if (search) {
      whereClause.OR = [
        { regNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where: whereClause,
        select: {
          id: true,
          regNumber: true,
          name: true,
          email: true,
          level: true,
          admissionYear: true,
          isSpillover: true,
          isActive: true,
          userId: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              faculty: { select: { id: true, name: true, code: true } },
            },
          },
          _count: {
            select: { studentCourses: { where: { status: { in: ['REGISTERED', 'CARRY_OVER'] } } } },
          },
        },
        orderBy: [{ level: 'asc' }, { regNumber: 'asc' }],
        skip,
        take: limit,
      }),
      db.student.count({ where: whereClause }),
    ])

    return apiResponse({ data: students, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { departmentId, regNumber, name, email, phone, level, admissionYear, isSpillover } = body

    if (!departmentId || !regNumber || !name || !level || !admissionYear) {
      return apiError('Missing required fields')
    }

    // Check if regNumber already exists in this department
    const existing = await db.student.findFirst({
      where: { departmentId, regNumber },
    })

    if (existing) {
      return apiError('Student with this registration number already exists')
    }

    const student = await db.student.create({
      data: {
        departmentId,
        regNumber,
        name,
        email,
        phone,
        level,
        admissionYear,
        isSpillover: isSpillover || false,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    })

    return apiResponse(student, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
