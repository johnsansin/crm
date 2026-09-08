import crypto from 'node:crypto'
import { prisma } from './prisma'
import { sendMail, getSmtpConfig } from './mailer'
import { writeAudit } from './audit'
import { notifyFollowersAndAssignee } from './notify'

export const EMAIL_STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  NOT_CONTACTED: { label: 'Not Contacted', tone: 'slate' },
  EMAIL_QUEUED: { label: 'Queued', tone: 'violet' },
  EMAIL_SENT: { label: 'Sent', tone: 'blue' },
  EMAIL_DELIVERED: { label: 'Delivered', tone: 'emerald' },
  EMAIL_OPENED: { label: 'Opened', tone: 'teal' },
  EMAIL_CLICKED: { label: 'Clicked', tone: 'cyan' },
  AWAITING_REPLY: { label: 'Awaiting Reply', tone: 'amber' },
  REPLIED: { label: 'Replied', tone: 'emerald' },
  BOUNCED: { label: 'Bounced', tone: 'red' },
  DELIVERY_FAILED: { label: 'Delivery Failed', tone: 'red' },
  UNSUBSCRIBED: { label: 'Unsubscribed', tone: 'slate' },
  SEQUENCE_ACTIVE: { label: 'Sequence Active', tone: 'blue' },
  SEQUENCE_PAUSED: { label: 'Sequence Paused', tone: 'orange' },
  SEQUENCE_COMPLETED: { label: 'Sequence Completed', tone: 'slate' },
  SEQUENCE_STOPPED: { label: 'Sequence Stopped', tone: 'slate' },
}

export type DelayUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'

export interface EmailProviderAdapter {
  name: string
  sendEmail(input: {
    companyId: string
    fromEmail: string
    toEmail: string
    subject: string
    htmlBody?: string | null
    textBody?: string | null
    messageId?: string | null
    threadId?: string | null
    replyTo?: string | null
  }): Promise<{ ok: boolean; providerMessageId?: string | null; error?: string | null; temporary?: boolean }>
  processWebhook(payload: any): Promise<{
    companyId?: string | null
    eventType: string
    providerEventId?: string | null
    providerMessageId?: string | null
    messageId?: string | null
    metadata?: any
  }>
  getMessageStatus?(providerMessageId: string): Promise<string | null>
  validateWebhook(rawBody: string, signature?: string): boolean
}

export class InternalEmailProviderAdapter implements EmailProviderAdapter {
  name = 'INTERNAL'
  constructor(private secret?: string) {}
  async sendEmail(input: { companyId: string; fromEmail: string; toEmail: string; subject: string; htmlBody?: string | null; textBody?: string | null }) {
    const sent = await sendMail({ to: input.toEmail, subject: input.subject, html: input.htmlBody || undefined, text: input.textBody || undefined, companyId: input.companyId, fromOverride: await getSmtpConfig(input.companyId) })
    return { ok: sent.delivered, providerMessageId: sent.id || null, error: sent.error || null, temporary: !sent.delivered }
  }
  async processWebhook(payload: any) {
    return {
      companyId: payload.companyId || payload.tenant_id || payload.organization_id || null,
      eventType: String(payload.eventType || payload.event || payload.type || '').toUpperCase(),
      providerEventId: payload.providerEventId || payload.event_id || payload.id || null,
      providerMessageId: payload.providerMessageId || payload.message_id || null,
      messageId: payload.messageId || null,
      metadata: payload,
    }
  }
  validateWebhook(rawBody: string, signature?: string) {
    return validateWebhookSignature(rawBody, signature, this.secret)
  }
}

const PERMANENT_FAILURES = ['BOUNCED', 'HARD_BOUNCE', 'FAILED', 'DELIVERY_FAILED', 'COMPLAINED', 'UNSUBSCRIBED']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MERGE_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function addDelay(base: Date, value: number, unit: string): Date {
  const out = new Date(base)
  const n = Math.max(0, Number(value) || 0)
  switch (String(unit || 'DAYS').toUpperCase()) {
    case 'MINUTES': out.setMinutes(out.getMinutes() + n); break
    case 'HOURS': out.setHours(out.getHours() + n); break
    case 'WEEKS': out.setDate(out.getDate() + n * 7); break
    default: out.setDate(out.getDate() + n)
  }
  return out
}

