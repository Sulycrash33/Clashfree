import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('room', {
  include: {
    faculty: { select: { name: true, code: true } },
  },
  notFoundMessage: 'Room not found',
})

export const PUT = createUpdateByIdHandler('room', {
  allowedFields: ['code', 'name', 'building', 'capacity', 'type', 'hasProjector', 'hasAC', 'hasComputers', 'isAccessible', 'facultyId', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('room')
