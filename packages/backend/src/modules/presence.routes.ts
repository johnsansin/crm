import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const presenceRouter = Router()

export const ONLINE_WINDOW_MS = 2 * 60 * 1000

presenceRouter.use(authMiddleware)

presenceRouter.post('/heartbeat', async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { lastActiveAt: new Date() },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

presenceRouter.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId || null, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        title: true,
        department: true,
        isAdmin: true,
        lastActiveAt: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    const now = Date.now()
    const data = users.map((u) => ({
      ...u,
      online: !!u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < ONLINE_WINDOW_MS,
    }))
    res.json({ data })
  } catch (err) { next(err) }
})
