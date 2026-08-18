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
    const session = await prisma.chatSession.create({
      data: {
        widgetId: widgetId || null, visitorName, visitorEmail, visitorIp, userAgent,
        status: 'active', companyId: null,
      },
    })
    res.status(201).json({ data: session })
  } catch (err) { next(err) }
})

chatWidgetRouter.post('/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { body, senderType, senderId } = req.body || {}
    if (!body) return res.status(400).json({ error: 'body is required' })
    const session = await prisma.chatSession.findUnique({ where: { id } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const message = await prisma.chatSessionMessage.create({
      data: { sessionId: id, senderType: senderType || 'visitor', senderId, body },
    })
    res.status(201).json({ data: message })
  } catch (err) { next(err) }
})

chatWidgetRouter.get('/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await prisma.chatSessionMessage.findMany({ where: { sessionId: id }, orderBy: { createdAt: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.use(authMiddleware)

chatWidgetAdminRouter.get('/admin/sessions', async (req, res, next) => {
  try {
    const { status } = req.query
    const where: any = { companyId: req.user!.companyId || undefined }
    if (status) where.status = String(status)
    const data = await prisma.chatSession.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ data })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.post('/admin/sessions/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { body } = req.body || {}
    if (!body) return res.status(400).json({ error: 'body is required' })
    const session = await prisma.chatSession.findUnique({ where: { id } })
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
    const session = await prisma.chatSession.findUnique({ where: { id } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const updated = await prisma.chatSession.update({ where: { id }, data: { assignedTo } })
    res.json({ data: updated })
  } catch (err) { next(err) }
})

chatWidgetAdminRouter.put('/admin/sessions/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params
    const session = await prisma.chatSession.findUnique({ where: { id } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const updated = await prisma.chatSession.update({ where: { id }, data: { status: 'closed', endedAt: new Date() } })
    res.json({ data: updated })
  } catch (err) { next(err) }
})
