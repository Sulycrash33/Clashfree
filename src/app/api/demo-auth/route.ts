import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'demo_access'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const password = body?.password

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const correctPassword = process.env.DEMO_ACCESS_PASSWORD

  if (!correctPassword) {
    // Misconfigured deployment — fail closed, not open
    return NextResponse.json(
      { error: 'Demo access is not configured. Contact the administrator.' },
      { status: 500 }
    )
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  // Session-only cookie: no maxAge/expires set, so it dies when the browser closes.
  // Value itself is not the raw password — it's a static marker checked by middleware.
  response.cookies.set(COOKIE_NAME, 'granted', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return response
}
