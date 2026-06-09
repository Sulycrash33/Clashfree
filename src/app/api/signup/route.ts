import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { sendSignupConfirmation } from '@/lib/email'
import { z } from 'zod'

const SignupSchema = z.object({
  institutionName: z.string().min(3).max(200),
  shortName: z.string().min(2).max(20).toUpperCase(),
  type: z.enum([
    'FEDERAL_UNI', 'STATE_UNI', 'PRIVATE_UNI', 'POLYTECHNIC',
    'MONOTECHNIC', 'COLLEGE_OF_EDUCATION', 'SCHOOL_OF_NURSING', 'HEALTH_TECH'
  ]),
  city: z.string().min(2),
  state: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
  emailDomain: z.string().optional(),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  message: z.string().max(1000).optional(),
})

// POST /api/signup — public endpoint, no auth required
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = SignupSchema.parse(body)

    // Duplicate check: same email or same shortName pending/approved
    const existing = await prisma.institutionSignup.findFirst({
      where: {
        OR: [
          { contactEmail: data.contactEmail, status: { in: ['PENDING', 'APPROVED'] } },
          { shortName: data.shortName, status: { in: ['PENDING', 'APPROVED'] } },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email or institution code already exists.' },
        { status: 409 }
      )
    }

    const signup = await prisma.institutionSignup.create({
      data: {
        ...data,
        website: data.website || null,
        emailDomain: data.emailDomain || null,
        contactPhone: data.contactPhone || null,
        message: data.message || null,
      },
    })

    // Fire confirmation email — non-blocking
    sendSignupConfirmation({
      to: data.contactEmail,
      name: data.contactName,
      institutionName: data.institutionName,
    }).catch(console.error)

    return NextResponse.json({ id: signup.id, message: 'Application submitted successfully.' }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
    }
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET /api/signup — SA only, list all signups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined

    const signups = await prisma.institutionSignup.findMany({
      where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(signups)
  } catch (err) {
    console.error('[signup GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
