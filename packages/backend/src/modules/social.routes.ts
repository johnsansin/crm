import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const socialRouter = Router()
socialRouter.use(authMiddleware)

// ---- Profiles ----
socialRouter.get('/profiles', async (req, res, next) => {
  try {
    const data = await prisma.socialMediaProfile.findMany({
      where: { companyId: req.user!.companyId || undefined, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

socialRouter.post('/profiles', async (req, res, next) => {
  try {
    const { platform, profileId, profileName, profileUrl, accessToken, refreshToken, tokenExpiresAt } = req.body || {}
    if (!platform || !profileId) return res.status(400).json({ error: 'platform and profileId are required' })
    const profile = await prisma.socialMediaProfile.create({
      data: {
        platform, profileId, profileName, profileUrl, accessToken, refreshToken,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: profile })
  } catch (err) { next(err) }
})

socialRouter.delete('/profiles/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.socialMediaProfile.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Profile not found' })
    await prisma.socialMediaProfile.update({ where: { id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Posts ----
socialRouter.get('/posts', async (req, res, next) => {
  try {
    const { profileId, status } = req.query
    const where: any = { companyId: req.user!.companyId || undefined }
    if (profileId) where.profileId = String(profileId)
    if (status) where.status = String(status)
    const data = await prisma.socialMediaPost.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

socialRouter.post('/posts', async (req, res, next) => {
  try {
    const { profileId, content, mediaUrls, status, scheduledAt } = req.body || {}
    if (!profileId || !content) return res.status(400).json({ error: 'profileId and content are required' })
    const post = await prisma.socialMediaPost.create({
      data: {
        profileId, content, mediaUrls: mediaUrls || [],
        status: status || 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: post })
  } catch (err) { next(err) }
})

socialRouter.put('/posts/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.socialMediaPost.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Post not found' })
    const data: any = {}
    for (const key of ['content', 'status', 'scheduledAt']) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.mediaUrls !== undefined) data.mediaUrls = req.body.mediaUrls
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt)
    const post = await prisma.socialMediaPost.update({ where: { id }, data })
    res.json({ data: post })
  } catch (err) { next(err) }
})

socialRouter.delete('/posts/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.socialMediaPost.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Post not found' })
    await prisma.socialMediaPost.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

socialRouter.post('/posts/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.socialMediaPost.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Post not found' })
    const post = await prisma.socialMediaPost.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    })
    res.json({ data: post })
  } catch (err) { next(err) }
})

socialRouter.post('/posts/:id/schedule', async (req, res, next) => {
  try {
    const { id } = req.params
    const { scheduledAt } = req.body || {}
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' })
    const existing = await prisma.socialMediaPost.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Post not found' })
    const post = await prisma.socialMediaPost.update({
      where: { id },
      data: { status: 'scheduled', scheduledAt: new Date(scheduledAt) },
    })
    res.json({ data: post })
  } catch (err) { next(err) }
})

// ---- Analytics ----
socialRouter.get('/analytics/:profileId', async (req, res, next) => {
  try {
    const { profileId } = req.params
    const profile = await prisma.socialMediaProfile.findFirst({ where: { id: profileId, companyId: req.user!.companyId || undefined } })
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    const posts = await prisma.socialMediaPost.findMany({ where: { profileId } })
    const totalPosts = posts.length
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0)
    const totalComments = posts.reduce((s, p) => s + p.comments, 0)
    const totalShares = posts.reduce((s, p) => s + p.shares, 0)
    const totalReach = posts.reduce((s, p) => s + p.reach, 0)
    const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0)
    const publishedCount = posts.filter(p => p.status === 'published').length
    res.json({ data: { profile, totalPosts, publishedCount, totalLikes, totalComments, totalShares, totalReach, totalImpressions } })
  } catch (err) { next(err) }
})
