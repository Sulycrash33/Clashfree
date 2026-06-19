import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const institutionId = searchParams.get('institutionId')

  const whereClause =
    authResult.user.role === 'SA' && institutionId
      ? { institutionId }
      : authResult.user.role !== 'SA' && authResult.user.institutionId
        ? { institutionId: authResult.user.institutionId! }
        : authResult.user.role === 'SA'
          ? {}
          : { institutionId: 'none' }

  const faculties = await db.faculty.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      code: true,
      deanName: true,
      isActive: true,
      institution: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
      _count: {
        select: {
          departments: true,
          courses: true,
        },
      },
    },
    orderBy: [{ institution: { name: 'asc' } }, { name: 'asc' }],
  })

  return apiResponse(faculties)
})

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const body = await request.json()
  const { institutionId, name, code, deanName, description } = body

  const targetInstitutionId =
    authResult.user.role === 'SA' ? institutionId : authResult.user.institutionId

  if (!targetInstitutionId || !name || !code) {
    return apiError('Missing required fields')
  }

  const existing = await db.faculty.findFirst({
    where: { institutionId: targetInstitutionId, code },
  })

  if (existing) {
    return apiError('Faculty with this code already exists in the institution')
  }

  const faculty = await db.faculty.create({
    data: {
      institutionId: targetInstitutionId,
      name,
      code: code.toUpperCase(),
      deanName,
      description,
    },
    include: {
      institution: {
        select: { id: true, name: true, shortName: true },
      },
    },
  })

  return apiResponse(faculty, 201)
}, ['SA', 'IA'])
