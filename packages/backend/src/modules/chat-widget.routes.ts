import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const chatWidgetRouter = Router()
export const chatWidgetAdminRouter = Router()

chatWidgetRouter.get('/config', async (req, res, next) => {
  try {
    const { companyId } = req.query
    const widget = await prisma.chatWidget.findFirst({ where: { companyId: String(companyId || ''), isActive: true } })
    res.json({ data: widget || null })
  } catch (err) { next(err) }
})

chatWidgetRouter.post('/sessions', async (req, res, next) => {
  try {
    const { widgetId, visitorName, visitorEmail, visitorIp, userAgent } = req.body || {}
    const widget = widgetId ? await prisma.chatWidget.findFirst({ where: { id: widgetId, isActive: true } }) : null
    if (!widget) return res.status(404).json({ error: 'Active chat widget not found' })
    const session = await prisma.chatSession.create({
      data: {
        widgetId: widgetId || null, visitorName, visitorEmail, visitorIp, userAgent,
        status: 'active', companyId: widget.companyId,
      },
    })
    res.status(201).json({ data: session, visitorToken: session.visitorToken })
  } catch (err) { next(err) }
})

chatWidgetRouter.post('/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { body, visitorToken } = req.body || {}
    if (!body) return res.status(400).json({ error: 'body is required' })
    const session = await prisma.chatSession.findFirst({ where: { id, visitorToken: String(visitorToken || '') } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const message = await prisma.chatSessionMessage.create({
      data: { sessionId: id, senderType: 'visitor', body },
    })
    res.status(201).json({ data: message })
  } catch (err) { next(err) }
})

chatWidgetRouter.get('/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const session = await prisma.chatSession.findFirst({ where: { id, visitorToken: String(req.query.visitorToken || '') } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const data = await prisma.chatSessionMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.use(authMiddleware)

chatWidgetAdminRouter.get('/admin/config', async (req, res, next) => {
  try {
    const widget = await prisma.chatWidget.findFirst({ where: { companyId: req.user!.companyId || undefined } })
    res.json({ data: widget || null })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.put('/admin/config', async (req, res, next) => {
  try {
    const { name, color, welcomeMsg, offlineMsg, position, isActive } = req.body || {}
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'Organization required' })
    const existing = await prisma.chatWidget.findFirst({ where: { companyId } })
    const data: any = {}
    if (name !== undefined) data.name = String(name).slice(0, 200)
    if (color !== undefined) data.color = String(color).slice(0, 20)
    if (welcomeMsg !== undefined) data.welcomeMsg = String(welcomeMsg).slice(0, 500) || null
    if (offlineMsg !== undefined) data.offlineMsg = String(offlineMsg).slice(0, 500) || null
    if (position !== undefined) data.position = ['bottom-right', 'bottom-left', 'bottom-center'].includes(position) ? position : 'bottom-right'
    if (isActive !== undefined) data.isActive = !!isActive
    const widget = existing
      ? await prisma.chatWidget.update({ where: { id: existing.id }, data })
      : await prisma.chatWidget.create({ data: { name: name || 'Live Chat', companyId, createdBy: req.user!.userId, ...data } })
    res.json({ data: widget })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.get('/admin/sessions', async (req, res, next) => {
  try {
    const { status } = req.query
    const where: any = { companyId: req.user!.companyId || undefined }
    if (status) where.status = String(status)
    const data = await prisma.chatSession.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ data })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.get('/admin/sessions/:id/messages', async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const data = await prisma.chatSessionMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.post('/admin/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { body } = req.body || {}
    if (!body) return res.status(400).json({ error: 'body is required' })
    const session = await prisma.chatSession.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const message = await prisma.chatSessionMessage.create({
      data: { sessionId: id, senderType: 'agent', senderId: req.user!.userId, body },
    })
    res.status(201).json({ data: message })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.put('/admin/sessions/:id/assign', async (req, res, next) => {
  try {
    const { id } = req.params
    const { assignedTo } = req.body || {}
    const session = await prisma.chatSession.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (assignedTo) {
      const assignee = await prisma.user.findFirst({ where: { id: assignedTo, companyId: req.user!.companyId || undefined, isActive: true } })
      if (!assignee) return res.status(400).json({ error: 'Assignee not found in this organization' })
    }
    const updated = await prisma.chatSession.update({ where: { id }, data: { assignedTo } })
    res.json({ data: updated })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.put('/admin/sessions/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params
    const session = await prisma.chatSession.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const updated = await prisma.chatSession.update({ where: { id }, data: { status: 'closed', endedAt: new Date() } })
    res.json({ data: updated })
  } catch (err) { next(err) }
})
