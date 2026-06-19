import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('department', {
  include: {
    faculty: { select: { name: true, code: true } },
    _count: { select: { students: true, lecturers: true, courses: true } },
  },
  notFoundMessage: 'Department not found',
})

export const PUT = createUpdateByIdHandler('department', {
  allowedFields: ['name', 'code', 'hodName', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('department')
