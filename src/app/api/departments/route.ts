import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/departments - List departments
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')
    const institutionId = searchParams.get('institutionId')

    let whereClause: any = {}

    if (facultyId) {
      whereClause.facultyId = facultyId
    } else if (institutionId) {
      whereClause.faculty = { institutionId }
    } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
      whereClause.faculty = { institutionId: authResult.user.institutionId }
    }

    const departments = await db.department.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        hodName: true,
        isActive: true,
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
            institution: {
              select: { id: true, name: true, shortName: true },
            },
          },
        },
        _count: {
          select: {
            courses: true,
            students: true,
            lecturers: true,
          },
        },
      },
      orderBy: [{ faculty: { name: 'asc' } }, { name: 'asc' }],
    })

    return apiResponse(departments)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { facultyId, name, code, hodName } = body

    if (!facultyId || !name || !code) {
      return apiError('Missing required fields')
    }

    // Verify access to this faculty
    const faculty = await db.faculty.findUnique({
      where: { id: facultyId },
      select: { institutionId: true },
    })

    if (!faculty) {
      return apiError('Faculty not found')
    }

    if (authResult.user.role !== 'SA' && authResult.user.institutionId !== faculty.institutionId) {
      return apiError('Access denied', 403)
    }

    // Check if code already exists in this faculty
    const existing = await db.department.findFirst({
      where: { facultyId, code },
    })

    if (existing) {
      return apiError('Department with this code already exists in the faculty')
    }

    const department = await db.department.create({
      data: {
        facultyId,
        name,
        code: code.toUpperCase(),
        hodName,
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return apiResponse(department, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
