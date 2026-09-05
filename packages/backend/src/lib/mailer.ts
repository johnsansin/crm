import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { prisma } from './prisma'

export interface SmtpConfig {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  fromEmail?: string
  fromName?: string
  resendApiKey?: string
  resendFromEmail?: string
}

function buildMime(opts: { from: string; to: string[]; subject: string; html?: string; text?: string }): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const lines = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    'MIME-Version: 1.0',
    `To: ${opts.to.join(', ')}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject.replace(/[\r\n]+/g, ' ')}`,
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + Date.now() + '.' + Math.random().toString(36).slice(2) + '@bizforce-crm.online>',
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(opts.text || 'See attached HTML content.').toString('base64'),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(opts.html || opts.text || opts.subject).toString('base64'),
    `--${boundary}--`,
  ]
  return lines.join('\r\n')
}

async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ ok: boolean; accessToken?: string; error?: string }> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })
    const data: any = await res.json()
    if (!res.ok || !data.access_token) {
      return { ok: false, error: data.error_description || data.error || `Token refresh failed (${res.status})` }
    }
    return { ok: true, accessToken: data.access_token }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Token refresh request failed' }
  }
}

async function sendViaGmailApi(
  opts: { from: string; fromEmail: string; to: string[]; subject: string; html?: string; text?: string },
  companyId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const google = await (async () => {
      if (companyId) {
        const row = await prisma.orgSetting.findUnique({
          where: { companyId_key: { companyId, key: 'google' } },
        }).catch(() => null)
        if (row?.value && (row.value as any)?.clientId) return row.value as any
      }
      const global = await prisma.globalSetting.findUnique({ where: { key: 'google' } }).catch(() => null)
      if (global?.value && (global.value as any)?.clientId) return global.value as any
      return {}
    })()
    const clientId = google.clientId || process.env.GOOGLE_CLIENT_ID || ''
    const clientSecret = google.clientSecret || process.env.GOOGLE_CLIENT_SECRET || ''
    if (!clientId || !clientSecret) {
      return { ok: false, error: 'Google OAuth clientId/clientSecret not configured' }
    }
    const acct = await prisma.googleAccount.findFirst({
      where: companyId ? { companyId, isActive: true } : { isActive: true },
      orderBy: { lastSyncedAt: 'desc' },
    }).catch(() => null)
    if (!acct?.refreshToken || !acct.email) {
      return { ok: false, error: 'No linked Gmail account with a refresh token and email found' }
    }
    const refresh = await refreshGoogleAccessToken(acct.refreshToken, clientId, clientSecret)
    if (!refresh.ok || !refresh.accessToken) {
      return { ok: false, error: refresh.error || 'Could not obtain access token' }
    }
    const fromEmail = opts.fromEmail || acct.email
    const from = opts.from.startsWith('"') ? opts.from : `"${opts.from}" <${fromEmail}>`
    const mime = buildMime({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text })
    const raw = Buffer.from(mime).toString('base64url')
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(fromEmail)}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refresh.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Gmail API error (${res.status}): ${body.slice(0, 300)}` }
    }
    console.log(`[EMAIL] Gmail API sent OK via ${acct.email} to=${opts.to.join(', ')}`)
    return { ok: true }
  } catch (err: any) {
    console.error('[EMAIL] Gmail API failed:', err?.message)
    return { ok: false, error: err?.message || 'Gmail API failed' }
  }
}

const DEFAULT_SMTP: SmtpConfig = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromEmail: '',
  fromName: '',
}

export async function getSmtpConfig(companyId?: string | null): Promise<SmtpConfig> {
  if (companyId) {
    const row = await prisma.orgSetting.findUnique({
      where: { companyId_key: { companyId, key: 'smtp' } },
    }).catch(() => null)
    if (row?.value && (row.value as any)?.host) {
      return { ...DEFAULT_SMTP, ...(row.value as any) }
    }
  }
  const global = await prisma.globalSetting.findUnique({ where: { key: 'smtp' } }).catch(() => null)
  if (global?.value && (global.value as any)?.host) {
    return { ...DEFAULT_SMTP, ...(global.value as any) }
  }
  return DEFAULT_SMTP
}

export async function isSmtpConfigured(companyId?: string | null): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const cfg = await getSmtpConfig(companyId)
  if (apiKey || cfg.resendApiKey) return true
  return !!(cfg.host && cfg.fromEmail)
}

async function sendViaResend(
  opts: { to: string[]; from: string; subject: string; html?: string; text?: string },
  apiKey?: string
): Promise<{ ok: boolean; error?: string }> {
  const key = apiKey || process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'Resend API key not set' }
  try {
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html || opts.text || opts.subject,
    })
    if (result.error) {
      console.error('[EMAIL] Resend API error:', result.error.message)
      return { ok: false, error: result.error.message }
    }
    console.log(`[EMAIL] Resend sent OK id=${result.data?.id} to=${opts.to.join(', ')}`)
    return { ok: true }
  } catch (err: any) {
    console.error('[EMAIL] Resend API failed:', err?.message)
    return { ok: false, error: err?.message }
  }
}

async function sendViaSmtp(
  cfg: SmtpConfig,
  opts: { to: string; from: string; subject: string; html?: string; text?: string; attachments?: any[] }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port || 587),
      secure: !!cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass || '' } : undefined,
      connectionTimeout: 2500,
      greetingTimeout: 2500,
      socketTimeout: 2500,
    })
    await transporter.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    })
    return { ok: true }
  } catch (err: any) {
    console.error('[EMAIL] SMTP send failed:', err?.message)
    return { ok: false, error: err?.message }
  }
}

export async function sendMail(
  opts: { to: string | string[]; subject: string; html?: string; text?: string; attachments?: any[]; companyId?: string | null; fromOverride?: SmtpConfig }
): Promise<{ ok: boolean; delivered: boolean; error?: string; id?: string }> {
  const cfg = opts.fromOverride || (await getSmtpConfig(opts.companyId))
  const toArr = Array.isArray(opts.to) ? opts.to : [opts.to]
  const to = toArr.join(', ')
  const fromEmail = cfg.fromEmail || process.env.SMTP_FROM_EMAIL || ''
  const fromName = cfg.fromName || 'BizForce CRM'
  const from = fromEmail ? `"${fromName}" <${fromEmail}>` : ''
  const resendKey = cfg.resendApiKey || process.env.RESEND_API_KEY
  let emailId: string | undefined

  if (opts.companyId) {
    try {
      const email = await prisma.email.create({
        data: {
          subject: opts.subject,
          body: opts.html || opts.text || '',
          fromEmail,
          toEmails: to,
          emailFlag: 'Queued',
          companyId: opts.companyId,
        },
      })
      emailId = email.id
    } catch {}
  }

  let result: { ok: boolean; error?: string } = { ok: false, error: 'No email provider available' }

  if (cfg.host) {
    result = await sendViaSmtp(cfg, {
      to,
      from,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    })
    if (result.ok) {
      if (emailId) await prisma.email.update({ where: { id: emailId }, data: { emailFlag: 'Sent' } }).catch(() => {})
      return { ok: true, delivered: true, id: emailId }
    }
    console.log(`[EMAIL] SMTP failed (${result.error}), trying next provider...`)
  }

  if (opts.companyId) {
    const gmail = await sendViaGmailApi(
      { from: fromName, fromEmail, to: toArr, subject: opts.subject, html: opts.html, text: opts.text },
      opts.companyId
    )
    if (gmail.ok) {
      if (emailId) await prisma.email.update({ where: { id: emailId }, data: { emailFlag: 'Sent' } }).catch(() => {})
      return { ok: true, delivered: true, id: emailId }
    }
    if (gmail.error && !`${gmail.error}`.includes('not configured')) {
      console.log(`[EMAIL] Gmail API fallback failed: ${gmail.error}`)
      result = { ok: false, error: gmail.error }
    }
  }

  if (resendKey) {
    const useOrgKey = !!cfg.resendApiKey
    const orgFrom = cfg.resendFromEmail || cfg.fromEmail
    const resendFrom = useOrgKey
      ? (orgFrom ? `"${fromName}" <${orgFrom}>` : `"${fromName}" <noreply@bizforce-crm.online>`)
      : `"${fromName}" <noreply@bizforce-crm.online>`
    result = await sendViaResend({
      to: toArr,
      from: resendFrom,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }, cfg.resendApiKey)
    if (result.ok) {
      if (emailId) await prisma.email.update({ where: { id: emailId }, data: { emailFlag: 'Sent' } }).catch(() => {})
      return { ok: true, delivered: true, id: emailId }
    }
    console.log(`[EMAIL] Resend fallback failed: ${result.error}`)
  }

  if (result.ok) {
    if (emailId) await prisma.email.update({ where: { id: emailId }, data: { emailFlag: 'Sent' } }).catch(() => {})
    return { ok: true, delivered: true, id: emailId }
  } else {
    console.log(`[EMAIL] All providers failed for to=${to} subject="${opts.subject}"`)
    if (emailId) await prisma.email.update({ where: { id: emailId }, data: { emailFlag: 'Failed' } }).catch(() => {})
    return { ok: false, delivered: false, error: result.error, id: emailId }
  }
}

export async function testSmtpConnection(cfg: SmtpConfig): Promise<{ ok: boolean; error?: string }> {
  const key = cfg.resendApiKey || process.env.RESEND_API_KEY
  if (key) {
    try {
      const resend = new Resend(key)
      const testTo = cfg.resendFromEmail || cfg.fromEmail || 'noreply@bizforce-crm.online'
      const result = await resend.emails.send({
        from: '"BizForce CRM" <noreply@bizforce-crm.online>',
        to: testTo,
        subject: 'Connection test',
        text: 'BizForce CRM email connection test',
      })
      if (result.error) return { ok: false, error: result.error.message }
      return { ok: true }
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Resend connection failed' }
    }
  }
  if (!cfg.host) return { ok: false, error: 'SMTP host is required' }
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port || 587),
      secure: !!cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass || '' } : undefined,
    })
    await transporter.verify()
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Connection failed' }
  }
}
