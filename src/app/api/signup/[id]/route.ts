import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { sendSignupApproved, sendSignupRejected } from '@/lib/email'
import bcrypt from 'bcryptjs'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// PATCH /api/signup/[id] — SA approves or rejects
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as { role?: string }).role !== 'SA') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, rejectionReason } = await req.json() as {
      action: 'approve' | 'reject'
      rejectionReason?: string
    }

    const signup = await prisma.institutionSignup.findUnique({ where: { id: params.id } })
    if (!signup) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (signup.status !== 'PENDING') {
      return NextResponse.json({ error: 'Already processed' }, { status: 409 })
    }

    if (action === 'reject') {
      await prisma.institutionSignup.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          reviewedBy: session.user.email,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || 'Application did not meet requirements.',
        },
      })

      sendSignupRejected({
        to: signup.contactEmail,
        name: signup.contactName,
        institutionName: signup.institutionName,
        reason: rejectionReason || 'Application did not meet requirements.',
      }).catch(console.error)

      return NextResponse.json({ message: 'Application rejected.' })
    }

    // APPROVE: create Institution + IA User
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const [institution, user] = await prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name: signup.institutionName,
          shortName: signup.shortName,
          type: signup.type,
          city: signup.city,
          state: signup.state,
          website: signup.website || null,
          emailDomain: signup.emailDomain || null,
          currentSession: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
          currentSemester: 1,
          isActive: true,
        },
      })

      const u = await tx.user.create({
        data: {
          email: signup.contactEmail,
          passwordHash,
          name: signup.contactName,
          role: 'IA',
          institutionId: inst.id,
          isActive: true,
        },
      })

      await tx.institutionSignup.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          reviewedBy: session!.user!.email,
          reviewedAt: new Date(),
        },
      })

      return [inst, u]
    })

    sendSignupApproved({
      to: signup.contactEmail,
      name: signup.contactName,
      institutionName: signup.institutionName,
      tempPassword,
      loginEmail: signup.contactEmail,
    }).catch(console.error)

    return NextResponse.json({
      message: 'Approved. Institution and IA account created.',
      institutionId: institution.id,
      userId: user.id,
    })
  } catch (err) {
    console.error('[signup PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
