import { Router, Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { publishSupportEvent } from '../lib/support-events'

const messageLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false })
const createLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false })
const STATUSES = ['AI_ACTIVE', 'WAITING_FOR_AGENT', 'AGENT_ASSIGNED', 'AGENT_ACTIVE', 'RESOLVED', 'CLOSED'] as const
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const

export const supportRouter = Router()
export const adminSupportRouter = Router()
supportRouter.use(authMiddleware)
adminSupportRouter.use(authMiddleware)

function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId || !req.user.isAdmin || req.user.isSuperAdmin) return res.status(403).json({ error: 'Organization admin access required' })
  next()
}

function requireSupportStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin && !req.user?.isAgent) return res.status(403).json({ error: 'Support agent access required' })
  next()
}

supportRouter.use(requireOrgAdmin)
adminSupportRouter.use(requireSupportStaff)

function cleanText(value: unknown, max = 4000) {
  return String(value || '').trim().slice(0, max)
}

async function audit(conversationId: string, companyId: string, actorUserId: string | undefined, action: string, metadata?: any) {
  await prisma.supportAuditEvent.create({ data: { conversationId, companyId, actorUserId: actorUserId || null, action, metadata: metadata || undefined } }).catch(() => {})
}

async function customerConversation(req: Request, id: string) {
  return prisma.supportConversation.findFirst({ where: { id, companyId: req.user!.companyId! } })
}

async function staffConversation(req: Request, id: string, allowWaiting = false) {
  const conversation = await prisma.supportConversation.findUnique({ where: { id } })
  if (!conversation) return null
  if (req.user!.isSuperAdmin) return conversation
  if (conversation.assignedAgentId === req.user!.userId) return conversation
  if (allowWaiting && conversation.status === 'WAITING_FOR_AGENT' && !conversation.assignedAgentId) return conversation
  return null
}

async function enrich(conversations: any[]) {
  const companyIds = [...new Set(conversations.map(c => c.companyId))]
  const userIds = [...new Set(conversations.flatMap(c => [c.createdByUserId, c.assignedAgentId]).filter(Boolean))]
  const [companies, users] = await Promise.all([
    prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true, email: true, isActive: true, createdAt: true, _count: { select: { users: true } } } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastLogin: true, lastActiveAt: true } }),
  ])
  const companyMap = new Map(companies.map(c => [c.id, c]))
  const userMap = new Map(users.map(u => [u.id, u]))
  return conversations.map(c => ({ ...c, company: companyMap.get(c.companyId), customer: userMap.get(c.createdByUserId), assignedAgent: c.assignedAgentId ? userMap.get(c.assignedAgentId) : null }))
}

function aiAnswer(message: string) {
  const lower = message.toLowerCase()
  if (/upgrade|plan|subscription|billing/.test(lower)) return 'An organisation admin can review subscription and billing information from Settings. If the required billing action is unavailable, select “Talk to an Agent” and our support team will assist without losing this conversation.'
  if (/add.*user|create.*user|invite/.test(lower)) return 'Open Settings → Users and select New User. Complete the user details, assign a role and group, then save. Confirm that the selected role has the required module permissions.'
  if (/currency/.test(lower)) return 'Organisation currencies are managed in Settings → Currencies. The active default currency is used on new quotes and sales documents, while other active currencies remain selectable.'
  if (/pdf|letter.?head|logo/.test(lower)) return 'Configure the active master document in Settings → Master Documents. Its organisation logo, header and footer are then used by supported quotation, order and invoice print views.'
  if (/backup/.test(lower)) return 'Full system backups (database, uploaded files and configuration) are available to Super Admins from Super Admin → Settings → System Backups.'
  if (/error|failed|not working|technical|bug/.test(lower)) return 'I can help troubleshoot this. Please include the page address, the action you attempted, and the exact error message. You can also select “Talk to an Agent” at any time.'
  return 'I can help with users, permissions, currencies, PDF templates, reports, backups and common CRM workflows. If you need hands-on assistance, select “Talk to an Agent” and the complete conversation will be transferred.'
}

