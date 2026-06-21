import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const facultyId = searchParams.get('facultyId')
  const institutionId = searchParams.get('institutionId')

  let whereClause: Record<string, unknown> = {}

  if (facultyId) {
    whereClause.facultyId = facultyId
  } else if (institutionId) {
    whereClause.faculty = { institutionId }
  } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
    whereClause.faculty = { institutionId: authResult.user.institutionId! }
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
})

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const body = await request.json()
  const { facultyId, name, code, hodName } = body

  if (!facultyId || !name || !code) {
    return apiError('Missing required fields')
  }

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
}, ['SA', 'IA', 'TO'])
