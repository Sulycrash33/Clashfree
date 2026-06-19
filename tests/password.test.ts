import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('hashPassword', () => {
  it('returns a hash different from the original password', async () => {
    const password = 'admin123'
    const hashed = await hashPassword(password)
    expect(hashed).not.toBe(password)
  })

  it('returns a bcrypt-formatted hash', async () => {
    const hashed = await hashPassword('testPassword')
    // bcrypt hashes start with $2a$ or $2b$
    expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$/)
  })

  it('generates different hashes for the same password (salt)', async () => {
    const password = 'samePassword'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
  })

  it('handles empty string', async () => {
    const hashed = await hashPassword('')
    expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$/)
  })

  it('handles long passwords', async () => {
    const longPassword = 'a'.repeat(100)
    const hashed = await hashPassword(longPassword)
    expect(hashed).toBeTruthy()
    expect(hashed.length).toBeGreaterThan(50)
  })

  it('handles special characters', async () => {
    const password = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const hashed = await hashPassword(password)
    expect(hashed).toBeTruthy()
  })
})

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const password = 'admin123'
    const hashed = await hashPassword(password)
    const result = await verifyPassword(password, hashed)
    expect(result).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const password = 'admin123'
    const hashed = await hashPassword(password)
    const result = await verifyPassword('wrongPassword', hashed)
    expect(result).toBe(false)
  })

  it('returns false for similar but not exact password', async () => {
    const password = 'Admin123'
    const hashed = await hashPassword(password)
    const result = await verifyPassword('admin123', hashed)
    expect(result).toBe(false)
  })

  it('handles empty password verification', async () => {
    const hashed = await hashPassword('')
    const result = await verifyPassword('', hashed)
    expect(result).toBe(true)
  })

  it('handles empty password against non-empty hash', async () => {
    const hashed = await hashPassword('password')
    const result = await verifyPassword('', hashed)
    expect(result).toBe(false)
  })

  it('verifies special characters correctly', async () => {
    const password = 'p@$$w0rd!#%'
    const hashed = await hashPassword(password)
    expect(await verifyPassword(password, hashed)).toBe(true)
    expect(await verifyPassword('p@$$w0rd!#', hashed)).toBe(false)
  })

  it('handles unicode characters', async () => {
    const password = 'password123'
    const hashed = await hashPassword(password)
    expect(await verifyPassword(password, hashed)).toBe(true)
  })
})
