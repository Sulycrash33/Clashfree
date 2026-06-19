import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types/enums'

type RoleCheck = UserRole | UserRole[]

// Discriminated union so TypeScript narrows correctly in every route
type AuthError = { error: string; status: 401 | 403 }
type AuthSuccess = { user: { id: string; email: string; name: string; role: 'SA' | 'IA' | 'TO' | 'LC' | 'ST'; institutionId?: string; facultyId?: string } }
type AuthResult = AuthError | AuthSuccess

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession()
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 }
  }
  return { user: session.user }
}

export async function requireRole(roles: RoleCheck): Promise<AuthResult> {
  const authResult = await requireAuth()
  if ('error' in authResult) return authResult

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  if (!allowedRoles.includes(authResult.user.role as UserRole)) {
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

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Handle Prisma known request errors (e.g. unique constraint violations, foreign key failures)
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'clientVersion' in error
  ) {
    const prismaError = error as { code: string; meta?: { target?: string[] | string; cause?: string } }
    switch (prismaError.code) {
      case 'P2002':
        return apiError(
          `A record with this ${Array.isArray(prismaError.meta?.target) ? prismaError.meta.target.join(', ') : 'value'} already exists`,
          409
        )
      case 'P2025':
        return apiError('Record not found', 404)
      case 'P2003':
        return apiError('Cannot perform this action due to related records', 409)
      default:
        return apiError('Database error', 500)
    }
  }

  if (error instanceof Error) {
    return apiError(error.message, 500)
  }
  return apiError('Internal server error', 500)
}

/**
 * Type-safe guard for institutionId.
 * SA users have no institutionId — always check before using in DB queries.
 */
export function requireInstitutionId(id: string | undefined | null): string | null {
  return id ?? null
}

/**
 * Non-null assertion for institutionId — use only after confirming non-SA role.
 */
export function assertInstitutionId(id: string | undefined | null): { error: string; status: 400 } | string {
  if (!id) return { error: 'Institution context required', status: 400 }
  return id
}
