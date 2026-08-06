import nodemailer from 'nodemailer'
import { prisma } from './prisma'

export interface SmtpConfig {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  fromEmail?: string
  fromName?: string
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
  const cfg = await getSmtpConfig(companyId)
  return !!(cfg.host && cfg.fromEmail)
}

export async function sendMail(
  opts: { to: string | string[]; subject: string; html?: string; text?: string; attachments?: any[]; companyId?: string | null; fromOverride?: SmtpConfig }
): Promise<{ ok: boolean; delivered: boolean; error?: string; id?: string }> {
  const cfg = opts.fromOverride || (await getSmtpConfig(opts.companyId))
  const to = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to
  const from = cfg.fromEmail ? `"${cfg.fromName || 'BizForce CRM'}" <${cfg.fromEmail}>` : undefined
  let emailId: string | undefined

  // Always record in the Emails module when a company is attached
  if (opts.companyId) {
    try {
      const email = await prisma.email.create({
        data: {
          subject: opts.subject,
          body: opts.html || opts.text || '',
          fromEmail: cfg.fromEmail || from || '',
          toEmails: to,
          emailFlag: 'Sent',
          companyId: opts.companyId,
        },
      })
      emailId = email.id
    } catch {}
  }

  if (!cfg.host || !from) {
    console.log(`[EMAIL] (no SMTP configured, logged only) to=${to} subject="${opts.subject}"`)
    return { ok: true, delivered: false, id: emailId }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port || 587),
      secure: !!cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass || '' } : undefined,
    })
    await transporter.sendMail({
      from,
      to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    })
    return { ok: true, delivered: true, id: emailId }
  } catch (err: any) {
    console.error('[EMAIL] SMTP send failed:', err?.message)
    return { ok: true, delivered: false, error: err?.message, id: emailId }
  }
}

export async function testSmtpConnection(cfg: SmtpConfig): Promise<{ ok: boolean; error?: string }> {
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
