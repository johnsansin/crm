import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'bizforce-jwt-secret-dev-2026'

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string; isAdmin: boolean; companyId?: string; isSuperAdmin?: boolean; roleId?: string | null }
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  let token = ''
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1]
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token
  }
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    const fresh = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true, profile: true }
    })
    if (!fresh || !fresh.isActive) {
      return res.status(401).json({ error: 'Account disabled' })
    }
    if (fresh.companyId && fresh.company && !fresh.company.isActive) {
      return res.status(403).json({ error: 'Organization is deactivated. Contact your super admin.' })
    }
    req.user = {
      userId: fresh.id,
      email: fresh.email,
      isAdmin: fresh.isAdmin,
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
