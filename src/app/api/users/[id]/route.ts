import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('user', {
  include: {
    institution: { select: { name: true, shortName: true } },
    faculty: { select: { name: true, code: true } },
  },
  notFoundMessage: 'User not found',
  roles: 'SA',
})

export const PUT = createUpdateByIdHandler('user', {
  allowedFields: ['name', 'email', 'role', 'institutionId', 'facultyId', 'isActive'],
  select: { id: true, email: true, name: true, role: true, isActive: true },
  roles: 'SA',
})

export const DELETE = createDeleteByIdHandler('user', {
  roles: 'SA',
})
