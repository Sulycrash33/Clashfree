import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('departmentId')
  const facultyId = searchParams.get('facultyId')
  const institutionId = searchParams.get('institutionId')
  const level = searchParams.get('level')
  const isShared = searchParams.get('isShared')

  let whereClause: Record<string, unknown> = {}

  if (departmentId) {
    whereClause.departmentId = departmentId
  } else if (facultyId) {
    whereClause.department = { facultyId }
  } else if (institutionId) {
    whereClause.institutionId = institutionId
  } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
    whereClause.institutionId = authResult.user.institutionId
  }

  if (level) {
    whereClause.level = parseInt(level)
  }

  if (isShared !== null && isShared !== undefined) {
    whereClause.isShared = isShared === 'true'
  }

  const courses = await db.course.findMany({
    where: whereClause,
    select: {
      id: true,
      code: true,
      name: true,
      creditUnits: true,
      level: true,
      semester: true,
      isShared: true,
      requiresLab: true,
      maxStudents: true,
      isActive: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          faculty: {
            select: { id: true, name: true, code: true },
          },
        },
      },
      lecturer: {
        select: { id: true, name: true, staffId: true },
      },
      _count: {
        select: { studentCourses: { where: { status: 'REGISTERED' } } },
      },
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  })

  return apiResponse(courses)
})

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const body = await request.json()
  const {
    institutionId,
    departmentId,
    code,
    name,
    creditUnits,
    level,
    semester,
    isShared,
    requiresLab,
    maxStudents,
    description,
    lecturerId,
  } = body

  if (!institutionId || !departmentId || !code || !name || !level) {
    return apiError('Missing required fields')
  }

  if (authResult.user.role !== 'SA' && authResult.user.institutionId !== institutionId) {
    return apiError('Access denied', 403)
  }

  const existing = await db.course.findFirst({
    where: { institutionId, code },
  })

  if (existing) {
    return apiError('Course with this code already exists')
  }

  const course = await db.course.create({
    data: {
      institutionId,
      departmentId,
      code: code.toUpperCase(),
      name,
      creditUnits: creditUnits || 2,
      level,
      semester: semester || 1,
      isShared: isShared || false,
      requiresLab: requiresLab || false,
      maxStudents,
      description,
      lecturerId,
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      lecturer: { select: { id: true, name: true } },
    },
  })

  return apiResponse(course, 201)
}, ['SA', 'IA', 'TO'])
