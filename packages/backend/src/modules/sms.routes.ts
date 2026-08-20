import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'
import { requireAdmin } from '../middleware/auth'
import { getSmsConfig, publicSmsConfig, sendSms, verifySmsConfig } from '../lib/sms-provider'
import { setGlobalSetting, setOrgSetting } from '../lib/settings'

export const smsRouter = Router()
smsRouter.use(authMiddleware)
smsRouter.use(requireModulePermission('smsnotifier'))

smsRouter.get('/config', async (req, res, next) => {
  try { res.json({ data: publicSmsConfig(await getSmsConfig(req.user!.companyId)) }) } catch (err) { next(err) }
})

smsRouter.put('/config', requireAdmin, async (req, res, next) => {
  try {
    const current = await getSmsConfig(req.user!.companyId)
    const config = {
      provider: 'twilio' as const,
      accountSid: String(req.body?.accountSid || '').trim(),
      authToken: String(req.body?.authToken || '').trim() || current.authToken,
      fromNumber: String(req.body?.fromNumber || '').trim(),
    }
    await verifySmsConfig(config)
    if (req.user!.companyId) await setOrgSetting(req.user!.companyId, 'sms', config)
    else if (req.user!.isSuperAdmin) await setGlobalSetting('sms', config)
    else return res.status(403).json({ error: 'Organization is required' })
    res.json({ data: publicSmsConfig(config), message: 'SMS provider verified and saved successfully' })
  } catch (err) { next(err) }
})

smsRouter.post('/config/test', requireAdmin, async (req, res, next) => {
  try {
    const current = await getSmsConfig(req.user!.companyId)
    const config = { ...current, ...req.body, authToken: String(req.body?.authToken || '').trim() || current.authToken }
    await verifySmsConfig(config)
    res.json({ success: true, message: 'Twilio connection verified successfully' })
  } catch (err) { next(err) }
})

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
        toNumber, fromNumber, message, status: 'Queued',
        companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    try {
      const delivery = await sendSms(req.user!.companyId!, String(toNumber).trim(), String(message), fromNumber)
      const sent = await prisma.smsNotifier.update({ where: { id: log.id }, data: { status: 'Sent', fromNumber: fromNumber || (await getSmsConfig(req.user!.companyId)).fromNumber } })
      res.status(201).json({ data: sent, delivery })
    } catch (error: any) {
      await prisma.smsNotifier.update({ where: { id: log.id }, data: { status: 'Failed' } }).catch(() => {})
      res.status(502).json({ error: error?.message || 'SMS provider rejected the message' })
    }
  } catch (err) { next(err) }
})

smsRouter.post('/bulk', async (req, res, next) => {
  try {
    const { toNumbers, fromNumber, message } = req.body || {}
    if (!Array.isArray(toNumbers) || !toNumbers.length || !message) {
      return res.status(400).json({ error: 'toNumbers array and message are required' })
    }
    if (toNumbers.length > 100) return res.status(400).json({ error: 'Bulk SMS is limited to 100 recipients per request' })
    const normalized = Array.from(new Set(toNumbers.map((value: any) => String(value).trim()).filter(Boolean)))
    const companyId = req.user!.companyId!
    const createdBy = req.user!.userId
    let sentCount = 0
    const errors: { toNumber: string; error: string }[] = []
    for (const toNumber of normalized) {
      const log = await prisma.smsNotifier.create({ data: { toNumber, fromNumber, message, status: 'Queued', companyId, createdBy } })
      try {
        await sendSms(companyId, toNumber, String(message), fromNumber)
        await prisma.smsNotifier.update({ where: { id: log.id }, data: { status: 'Sent' } })
        sentCount++
      } catch (error: any) {
        await prisma.smsNotifier.update({ where: { id: log.id }, data: { status: 'Failed' } }).catch(() => {})
        errors.push({ toNumber, error: error?.message || 'Failed' })
      }
    }
    res.status(sentCount ? 201 : 502).json({ success: errors.length === 0, sentCount, failedCount: errors.length, errors })
  } catch (err) { next(err) }
})

smsRouter.get('/logs', async (req, res, next) => {
  try {
    const data = await prisma.smsNotifier.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ data })
  } catch (err) { next(err) }
})
