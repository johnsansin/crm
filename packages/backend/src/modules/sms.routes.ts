import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'

export const smsRouter = Router()
smsRouter.use(authMiddleware)
smsRouter.use(requireModulePermission('smsnotifier'))

smsRouter.get('/templates', async (req, res, next) => {
  try {
    const data = await prisma.smsTemplate.findMany({ where: { companyId: req.user!.companyId || undefined, isActive: true }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

smsRouter.post('/templates', async (req, res, next) => {
  try {
    const { name, body, module, variables } = req.body || {}
    if (!name || !body) return res.status(400).json({ error: 'name and body are required' })
    const template = await prisma.smsTemplate.create({
      data: { name, body, module, variables: variables || [], companyId: req.user!.companyId || null, createdBy: req.user!.userId },
    })
    res.status(201).json({ data: template })
  } catch (err) { next(err) }
})

smsRouter.put('/templates/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.smsTemplate.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Template not found' })
    const data: any = {}
    for (const key of ['name', 'body', 'module', 'isActive']) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.variables !== undefined) data.variables = req.body.variables
    const template = await prisma.smsTemplate.update({ where: { id }, data })
    res.json({ data: template })
  } catch (err) { next(err) }
})

smsRouter.delete('/templates/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.smsTemplate.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Template not found' })
    await prisma.smsTemplate.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

smsRouter.post('/send', async (req, res, next) => {
  try {
    const { toNumber, fromNumber, message } = req.body || {}
    if (!toNumber || !message) return res.status(400).json({ error: 'toNumber and message are required' })
    const log = await prisma.smsNotifier.create({
      data: {
        toNumber, fromNumber, message, status: 'Sent',
        companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: log })
  } catch (err) { next(err) }
})

smsRouter.post('/bulk', async (req, res, next) => {
  try {
    const { toNumbers, fromNumber, message } = req.body || {}
    if (!Array.isArray(toNumbers) || !toNumbers.length || !message) {
      return res.status(400).json({ error: 'toNumbers array and message are required' })
    }
    const companyId = req.user!.companyId || null
    const createdBy = req.user!.userId
    const result = await prisma.smsNotifier.createMany({
      data: toNumbers.map((num: string) => ({ toNumber: num, fromNumber, message, status: 'Sent', companyId, createdBy })),
    })
    res.status(201).json({ success: true, sentCount: result.count })
  } catch (err) { next(err) }
})

smsRouter.get('/logs', async (req, res, next) => {
  try {
    const data = await prisma.smsNotifier.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ data })
  } catch (err) { next(err) }
})
