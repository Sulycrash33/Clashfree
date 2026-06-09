/**
 * Run this once to apply the signup/invite tables:
 * npx ts-node prisma/run-migration.ts
 * OR paste the SQL from prisma/migrations/20260608_signup_invite/migration.sql
 * directly into your Neon console.
 */
import { prisma } from '../src/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const sql = readFileSync(
    join(__dirname, 'migrations/20260608_signup_invite/migration.sql'),
    'utf-8'
  )
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt)
      console.log('✅', stmt.slice(0, 60))
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('already exists')) {
        console.log('⏭ Already exists:', stmt.slice(0, 60))
      } else {
        console.error('❌', stmt.slice(0, 60), e)
      }
    }
  }
  await prisma.$disconnect()
}
main()
