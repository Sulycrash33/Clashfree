import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('institution', {
  include: {
    _count: { select: { faculties: true, courses: true, users: true, rooms: true } },
  },
  notFoundMessage: 'Institution not found',
  roles: 'SA',
})

export const PUT = createUpdateByIdHandler('institution', {
  allowedFields: ['name', 'shortName', 'type', 'city', 'state', 'country', 'currentSession', 'currentSemester', 'isActive'],
  roles: 'SA',
})

export const DELETE = createDeleteByIdHandler('institution', {
  roles: 'SA',
})
