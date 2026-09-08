import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireTenant } from '../lib/module-permissions'
import { writeAudit } from '../lib/audit'
import {
  EMAIL_STATUS_CONFIG,
  enrollLeadsInSequence,
  processEmailProviderEvent,
  processIncomingReply,
  sendNextSequenceStep,
  validateWebhookSignature,
} from '../lib/email-automation'

export const emailAutomationRouter = Router()
export const emailWebhookRouter = Router()

const stepSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number().int().positive(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  delayValue: z.number().int().min(0).default(0),
  delayUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']).default('DAYS'),
  condition: z.string().default('NO_REPLY'),
  isActive: z.boolean().default(true),
})

const sequenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  fromEmail: z.string().optional().nullable(),
  replyTo: z.string().optional().nullable(),
  timezone: z.string().default('UTC'),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).default('DRAFT'),
  sendWindow: z.any().optional(),
  rateLimits: z.any().optional(),
  steps: z.array(stepSchema).min(1),
})

function companyId(req: any): string {
  if (!req.user?.companyId) throw Object.assign(new Error('Organization is required'), { status: 400 })
  return req.user.companyId
}

function cleanEmail(value: any): string {
  return String(value || '').trim().toLowerCase()
}

async function sequenceStats(companyId: string, sequenceId: string) {
  const [enrollments, messages, replies, bounces] = await Promise.all([
    (prisma as any).leadSequenceEnrollment.groupBy({ by: ['status'], where: { companyId, sequenceId }, _count: { _all: true } }).catch(() => []),
    (prisma as any).emailMessage.groupBy({ by: ['status'], where: { companyId, sequenceId }, _count: { _all: true } }).catch(() => []),
    (prisma as any).emailReply.count({ where: { companyId, message: { sequenceId } } }).catch(() => 0),
    (prisma as any).emailEvent.count({ where: { companyId, eventType: { in: ['BOUNCED', 'HARD_BOUNCE'] }, message: { sequenceId } } }).catch(() => 0),
  ])
  const byStatus = Object.fromEntries(enrollments.map((row: any) => [row.status, row._count._all]))
  const msgStatus = Object.fromEntries(messages.map((row: any) => [row.status, row._count._all]))
  const sent = Number(msgStatus.SENT || 0) + Number(msgStatus.DELIVERED || 0) + Number(msgStatus.OPENED || 0) + Number(msgStatus.CLICKED || 0)
  const delivered = Number(msgStatus.DELIVERED || 0) + Number(msgStatus.OPENED || 0) + Number(msgStatus.CLICKED || 0)
  return {
    totalLeads: Object.values(byStatus).reduce((sum: number, n: any) => sum + Number(n || 0), 0),
    active: byStatus.ACTIVE || 0,
    paused: byStatus.PAUSED || 0,
    completed: byStatus.COMPLETED || 0,
    stopped: byStatus.STOPPED || 0,
    emailsSent: sent,
    delivered,
    opened: msgStatus.OPENED || 0,
    clicked: msgStatus.CLICKED || 0,
    replies,
    bounced: bounces,
    replyRate: sent ? Number(((replies / sent) * 100).toFixed(1)) : 0,
    deliveryRate: sent ? Number(((delivered / sent) * 100).toFixed(1)) : 0,
  }
}

emailAutomationRouter.use(authMiddleware)
emailAutomationRouter.use(requireTenant)

emailAutomationRouter.get('/config/statuses', (_req, res) => {
  res.json({ data: EMAIL_STATUS_CONFIG })
})

emailAutomationRouter.get('/dashboard', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const startToday = new Date(); startToday.setUTCHours(0, 0, 0, 0)
    const [activeLeads, sentToday, repliesToday, pendingFollowUps, bounces, failed, sequences] = await Promise.all([
      (prisma as any).leadSequenceEnrollment.count({ where: { companyId: cid, status: 'ACTIVE' } }),
      (prisma as any).emailMessage.count({ where: { companyId: cid, sentAt: { gte: startToday } } }),
      (prisma as any).emailReply.count({ where: { companyId: cid, receivedAt: { gte: startToday } } }),
      (prisma as any).leadSequenceEnrollment.count({ where: { companyId: cid, status: 'ACTIVE', nextActionAt: { lte: new Date() } } }),
      (prisma as any).emailEvent.count({ where: { companyId: cid, eventType: { in: ['BOUNCED', 'HARD_BOUNCE'] } } }),
      (prisma as any).emailMessage.count({ where: { companyId: cid, status: { in: ['FAILED', 'DELIVERY_FAILED'] } } }),
      (prisma as any).emailSequence.count({ where: { companyId: cid, status: 'ACTIVE', isActive: true } }),
    ])
    res.json({ data: { activeLeads, emailsSentToday: sentToday, repliesToday, pendingFollowUps, bounces, failedEmails: failed, sequencesRunning: sequences } })
  } catch (err) { next(err) }
})

