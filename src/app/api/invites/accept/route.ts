import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const AcceptSchema = z.object({
  token: z.string(),
  name: z.string().min(2),
  password: z.string().min(8),
})

// POST /api/invites/accept — public, no auth
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, name, password } = AcceptSchema.parse(body)

    const invite = await prisma.inviteToken.findUnique({ where: { token } })

    if (!invite) return NextResponse.json({ error: 'Invalid invite link.' }, { status: 404 })
    if (invite.usedAt) return NextResponse.json({ error: 'This invite has already been used.' }, { status: 410 })
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'This invite has expired.' }, { status: 410 })

    // Check no existing user
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } })
    if (existingUser) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          name,
          role: invite.role,
          institutionId: invite.institutionId || null,
          isActive: true,
        },
      })
      await tx.inviteToken.update({
        where: { token },
        data: { usedAt: new Date() },
      })
    })

    return NextResponse.json({ message: 'Account created. You can now log in.' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('[invites/accept]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/invites/accept?token=xxx — validate token before showing form
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const invite = await prisma.inviteToken.findUnique({ where: { token } })
  if (!invite) return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ valid: false, error: 'Already used' })
  if (invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: 'Expired' })

  // Return safe info for the accept form
  let institutionName = null
  if (invite.institutionId) {
    const inst = await prisma.institution.findUnique({ where: { id: invite.institutionId } })
    institutionName = inst?.name || null
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    role: invite.role,
    institutionName,
    expiresAt: invite.expiresAt,
  })
}
