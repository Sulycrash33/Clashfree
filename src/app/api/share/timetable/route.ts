import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

/**
 * POST /api/share/timetable
 * Generates a shareable timetable link + WhatsApp URL.
 *
 * Body:
 *   type: 'student' | 'department' | 'exam'
 *   targetId: string        (studentId | departmentId | examPeriodId)
 *   sendWhatsApp?: boolean
 *   phone?: string          (required if sendWhatsApp=true and type='student')
 *   timetableId?: string    (optional — for lecture timetables)
 *
 * Returns:
 *   shareUrl            — direct link to the timetable
 *   whatsappUrl         — wa.me link with pre-filled message (phone required)
 *   whatsappBroadcastUrl — api.whatsapp.com link (no phone — user forwards manually)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const institutionId = authResult.user.institutionId

    const body = await request.json()
    const { type, targetId, sendWhatsApp = false, phone, timetableId } = body

    if (!type || !targetId) return apiError('type and targetId are required')
    if (!['student', 'department', 'exam'].includes(type)) {
      return apiError('type must be: student | department | exam')
    }

    const baseUrl = process.env.NEXTAUTH_URL ||
      `https://${process.env.VERCEL_URL || 'clashfree.vercel.app'}`

    let shareUrl = ''
    let recipientName = ''
    let recipientPhone = phone || ''
    let timetableLabel = ''

    if (type === 'student') {
      const student = await db.student.findFirst({
        where: {
          id: targetId,
          department: { faculty: { institutionId: institutionId! } },
        },
        select: {
          id: true, name: true, regNumber: true, phone: true,
          department: { select: { code: true, name: true } },
        },
      })
      if (!student) return apiError('Student not found', 404)
      recipientName = student.name
      recipientPhone = phone || student.phone || ''
      timetableLabel = `${student.name}'s Timetable (${student.regNumber})`
      shareUrl = `${baseUrl}/student/timetable?studentId=${targetId}${timetableId ? `&timetableId=${timetableId}` : ''}`

    } else if (type === 'department') {
      const dept = await db.department.findFirst({
        where: {
          id: targetId,
          faculty: { institutionId: institutionId! },
        },
        select: { id: true, name: true, code: true },
      })
      if (!dept) return apiError('Department not found', 404)
      recipientName = dept.name
      timetableLabel = `${dept.code} Department Timetable`
      shareUrl = `${baseUrl}/timetable/department/${targetId}${timetableId ? `?timetableId=${timetableId}` : ''}`

    } else if (type === 'exam') {
      const period = await db.examPeriod.findFirst({
        where: {
          id: targetId,
          institutionId: institutionId!,
        },
        select: { id: true, name: true, session: true, semester: true },
      })
      if (!period) return apiError('Exam period not found', 404)
      recipientName = period.name
      timetableLabel = `${period.name} Exam Timetable`
      shareUrl = `${baseUrl}/timetable/exam/${targetId}`
    }

    // Build WhatsApp message
    const message = `📅 *ClashFree Timetable*\n\nHello${recipientName ? ` ${recipientName}` : ''},\n\nYour *${timetableLabel}* is ready.\n\n🔗 ${shareUrl}\n\n_Powered by ClashFree — Nigeria's Smart Timetable Platform_`
    const encodedMessage = encodeURIComponent(message)

    // Broadcast link (no phone — user can paste in any WhatsApp chat/group)
    const whatsappBroadcastUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`

    // Direct link (phone required)
    let whatsappUrl: string | null = null
    if (sendWhatsApp) {
      if (!recipientPhone) return apiError('Phone number is required for direct WhatsApp share')
      const cleanPhone = normalizeNigerianPhone(recipientPhone)
      if (!cleanPhone) return apiError(`Invalid phone number: "${recipientPhone}". Use format: 08012345678 or +2348012345678`)
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    }

    return apiResponse({
      shareUrl,
      timetableLabel,
      whatsappUrl,
      whatsappBroadcastUrl,
      message: `Share link generated for ${timetableLabel}`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/share/timetable?type=student&targetId=xxx
 * Quick share link generator (no auth needed for public timetables).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const targetId = searchParams.get('targetId')
    if (!type || !targetId) return apiError('type and targetId are required')

    const baseUrl = process.env.NEXTAUTH_URL ||
      `https://${process.env.VERCEL_URL || 'clashfree.vercel.app'}`

    const shareUrl =
      type === 'student' ? `${baseUrl}/student/timetable?studentId=${targetId}` :
      type === 'department' ? `${baseUrl}/timetable/department/${targetId}` :
      `${baseUrl}/timetable/exam/${targetId}`

    const msg = encodeURIComponent(`📅 View your timetable on ClashFree: ${shareUrl}`)
    return apiResponse({
      shareUrl,
      whatsappBroadcastUrl: `https://api.whatsapp.com/send?text=${msg}`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** Normalize Nigerian phone numbers → 234XXXXXXXXXX (no + prefix for wa.me) */
function normalizeNigerianPhone(phone: string): string | null {
  const clean = phone.replace(/[\s\-\(\)+]/g, '')
  if (/^234\d{10}$/.test(clean)) return clean                    // 234XXXXXXXXXX
  if (/^0[789]\d{9}$/.test(clean)) return `234${clean.slice(1)}` // 0XXXXXXXXXX
  if (/^[789]\d{9}$/.test(clean)) return `234${clean}`           // XXXXXXXXXX
  return null
}