emailAutomationRouter.get('/sequences', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const rows = await (prisma as any).emailSequence.findMany({
      where: { companyId: cid, isActive: true },
      include: { steps: { where: { isActive: true }, orderBy: { stepNumber: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    })
    const data = await Promise.all(rows.map(async (row: any) => ({ ...row, stats: await sequenceStats(cid, row.id) })))
    res.json({ data })
  } catch (err) { next(err) }
})

emailAutomationRouter.post('/sequences', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const parsed = sequenceSchema.parse(req.body || {})
    const sequence = await (prisma as any).emailSequence.create({
      data: {
        companyId: cid,
        name: parsed.name,
        description: parsed.description || null,
        fromEmail: cleanEmail(parsed.fromEmail) || null,
        replyTo: cleanEmail(parsed.replyTo) || null,
        timezone: parsed.timezone,
        status: parsed.status,
        sendWindow: parsed.sendWindow || {},
        rateLimits: parsed.rateLimits || {},
        createdBy: req.user.userId,
        steps: { create: parsed.steps.map(step => ({ ...step, companyId: cid })) },
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    })
    await writeAudit({ moduleName: 'email-sequences', recordId: sequence.id, action: 'CREATE', userId: req.user.userId, companyId: cid })
    res.status(201).json({ data: sequence })
  } catch (err) { next(err) }
})

emailAutomationRouter.get('/sequences/:id', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const sequence = await (prisma as any).emailSequence.findFirst({ where: { id: req.params.id, companyId: cid, isActive: true }, include: { steps: { orderBy: { stepNumber: 'asc' } } } })
    if (!sequence) return res.status(404).json({ error: 'Sequence not found' })
    res.json({ data: { ...sequence, stats: await sequenceStats(cid, sequence.id) } })
  } catch (err) { next(err) }
})

emailAutomationRouter.get('/sequences/:id/leads', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const sequence = await (prisma as any).emailSequence.findFirst({ where: { id: req.params.id, companyId: cid, isActive: true }, select: { id: true } })
    if (!sequence) return res.status(404).json({ error: 'Sequence not found' })
    const search = String(req.query.search || '').trim()
    const leadStatus = String(req.query.leadStatus || '')
    const emailStatus = String(req.query.emailStatus || '')
    const enrollmentStatus = String(req.query.enrollmentStatus || 'all')
    const limit = Math.min(200, Math.max(25, Number(req.query.limit) || 100))
    const where: any = { companyId: cid, isActive: true, isConverted: false }
    if (search) {
      where.OR = ['firstName', 'lastName', 'company', 'email', 'phone'].map(field => ({ [field]: { contains: search, mode: 'insensitive' } }))
    }
    if (leadStatus && leadStatus !== 'all') where.leadStatus = leadStatus
    if (emailStatus && emailStatus !== 'all') where.emailStatus = emailStatus
    if (enrollmentStatus === 'missing_email') where.OR = [...(where.OR || []), { email: null }, { email: '' }]
    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, company: true, email: true, phone: true,
        leadStatus: true, emailStatus: true, emailOptOut: true, lastEmailAt: true, lastReplyAt: true,
        nextFollowUp: true, emailSequenceStatus: true, emailSequenceName: true, emailFollowUpCount: true,
      } as any,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
    const enrollments = await (prisma as any).leadSequenceEnrollment.findMany({
      where: { companyId: cid, sequenceId: req.params.id, leadId: { in: leads.map((lead: any) => lead.id) } },
      orderBy: { createdAt: 'desc' },
    })
    const enrollmentByLead = new Map<string, any>()
    for (const enrollment of enrollments) if (!enrollmentByLead.has(enrollment.leadId)) enrollmentByLead.set(enrollment.leadId, enrollment)
    let data = leads.map((lead: any) => ({ ...lead, enrollment: enrollmentByLead.get(lead.id) || null }))
    if (enrollmentStatus === 'available') data = data.filter((lead: any) => !lead.enrollment || !['ACTIVE', 'PAUSED'].includes(lead.enrollment.status))
    else if (['ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED', 'FAILED'].includes(enrollmentStatus)) data = data.filter((lead: any) => lead.enrollment?.status === enrollmentStatus)
    else if (enrollmentStatus === 'eligible') data = data.filter((lead: any) => lead.email && !lead.emailOptOut && !['REPLIED', 'BOUNCED', 'UNSUBSCRIBED', 'DELIVERY_FAILED'].includes(lead.emailStatus || ''))
    res.json({ data })
  } catch (err) { next(err) }
})

