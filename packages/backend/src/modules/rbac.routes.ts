import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'

export const rbacRouter = Router()

rbacRouter.use(authMiddleware)

// === ROLES ===

// Role tree (hierarchical)
rbacRouter.get('/roles/tree', requireAdmin, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const roles = await prisma.role.findMany({
      where: { companyId, isActive: true },
      include: { children: { where: { isActive: true } }, users: { select: { id: true, firstName: true, lastName: true } }, permissions: true },
      orderBy: { createdAt: 'asc' }
    })
    const topLevel = roles.filter(r => !r.parentId)
    const mapRole = (r: any): any => ({
      ...r,
      userCount: r.users.length,
      users: undefined,
      permissions: undefined,
      children: roles.filter((c: any) => c.parentId === r.id).map(mapRole)
    })
    res.json({ data: topLevel.map(mapRole) })
  } catch (err) { next(err) }
})

// Get role permissions for all modules
rbacRouter.get('/roles/:id/permissions', requireAdmin, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const role = await prisma.role.findFirst({ where: { id: req.params.id, companyId } })
    if (!role) return res.status(404).json({ error: 'Role not found' })

    const moduleNames = ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails', 'emailtemplates', 'projects', 'projecttasks', 'projectmilestones', 'assets', 'servicecontracts', 'smsnotifier']

    const permissions = await prisma.rolePermission.findMany({ where: { roleId: role.id } })
    const permMap = new Map(permissions.map(p => [p.moduleName, p]))

    const result = moduleNames.map(m => ({
      moduleName: m,
      view: permMap.get(m)?.view ?? false,
      create: permMap.get(m)?.create ?? false,
      edit: permMap.get(m)?.edit ?? false,
      delete: permMap.get(m)?.delete ?? false,
      import: permMap.get(m)?.import ?? false,
      export: permMap.get(m)?.export ?? false,
    }))

    res.json({ data: result })
  } catch (err) { next(err) }
})

// Update role permissions
rbacRouter.put('/roles/:id/permissions', requireAdmin, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const role = await prisma.role.findFirst({ where: { id: req.params.id, companyId } })
    if (!role) return res.status(404).json({ error: 'Role not found' })

    const { permissions } = req.body
    if (!Array.isArray(permissions)) return res.status(400).json({ error: 'permissions must be an array' })

    // Delete existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    // Create new permissions
    for (const p of permissions) {
      if (p.moduleName) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            moduleName: p.moduleName,
            view: p.view ?? false,
            create: p.create ?? false,
            edit: p.edit ?? false,
            delete: p.delete ?? false,
            import: p.import ?? false,
            export: p.export ?? false,
          }
        })
      }
    }

    res.json({ success: true })
  } catch (err) { next(err) }
})

// === USER GROUPS ===

// List all groups for company
rbacRouter.get('/usergroups', requireAdmin, async (req, res, next) => {
  try {
    const groups = await prisma.userGroup.findMany({
      where: { companyId: req.user!.companyId, isActive: true },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } }
    })
    res.json({ data: groups })
  } catch (err) { next(err) }
})

// Create a group
rbacRouter.post('/usergroups', requireAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body
    const group = await prisma.userGroup.create({
      data: { name, description, companyId: req.user!.companyId }
    })
    res.status(201).json(group)
  } catch (err) { next(err) }
})

// Update a group
rbacRouter.put('/usergroups/:id', requireAdmin, async (req, res, next) => {
  try {
    const group = await prisma.userGroup.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!group) return res.status(404).json({ error: 'Group not found' })
    const updated = await prisma.userGroup.update({ where: { id: req.params.id }, data: req.body })
    res.json(updated)
  } catch (err) { next(err) }
})

// Delete a group
rbacRouter.delete('/usergroups/:id', requireAdmin, async (req, res, next) => {
  try {
    const group = await prisma.userGroup.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!group) return res.status(404).json({ error: 'Group not found' })
    await prisma.userGroup.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// Add member to group
rbacRouter.post('/usergroups/:id/members', requireAdmin, async (req, res, next) => {
  try {
    const group = await prisma.userGroup.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!group) return res.status(404).json({ error: 'Group not found' })
    const { userId } = req.body
    const existing = await prisma.userGroupMember.findUnique({
      where: { groupId_userId: { groupId: req.params.id, userId } }
    })
    if (existing) return res.status(400).json({ error: 'Member already exists' })
    const member = await prisma.userGroupMember.create({
      data: { groupId: req.params.id, userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
    })
    res.status(201).json(member)
  } catch (err) { next(err) }
})

// Remove member from group
rbacRouter.delete('/usergroups/:id/members/:userId', requireAdmin, async (req, res, next) => {
  try {
    const group = await prisma.userGroup.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId }
    })
    if (!group) return res.status(404).json({ error: 'Group not found' })
    await prisma.userGroupMember.delete({
      where: { groupId_userId: { groupId: req.params.id, userId: req.params.userId } }
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})
