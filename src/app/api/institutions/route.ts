import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async () => {
  const institutions = await db.institution.findMany({
    select: {
      id: true,
      name: true,
      shortName: true,
      type: true,
      city: true,
      state: true,
      currentSession: true,
      currentSemester: true,
      isActive: true,
      _count: {
        select: {
          faculties: true,
          courses: true,
          users: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return apiResponse(institutions)
}, 'SA')

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const { name, shortName, type, city, state, country, website, emailDomain, currentSession } = body

  if (!name || !shortName || !type || !city || !state || !currentSession) {
    return apiError('Missing required fields')
  }

  const existing = await db.institution.findUnique({
    where: { shortName },
  })

  if (existing) {
    return apiError('Institution with this short name already exists')
  }

  const institution = await db.institution.create({
    data: {
      name,
      shortName,
      type,
      city,
      state,
      country: country || 'Nigeria',
      website,
      emailDomain,
      currentSession,
    },
  })

  return apiResponse(institution, 201)
}, 'SA')