export function renderMergeTemplate(template: string, lead: any, owner?: any): { text: string; missing: string[] } {
  const values: Record<string, any> = {
    first_name: lead.firstName,
    firstName: lead.firstName,
    last_name: lead.lastName,
    lastName: lead.lastName,
    lead_name: [lead.firstName, lead.lastName].filter(Boolean).join(' '),
    company_name: lead.company,
    company: lead.company,
    job_title: lead.title,
    title: lead.title,
    email: lead.email,
    phone: lead.phone || lead.mobile,
    owner_name: owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email : '',
  }
  const missing = new Set<string>()
  const text = String(template || '').replace(MERGE_RE, (_match, key) => {
    const value = values[key]
    if (value == null || value === '') {
      missing.add(key)
      return ''
    }
    return String(value)
  })
  return { text, missing: [...missing] }
}

export function automationStopReason(input: {
  enrollmentStatus?: string | null
  leadEmailStatus?: string | null
  emailOptOut?: boolean | null
  hasReply?: boolean | null
  hasHardBounce?: boolean | null
  isSuppressed?: boolean | null
}): string | null {
  if (input.enrollmentStatus && input.enrollmentStatus !== 'ACTIVE') return 'NOT_ACTIVE'
  if (input.emailOptOut || input.leadEmailStatus === 'UNSUBSCRIBED' || input.isSuppressed) return 'UNSUBSCRIBED'
  if (input.hasReply || input.leadEmailStatus === 'REPLIED') return 'REPLIED'
  if (input.hasHardBounce || input.leadEmailStatus === 'BOUNCED') return 'HARD_BOUNCE'
  if (input.leadEmailStatus === 'DELIVERY_FAILED') return 'DELIVERY_FAILED'
  return null
}

export function nextSequenceState(input: { currentStep: number; totalSteps: number; sentAt: Date; nextDelayValue?: number; nextDelayUnit?: string }) {
  if (input.currentStep + 1 >= input.totalSteps) {
    return { status: 'COMPLETED', currentStep: input.currentStep + 1, nextActionAt: null as Date | null }
  }
  return {
    status: 'ACTIVE',
    currentStep: input.currentStep + 1,
    nextActionAt: addDelay(input.sentAt, input.nextDelayValue || 0, input.nextDelayUnit || 'DAYS'),
  }
}

async function createActivity(companyId: string, leadId: string, activityType: string, description: string, referenceId?: string | null, metadata: any = {}, createdBy?: string | null) {
  await (prisma as any).leadEmailActivity.create({
    data: { companyId, leadId, activityType, description, referenceId: referenceId || null, metadata, createdBy: createdBy || null },
  }).catch(() => {})
}

async function updateLeadEmailState(companyId: string, leadId: string, data: any) {
  await prisma.lead.updateMany({ where: { id: leadId, companyId, isActive: true }, data }).catch(() => {})
}

async function stopEnrollment(companyId: string, enrollmentId: string | null | undefined, leadId: string, reason: string, status: string, note?: string) {
  if (enrollmentId) {
    await (prisma as any).leadSequenceEnrollment.updateMany({
      where: { id: enrollmentId, companyId, status: { in: ['ACTIVE', 'PAUSED'] } },
      data: { status: 'STOPPED', stopReason: reason, stoppedAt: new Date(), nextActionAt: null, failureReason: note || null },
    })
  } else {
    await (prisma as any).leadSequenceEnrollment.updateMany({
      where: { leadId, companyId, status: { in: ['ACTIVE', 'PAUSED'] } },
      data: { status: 'STOPPED', stopReason: reason, stoppedAt: new Date(), nextActionAt: null, failureReason: note || null },
    })
  }
  await updateLeadEmailState(companyId, leadId, { emailStatus: status, emailSequenceStatus: 'STOPPED', nextFollowUp: null })
  await createActivity(companyId, leadId, 'SEQUENCE_STOPPED', `Sequence stopped: ${reason}`, enrollmentId || null, { reason, note })
}

