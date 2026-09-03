import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import { validatePassword } from '../lib/settings'
import { ONLINE_WINDOW_MS } from './presence.routes'
import { publicUser } from '../lib/public-user'
import { checkOrganizationLimit } from '../lib/organization-limits'

export const userRouter = Router()

userRouter.use(authMiddleware)

userRouter.get('/', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true'
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, isAgent: false, ...(includeInactive ? {} : { isActive: true }) },
      select: { id: true, userName: true, email: true, firstName: true, lastName: true, isAdmin: true, isActive: true, roleId: true, avatar: true, lastActiveAt: true, createdAt: true, updatedAt: true, pbxExtension: true, dashboardEnabled: true, groups: { select: { group: { select: { name: true } } } } }
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

userRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const capacity = await checkOrganizationLimit(req.user!.companyId, 'users')
    if (!capacity.allowed) return res.status(409).json({ error: `User limit reached (${capacity.used}/${capacity.limit}). Contact your super admin to change the organization limit.` })
    const { userName, email, firstName, lastName, password, isAdmin, roleId, pbxExtension, dashboardEnabled } = req.body
    if (![userName, email, firstName, lastName, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Username, email, first name, last name, and password are required.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'Enter a valid email address.' })
    const policyError = await validatePassword(req.user!.companyId, password)
    if (policyError) return res.status(400).json({ error: policyError })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        userName: userName.trim(), email: email.trim().toLowerCase(), firstName: firstName.trim(), lastName: lastName.trim(),
        password: hashed,
        isAdmin: isAdmin || false,
        roleId: roleId || null,
        pbxExtension: pbxExtension || null,
        dashboardEnabled: dashboardEnabled !== false,
        companyId: req.user!.companyId
      }
    })
    res.status(201).json(publicUser(user))
  } catch (err) { next(err) }
})

userRouter.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!existing) return res.status(404).json({ error: 'User not found' })
    if (!existing.isActive && req.body.isActive === true) {
      const capacity = await checkOrganizationLimit(req.user!.companyId, 'users')
      if (!capacity.allowed) return res.status(409).json({ error: `User limit reached (${capacity.used}/${capacity.limit}). Contact your super admin to change the organization limit.` })
    }
    const allowed = ['userName', 'email', 'firstName', 'lastName', 'phone', 'mobile', 'title', 'department', 'roleId', 'pbxExtension', 'dashboardEnabled', 'isAdmin', 'isActive']
    const data: any = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.password) {
      const policyError = await validatePassword(req.user!.companyId, req.body.password)
      if (policyError) return res.status(400).json({ error: policyError })
      data.password = await bcrypt.hash(req.body.password, 10)
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    res.json(publicUser(user))
  } catch (err) { next(err) }
})

userRouter.post('/:id/logout-all', requireAdmin, async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.status(400).json({ error: 'No company' })
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      select: { id: true, email: true },
    })
    if (!target) return res.status(404).json({ error: 'User not found' })
    await prisma.user.update({
      where: { id: target.id },
      data: { tokenVersion: { increment: 1 }, lastActiveAt: null },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

userRouter.delete('/:id', requireAdmin, async (req, res, next) => {
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
