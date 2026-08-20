import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'

export const emailCampaignsRouter = Router()
emailCampaignsRouter.use(authMiddleware)
emailCampaignsRouter.use(requireModulePermission('campaigns'))

emailCampaignsRouter.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    const where: any = { companyId: req.user!.companyId || undefined, isActive: true }
    if (status) where.status = String(status)
    const data = await prisma.emailCampaign.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ data })
  } catch (err) { next(err) }
})

emailCampaignsRouter.post('/', async (req, res, next) => {
  try {
    const { campaignName, subject, body, plainBody, fromEmail, fromName, replyTo, status, scheduledAt, recipientType, recipientFilter, templateId } = req.body || {}
    if (!campaignName || !subject || !body) return res.status(400).json({ error: 'campaignName, subject, and body are required' })
    const campaign = await prisma.emailCampaign.create({
      data: {
        campaignName, subject, body, plainBody, fromEmail, fromName, replyTo,
        status: status || 'Draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recipientType, recipientFilter: recipientFilter || {},
        templateId, companyId: req.user!.companyId || null,
        createdBy: req.user!.userId, assignedTo: req.user!.userId,
      },
    })
    res.status(201).json({ data: campaign })
  } catch (err) { next(err) }
})

emailCampaignsRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Campaign not found' })
    const data: any = {}
    for (const key of ['campaignName', 'subject', 'body', 'plainBody', 'fromEmail', 'fromName', 'replyTo', 'status', 'recipientType', 'templateId']) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.recipientFilter !== undefined) data.recipientFilter = req.body.recipientFilter
    if (req.body.scheduledAt !== undefined) data.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null
    const campaign = await prisma.emailCampaign.update({ where: { id }, data })
    res.json({ data: campaign })
  } catch (err) { next(err) }
})

emailCampaignsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Campaign not found' })
    await prisma.emailCampaign.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

emailCampaignsRouter.post('/:id/send', async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    if (campaign.status === 'Sent') return res.status(400).json({ error: 'Campaign already sent' })
    const recipients = await prisma.emailCampaignRecipient.findMany({ where: { campaignId: id, status: 'Pending' } })
    if (recipients.length === 0) return res.status(400).json({ error: 'No pending recipients' })
    const now = new Date()
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'Sent', sentAt: now, recipientCount: recipients.length },
    })
    await prisma.emailCampaignRecipient.updateMany({
      where: { campaignId: id, status: 'Pending' },
      data: { status: 'Sent', sentAt: now },
    })
    res.json({ success: true, sentCount: recipients.length })
  } catch (err) { next(err) }
})

emailCampaignsRouter.post('/:id/test', async (req, res, next) => {
  try {
    const { id } = req.params
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'email is required' })
    const campaign = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    const recipient = await prisma.emailCampaignRecipient.create({
      data: { campaignId: id, email, name: 'Test Recipient', status: 'Sent', sentAt: new Date(), companyId: req.user!.companyId || null },
    })
    await prisma.emailCampaign.update({ where: { id }, data: { recipientCount: { increment: 1 } } })
    res.json({ success: true, recipient })
  } catch (err) { next(err) }
})

emailCampaignsRouter.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    const totalRecipients = await prisma.emailCampaignRecipient.count({ where: { campaignId: id } })
    const sentCount = await prisma.emailCampaignRecipient.count({ where: { campaignId: id, status: 'Sent' } })
    const openedCount = await prisma.emailCampaignRecipient.count({ where: { campaignId: id, openedAt: { not: null } } })
    const clickedCount = await prisma.emailCampaignRecipient.count({ where: { campaignId: id, clickedAt: { not: null } } })
    const bouncedCount = await prisma.emailCampaignRecipient.count({ where: { campaignId: id, bouncedAt: { not: null } } })
    const unsubscribedCount = await prisma.emailCampaignRecipient.count({ where: { campaignId: id, unsubscribedAt: { not: null } } })
    res.json({
      data: {
        ...campaign,
        stats: { totalRecipients, sentCount, openedCount, clickedCount, bouncedCount, unsubscribedCount },
      },
    })
  } catch (err) { next(err) }
})

emailCampaignsRouter.post('/:id/recipients', async (req, res, next) => {
  try {
    const { id } = req.params
    const { recipients } = req.body || {}
    const campaign = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    const list: { email: string; contactId?: string; name?: string }[] = Array.isArray(recipients) ? recipients : []
    if (!list.length) return res.status(400).json({ error: 'recipients array is required' })
    const created = await prisma.emailCampaignRecipient.createMany({
      data: list.map((r) => ({
        campaignId: id, email: r.email, contactId: r.contactId || null, name: r.name || null,
        companyId: req.user!.companyId || null,
      })),
      skipDuplicates: true,
    })
    await prisma.emailCampaign.update({ where: { id }, data: { recipientCount: { increment: created.count } } })
    res.json({ success: true, added: created.count })
  } catch (err) { next(err) }
})

emailCampaignsRouter.get('/:id/recipients', async (req, res, next) => {
  try {
    const { id } = req.params
    const campaign = await prisma.emailCampaign.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    const data = await prisma.emailCampaignRecipient.findMany({ where: { campaignId: id }, orderBy: { createdAt: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})
