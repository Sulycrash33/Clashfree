import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('lecturer', {
  include: {
    department: { select: { name: true, code: true } },
    _count: { select: { courses: true, invigilations: true } },
  },
  notFoundMessage: 'Lecturer not found',
})

export const PUT = createUpdateByIdHandler('lecturer', {
  allowedFields: ['staffId', 'name', 'email', 'phone', 'rank', 'specialization', 'departmentId', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('lecturer')
