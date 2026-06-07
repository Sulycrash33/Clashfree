/**
 * ClashFree - SuperAdmin Seed
 * Creates only the SA user so the platform is accessible.
 * Run: bun scripts/seed-superadmin.ts
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 ClashFree - Seeding SuperAdmin...')

  const passwordHash = await hash('admin123', 12)

  const sa = await prisma.user.upsert({
    where: { email: 'admin@clashfree.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'admin@clashfree.com',
      passwordHash,
      name: 'Super Admin',
      role: 'SA',
      isActive: true,
    },
  })

  console.log('✅ SuperAdmin ready:', sa.email)
  console.log('   Password: admin123')
  console.log('   Role: SA')
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
