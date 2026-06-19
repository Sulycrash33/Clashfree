import { db } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-utils'
import { withAuth } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

export const GET = withAuth(async (request: NextRequest, authResult) => {
  const { searchParams } = new URL(request.url)
  const institutionId = searchParams.get('institutionId')
  const facultyId = searchParams.get('facultyId')
  const type = searchParams.get('type')
  const minCapacity = searchParams.get('minCapacity')

  let whereClause: Record<string, unknown> = {}

  if (institutionId) {
    whereClause.institutionId = institutionId
  } else if (authResult.user.role !== 'SA' && authResult.user.institutionId) {
    whereClause.institutionId = authResult.user.institutionId
  }

  if (facultyId) {
    whereClause.facultyId = facultyId
  }

  if (type) {
    whereClause.type = type
  }

  if (minCapacity) {
    whereClause.capacity = { gte: parseInt(minCapacity) }
  }

  const rooms = await db.room.findMany({
    where: whereClause,
    select: {
      id: true,
      code: true,
      name: true,
      building: true,
      floor: true,
      capacity: true,
      type: true,
      hasProjector: true,
      hasAC: true,
      hasComputers: true,
      isAccessible: true,
      isActive: true,
      faculty: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { examSlots: true, lectureSlots: true },
      },
    },
    orderBy: [{ building: 'asc' }, { code: 'asc' }],
  })

  return apiResponse(rooms)
})

export const POST = withAuth(async (request: NextRequest, authResult) => {
  const body = await request.json()
  const {
    institutionId,
    facultyId,
    code,
    name,
    building,
    floor,
    capacity,
    type,
    hasProjector,
    hasAC,
    hasComputers,
    labEquipment,
    isAccessible,
    notes,
  } = body

  if (!institutionId || !code || !name || !capacity || !type) {
    return apiError('Missing required fields')
  }

  if (authResult.user.role !== 'SA' && authResult.user.institutionId !== institutionId) {
    return apiError('Access denied', 403)
  }

  const existing = await db.room.findFirst({
    where: { institutionId, code },
  })

  if (existing) {
    return apiError('Room with this code already exists')
  }

  const room = await db.room.create({
    data: {
      institutionId,
      facultyId,
      code: code.toUpperCase(),
      name,
      building,
      floor,
      capacity,
      type,
      hasProjector: hasProjector || false,
      hasAC: hasAC || false,
      hasComputers: hasComputers || false,
      labEquipment: labEquipment ? JSON.stringify(labEquipment) : null,
      isAccessible: isAccessible !== false,
      notes,
    },
    include: {
      faculty: { select: { id: true, name: true, code: true } },
    },
  })

  return apiResponse(room, 201)
}, ['SA', 'IA', 'TO'])
