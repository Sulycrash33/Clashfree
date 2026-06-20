import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { compare, hash } from 'bcryptjs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current and new password are required' },
      { status: 400 }
    )
  }

  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    return NextResponse.json(
      { error: 'New password must be at least 10 characters' },
      { status: 400 }
    )
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const currentPasswordMatch = await compare(currentPassword, user.passwordHash)

  if (!currentPasswordMatch) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 }
    )
  }

  const sameAsOld = await compare(newPassword, user.passwordHash)
  if (sameAsOld) {
    return NextResponse.json(
      { error: 'New password must be different from current password' },
      { status: 400 }
    )
  }

  const newPasswordHash = await hash(newPassword, 12)

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  })

  return NextResponse.json({ success: true })
}
