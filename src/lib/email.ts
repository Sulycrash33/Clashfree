import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'ClashFree <noreply@clashfree.app>'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://clashfree.vercel.app'

// ─── Branded HTML wrapper ───────────────────────────────────────────────────
function wrap(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0891b2,#2563eb);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-block;text-align:center;line-height:48px;font-size:20px;font-weight:bold;color:#fff;">CF</div>
              <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">ClashFree</span>
            </div>
            <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Academic Scheduling Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#1e293b;padding:40px;border-radius:0 0 16px 16px;">
            ${body}
            <hr style="border:none;border-top:1px solid #334155;margin:32px 0;" />
            <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
              © 2026 ClashFree · Nigeria's #1 Academic Scheduling Platform<br/>
              <a href="${BASE_URL}" style="color:#0891b2;text-decoration:none;">${BASE_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Invite Email ────────────────────────────────────────────────────────────
export async function sendInviteEmail({
  to,
  name,
  role,
  institutionName,
  token,
}: {
  to: string
  name: string
  role: string
  institutionName: string
  token: string
}) {
  const acceptUrl = `${BASE_URL}/invite/accept?token=${token}`
  const roleLabels: Record<string, string> = {
    IA: 'Institution Admin',
    TO: 'Timetable Officer',
    LC: 'Lecturer',
    ST: 'Student',
  }
  const roleLabel = roleLabels[role] || role

  const body = `
    <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">You've been invited! 🎉</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hello ${name},</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
      You've been invited to join <strong style="color:#fff;">${institutionName}</strong> on ClashFree 
      as a <strong style="color:#22d3ee;">${roleLabel}</strong>.
    </p>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#94a3b8;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your role</p>
      <p style="color:#22d3ee;font-size:20px;font-weight:700;margin:0;">${roleLabel}</p>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">${institutionName}</p>
    </div>
    <a href="${acceptUrl}" style="display:block;background:linear-gradient(135deg,#0891b2,#2563eb);color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:16px;font-weight:700;margin:0 0 20px;">
      Accept Invitation →
    </a>
    <p style="color:#64748b;font-size:13px;margin:0;">
      This invite expires in <strong style="color:#94a3b8;">7 days</strong>. 
      If you did not expect this invitation, you can safely ignore this email.
    </p>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited to ${institutionName} on ClashFree`,
    html: wrap(`Invitation to ClashFree - ${institutionName}`, body),
  })
}

// ─── Signup Confirmation (to institution contact) ────────────────────────────
export async function sendSignupConfirmation({
  to,
  name,
  institutionName,
}: {
  to: string
  name: string
  institutionName: string
}) {
  const body = `
    <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">Application Received ✅</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hello ${name},</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Thank you for applying to bring <strong style="color:#fff;">${institutionName}</strong> onto ClashFree.
      Our team will review your application and get back to you within <strong style="color:#22d3ee;">48 hours</strong>.
    </p>
    <div style="background:#0f172a;border:1px solid #0891b2;border-left:4px solid #0891b2;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#22d3ee;font-size:13px;font-weight:600;margin:0 0 4px;">WHAT HAPPENS NEXT</p>
      <p style="color:#94a3b8;font-size:14px;margin:0;">
        1. SA reviews your application<br/>
        2. If approved, you'll receive login credentials<br/>
        3. Set up your institution structure and go live
      </p>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0;">
      Questions? Reply to this email or visit <a href="${BASE_URL}" style="color:#0891b2;">${BASE_URL}</a>
    </p>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `ClashFree — Application for ${institutionName} received`,
    html: wrap(`Application Received — ${institutionName}`, body),
  })
}

// ─── Signup Approved (SA approves → IA gets login) ───────────────────────────
export async function sendSignupApproved({
  to,
  name,
  institutionName,
  tempPassword,
  loginEmail,
}: {
  to: string
  name: string
  institutionName: string
  tempPassword: string
  loginEmail: string
}) {
  const loginUrl = `${BASE_URL}/login`
  const body = `
    <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">Your Institution is Live! 🚀</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hello ${name},</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Great news! <strong style="color:#fff;">${institutionName}</strong> has been approved on ClashFree.
      Your Institution Admin account is ready. Use the credentials below to log in.
    </p>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#94a3b8;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Login Credentials</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;">Email</td>
          <td style="color:#f1f5f9;font-size:14px;font-weight:600;text-align:right;">${loginEmail}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;">Temp Password</td>
          <td style="color:#22d3ee;font-size:14px;font-weight:700;font-family:monospace;text-align:right;">${tempPassword}</td>
        </tr>
      </table>
    </div>
    <a href="${loginUrl}" style="display:block;background:linear-gradient(135deg,#0891b2,#2563eb);color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:16px;font-weight:700;margin:0 0 20px;">
      Log In to ClashFree →
    </a>
    <p style="color:#f59e0b;font-size:13px;background:#451a03;border:1px solid #92400e;border-radius:8px;padding:12px;margin:0;">
      ⚠️ Change your password immediately after first login.
    </p>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `ClashFree — ${institutionName} is now live!`,
    html: wrap(`${institutionName} Approved`, body),
  })
}

// ─── Signup Rejected ─────────────────────────────────────────────────────────
export async function sendSignupRejected({
  to,
  name,
  institutionName,
  reason,
}: {
  to: string
  name: string
  institutionName: string
  reason: string
}) {
  const body = `
    <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">Application Update</h1>
    <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hello ${name},</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
      We've reviewed the application for <strong style="color:#fff;">${institutionName}</strong>.
      Unfortunately, we're unable to approve it at this time.
    </p>
    <div style="background:#450a0a;border:1px solid #991b1b;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#fca5a5;font-size:13px;font-weight:600;margin:0 0 4px;">Reason</p>
      <p style="color:#fecaca;font-size:14px;margin:0;">${reason}</p>
    </div>
    <p style="color:#cbd5e1;font-size:14px;margin:0 0 16px;">
      If you believe this was an error or would like to reapply with updated information, 
      please contact us by replying to this email.
    </p>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `ClashFree — Application for ${institutionName}`,
    html: wrap(`Application Update — ${institutionName}`, body),
  })
}

// ─── WhatsApp Clash/Publish Alert (via Meta Cloud API) ───────────────────────
// We expose this here so it's importable from one place.
// Actual WhatsApp logic is in /api/notify/whatsapp
export type WhatsAppAlertType = 'CLASH_DETECTED' | 'TIMETABLE_PUBLISHED' | 'EXAM_REMINDER'
