import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('faculty', {
  include: {
    institution: { select: { name: true, shortName: true } },
    _count: { select: { departments: true, users: true } },
  },
  notFoundMessage: 'Faculty not found',
})

export const PUT = createUpdateByIdHandler('faculty', {
  allowedFields: ['name', 'code', 'description', 'deanName', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('faculty')
