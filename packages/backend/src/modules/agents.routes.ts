import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import bcrypt from 'bcryptjs'

export const agentsRouter = Router()

agentsRouter.use(authMiddleware)

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' })
  }
  next()
}

agentsRouter.use(requireSuperAdmin)

agentsRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isAgent: true },
      select: {
        id: true, userName: true, email: true, firstName: true, lastName: true,
        phone: true, mobile: true, title: true, department: true,
        isActive: true, isAgent: true, lastLogin: true, lastActiveAt: true,
        createdAt: true, companyId: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: users })
  } catch (err) { next(err) }
})

agentsRouter.post('/', async (req, res, next) => {
  try {
    const { userName, email, firstName, lastName, password, phone, department, title, companyId } = req.body
    if (!userName || !email || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'userName, email, firstName, lastName, password are required' })
    }
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { userName }] } })
    if (existing) return res.status(409).json({ error: 'A user with this email or username already exists' })
    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } })
      if (!company) return res.status(404).json({ error: 'Organization not found' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        userName, email, firstName, lastName,
        password: hashed,
        isAgent: true,
        phone: phone || null,
        department: department || null,
        title: title || null,
        companyId: companyId || null,
      },
      select: {
        id: true, userName: true, email: true, firstName: true, lastName: true,
        phone: true, title: true, department: true, isActive: true, isAgent: true,
        createdAt: true, companyId: true,
        company: { select: { id: true, name: true } },
      },
    })
    res.status(201).json(user)
  } catch (err) { next(err) }
})

agentsRouter.put('/:id', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, department, title, isActive, companyId } = req.body
    const agent = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!agent || !agent.isAgent) return res.status(404).json({ error: 'Agent not found' })
    if (email && email !== agent.email) {
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id: agent.id } } })
      if (dup) return res.status(409).json({ error: 'Email already in use' })
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(title !== undefined && { title }),
        ...(isActive !== undefined && { isActive }),
        ...(companyId !== undefined && { companyId: companyId || null }),
      },
      select: {
        id: true, userName: true, email: true, firstName: true, lastName: true,
        phone: true, title: true, department: true, isActive: true, isAgent: true,
        createdAt: true, companyId: true,
        company: { select: { id: true, name: true } },
      },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

agentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const agent = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!agent || !agent.isAgent) return res.status(404).json({ error: 'Agent not found' })
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})
