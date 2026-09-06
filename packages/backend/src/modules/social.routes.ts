import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission, requireTenant } from '../lib/module-permissions'

// Legacy read compatibility. Never return tokens or claim publication without a provider receipt.
export const socialRouter = Router()
socialRouter.use(authMiddleware, requireTenant, requireModulePermission('social'))
const publicProfile = { id: true, platform: true, profileName: true, profileId: true, profileUrl: true, isActive: true } as const
socialRouter.get('/profiles', async (req, res, next) => {
  try { res.json({ data: await prisma.socialMediaProfile.findMany({ where: { companyId: req.user!.companyId!, isActive: true }, select: publicProfile }) }) }
  catch (err) { next(err) }
})
socialRouter.get('/posts', async (req, res, next) => {
  try { res.json({ data: await prisma.socialMediaPost.findMany({ where: { companyId: req.user!.companyId!, profile: { companyId: req.user!.companyId! } }, include: { profile: { select: publicProfile } }, take: 200, orderBy: { createdAt: 'desc' } }) }) }
  catch (err) { next(err) }
})
socialRouter.use((_req, res) => res.status(410).json({ error: 'This legacy social operation has been retired. Open SocialForce AI to manage content. Live integrations require official OAuth setup.' }))