emailAutomationRouter.put('/sequences/:id', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const parsed = sequenceSchema.parse(req.body || {})
    const exists = await (prisma as any).emailSequence.findFirst({ where: { id: req.params.id, companyId: cid, isActive: true } })
    if (!exists) return res.status(404).json({ error: 'Sequence not found' })
    const sequence = await prisma.$transaction(async (tx) => {
      await (tx as any).emailSequenceStep.deleteMany({ where: { companyId: cid, sequenceId: req.params.id } })
      return (tx as any).emailSequence.update({
        where: { id: req.params.id },
        data: {
          name: parsed.name,
          description: parsed.description || null,
          fromEmail: cleanEmail(parsed.fromEmail) || null,
          replyTo: cleanEmail(parsed.replyTo) || null,
          timezone: parsed.timezone,
          status: parsed.status,
          sendWindow: parsed.sendWindow || {},
          rateLimits: parsed.rateLimits || {},
          steps: { create: parsed.steps.map(step => ({ ...step, companyId: cid })) },
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      })
    })
    await writeAudit({ moduleName: 'email-sequences', recordId: sequence.id, action: 'UPDATE', userId: req.user.userId, companyId: cid })
    res.json({ data: sequence })
  } catch (err) { next(err) }
})

emailAutomationRouter.delete('/sequences/:id', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const sequence = await (prisma as any).emailSequence.findFirst({ where: { id: req.params.id, companyId: cid } })
    if (!sequence) return res.status(404).json({ error: 'Sequence not found' })
    await (prisma as any).emailSequence.update({ where: { id: req.params.id }, data: { isActive: false, status: 'ARCHIVED' } })
    await writeAudit({ moduleName: 'email-sequences', recordId: req.params.id, action: 'DELETE', userId: req.user.userId, companyId: cid })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

for (const action of ['activate', 'pause'] as const) {
  emailAutomationRouter.post(`/sequences/:id/${action}`, async (req: any, res, next) => {
    try {
      const cid = companyId(req)
      const status = action === 'activate' ? 'ACTIVE' : 'PAUSED'
      const updated = await (prisma as any).emailSequence.updateMany({ where: { id: req.params.id, companyId: cid, isActive: true }, data: { status } })
      if (!updated.count) return res.status(404).json({ error: 'Sequence not found' })
      await writeAudit({ moduleName: 'email-sequences', recordId: req.params.id, action: 'ACTIVITY', fieldName: `SEQUENCE_${status}`, userId: req.user.userId, companyId: cid })
      res.json({ ok: true, status })
    } catch (err) { next(err) }
  })
}

emailAutomationRouter.post('/sequences/:id/enroll', async (req: any, res, next) => {
  try {
    const summary = await enrollLeadsInSequence({ companyId: companyId(req), sequenceId: req.params.id, leadIds: Array.isArray(req.body?.leadIds) ? req.body.leadIds : [], userId: req.user.userId })
    res.json({ data: summary })
  } catch (err) { next(err) }
})

emailAutomationRouter.get('/leads/:id', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, companyId: cid, isActive: true } as any })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const [enrollment, conversations, messages, replies, events, activities] = await Promise.all([
      (prisma as any).leadSequenceEnrollment.findFirst({ where: { companyId: cid, leadId: req.params.id }, include: { sequence: true }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).emailConversation.findMany({ where: { companyId: cid, leadId: req.params.id }, orderBy: { lastMessageAt: 'desc' } }),
      (prisma as any).emailMessage.findMany({ where: { companyId: cid, leadId: req.params.id }, orderBy: { createdAt: 'desc' } }),
      (prisma as any).emailReply.findMany({ where: { companyId: cid, leadId: req.params.id }, orderBy: { receivedAt: 'desc' } }),
      (prisma as any).emailEvent.findMany({ where: { companyId: cid, leadId: req.params.id }, orderBy: { eventTimestamp: 'desc' } }),
      (prisma as any).leadEmailActivity.findMany({ where: { companyId: cid, leadId: req.params.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ])
    res.json({ data: { lead, enrollment, conversations, messages, replies, events, activities } })
  } catch (err) { next(err) }
})

emailAutomationRouter.get('/leads/:id/emails', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, companyId: cid, isActive: true }, select: { id: true } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const messages = await (prisma as any).emailMessage.findMany({ where: { companyId: cid, leadId: req.params.id }, include: { events: true, replies: true }, orderBy: { createdAt: 'desc' } })
    res.json({ data: messages })
  } catch (err) { next(err) }
})