async function notifyStaff(conversation: any) {
  const staff = await prisma.user.findMany({
    where: { isActive: true, OR: [{ isAgent: true }, { profile: { is: { isSuperAdmin: true } } }] },
    select: { id: true, isAgent: true, profile: { select: { isSuperAdmin: true } } },
  })
  if (staff.length) await prisma.notification.createMany({ data: staff.map(user => ({
    userId: user.id,
    title: conversation.assignedAgentId === user.id ? 'Support request assigned to you' : 'New support request',
    message: conversation.subject || 'An organization requested a support agent',
    link: user.profile?.isSuperAdmin ? `/superadmin/support?id=${conversation.id}` : `/support-agent?id=${conversation.id}`,
    companyId: conversation.companyId,
  })) }).catch(() => {})
}

async function notifyAssignedAgent(conversation: any, agentId: string, title = 'Support request assigned to you') {
  await prisma.notification.create({
    data: { userId: agentId, title, message: conversation.subject || 'Open the conversation to respond', link: `/support-agent?id=${conversation.id}`, companyId: conversation.companyId },
  }).catch(() => {})
}

async function nextAvailableAgent() {
  const presenceCutoff = new Date(Date.now() - 5 * 60_000)
  const agents = await prisma.user.findMany({
    where: { isAgent: true, isActive: true, lastActiveAt: { gte: presenceCutoff } },
    select: { id: true, firstName: true, lastName: true, lastActiveAt: true },
  })
  if (!agents.length) return null
  const workloads = await prisma.supportConversation.groupBy({
    by: ['assignedAgentId'],
    where: { assignedAgentId: { in: agents.map(agent => agent.id) }, status: { in: ['AGENT_ASSIGNED', 'AGENT_ACTIVE'] } },
    _count: { _all: true },
  })
  const countByAgent = new Map(workloads.map(row => [row.assignedAgentId, row._count._all]))
  return agents.sort((left, right) => {
    const workloadDifference = (countByAgent.get(left.id) || 0) - (countByAgent.get(right.id) || 0)
    if (workloadDifference) return workloadDifference
    return (left.lastActiveAt?.getTime() || 0) - (right.lastActiveAt?.getTime() || 0)
  })[0]
}

supportRouter.post('/conversations', createLimiter, async (req, res, next) => {
  try {
    const subject = cleanText(req.body.subject, 240) || 'Support request'
    const initialMessage = cleanText(req.body.message)
    const conversation = await prisma.supportConversation.create({ data: { companyId: req.user!.companyId!, createdByUserId: req.user!.userId, subject, customerLastReadAt: new Date() } })
    await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'AI', messageType: 'TEXT', content: 'Hello! I’m the BizForce support assistant. How can I help you today?' } })
    if (initialMessage) {
      await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'CUSTOMER', senderId: req.user!.userId, content: initialMessage } })
      await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'AI', content: aiAnswer(initialMessage) } })
    }
    await audit(conversation.id, conversation.companyId, req.user!.userId, 'CONVERSATION_CREATED')
    publishSupportEvent({ event: 'conversation.created', conversationId: conversation.id, companyId: conversation.companyId, payload: conversation })
    res.status(201).json({ data: conversation })
  } catch (err) { next(err) }
})

supportRouter.get('/conversations', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const where = { companyId: req.user!.companyId! }
    const [rows, total] = await Promise.all([
      prisma.supportConversation.findMany({ where, orderBy: { lastMessageAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      prisma.supportConversation.count({ where }),
    ])
    res.json({ data: await enrich(rows), pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

supportRouter.get('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const [item] = await enrich([conversation])
    res.json({ data: item })
  } catch (err) { next(err) }
})

supportRouter.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const cursor = cleanText(req.query.cursor, 100)
    const rows = await prisma.supportMessage.findMany({ where: { conversationId: conversation.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
    const hasMore = rows.length > limit; const page = rows.slice(0, limit)
    res.json({ data: page.reverse(), nextCursor: hasMore ? page[page.length - 1]?.id : null })
  } catch (err) { next(err) }
})

supportRouter.post('/conversations/:id/messages', messageLimiter, async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.status === 'CLOSED') return res.status(409).json({ error: 'This conversation is closed. Start a new conversation.' })
    const content = cleanText(req.body.content)
    if (!content) return res.status(400).json({ error: 'Message is required' })
    const clientMessageId = cleanText(req.body.clientMessageId, 100) || null
    if (clientMessageId) {
      const existing = await prisma.supportMessage.findFirst({ where: { conversationId: conversation.id, clientMessageId } })
      if (existing) return res.json({ data: existing, duplicate: true })
    }
    if (conversation.status === 'RESOLVED') {
      await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'WAITING_FOR_AGENT', humanRequested: true, aiEnabled: false, resolvedAt: null } })
      await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: 'Conversation reopened and returned to the support queue.' } })
    }
    const message = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'CUSTOMER', senderId: req.user!.userId, content, clientMessageId } })
    await prisma.supportConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: message.createdAt, customerLastReadAt: new Date() } })
    publishSupportEvent({ event: 'message.created', conversationId: conversation.id, companyId: conversation.companyId, payload: message })
    let aiMessage = null
    if (conversation.status === 'AI_ACTIVE' && conversation.aiEnabled) {
      aiMessage = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'AI', content: aiAnswer(content) } })
      await prisma.supportConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: aiMessage.createdAt } })
      publishSupportEvent({ event: 'message.created', conversationId: conversation.id, companyId: conversation.companyId, payload: aiMessage })
    }
    res.status(201).json({ data: message, aiMessage })
  } catch (err) { next(err) }
})

