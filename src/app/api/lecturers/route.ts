import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

// GET /api/lecturers - List lecturers
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const { searchParams } = new URL(request.url)
    const me = searchParams.get('me') === 'true'

    // LC role: return only their own lecturer record
    if (me || authResult.user.role === 'LC') {
      const lecturer = await db.lecturer.findFirst({
        where: { userId: authResult.user.id },
        select: {
          id: true, staffId: true, name: true, email: true,
          phone: true, rank: true, specialization: true, isActive: true, userId: true,
          department: {
            select: {
              id: true, name: true, code: true,
              faculty: { select: { id: true, name: true, code: true } },
            },
          },
          _count: { select: { courses: true } },
        },
      })
      if (!lecturer) return apiError('Lecturer profile not found for this account', 404)
      return apiResponse([lecturer])
    }

    const departmentId = searchParams.get('departmentId')
    const facultyId = searchParams.get('facultyId')
    const institutionId = searchParams.get('institutionId')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (departmentId) {
      if (authResult.user.role !== 'SA') {
        const dept = await db.department.findUnique({
          where: { id: departmentId },
          select: { faculty: { select: { institutionId: true } } },
        })
        if (!dept || dept.faculty.institutionId !== authResult.user.institutionId) {
          return apiError('Access denied', 403)
        }
      }
      whereClause.departmentId = departmentId
    } else if (facultyId) {
      if (authResult.user.role !== 'SA') {
        const fac = await db.faculty.findUnique({ where: { id: facultyId }, select: { institutionId: true } })
        if (!fac || fac.institutionId !== authResult.user.institutionId) {
          return apiError('Access denied', 403)
        }
      }
      whereClause.department = { facultyId }
    } else if (institutionId) {
      if (authResult.user.role !== 'SA' && authResult.user.institutionId !== institutionId) {
        return apiError('Access denied', 403)
      }
      whereClause.department = { faculty: { institutionId } }
    } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
      whereClause.department = { faculty: { institutionId: authResult.user.institutionId! } }
    }

    if (search) {
      whereClause.OR = [
        { staffId: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const lecturers = await db.lecturer.findMany({
      where: whereClause,
      select: {
        id: true,
        staffId: true,
        name: true,
        email: true,
        phone: true,
        rank: true,
        specialization: true,
        isActive: true,
        userId: true,
        unavailableDays: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: { select: { id: true, name: true, code: true } },
          },
        },
        _count: {
          select: { courses: true, invigilations: true },
        },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    })

    return apiResponse(lecturers)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/lecturers - Create new lecturer
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) {
      return apiError(authResult.error, authResult.status)
    }

    const body = await request.json()
    const { departmentId, staffId, name, email, phone, rank, specialization, unavailableDays } = body

    if (!departmentId || !staffId || !name || !email) {
      return apiError('Missing required fields')
    }

    // Check if staffId already exists in this department
    const existing = await db.lecturer.findFirst({
      where: { departmentId, staffId },
    })

    if (existing) {
      return apiError('Lecturer with this staff ID already exists in this department')
    }

    const lecturer = await db.lecturer.create({
      data: {
        departmentId,
        staffId,
        name,
        email,
        phone,
        rank,
        specialization,
        unavailableDays: unavailableDays ? JSON.stringify(unavailableDays) : null,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    })

    return apiResponse(lecturer, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