emailAutomationRouter.post('/leads/:leadId/sequences/:enrollmentId/:action', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const action = req.params.action
    const enrollment = await (prisma as any).leadSequenceEnrollment.findFirst({ where: { id: req.params.enrollmentId, leadId: req.params.leadId, companyId: cid } })
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })
    if (action === 'pause') {
      await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'PAUSED' } })
      await prisma.lead.updateMany({ where: { id: req.params.leadId, companyId: cid }, data: { emailStatus: 'SEQUENCE_PAUSED', emailSequenceStatus: 'PAUSED' } as any })
    } else if (action === 'resume') {
      await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'ACTIVE' } })
      await prisma.lead.updateMany({ where: { id: req.params.leadId, companyId: cid }, data: { emailStatus: 'SEQUENCE_ACTIVE', emailSequenceStatus: 'ACTIVE' } as any })
    } else if (action === 'stop') {
      await (prisma as any).leadSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'STOPPED', stopReason: 'MANUAL_STOP', stoppedAt: new Date(), nextActionAt: null } })
      await prisma.lead.updateMany({ where: { id: req.params.leadId, companyId: cid }, data: { emailStatus: 'SEQUENCE_STOPPED', emailSequenceStatus: 'STOPPED', nextFollowUp: null } as any })
    } else {
      return res.status(400).json({ error: 'Unsupported action' })
    }
    await writeAudit({ moduleName: 'email-sequences', recordId: enrollment.sequenceId, action: 'ACTIVITY', fieldName: `SEQUENCE_${action.toUpperCase()}`, userId: req.user.userId, companyId: cid })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

emailAutomationRouter.post('/emails/send', async (req: any, res, next) => {
  try {
    const cid = companyId(req)
    const leadId = String(req.body?.leadId || '')
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId: cid, isActive: true } as any })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const tempSequence = await (prisma as any).emailSequence.create({
      data: {
        companyId: cid,
        name: `Manual email: ${String(req.body?.subject || 'No subject').slice(0, 80)}`,
        status: 'ACTIVE',
        createdBy: req.user.userId,
        steps: { create: [{ companyId: cid, stepNumber: 1, subject: String(req.body?.subject || '').slice(0, 500), body: String(req.body?.body || ''), delayValue: 0, delayUnit: 'MINUTES' }] },
      },
    })
    const summary = await enrollLeadsInSequence({ companyId: cid, sequenceId: tempSequence.id, leadIds: [leadId], userId: req.user.userId })
    const enrollment = await (prisma as any).leadSequenceEnrollment.findFirst({ where: { companyId: cid, sequenceId: tempSequence.id, leadId } })
    const result = enrollment ? await sendNextSequenceStep(enrollment.id) : { ok: false, summary }
    res.json({ data: result })
  } catch (err) { next(err) }
})

emailWebhookRouter.post('/email/:provider', async (req: any, res, next) => {
  try {
    const provider = String(req.params.provider || 'internal').toUpperCase()
    const secret = process.env[`EMAIL_WEBHOOK_${provider}_SECRET`] || process.env.EMAIL_WEBHOOK_SECRET
    const raw = JSON.stringify(req.body || {})
    const signature = req.headers['x-email-signature']?.toString() || req.headers['x-webhook-signature']?.toString()
    if (!validateWebhookSignature(raw, signature, secret)) return res.status(401).json({ error: 'Invalid webhook signature' })
    const cid = String(req.body?.companyId || req.body?.tenant_id || req.body?.organization_id || '')
    if (!cid) return res.status(400).json({ error: 'Organization is required' })
    const type = String(req.body?.eventType || req.body?.event || req.body?.type || '').toUpperCase()
    if (type === 'REPLY' || type === 'REPLIED' || req.body?.reply) {
      const result = await processIncomingReply({
        companyId: cid,
        provider,
        providerMessageId: req.body.providerMessageId || req.body.message_id || null,
        messageId: req.body.messageId || req.body.message_id || null,
        inReplyTo: req.body.inReplyTo || req.body.in_reply_to || null,
        references: req.body.references || null,
        fromEmail: req.body.fromEmail || req.body.from || '',
        toEmail: req.body.toEmail || req.body.to || '',
        subject: req.body.subject || null,
        body: req.body.body || req.body.text || null,
        htmlBody: req.body.html || null,
      })
      return res.json({ ok: true, data: result })
    }
    const result = await processEmailProviderEvent({
      companyId: cid,
      provider,
      eventType: type,
      providerEventId: req.body.providerEventId || req.body.event_id || req.body.id || null,
      providerMessageId: req.body.providerMessageId || req.body.message_id || null,
      messageId: req.body.messageId || null,
      metadata: req.body,
    })
    res.json({ ok: true, data: result })
  } catch (err) { next(err) }
})