supportRouter.post('/conversations/:id/request-agent', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.status !== 'AI_ACTIVE') return res.status(409).json({ error: 'A support agent has already been requested' })
    const availableAgent = await nextAvailableAgent()
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: availableAgent ? 'AGENT_ASSIGNED' : 'WAITING_FOR_AGENT', assignedAgentId: availableAgent?.id || null, humanRequested: true, aiEnabled: false, priority: PRIORITIES.includes(req.body.priority) ? req.body.priority : conversation.priority } })
    const agentName = availableAgent ? [availableAgent.firstName, availableAgent.lastName].filter(Boolean).join(' ') || 'a support agent' : ''
    const systemMessage = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: availableAgent ? `You requested human support. This conversation was assigned to ${agentName}.` : 'You requested to speak with a support agent. Your conversation has been added to the support queue.' } })
    const ahead = availableAgent ? -1 : await prisma.supportConversation.count({ where: { status: 'WAITING_FOR_AGENT', OR: [{ priority: { in: ['URGENT', 'HIGH'] }, createdAt: { lt: conversation.createdAt } }, { priority: updated.priority, createdAt: { lt: conversation.createdAt } }] } })
    await notifyStaff(updated); await audit(updated.id, updated.companyId, req.user!.userId, 'AGENT_REQUESTED')
    if (availableAgent) await audit(updated.id, updated.companyId, availableAgent.id, 'CONVERSATION_AUTO_ASSIGNED')
    publishSupportEvent({ event: availableAgent ? 'conversation.assigned' : 'conversation.status_changed', conversationId: updated.id, companyId: updated.companyId, userId: availableAgent?.id, payload: updated })
    res.json({ data: updated, systemMessage, queuePosition: availableAgent ? null : ahead + 1, assignedAgent: availableAgent })
  } catch (err) { next(err) }
})

supportRouter.post('/conversations/:id/read', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    await prisma.supportConversation.update({ where: { id: conversation.id }, data: { customerLastReadAt: new Date() } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

supportRouter.post('/conversations/:id/reopen', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.status !== 'RESOLVED') return res.status(409).json({ error: 'Only a resolved conversation can be reopened' })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'WAITING_FOR_AGENT', humanRequested: true, aiEnabled: false, resolvedAt: null } })
    const message = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: 'The customer reopened this conversation.' } })
    await notifyStaff(updated); await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_REOPENED')
    publishSupportEvent({ event: 'conversation.status_changed', conversationId: updated.id, companyId: updated.companyId, payload: updated })
    res.json({ data: updated, systemMessage: message })
  } catch (err) { next(err) }
})

supportRouter.post('/conversations/:id/close', async (req, res, next) => {
  try {
    const conversation = await customerConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.status === 'CLOSED') return res.json({ data: conversation })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'CLOSED', closedAt: new Date(), aiEnabled: false } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_CLOSED')
    publishSupportEvent({ event: 'conversation.closed', conversationId: updated.id, companyId: updated.companyId, payload: updated })
    res.json({ data: updated })
  } catch (err) { next(err) }
})

