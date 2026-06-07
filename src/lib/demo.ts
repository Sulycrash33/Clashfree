// Demo mode utilities - demo mode disabled

export const DEMO_EMAILS: string[] = []

export function isDemoEmail(email?: string | null): boolean {
  return false
}

export function setDemoCookie(): void {}

export function clearDemoCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'demo_mode=1; path=/; max-age=0'
  }
}

export function isDemoCookieSet(): boolean {
  return false
}