export async function enrollLeadsInSequence(params: { companyId: string; sequenceId: string; leadIds: string[]; userId?: string | null }) {
  const sequence = await (prisma as any).emailSequence.findFirst({
    where: { id: params.sequenceId, companyId: params.companyId, isActive: true },
    include: { steps: { where: { isActive: true }, orderBy: { stepNumber: 'asc' } } },
  })
  if (!sequence) throw Object.assign(new Error('Sequence not found'), { status: 404 })
  if (!sequence.steps.length) throw Object.assign(new Error('Sequence needs at least one active step'), { status: 400 })

  const leads = await prisma.lead.findMany({
    where: { id: { in: params.leadIds.slice(0, 1000) }, companyId: params.companyId, isActive: true, isConverted: false },
    select: { id: true, email: true, emailOptOut: true, emailStatus: true },
  } as any)
  const suppressed = await (prisma as any).emailSuppression.findMany({
    where: { companyId: params.companyId, email: { in: leads.map((lead: any) => String(lead.email || '').toLowerCase()).filter(Boolean) } },
    select: { email: true },
  })
  const suppressedEmails = new Set(suppressed.map((row: any) => row.email))
  const summary = { selected: params.leadIds.length, eligible: 0, missingEmail: 0, alreadyReplied: 0, unsubscribed: 0, alreadyEnrolled: 0, suppressed: 0, enrolled: 0 }

  for (const lead of leads as any[]) {
    const email = String(lead.email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) { summary.missingEmail++; continue }
    if (lead.emailOptOut || lead.emailStatus === 'UNSUBSCRIBED') { summary.unsubscribed++; continue }
    if (lead.emailStatus === 'REPLIED') { summary.alreadyReplied++; continue }
    if (suppressedEmails.has(email)) { summary.suppressed++; continue }
    const active = await (prisma as any).leadSequenceEnrollment.findFirst({ where: { companyId: params.companyId, leadId: lead.id, sequenceId: sequence.id, status: { in: ['ACTIVE', 'PAUSED'] } } })
    if (active) { summary.alreadyEnrolled++; continue }
    summary.eligible++
    const first = sequence.steps[0]
    const nextActionAt = addDelay(new Date(), first.delayValue, first.delayUnit)
    const enrollment = await (prisma as any).leadSequenceEnrollment.create({
      data: { companyId: params.companyId, leadId: lead.id, sequenceId: sequence.id, currentStep: 0, nextActionAt, createdBy: params.userId || null },
    })
    summary.enrolled++
    await updateLeadEmailState(params.companyId, lead.id, { emailStatus: 'SEQUENCE_ACTIVE', emailSequenceName: sequence.name, emailSequenceStatus: 'ACTIVE', nextFollowUp: nextActionAt })
    await createActivity(params.companyId, lead.id, 'SEQUENCE_STARTED', `Sequence started: ${sequence.name}`, enrollment.id, { sequenceId: sequence.id }, params.userId)
    await writeAudit({ moduleName: 'email-sequences', recordId: sequence.id, action: 'ACTIVITY', fieldName: 'LEAD_ENROLLED', newValue: lead.id, userId: params.userId || null, companyId: params.companyId })
  }
  return summary
}

export async function processDueEmailSequences(limit = 100) {
  const due = await (prisma as any).leadSequenceEnrollment.findMany({
    where: { status: 'ACTIVE', nextActionAt: { lte: new Date() } },
    orderBy: { nextActionAt: 'asc' },
    take: limit,
  })
  const results = []
  for (const enrollment of due) results.push(await sendNextSequenceStep(enrollment.id).catch((error: any) => ({ enrollmentId: enrollment.id, ok: false, error: error?.message || String(error) })))
  return results
}

