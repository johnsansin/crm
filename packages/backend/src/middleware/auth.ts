import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { organizationAccessError } from '../lib/organization-limits'
import { signingSecret } from '../lib/secrets'

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; isAdmin: boolean; isAgent?: boolean; companyId?: string; isSuperAdmin?: boolean; roleId?: string | null }
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  let token = ''
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1]
  }
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; tokenVersion?: number }
    const fresh = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true, profile: true }
    })
    if (!fresh || !fresh.isActive) {
      return res.status(401).json({ error: 'Account disabled' })
    }
    if ((decoded.tokenVersion ?? 0) !== fresh.tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
    if (fresh.companyId && fresh.company && !fresh.company.isActive) {
      return res.status(403).json({ error: 'Organization is deactivated. Contact your super admin.' })
    }
    if (fresh.companyId && fresh.company) {
      const accessError = organizationAccessError(fresh.company)
      if (accessError) return res.status(403).json({ error: accessError })
    }
    req.user = {
      userId: fresh.id,
      email: fresh.email,
      isAdmin: fresh.isAdmin,
      isAgent: fresh.isAgent,
      companyId: fresh.companyId || undefined,
      isSuperAdmin: fresh.profile?.isSuperAdmin || false,
      roleId: fresh.roleId
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin && !req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