// Super Admin / support agent inbox
adminSupportRouter.get('/conversations', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25))
    const where: any = {}
    if (!req.user!.isSuperAdmin) where.OR = [{ assignedAgentId: req.user!.userId }, { status: 'WAITING_FOR_AGENT', assignedAgentId: null }]
    if (STATUSES.includes(req.query.status as any)) where.status = req.query.status
    if (PRIORITIES.includes(req.query.priority as any)) where.priority = req.query.priority
    if (req.query.companyId && req.user!.isSuperAdmin) where.companyId = String(req.query.companyId)
    const search = cleanText(req.query.search, 200)
    if (search) {
      const [companies, users, messageConversations] = await Promise.all([
        prisma.company.findMany({ where: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }, select: { id: true } }),
        prisma.user.findMany({ where: { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }, select: { id: true } }),
        prisma.supportMessage.findMany({ where: { content: { contains: search, mode: 'insensitive' } }, distinct: ['conversationId'], select: { conversationId: true }, take: 200 }),
      ])
      where.AND = [{ OR: [{ id: { contains: search, mode: 'insensitive' } }, { subject: { contains: search, mode: 'insensitive' } }, { companyId: { in: companies.map(c => c.id) } }, { createdByUserId: { in: users.map(u => u.id) } }, { id: { in: messageConversations.map(m => m.conversationId) } }] }]
    }
    const [rows, total] = await Promise.all([
      prisma.supportConversation.findMany({ where, orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }], skip: (page - 1) * limit, take: limit, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      prisma.supportConversation.count({ where }),
    ])
    res.json({ data: await enrich(rows), pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

adminSupportRouter.get('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id, true)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const [item] = await enrich([conversation]); res.json({ data: item })
  } catch (err) { next(err) }
})

adminSupportRouter.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id, true)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const rows = await prisma.supportMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'asc' }, take: 100 })
    res.json({ data: rows })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/claim', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id, true)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    const claimed = await prisma.supportConversation.updateMany({ where: { id: conversation.id, status: 'WAITING_FOR_AGENT', assignedAgentId: null }, data: { status: 'AGENT_ASSIGNED', assignedAgentId: req.user!.userId, aiEnabled: false } })
    if (claimed.count === 0) return res.status(409).json({ error: 'Another agent already claimed this conversation' })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'AGENT_ACTIVE', agentLastReadAt: new Date() } })
    const agent = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true } })
    const systemMessage = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: `${[agent?.firstName, agent?.lastName].filter(Boolean).join(' ') || 'A support agent'} joined the conversation.` } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_CLAIMED')
    publishSupportEvent({ event: 'conversation.assigned', conversationId: updated.id, companyId: updated.companyId, userId: req.user!.userId, payload: { conversation: updated, systemMessage } })
    res.json({ data: updated, systemMessage })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/accept', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id, true)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.assignedAgentId !== req.user!.userId) return res.status(403).json({ error: 'This conversation is assigned to another agent' })
    const accepted = await prisma.supportConversation.updateMany({
      where: { id: conversation.id, status: 'AGENT_ASSIGNED', assignedAgentId: req.user!.userId },
      data: { status: 'AGENT_ACTIVE', agentLastReadAt: new Date(), aiEnabled: false },
    })
    if (accepted.count === 0) return res.status(409).json({ error: 'Conversation is no longer awaiting acceptance' })
    const updated = await prisma.supportConversation.findUniqueOrThrow({ where: { id: conversation.id } })
    const agent = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true } })
    const agentName = [agent?.firstName, agent?.lastName].filter(Boolean).join(' ') || 'A support agent'
    const systemMessage = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: `${agentName} accepted the conversation and is ready to help.` } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_ACCEPTED')
    publishSupportEvent({ event: 'conversation.status_changed', conversationId: updated.id, companyId: updated.companyId, userId: req.user!.userId, payload: { conversation: updated, systemMessage } })
    res.json({ data: updated, systemMessage })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/messages', messageLimiter, async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found or not assigned to you' })
    if (conversation.status !== 'AGENT_ACTIVE') return res.status(409).json({ error: 'Accept this conversation before replying' })
    const content = cleanText(req.body.content)
    if (!content) return res.status(400).json({ error: 'Message is required' })
    const message = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'AGENT', senderId: req.user!.userId, content, clientMessageId: cleanText(req.body.clientMessageId, 100) || null } })
    await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'AGENT_ACTIVE', lastMessageAt: message.createdAt, firstAgentResponseAt: conversation.firstAgentResponseAt || message.createdAt, agentLastReadAt: new Date() } })
    publishSupportEvent({ event: 'message.created', conversationId: conversation.id, companyId: conversation.companyId, userId: req.user!.userId, payload: message })
    res.status(201).json({ data: message })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/resolve', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (!['AGENT_ASSIGNED', 'AGENT_ACTIVE'].includes(conversation.status)) return res.status(409).json({ error: 'Only an active conversation can be resolved' })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'RESOLVED', resolvedAt: new Date(), aiEnabled: false } })
    const message = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: 'Your support request has been resolved. You can reopen it by sending another message.' } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_RESOLVED')
    publishSupportEvent({ event: 'conversation.status_changed', conversationId: updated.id, companyId: updated.companyId, payload: updated })
    res.json({ data: updated, systemMessage: message })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/priority', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id, true)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (!PRIORITIES.includes(req.body.priority)) return res.status(400).json({ error: 'Invalid priority' })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { priority: req.body.priority } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'PRIORITY_CHANGED', { priority: updated.priority })
    publishSupportEvent({ event: 'conversation.updated', conversationId: updated.id, companyId: updated.companyId, payload: updated })
    res.json({ data: updated })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/transfer', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found or not assigned to you' })
    const targetAgentId = cleanText(req.body.agentId, 100)
    const target = await prisma.user.findFirst({ where: { id: targetAgentId, isActive: true, isAgent: true }, select: { id: true, firstName: true, lastName: true } })
    if (!target) return res.status(400).json({ error: 'Select an active support agent' })
    const source = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true } })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { assignedAgentId: target.id, status: 'AGENT_ASSIGNED', agentLastReadAt: null } })
    const sourceName = [source?.firstName, source?.lastName].filter(Boolean).join(' ') || 'Support'
    const targetName = [target.firstName, target.lastName].filter(Boolean).join(' ') || 'another agent'
    const message = await prisma.supportMessage.create({ data: { conversationId: conversation.id, senderType: 'SYSTEM', messageType: 'SYSTEM', content: `Conversation transferred from ${sourceName} to ${targetName}.` } })
    await notifyAssignedAgent(updated, target.id, 'A support conversation was transferred to you')
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_TRANSFERRED', { toAgentId: target.id, reason: cleanText(req.body.reason, 500) })
    publishSupportEvent({ event: 'conversation.assigned', conversationId: updated.id, companyId: updated.companyId, userId: target.id, payload: { conversation: updated, systemMessage: message } })
    res.json({ data: updated, systemMessage: message })
  } catch (err) { next(err) }
})

