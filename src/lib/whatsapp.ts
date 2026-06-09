/**
 * WhatsApp Business Cloud API utility
 * Uses Meta's official WhatsApp Cloud API (free tier: 1000 conversations/mo)
 * Template messages for clash alerts and publish notifications
 */

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`
const WA_TOKEN = process.env.WA_ACCESS_TOKEN || ''

// ─── Normalize Nigerian phone to E.164 ──────────────────────────────────────
export function normalizeNigerianPhone(phone: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')

  // Already E.164 with country code
  if (digits.startsWith('234') && digits.length === 13) return `+${digits}`

  // 0XXXXXXXXXX (local)
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`

  // 8XXXXXXXXX or 7XXXXXXXXX or 9XXXXXXXXX (missing leading 0)
  if ((digits.startsWith('7') || digits.startsWith('8') || digits.startsWith('9')) && digits.length === 10) {
    return `+234${digits}`
  }

  return null
}

// ─── Base send function ──────────────────────────────────────────────────────
async function sendWA(to: string, payload: object): Promise<{ success: boolean; error?: string }> {
  if (!WA_TOKEN || !process.env.WA_PHONE_NUMBER_ID) {
    console.warn('[WhatsApp] WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID not set — skipping')
    return { success: false, error: 'WhatsApp not configured' }
  }

  const phone = normalizeNigerianPhone(to)
  if (!phone) return { success: false, error: `Invalid phone: ${to}` }

  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace('+', ''), ...payload }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[WhatsApp] API error:', data)
      return { success: false, error: data.error?.message || 'API error' }
    }
    return { success: true }
  } catch (err) {
    console.error('[WhatsApp] Fetch error:', err)
    return { success: false, error: 'Network error' }
  }
}

// ─── Send free-form text (only works within 24h window) ──────────────────────
export async function sendWAText(to: string, message: string) {
  return sendWA(to, { type: 'text', text: { body: message } })
}

// ─── Clash Alert ─────────────────────────────────────────────────────────────
// Template: clashfree_clash_alert
// Params: {{1}} student/lecturer name, {{2}} course, {{3}} conflict description
export async function sendClashAlert({
  to, name, course, conflict,
}: { to: string; name: string; course: string; conflict: string }) {
  // If template not approved yet, fall back to text (within session)
  if (process.env.WA_USE_TEMPLATES === 'true') {
    return sendWA(to, {
      type: 'template',
      template: {
        name: 'clashfree_clash_alert',
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: course },
            { type: 'text', text: conflict },
          ],
        }],
      },
    })
  }

  // Plain text fallback
  const msg = `⚠️ *ClashFree Alert*\n\nHello ${name},\n\nA scheduling conflict has been detected:\n\n📚 Course: *${course}*\n🔴 Conflict: ${conflict}\n\nLog in to ClashFree to review and resolve this conflict.\n\n_clashfree.vercel.app_`
  return sendWAText(to, msg)
}

// ─── Timetable Published ─────────────────────────────────────────────────────
export async function sendTimetablePublished({
  to, name, timetableName, institutionName, viewUrl,
}: { to: string; name: string; timetableName: string; institutionName: string; viewUrl: string }) {
  if (process.env.WA_USE_TEMPLATES === 'true') {
    return sendWA(to, {
      type: 'template',
      template: {
        name: 'clashfree_timetable_published',
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: timetableName },
            { type: 'text', text: institutionName },
          ],
        }],
      },
    })
  }

  const msg = `✅ *Timetable Published*\n\nHello ${name},\n\n📅 *${timetableName}* has been published by *${institutionName}*.\n\nYour schedule is now available. View it here:\n${viewUrl}\n\n_ClashFree — Academic Scheduling Platform_`
  return sendWAText(to, msg)
}

// ─── Exam Reminder ───────────────────────────────────────────────────────────
export async function sendExamReminder({
  to, name, course, date, time, room,
}: { to: string; name: string; course: string; date: string; time: string; room: string }) {
  const msg = `🔔 *Exam Reminder — ClashFree*\n\nHello ${name},\n\nYou have an exam tomorrow:\n\n📚 *${course}*\n📅 Date: ${date}\n⏰ Time: ${time}\n📍 Room: ${room}\n\nGood luck! 🎯\n\n_ClashFree — Academic Scheduling Platform_`
  return sendWAText(to, msg)
}

// ─── Batch notify (fire-and-forget, logs failures) ───────────────────────────
export async function batchNotifyWA(
  recipients: { phone: string; name: string }[],
  buildMessage: (r: { phone: string; name: string }) => Promise<{ success: boolean; error?: string }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0; let failed = 0
  // Process in chunks of 10 to avoid rate limits
  for (let i = 0; i < recipients.length; i += 10) {
    const chunk = recipients.slice(i, i + 10)
    await Promise.all(chunk.map(async r => {
      const result = await buildMessage(r)
      if (result.success) sent++
      else { failed++; console.warn(`[WA] Failed ${r.phone}: ${result.error}`) }
    }))
    if (i + 10 < recipients.length) await new Promise(r => setTimeout(r, 1000)) // 1s between chunks
  }
  return { sent, failed }
}
