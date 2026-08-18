import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const landingPagesRouter = Router()
landingPagesRouter.use(authMiddleware)

landingPagesRouter.get('/', async (req, res, next) => {
  try {
    const data = await prisma.landingPage.findMany({
      where: { companyId: req.user!.companyId || undefined },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

landingPagesRouter.post('/', async (req, res, next) => {
  try {
    const { name, slug, title, subtitle, description, content, formConfig, theme, primaryColor, imageUrl, faviconUrl, metaTitle, metaDescription, thankYouMsg, redirectUrl, submitAction, campaignId, assignedTo } = req.body || {}
    if (!name || !slug || !title) return res.status(400).json({ error: 'name, slug, and title are required' })
    const page = await prisma.landingPage.create({
      data: {
        name, slug, title, subtitle, description, content: content || {}, formConfig: formConfig || {},
        theme: theme || 'default', primaryColor: primaryColor || '#0B1F3A',
        imageUrl, faviconUrl, metaTitle, metaDescription, thankYouMsg, redirectUrl,
        submitAction: submitAction || 'thankYou',
        campaignId, assignedTo, companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: page })
  } catch (err) { next(err) }
})

landingPagesRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.landingPage.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Page not found' })
    const data: any = {}
    for (const key of ['name', 'slug', 'title', 'subtitle', 'description', 'theme', 'primaryColor', 'imageUrl', 'faviconUrl', 'metaTitle', 'metaDescription', 'thankYouMsg', 'redirectUrl', 'submitAction', 'campaignId', 'assignedTo', 'isActive']) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.content !== undefined) data.content = req.body.content
    if (req.body.formConfig !== undefined) data.formConfig = req.body.formConfig
    const page = await prisma.landingPage.update({ where: { id }, data })
    res.json({ data: page })
  } catch (err) { next(err) }
})

landingPagesRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.landingPage.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Page not found' })
    await prisma.landingPage.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

landingPagesRouter.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params
    const page = await prisma.landingPage.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!page) return res.status(404).json({ error: 'Page not found' })
    const totalSubmissions = await prisma.landingPageSubmission.count({ where: { pageId: id } })
    res.json({ data: { ...page, totalSubmissions } })
  } catch (err) { next(err) }
})

landingPagesRouter.get('/:id/submissions', async (req, res, next) => {
  try {
    const { id } = req.params
    const page = await prisma.landingPage.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!page) return res.status(404).json({ error: 'Page not found' })
    const data = await prisma.landingPageSubmission.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

landingPagesRouter.post('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.landingPage.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Page not found' })
    const page = await prisma.landingPage.update({
      where: { id },
      data: { isPublished: !existing.isPublished },
    })
    res.json({ data: page })
  } catch (err) { next(err) }
})
