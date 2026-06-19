import {
  createGetByIdHandler,
  createUpdateByIdHandler,
  createDeleteByIdHandler,
} from '@/lib/api-helpers'

export const GET = createGetByIdHandler('student', {
  include: {
    department: { select: { name: true, code: true, faculty: { select: { code: true } } } },
    _count: { select: { studentCourses: true } },
  },
  notFoundMessage: 'Student not found',
})

export const PUT = createUpdateByIdHandler('student', {
  allowedFields: ['regNumber', 'name', 'email', 'phone', 'level', 'admissionYear', 'departmentId', 'isSpillover', 'isActive'],
})

export const DELETE = createDeleteByIdHandler('student')
