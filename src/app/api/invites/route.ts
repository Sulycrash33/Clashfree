import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInviteEmail } from '@/lib/email'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['IA', 'TO', 'LC', 'ST']),
  institutionId: z.string().optional(),
})

// POST /api/invites — SA or IA creates invite
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string; id?: string; institutionId?: string } | undefined
    if (!session?.user || !['SA', 'IA'].includes(sessionUser?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = InviteSchema.parse(body)

    // IA can only invite TO/LC/ST for their own institution
    if (sessionUser?.role === 'IA') {
      if (!['TO', 'LC', 'ST'].includes(data.role)) {
        return NextResponse.json({ error: 'IA can only invite TO, LC, or ST roles' }, { status: 403 })
      }
      data.institutionId = sessionUser.institutionId
    }

    // Check institution exists if provided
    if (data.institutionId) {
      const inst = await prisma.institution.findUnique({ where: { id: data.institutionId } })
      if (!inst) return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    // Check for existing active invite
    const existing = await prisma.inviteToken.findFirst({
      where: {
        email: data.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'Active invite already exists for this email.' }, { status: 409 })
    }

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Get institution name for email
    let institutionName = 'ClashFree'
    if (data.institutionId) {
      const inst = await prisma.institution.findUnique({ where: { id: data.institutionId } })
      institutionName = inst?.name || 'ClashFree'
    }

    await prisma.inviteToken.create({
      data: {
        token,
        email: data.email,
        role: data.role as 'IA' | 'TO' | 'LC' | 'ST',
        institutionId: data.institutionId || null,
        invitedBy: sessionUser?.id || 'system',
        expiresAt,
      },
    })

    await sendInviteEmail({
      to: data.email,
      name: data.name,
      role: data.role,
      institutionName,
      token,
    })

    return NextResponse.json({ message: 'Invite sent.', expiresAt }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('[invites POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/invites — list invites (SA sees all, IA sees own institution)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { role?: string; institutionId?: string } | undefined
    if (!session?.user || !['SA', 'IA'].includes(sessionUser?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where = sessionUser?.role === 'IA'
      ? { institutionId: sessionUser.institutionId }
      : {}

    const invites = await prisma.inviteToken.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(invites)
  } catch (err) {
    console.error('[invites GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
