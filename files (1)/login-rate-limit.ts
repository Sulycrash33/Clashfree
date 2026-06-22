// Login brute-force protection: per-account sliding-window lockout.
//
// Keyed by email (not IP) because campus networks commonly put hundreds of
// students behind one shared/NAT IP — an IP-based limit would lock out an
// entire hall of residence over one student's typos. Keying by email means
// only the targeted account locks, which is also the correct threat model
// for credential-stuffing/brute-force against a specific user.
//
// In-memory, resets on cold start — same accepted tradeoff as the API-key
// limiter in api-key.ts. Swap for Redis/Upstash if this needs to survive
// across serverless instances at scale.

const WINDOW_MS = 15 * 60_000 // 15 minutes
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60_000 // 15 minutes

interface AttemptRecord {
  failures: number[] // timestamps of failed attempts within the window
  lockedUntil?: number
}

const attemptLog = new Map<string, AttemptRecord>()

function normalizeKey(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Call BEFORE attempting password verification.
 * Returns whether the account is currently locked out.
 */
export function checkLoginLockout(email: string): { allowed: boolean; retryAfterSeconds?: number } {
  const key = normalizeKey(email)
  const record = attemptLog.get(key)
  if (!record) return { allowed: true }

  const now = Date.now()

  if (record.lockedUntil && record.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000) }
  }

  // Lockout expired — clear it so the next failure starts a fresh window.
  if (record.lockedUntil && record.lockedUntil <= now) {
    attemptLog.delete(key)
  }

  return { allowed: true }
}

/**
 * Call AFTER a failed password check. May trigger a lockout.
 */
export function recordLoginFailure(email: string): void {
  const key = normalizeKey(email)
  const now = Date.now()
  const record = attemptLog.get(key) || { failures: [] }

  const recentFailures = record.failures.filter((t) => now - t < WINDOW_MS)
  recentFailures.push(now)

  if (recentFailures.length >= MAX_ATTEMPTS) {
    attemptLog.set(key, { failures: recentFailures, lockedUntil: now + LOCKOUT_MS })
    return
  }

  attemptLog.set(key, { failures: recentFailures })
}

/**
 * Call AFTER a successful login. Clears any failure history for the account.
 */
export function clearLoginFailures(email: string): void {
  attemptLog.delete(normalizeKey(email))
}
