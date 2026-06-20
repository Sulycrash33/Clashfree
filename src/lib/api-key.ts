import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export interface ApiKeyContext {
  institutionId: string
  institutionName: string
  keyId: string
}

/**
 * Hashes a raw API key for storage/lookup. We never store or query the raw
 * cfk_ token — only its SHA-256 hash. The raw value is shown to the user
 * exactly once, at creation time, and is unrecoverable after that.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

// Simple in-memory sliding-window rate limiter, per API key.
// Resets on cold start — acceptable for this scale; swap for Redis/Upstash
// if traffic grows enough that multi-instance consistency matters.
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests/min per key
const requestLog = new Map<string, number[]>()

function checkRateLimit(keyId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const timestamps = (requestLog.get(keyId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = timestamps[0]
    const retryAfterSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestInWindow)) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  timestamps.push(now)
  requestLog.set(keyId, timestamps)
  return { allowed: true }
}

/**
 * Validates an API key from the Authorization header.
 * Expected format: Bearer cfk_<key>
 * 
 * Returns the institution context if valid, or an error object.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiKeyContext | { error: string; status: number; retryAfterSeconds?: number }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer cfk_<your_key>', status: 401 }
  }

  const token = authHeader.slice(7) // Remove "Bearer "

  if (!token.startsWith('cfk_')) {
    return { error: 'Invalid API key format. Keys must start with cfk_', status: 401 }
  }

  try {
    const keyHash = hashApiKey(token)

    const apiKey = await db.apiKey.findUnique({
      where: { keyHash },
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

    const rateLimit = checkRateLimit(apiKey.id)
    if (!rateLimit.allowed) {
      return {
        error: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
        status: 429,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      }
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
