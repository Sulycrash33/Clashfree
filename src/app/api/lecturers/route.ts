import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const me = searchParams.get('me') === 'true'

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
})

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const { departmentId, staffId, name, email, phone, rank, specialization, unavailableDays } = body

  if (!departmentId || !staffId || !name || !email) {
    return apiError('Missing required fields')
  }

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
}, ['SA', 'IA', 'TO'])