export async function sendNextSequenceStep(enrollmentId: string) {
  const now = new Date()
  const enrollment = await (prisma as any).leadSequenceEnrollment.findFirst({
    where: { id: enrollmentId, status: 'ACTIVE' },
    include: { sequence: { include: { steps: { where: { isActive: true }, orderBy: { stepNumber: 'asc' } } } } },
  })
  if (!enrollment) return { ok: false, skipped: true, reason: 'Enrollment is not active' }
  const companyId = enrollment.companyId
  const lead = await prisma.lead.findFirst({ where: { id: enrollment.leadId, companyId, isActive: true } as any })
  if (!lead) {
    await stopEnrollment(companyId, enrollment.id, enrollment.leadId, 'LEAD_DELETED', 'SEQUENCE_STOPPED')
    return { ok: false, skipped: true, reason: 'Lead not found' }
  }
  const email = String((lead as any).email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    await stopEnrollment(companyId, enrollment.id, lead.id, 'INVALID_EMAIL', 'DELIVERY_FAILED')
    return { ok: false, skipped: true, reason: 'Invalid email' }
  }
  if ((lead as any).emailOptOut || (lead as any).emailStatus === 'UNSUBSCRIBED') {
    await stopEnrollment(companyId, enrollment.id, lead.id, 'UNSUBSCRIBED', 'UNSUBSCRIBED')
    return { ok: false, skipped: true, reason: 'Unsubscribed' }
  }
  const suppressed = await (prisma as any).emailSuppression.findUnique({ where: { companyId_email: { companyId, email } } }).catch(() => null)
  if (suppressed) {
    await stopEnrollment(companyId, enrollment.id, lead.id, suppressed.reason || 'SUPPRESSED', suppressed.reason === 'UNSUBSCRIBED' ? 'UNSUBSCRIBED' : 'BOUNCED')
    return { ok: false, skipped: true, reason: 'Suppressed' }
  }
  const reply = await (prisma as any).emailReply.findFirst({ where: { companyId, leadId: lead.id, receivedAt: { gte: enrollment.startedAt } } })
  if (reply || (lead as any).emailStatus === 'REPLIED') {
    await stopEnrollment(companyId, enrollment.id, lead.id, 'REPLIED', 'REPLIED')
    return { ok: false, skipped: true, reason: 'Replied' }
  }
  const steps = enrollment.sequence.steps
  const step = steps[enrollment.currentStep]
  if (!step) {
    await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'COMPLETED', completedAt: now, nextActionAt: null, stopReason: 'SEQUENCE_COMPLETED' } })
    await updateLeadEmailState(companyId, lead.id, { emailStatus: 'SEQUENCE_COMPLETED', emailSequenceStatus: 'COMPLETED', nextFollowUp: null })
    await createActivity(companyId, lead.id, 'SEQUENCE_COMPLETED', `Sequence completed: ${enrollment.sequence.name}`, enrollment.id)
    return { ok: true, completed: true }
  }
  const idempotencyKey = `${companyId}:${enrollment.id}:${step.id}`
  const existing = await (prisma as any).emailMessage.findUnique({ where: { companyId_idempotencyKey: { companyId, idempotencyKey } } }).catch(() => null)
  if (existing?.status === 'SENT' || existing?.status === 'DELIVERED') return { ok: true, duplicatePrevented: true, messageId: existing.id }
  if (existing?.status === 'QUEUED') return { ok: false, skipped: true, reason: 'Already queued', messageId: existing.id }

  const owner = (lead as any).assignedTo ? await prisma.user.findFirst({ where: { id: (lead as any).assignedTo, companyId }, select: { firstName: true, lastName: true, email: true } }).catch(() => null) : null
  const subject = renderMergeTemplate(step.subject, lead, owner)
  const body = renderMergeTemplate(step.body, lead, owner)
  const missing = [...new Set([...subject.missing, ...body.missing])]
  if (missing.length) {
    await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'FAILED', failureReason: `Missing merge fields: ${missing.join(', ')}`, nextActionAt: null } })
    await updateLeadEmailState(companyId, lead.id, { emailStatus: 'DELIVERY_FAILED', emailSequenceStatus: 'FAILED', nextFollowUp: null })
    await createActivity(companyId, lead.id, 'EMAIL_FAILED', `Email skipped because merge fields were missing: ${missing.join(', ')}`, enrollment.id, { missing })
    return { ok: false, skipped: true, reason: 'Missing merge fields', missing }
  }

  const smtp = await getSmtpConfig(companyId)
  const fromEmail = enrollment.sequence.fromEmail || smtp.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@bizforce-crm.online'
  const conversation = await (prisma as any).emailConversation.create({
    data: { companyId, leadId: lead.id, subject: subject.text, threadId: crypto.randomUUID(), status: 'WAITING_FOR_REPLY', lastMessageAt: now, lastOutgoingMessageAt: now },
  })
  const message = await (prisma as any).emailMessage.create({
    data: {
      companyId, leadId: lead.id, sequenceId: enrollment.sequenceId, sequenceStepId: step.id, enrollmentId: enrollment.id,
      conversationId: conversation.id, threadId: conversation.threadId, provider: 'INTERNAL', idempotencyKey,
      messageId: `<${crypto.randomUUID()}@bizforce-crm.local>`, fromEmail, toEmail: email, subject: subject.text,
      body: body.text, htmlBody: body.text.replace(/\n/g, '<br>'), textBody: body.text, status: 'QUEUED', createdBy: enrollment.createdBy || null,
    },
  })
  await updateLeadEmailState(companyId, lead.id, { emailStatus: 'EMAIL_QUEUED', lastEmailStatus: 'QUEUED', nextFollowUp: null })
  await createActivity(companyId, lead.id, 'EMAIL_QUEUED', `Email queued: ${subject.text}`, message.id)

  const latest = await (prisma as any).leadSequenceEnrollment.findFirst({ where: { id: enrollment.id, companyId, status: 'ACTIVE' } })
  const latestLead = await prisma.lead.findFirst({ where: { id: lead.id, companyId, isActive: true } as any, select: { emailStatus: true, emailOptOut: true } as any })
  const latestReply = await (prisma as any).emailReply.findFirst({ where: { companyId, leadId: lead.id, receivedAt: { gte: enrollment.startedAt } } })
  if (!latest || latestLead?.emailStatus === 'REPLIED' || latestLead?.emailOptOut || latestReply) {
    await (prisma as any).emailMessage.update({ where: { id: message.id }, data: { status: 'CANCELLED', error: 'Cancelled by final stop-condition check' } })
    await stopEnrollment(companyId, enrollment.id, lead.id, latestLead?.emailStatus === 'REPLIED' || latestReply ? 'REPLIED' : 'UNSUBSCRIBED', latestLead?.emailStatus === 'REPLIED' || latestReply ? 'REPLIED' : 'UNSUBSCRIBED')
    return { ok: false, skipped: true, reason: 'Final stop condition matched' }
  }

  const sent = await sendMail({ to: email, subject: subject.text, html: body.text.replace(/\n/g, '<br>'), text: body.text, companyId, fromOverride: smtp })
  if (!sent.delivered) {
    await (prisma as any).emailMessage.update({ where: { id: message.id }, data: { status: 'FAILED', failedAt: new Date(), error: sent.error || 'Provider failed' } })
    await stopEnrollment(companyId, enrollment.id, lead.id, 'DELIVERY_FAILED', 'DELIVERY_FAILED', sent.error)
    await createActivity(companyId, lead.id, 'EMAIL_FAILED', `Email failed: ${sent.error || 'Provider failed'}`, message.id)
    return { ok: false, error: sent.error || 'Provider failed' }
  }

  const sentAt = new Date()
  const nextStep = steps[enrollment.currentStep + 1]
  const nextActionAt = nextStep ? addDelay(sentAt, nextStep.delayValue, nextStep.delayUnit) : null
  await (prisma as any).emailMessage.update({ where: { id: message.id }, data: { status: 'SENT', sentAt, providerMessageId: sent.id || null } })
  await (prisma as any).emailEvent.create({ data: { companyId, leadId: lead.id, emailMessageId: message.id, conversationId: conversation.id, eventType: 'SENT', provider: 'INTERNAL', eventTimestamp: sentAt, metadata: { sequenceStep: step.stepNumber } } }).catch(() => {})
  await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: nextActionAt ? { currentStep: enrollment.currentStep + 1, lastEmailAt: sentAt, nextActionAt, attemptCount: 0 } : { currentStep: enrollment.currentStep + 1, lastEmailAt: sentAt, nextActionAt: null, status: 'COMPLETED', completedAt: sentAt, stopReason: 'SEQUENCE_COMPLETED' } })
  await updateLeadEmailState(companyId, lead.id, { emailStatus: nextActionAt ? 'AWAITING_REPLY' : 'SEQUENCE_COMPLETED', lastEmailAt: sentAt, lastEmailStatus: 'SENT', emailSequenceStatus: nextActionAt ? 'ACTIVE' : 'COMPLETED', nextFollowUp: nextActionAt, emailFollowUpCount: { increment: 1 } })
  await createActivity(companyId, lead.id, 'EMAIL_SENT', `Email sent: ${subject.text}`, message.id)
  if (!nextActionAt) await createActivity(companyId, lead.id, 'SEQUENCE_COMPLETED', `Sequence completed: ${enrollment.sequence.name}`, enrollment.id)
  return { ok: true, messageId: message.id, nextActionAt }
}

