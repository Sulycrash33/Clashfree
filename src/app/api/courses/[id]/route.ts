import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('course', {
  include: {
    department: { select: { name: true, code: true } },
    lecturer: { select: { name: true } },
    _count: { select: { studentCourses: true } },
  },
  notFoundMessage: 'Course not found',
})

export const PUT = createUpdateByIdHandler('course', {
  allowedFields: ['name', 'code', 'creditUnits', 'level', 'semester', 'departmentId', 'isShared', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('course')
