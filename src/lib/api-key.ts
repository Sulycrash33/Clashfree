import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface ApiKeyContext {
  institutionId: string
  institutionName: string
  keyId: string
}

/**
 * Validates an API key from the Authorization header.
 * Expected format: Bearer cfk_<key>
 * 
 * Returns the institution context if valid, or an error object.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiKeyContext | { error: string; status: number }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer cfk_<your_key>', status: 401 }
  }

  const token = authHeader.slice(7) // Remove "Bearer "

  if (!token.startsWith('cfk_')) {
    return { error: 'Invalid API key format. Keys must start with cfk_', status: 401 }
  }

  try {
    const apiKey = await db.apiKey.findUnique({
      where: { key: token },
      include: { institution: { select: { id: true, name: true } } },
    })

    if (!apiKey) {
      return { error: 'Invalid API key', status: 401 }
    }

    if (!apiKey.active) {
      return { error: 'API key is disabled', status: 403 }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { error: 'API key has expired', status: 403 }
    }

    // Update last used timestamp
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })

    return {
      institutionId: apiKey.institution.id,
      institutionName: apiKey.institution.name,
      keyId: apiKey.id,
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { error: 'Internal authentication error', status: 500 }
  }
}