export async function processEmailProviderEvent(input: {
  companyId: string; provider: string; eventType: string; providerEventId?: string | null; providerMessageId?: string | null; messageId?: string | null; metadata?: any; eventTimestamp?: Date
}) {
  const eventType = String(input.eventType || '').toUpperCase()
  const message = await (prisma as any).emailMessage.findFirst({
    where: { companyId: input.companyId, OR: [{ providerMessageId: input.providerMessageId || undefined }, { messageId: input.messageId || undefined }, { id: input.providerMessageId || undefined }].filter((x: any) => Object.values(x)[0]) },
  })
  if (!message) throw Object.assign(new Error('Email message not found for event'), { status: 404 })
  if (input.providerEventId) {
    const existing = await (prisma as any).emailEvent.findUnique({ where: { companyId_provider_providerEventId: { companyId: input.companyId, provider: input.provider, providerEventId: input.providerEventId } } }).catch(() => null)
    if (existing) return { ok: true, duplicate: true }
  }
  const at = input.eventTimestamp || new Date()
  await (prisma as any).emailEvent.create({ data: { companyId: input.companyId, leadId: message.leadId, emailMessageId: message.id, conversationId: message.conversationId, eventType, provider: input.provider, providerEventId: input.providerEventId || null, eventTimestamp: at, metadata: input.metadata || {} } })
  const update: any = {}
  if (eventType === 'DELIVERED') Object.assign(update, { status: 'DELIVERED', deliveredAt: at })
  if (eventType === 'OPENED') Object.assign(update, { status: 'OPENED', openedAt: at, openCount: { increment: 1 } })
  if (eventType === 'CLICKED') Object.assign(update, { status: 'CLICKED', clickedAt: at, clickCount: { increment: 1 } })
  if (PERMANENT_FAILURES.includes(eventType)) Object.assign(update, { status: eventType === 'UNSUBSCRIBED' ? 'UNSUBSCRIBED' : eventType.includes('BOUNCE') ? 'BOUNCED' : 'FAILED', failedAt: at, error: input.metadata?.reason || null })
  if (Object.keys(update).length) await (prisma as any).emailMessage.update({ where: { id: message.id }, data: update })
  if (eventType === 'DELIVERED') await updateLeadEmailState(input.companyId, message.leadId, { emailStatus: 'EMAIL_DELIVERED', lastEmailStatus: 'DELIVERED' })
  if (eventType === 'OPENED') await updateLeadEmailState(input.companyId, message.leadId, { emailStatus: 'EMAIL_OPENED', lastEmailStatus: 'OPENED', lastOpenedAt: at })
  if (eventType === 'CLICKED') await updateLeadEmailState(input.companyId, message.leadId, { emailStatus: 'EMAIL_CLICKED', lastEmailStatus: 'CLICKED', lastClickedAt: at })
  if (eventType === 'UNSUBSCRIBED') {
    await (prisma as any).emailSuppression.upsert({ where: { companyId_email: { companyId: input.companyId, email: message.toEmail.toLowerCase() } }, update: { reason: 'UNSUBSCRIBED', source: input.provider, metadata: input.metadata || {} }, create: { companyId: input.companyId, email: message.toEmail.toLowerCase(), reason: 'UNSUBSCRIBED', source: input.provider, metadata: input.metadata || {} } })
    await stopEnrollment(input.companyId, message.enrollmentId, message.leadId, 'UNSUBSCRIBED', 'UNSUBSCRIBED')
  } else if (eventType.includes('BOUNCE')) {
    await (prisma as any).emailSuppression.upsert({ where: { companyId_email: { companyId: input.companyId, email: message.toEmail.toLowerCase() } }, update: { reason: 'HARD_BOUNCE', source: input.provider, metadata: input.metadata || {} }, create: { companyId: input.companyId, email: message.toEmail.toLowerCase(), reason: 'HARD_BOUNCE', source: input.provider, metadata: input.metadata || {} } })
    await stopEnrollment(input.companyId, message.enrollmentId, message.leadId, 'HARD_BOUNCE', 'BOUNCED', input.metadata?.reason)
  } else if (eventType === 'FAILED' || eventType === 'DELIVERY_FAILED') {
    await stopEnrollment(input.companyId, message.enrollmentId, message.leadId, 'DELIVERY_FAILED', 'DELIVERY_FAILED', input.metadata?.reason)
  }
  await createActivity(input.companyId, message.leadId, `EMAIL_${eventType}`, `Email ${eventType.toLowerCase().replace(/_/g, ' ')}`, message.id, input.metadata)
  return { ok: true }
}

