import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth, requireRole } from '@/lib/api-utils'
import { UserRole } from '@/types/enums'

type AuthSuccess = { user: { id: string; email: string; name: string; role: 'SA' | 'IA' | 'TO' | 'LC' | 'ST'; institutionId?: string; facultyId?: string } }
type RouteContext = { params: Promise<{ id: string }> }

type AuthenticatedHandler = (
  request: NextRequest,
  authResult: AuthSuccess,
) => Promise<NextResponse>

type AuthenticatedIdHandler = (
  request: NextRequest,
  authResult: AuthSuccess,
  id: string,
) => Promise<NextResponse>

export function withAuth(
  handler: AuthenticatedHandler,
  roles?: UserRole | UserRole[],
) {
  return async (request: NextRequest) => {
    try {
      const authResult = roles
        ? await requireRole(Array.isArray(roles) ? roles : [roles])
        : await requireAuth()
      if ('error' in authResult) {
        return apiError(authResult.error, authResult.status)
      }
      return await handler(request, authResult)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export function withAuthAndId(
  handler: AuthenticatedIdHandler,
  roles?: UserRole | UserRole[],
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const authResult = roles
        ? await requireRole(Array.isArray(roles) ? roles : [roles])
        : await requireAuth()
      if ('error' in authResult) {
        return apiError(authResult.error, authResult.status)
      }
      const { id } = await context.params
      return await handler(request, authResult, id)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

type PrismaModel = keyof typeof db & string

type FindUniqueArgs = {
  where: { id: string }
  include?: Record<string, unknown>
  select?: Record<string, unknown>
}

function getDelegate(model: PrismaModel) {
  return db[model] as {
    findUnique: (args: FindUniqueArgs) => Promise<unknown>
    update: (args: { where: { id: string }; data: Record<string, unknown>; select?: Record<string, unknown> }) => Promise<unknown>
    delete: (args: { where: { id: string } }) => Promise<unknown>
  }
}

export function createGetByIdHandler(
  model: PrismaModel,
  options: {
    include?: Record<string, unknown>
    notFoundMessage?: string
    roles?: UserRole | UserRole[]
  } = {},
) {
  const { include, notFoundMessage, roles } = options
  return withAuthAndId(async (_request, _authResult, id) => {
    const delegate = getDelegate(model)
    const record = await delegate.findUnique({
      where: { id },
      ...(include ? { include } : {}),
    })
    if (!record) return apiError(notFoundMessage || `${model.charAt(0).toUpperCase() + model.slice(1)} not found`, 404)
    return apiResponse(record)
  }, roles)
}

export function createUpdateByIdHandler(
  model: PrismaModel,
  options: {
    allowedFields: string[]
    select?: Record<string, unknown>
    roles?: UserRole | UserRole[]
  },
) {
  const { allowedFields, select, roles } = options
  return withAuthAndId(async (request, _authResult, id) => {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field]
    }
    const delegate = getDelegate(model)
    const record = await delegate.update({
      where: { id },
      data,
      ...(select ? { select } : {}),
    })
    return apiResponse(record)
  }, roles)
}

export function createDeleteByIdHandler(
  model: PrismaModel,
  options: {
    roles?: UserRole | UserRole[]
  } = {},
) {
  const { roles } = options
  return withAuthAndId(async (_request, _authResult, id) => {
    const delegate = getDelegate(model)
    await delegate.delete({ where: { id } })
    return apiResponse({ success: true })
  }, roles)
}
