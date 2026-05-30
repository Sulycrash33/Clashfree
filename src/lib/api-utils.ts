import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

type RoleCheck = UserRole | UserRole[]

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 }
  }
  return { user: session.user }
}

export async function requireRole(roles: RoleCheck) {
  const authResult = await requireAuth()
  if ('error' in authResult) return authResult

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  if (!allowedRoles.includes(authResult.user.role)) {
    return { error: 'Forbidden', status: 403 }
  }

  return authResult
}

export async function requireSuperAdmin() {
  return requireRole('SA')
}

export async function requireInstitutionAdmin() {
  return requireRole(['SA', 'IA'])
}

export async function requireTimetableOfficer() {
  return requireRole(['SA', 'IA', 'TO'])
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  if (error instanceof Error) {
    return apiError(error.message, 500)
  }
  return apiError('Internal server error', 500)
}
