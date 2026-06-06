// Demo mode utilities for FEDKO investor showcase

export const DEMO_EMAILS = [
  'admin@clashfree.com',
  'admin@fedko.edu.ng',
  'officer@fedko.edu.ng',
  'lecturer@fedko.edu.ng',
  'student@fedko.edu.ng',
]

/**
 * Check if the given email belongs to a FEDKO demo account
 */
export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false
  return DEMO_EMAILS.includes(email)
}

/**
 * Set the demo mode cookie when entering through FEDKO demo
 */
export function setDemoCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'demo_mode=1; path=/; max-age=86400; SameSite=Lax'
  }
}

/**
 * Clear the demo mode cookie (e.g., on sign out)
 */
export function clearDemoCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'demo_mode=1; path=/; max-age=0'
  }
}

/**
 * Check if demo mode cookie is set
 */
export function isDemoCookieSet(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('demo_mode=1'))
}
