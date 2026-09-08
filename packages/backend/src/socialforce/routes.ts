import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z, ZodError } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireTenant } from '../lib/module-permissions'
import { brandSchema, postSchema, providers, tenantId } from './domain'

import { loadSocialForcePermissions, requireSocialForce } from './permissions'
import { canUseSocialForce, socialForceSections } from './module'

export const socialForceRouter = Router()
// SocialForce shares the BizForce session and role matrix; no separate login.
socialForceRouter.use(authMiddleware, requireTenant, loadSocialForcePermissions)
socialForceRouter.use(rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }))
// All repositories require server-derived organization context; never accept tenant IDs in bodies.
socialForceRouter.get('/workspace', async (req, res, next) => {
  try {
    const section = z.enum(socialForceSections).parse(req.query.section || 'dashboard')
    if (!canUseSocialForce(res.locals.socialForcePermissions, section)) return res.status(403).json({ error: `You do not have access to SocialForce ${section}. Ask your organization administrator to update your role permissions.` })
    const companyId = tenantId(req.user)
    const showPosts = ['dashboard', 'content', 'calendar', 'approvals'].includes(section)
    const [company, brand, posts, events] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true, timezone: true } }),
      ['brand-settings', 'create-post'].includes(section) ? prisma.socialForceBrand.findUnique({ where: { companyId } }) : Promise.resolve(null),
      showPosts ? prisma.socialForcePost.findMany({ where: { companyId, ...(section === 'approvals' ? { status: 'PENDING_APPROVAL' } : {}) }, orderBy: { updatedAt: 'desc' }, take: 200 }) : Promise.resolve([]),
      section === 'dashboard' ? prisma.socialForceEvent.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 30 }) : Promise.resolve([]),
    ])
    const visiblePosts = ['dashboard', 'calendar'].includes(section) && !canUseSocialForce(res.locals.socialForcePermissions, 'content')
      ? posts.map(post => ({ ...post, content: '', reviewNote: null, variants: (post.variants as { platform: string }[]).map(variant => ({ platform: variant.platform, content: '' })) }))
      : posts
    res.json({ data: { company, brand, posts: visiblePosts, events, permissions: res.locals.socialForcePermissions, providers, accounts: [], aiConfigured: false,
      canManage: canUseSocialForce(res.locals.socialForcePermissions, 'brand-settings', 'edit') || canUseSocialForce(res.locals.socialForcePermissions, 'approvals', 'edit'), userId: req.user!.userId,
      publishingEnabled: false, phase: 'FOUNDATION' } })
  } catch (err) { next(err) }
})
socialForceRouter.post('/posts', requireSocialForce('create-post', 'create'), async (req, res, next) => {
  try {
    const input = postSchema.parse(req.body), companyId = tenantId(req.user)
    const data = await prisma.$transaction(async tx => {
      const post = await tx.socialForcePost.create({ data: { ...input, plannedAt: input.plannedAt ? new Date(input.plannedAt) : null, companyId, createdBy: req.user!.userId } })
      await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: 'DRAFT_CREATED', resourceId: post.id } })
      return post
    })
    res.status(201).json({ data })
  } catch (err) { next(err) }
})
socialForceRouter.put('/posts/:id', requireSocialForce('content', 'edit'), async (req, res, next) => {
  try {
    const { version, ...input } = postSchema.extend({ version: z.number().int().positive() }).parse(req.body)
    const companyId = tenantId(req.user)
    const data = await prisma.$transaction(async tx => {
      const updated = await tx.socialForcePost.updateMany({ where: { id: req.params.id, companyId, version, status: { in: ['DRAFT', 'CHANGES_REQUESTED', 'APPROVED'] } },
        data: { ...input, plannedAt: input.plannedAt ? new Date(input.plannedAt) : null, status: 'DRAFT', reviewedBy: null, reviewNote: null, version: { increment: 1 } } })
      if (!updated.count) return null
      await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: 'DRAFT_UPDATED', resourceId: req.params.id } })
      return tx.socialForcePost.findUnique({ where: { companyId_id: { companyId, id: req.params.id } } })
    })
    if (!data) return res.status(409).json({ error: 'Post unavailable, under review, or changed by another user. Refresh and try again.' })
    res.json({ data })
  } catch (err) { next(err) }
})
socialForceRouter.post('/posts/:id/submit', requireSocialForce('content', 'edit'), async (req, res, next) => {
  try {
    const companyId = tenantId(req.user)
    const count = await prisma.$transaction(async tx => {
      const result = await tx.socialForcePost.updateMany({ where: { id: req.params.id, companyId, status: { in: ['DRAFT', 'CHANGES_REQUESTED'] } }, data: { status: 'PENDING_APPROVAL', version: { increment: 1 } } })
      if (result.count) await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: 'APPROVAL_REQUESTED', resourceId: req.params.id } })
      return result.count
    })
    if (!count) return res.status(409).json({ error: 'Only a current draft can be submitted for review.' })
    res.json({ success: true })
  } catch (err) { next(err) }
})
socialForceRouter.post('/posts/:id/review', requireSocialForce('approvals', 'edit'), async (req, res, next) => {
  try {
    const { decision, note, version } = z.object({ decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']), note: z.string().trim().max(2000), version: z.number().int().positive() }).strict().parse(req.body)
    const companyId = tenantId(req.user)
    const post = await prisma.socialForcePost.findUnique({ where: { companyId_id: { companyId, id: req.params.id } } })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.createdBy === req.user!.userId) return res.status(403).json({ error: 'A different authorized reviewer in your organization must review this post.' })
    const count = await prisma.$transaction(async tx => {
      const result = await tx.socialForcePost.updateMany({ where: { id: post.id, companyId, version, status: 'PENDING_APPROVAL' }, data: { status: decision, reviewNote: note, reviewedBy: req.user!.userId, version: { increment: 1 } } })
      if (result.count) await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: decision, resourceId: post.id } })
      return result.count
    })
    if (!count) return res.status(409).json({ error: 'Post changed. Refresh before reviewing.' })
    res.json({ success: true })
  } catch (err) { next(err) }
})
socialForceRouter.delete('/posts/:id', requireSocialForce('content', 'delete'), async (req, res, next) => {
  try {
    const companyId = tenantId(req.user)
    const count = await prisma.$transaction(async tx => {
      const result = await tx.socialForcePost.deleteMany({ where: { id: req.params.id, companyId, status: { in: ['DRAFT', 'CHANGES_REQUESTED'] } } })
      if (result.count) await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: 'DRAFT_DELETED', resourceId: req.params.id } })
      return result.count
    })
    if (!count) return res.status(404).json({ error: 'Editable draft not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
})
socialForceRouter.put('/brand', requireSocialForce('brand-settings', 'edit'), async (req, res, next) => {
  try {
    const input = brandSchema.parse(req.body), companyId = tenantId(req.user)
    const data = await prisma.$transaction(async tx => {
      const brand = await tx.socialForceBrand.upsert({ where: { companyId }, create: { ...input, companyId }, update: input })
      await tx.socialForceEvent.create({ data: { companyId, actorId: req.user!.userId, action: 'BRAND_UPDATED' } })
      return brand
    })
    res.json({ data })
  } catch (err) { next(err) }
})
socialForceRouter.post('/providers/:provider/connect', requireSocialForce('social-accounts', 'create'), (_req, res) => res.status(503).json({ error: 'Official OAuth connection is not configured. An administrator must complete provider setup.' }))
socialForceRouter.post('/posts/:id/publish', requireSocialForce('content', 'edit'), (_req, res) => res.status(503).json({ error: 'Live publishing is not enabled. Save a draft while official integrations and publishing workers are being configured.' }))
socialForceRouter.post('/posts/:id/schedule', requireSocialForce('calendar', 'edit'), (_req, res) => res.status(503).json({ error: 'Automatic scheduling is not enabled. Planned dates are editorial reminders only.' }))
socialForceRouter.post('/ai/generate', requireSocialForce('ai-assistant', 'create'), (_req, res) => res.status(503).json({ error: 'AI generation is not configured. Use the manual editor or try sample content in the demo.' }))
socialForceRouter.use((err: unknown, _req: any, res: any, _next: any) => {
  if (err instanceof ZodError) return res.status(400).json({ error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') })
  console.error('socialforce.request_failed', { code: (err as { code?: string })?.code || 'UNKNOWN' })
  res.status(500).json({ error: 'SocialForce could not complete this request. Please try again.' })
})
