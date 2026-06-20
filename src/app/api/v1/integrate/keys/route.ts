import { NextRequest, NextResponse } from 'next/server'
import { apiError, requireRole } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { hashApiKey } from '@/lib/api-key'

/**
 * GET /api/v1/integrate/keys
 * 
 * List API keys for the current user's institution.
 * Requires IA or SA role.
 */
export async function GET() {
  const authResult = await requireRole(['SA', 'IA'])
  if ('error' in authResult) {
    return apiError(authResult.error, authResult.status)
  }

  const { user } = authResult

  if (!user.institutionId && user.role !== 'SA') {
    return apiError('No institution context', 400)
  }

  const where = user.role === 'SA' ? {} : { institutionId: user.institutionId! }

  const keys = await db.apiKey.findMany({
    where,
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      active: true,
      scopes: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      institution: { select: { name: true, shortName: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // keyPrefix already only holds the first 12 chars — safe to display as-is
  const masked = keys.map(k => ({
    ...k,
    key: `${k.keyPrefix}...`,
  }))

  return NextResponse.json(masked)
}

/**
 * POST /api/v1/integrate/keys
 * 
 * Create a new API key for the institution.
 * Requires IA or SA role.
 * 
 * Body:
 * {
 *   name: string                     // Label for the key
 *   scopes?: string                  // Comma-separated (default: "generate,validate,export")
 *   expiresInDays?: number           // Days until expiration (null = no expiry)
 * }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireRole(['SA', 'IA'])
  if ('error' in authResult) {
    return apiError(authResult.error, authResult.status)
  }

  const { user } = authResult

  if (!user.institutionId) {
    return apiError('No institution context. Cannot create API key without an institution.', 400)
  }

  try {
    const body = await request.json()
    const { name, scopes, expiresInDays } = body

    if (!name || typeof name !== 'string') {
      return apiError('Name is required')
    }

    // Generate a secure API key
    const keyBytes = randomBytes(32)
    const rawKey = `cfk_${keyBytes.toString('base64url')}`
    const keyHash = hashApiKey(rawKey)
    const keyPrefix = rawKey.slice(0, 12)

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const apiKey = await db.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        institutionId: user.institutionId,
        createdById: user.id,
        scopes: scopes || 'generate,validate,export',
        expiresAt,
      },
    })

    // Return the full raw key only on creation — it is never stored or
    // shown again. The server only ever retains its SHA-256 hash.
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      warning: 'Store this key securely. It will not be shown again.',
    }, { status: 201 })
  } catch (error) {
    console.error('[API Keys] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/integrate/keys
 * 
 * Revoke (deactivate) an API key.
 * Body: { keyId: string }
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireRole(['SA', 'IA'])
  if ('error' in authResult) {
    return apiError(authResult.error, authResult.status)
  }

  const { user } = authResult

  try {
    const body = await request.json()
    const { keyId } = body

    if (!keyId) {
      return apiError('keyId is required')
    }

    const apiKey = await db.apiKey.findUnique({
      where: { id: keyId },
      select: { institutionId: true },
    })

    if (!apiKey) {
      return apiError('API key not found', 404)
    }

    // SA can revoke any; IA can only revoke own institution's
    if (user.role !== 'SA' && apiKey.institutionId !== user.institutionId) {
      return apiError('Forbidden', 403)
    }

    await db.apiKey.update({
      where: { id: keyId },
      data: { active: false },
    })

    return NextResponse.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    console.error('[API Keys] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
