import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const me = searchParams.get('me') === 'true'

  if (me || authResult.user.role === 'ST') {
    const student = await db.student.findFirst({
      where: { userId: authResult.user.id },
      select: {
        id: true, regNumber: true, name: true, email: true,
        level: true, admissionYear: true, isSpillover: true, isActive: true, userId: true,
        department: {
          select: {
            id: true, name: true, code: true,
            faculty: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { studentCourses: { where: { status: { in: ['CURRENT', 'CARRY_OVER'] } } } } },
      },
    })
    if (!student) return apiError('Student profile not found for this account', 404)
    return apiResponse([student])
  }

  const departmentId = searchParams.get('departmentId')
  const facultyId = searchParams.get('facultyId')
  const institutionId = searchParams.get('institutionId')
  const level = searchParams.get('level')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit

  let whereClause: Record<string, unknown> = {}

  if (departmentId) {
    whereClause.departmentId = departmentId
  } else if (facultyId) {
    whereClause.department = { facultyId }
  } else if (institutionId) {
    whereClause.department = { faculty: { institutionId } }
  } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
    whereClause.department = { faculty: { institutionId: authResult.user.institutionId! } }
  }

  if (level) whereClause.level = parseInt(level)

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
        id: true, regNumber: true, name: true, email: true,
        level: true, admissionYear: true, isSpillover: true, isActive: true, userId: true,
        department: {
          select: {
            id: true, name: true, code: true,
            faculty: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { studentCourses: { where: { status: { in: ['CURRENT', 'CARRY_OVER'] } } } } },
      },
      orderBy: [{ level: 'asc' }, { regNumber: 'asc' }],
      skip,
      take: limit,
    }),
    db.student.count({ where: whereClause }),
  ])

  return apiResponse({ data: students, total, page, limit, totalPages: Math.ceil(total / limit) })
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const { departmentId, regNumber, name, email, phone, level, admissionYear, isSpillover } = body

  if (!departmentId || !regNumber || !name || !level || !admissionYear) {
    return apiError('Missing required fields')
  }

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
}, ['SA', 'IA', 'TO'])