export async function processIncomingReply(input: {
  companyId: string; provider?: string; providerMessageId?: string | null; messageId?: string | null; inReplyTo?: string | null; references?: string | null; fromEmail: string; toEmail: string; subject?: string | null; body?: string | null; htmlBody?: string | null; receivedAt?: Date
}) {
  const from = String(input.fromEmail || '').trim().toLowerCase()
  const candidates = [
    input.inReplyTo ? { messageId: input.inReplyTo } : null,
    input.references ? { messageId: { in: input.references.split(/\s+/).filter(Boolean) } } : null,
    input.providerMessageId ? { providerMessageId: input.providerMessageId } : null,
  ].filter(Boolean) as any[]
  let message = candidates.length ? await (prisma as any).emailMessage.findFirst({ where: { companyId: input.companyId, OR: candidates }, orderBy: { createdAt: 'desc' } }) : null
  if (!message) message = await (prisma as any).emailMessage.findFirst({ where: { companyId: input.companyId, toEmail: from }, orderBy: { createdAt: 'desc' } })
  if (!message) throw Object.assign(new Error('Could not match reply to a lead conversation'), { status: 404 })
  const at = input.receivedAt || new Date()
  const reply = await (prisma as any).emailReply.create({
    data: { companyId: input.companyId, leadId: message.leadId, emailMessageId: message.id, conversationId: message.conversationId, providerMessageId: input.providerMessageId || null, messageId: input.messageId || null, inReplyTo: input.inReplyTo || null, references: input.references || null, fromEmail: input.fromEmail, toEmail: input.toEmail, subject: input.subject || null, body: input.body || null, htmlBody: input.htmlBody || null, receivedAt: at },
  })
  await (prisma as any).emailConversation.updateMany({ where: { id: message.conversationId, companyId: input.companyId }, data: { status: 'REPLIED', lastMessageAt: at, lastIncomingMessageAt: at } })
  await (prisma as any).emailEvent.create({ data: { companyId: input.companyId, leadId: message.leadId, emailMessageId: message.id, conversationId: message.conversationId, eventType: 'REPLY', provider: input.provider || 'INTERNAL', providerEventId: input.messageId || input.providerMessageId || null, eventTimestamp: at, metadata: { fromEmail: input.fromEmail, subject: input.subject } } }).catch(() => {})
  await stopEnrollment(input.companyId, message.enrollmentId, message.leadId, 'REPLIED', 'REPLIED')
  await updateLeadEmailState(input.companyId, message.leadId, { lastReplyAt: at, emailStatus: 'REPLIED', emailSequenceStatus: 'STOPPED', nextFollowUp: null })
  await createActivity(input.companyId, message.leadId, 'EMAIL_REPLY', `Reply received: ${input.subject || 'No subject'}`, reply.id, { fromEmail: input.fromEmail })
  const lead = await prisma.lead.findFirst({ where: { id: message.leadId, companyId: input.companyId }, select: { assignedTo: true, firstName: true, lastName: true, company: true } })
  if (lead?.assignedTo) {
    const leadName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Lead'
    await notifyFollowersAndAssignee({ moduleName: 'leads', recordId: message.leadId, assigneeId: lead.assignedTo, title: 'New Lead Reply', message: `${leadName} replied to your email.`, link: `/leads/${message.leadId}`, companyId: input.companyId })
  }
  return { ok: true, replyId: reply.id, leadId: message.leadId }
}

export function validateWebhookSignature(rawBody: string, signature: string | undefined, secret: string | undefined): boolean {
  if (!secret) return true
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
