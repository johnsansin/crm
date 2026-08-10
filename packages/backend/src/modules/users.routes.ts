import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import { validatePassword } from '../lib/settings'
import { ONLINE_WINDOW_MS } from './presence.routes'

export const userRouter = Router()

userRouter.use(authMiddleware)
userRouter.use(requireAdmin)

userRouter.get('/', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true'
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, ...(includeInactive ? {} : { isActive: true }) },
      select: { id: true, userName: true, email: true, firstName: true, lastName: true, isAdmin: true, isActive: true, roleId: true, avatar: true, lastActiveAt: true, createdAt: true, updatedAt: true, pbxExtension: true, groups: { select: { group: { select: { name: true } } } } }
    })
    const roles = await prisma.role.findMany({ where: { companyId: req.user!.companyId } })
    const roleMap = new Map(roles.map(r => [r.id, r.name]))
    const now = Date.now()
    const result = users.map(u => ({
      ...u,
      roleName: u.roleId ? roleMap.get(u.roleId) || null : null,
      groups: u.groups.map(g => g.group.name),
      online: !!u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < ONLINE_WINDOW_MS,
    }))
    res.json({ data: result })
  } catch (err) { next(err) }
})

userRouter.post('/', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const { userName, email, firstName, lastName, password, isAdmin, roleId, pbxExtension } = req.body
    const policyError = await validatePassword(req.user!.companyId, password)
    if (policyError) return res.status(400).json({ error: policyError })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        userName, email, firstName, lastName,
        password: hashed,
        isAdmin: isAdmin || false,
        roleId: roleId || null,
        pbxExtension: pbxExtension || null,
        companyId: req.user!.companyId
      }
    })
    const { password: _, ...userData } = user
    res.status(201).json(userData)
  } catch (err) { next(err) }
})

userRouter.put('/:id', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!existing) return res.status(404).json({ error: 'User not found' })
    const data: any = { ...req.body }
    if (data.password) {
      const policyError = await validatePassword(req.user!.companyId, data.password)
      if (policyError) return res.status(400).json({ error: policyError })
      data.password = await bcrypt.hash(data.password, 10)
    } else {
      delete data.password
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    const { password: _, ...userData } = user
    res.json(userData)
  } catch (err) { next(err) }
})

userRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!existing) return res.status(404).json({ error: 'User not found' })
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})