adminSupportRouter.post('/conversations/:id/reopen', async (req, res, next) => {
  try {
    const conversation = await staffConversation(req, req.params.id)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (!['RESOLVED', 'CLOSED'].includes(conversation.status)) return res.status(409).json({ error: 'Conversation is already open' })
    const updated = await prisma.supportConversation.update({ where: { id: conversation.id }, data: { status: 'WAITING_FOR_AGENT', assignedAgentId: null, resolvedAt: null, closedAt: null, humanRequested: true, aiEnabled: false } })
    await audit(updated.id, updated.companyId, req.user!.userId, 'CONVERSATION_REOPENED')
    publishSupportEvent({ event: 'conversation.status_changed', conversationId: updated.id, companyId: updated.companyId, payload: updated })
    res.json({ data: updated })
  } catch (err) { next(err) }
})

adminSupportRouter.get('/agents', async (_req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60_000)
    const users = await prisma.user.findMany({ where: { isAgent: true, isActive: true }, select: { id: true, firstName: true, lastName: true, email: true, avatar: true, lastActiveAt: true } })
    res.json({ data: users.map(user => ({ ...user, online: !!user.lastActiveAt && user.lastActiveAt >= cutoff })) })
  } catch (err) { next(err) }
})

adminSupportRouter.get('/stats', async (req, res, next) => {
  try {
    const where = req.user!.isSuperAdmin ? {} : { OR: [{ assignedAgentId: req.user!.userId }, { status: 'WAITING_FOR_AGENT' as const, assignedAgentId: null }] }
    const grouped = await prisma.supportConversation.groupBy({ by: ['status'], where, _count: { _all: true } })
    res.json({ data: Object.fromEntries(grouped.map(row => [row.status, row._count._all])) })
  } catch (err) { next(err) }
})
