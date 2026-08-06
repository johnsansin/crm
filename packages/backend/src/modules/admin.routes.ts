import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { getAllGlobalSettings, setGlobalSetting } from '../lib/settings'

export const adminRouter = Router()

adminRouter.use(authMiddleware)

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' })
  }
  next()
}

adminRouter.use(requireSuperAdmin)

adminRouter.get('/settings', async (_req, res, next) => {
  try {
    res.json(await getAllGlobalSettings())
  } catch (err) { next(err) }
})

adminRouter.put('/settings', async (req, res, next) => {
  try {
    const body = req.body
    const keys = body && body.settings ? body.settings : body
    for (const key of Object.keys(keys || {})) {
      await setGlobalSetting(key, keys[key])
    }
    res.json(await getAllGlobalSettings())
  } catch (err) { next(err) }
})

adminRouter.get('/companies', async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    const withStats = await Promise.all(companies.map(async (c) => {
      const models = ['account', 'contact', 'lead', 'potential', 'campaign', 'product', 'service', 'vendor', 'quote', 'salesOrder', 'purchaseOrder', 'invoice', 'ticket']
      const counts: Record<string, number> = {}
      for (const m of models) {
        const key = m as keyof typeof prisma
        if (typeof (prisma as any)[key]?.count === 'function') {
          counts[m + 's'] = await (prisma as any)[key].count({ where: { companyId: c.id } })
        }
      }
      return { ...c, _count: c._count, recordCounts: counts }
    }))
    res.json({ data: withStats })
  } catch (err) { next(err) }
})

adminRouter.get('/companies/:id', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: { id: true, userName: true, email: true, firstName: true, lastName: true, isAdmin: true, isActive: true, lastLogin: true, createdAt: true }
        }
      }
    })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    res.json(company)
  } catch (err) { next(err) }
})

adminRouter.put('/companies/:id/toggle', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: { isActive: !company.isActive }
    })
    res.json(updated)
  } catch (err) { next(err) }
})

adminRouter.get('/login-history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = (req.query.search as string) || ''
    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { publicIp: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } }
      }),
      prisma.loginLog.count({ where })
    ])
    const normalized = data.map((log: any) => ({
      ...log,
      ipAddress: (log.ipAddress || '').replace(/^::ffff:/, ''),
    }))
    res.json({
      data: normalized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) { next(err) }
})

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { company: { select: { name: true } }, profile: { select: { isSuperAdmin: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const safe = users.map(({ password, profile, ...u }) => ({ ...u, isSuperAdmin: profile?.isSuperAdmin || false }))
    res.json({ data: safe })
  } catch (err) { next(err) }
})
