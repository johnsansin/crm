import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma'
import { canUseSocialForce, resolveSocialForcePermissions, type SocialForceAction, type SocialForceSection } from './module'

export const loadSocialForcePermissions: RequestHandler = async (req, res, next) => {
  try {
    const administrator = !!(req.user?.isAdmin || req.user?.isSuperAdmin)
    const rows = !administrator && req.user?.roleId ? await prisma.rolePermission.findMany({
      where: { roleId: req.user.roleId, role: { companyId: req.user.companyId, isActive: true } },
    }) : []
    const grants = resolveSocialForcePermissions(rows, administrator)
    if (!grants.socialforce.view) return res.status(403).json({ error: 'SocialForce module View permission is required. Ask your organization administrator to update your role.' })
    res.locals.socialForcePermissions = grants
    next()
  } catch (error) { next(error) }
}

export function requireSocialForce(section: SocialForceSection, action: SocialForceAction = 'view'): RequestHandler {
  return (_req, res, next) => {
    if (!canUseSocialForce(res.locals.socialForcePermissions, section, action)) return res.status(403).json({ error: `SocialForce ${section} ${action} permission is required.` })
    next()
  }
}
