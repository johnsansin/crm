import { Router, Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { getOrgSetting, setOrgSetting, getAllOrgSettings, validatePassword, nextSequenceNumber } from '../lib/settings'
import { resolveAuditReferences } from '../lib/audit'
import { sendMail, testSmtpConnection, getSmtpConfig } from '../lib/mailer'
import { generateSecret, verifyTotp, otpauthUri } from '../lib/otp'
import { writeAudit, getClientIp } from '../lib/audit'
import { getModuleConfig } from './moduleSetup'

export const settingsRouter = Router()
settingsRouter.use(authMiddleware)

const userOnly = (fn: (req: Request, res: Response, next: NextFunction) => void) => fn

// ---- Org settings ----
settingsRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const settings = await getAllOrgSettings(req.user!.companyId)
    res.json(settings)
  } catch (err) { next(err) }
})

settingsRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const body = req.body
    const keys = body && body.settings ? body.settings : body
    for (const key of Object.keys(keys || {})) {
      await setOrgSetting(req.user!.companyId, key, keys[key])
    }
    await writeAudit({ moduleName: 'settings', action: 'UPDATE', fieldName: 'org', newValue: JSON.stringify(Object.keys(keys || {})), userId: req.user!.userId, req })
    res.json(await getAllOrgSettings(req.user!.companyId))
  } catch (err) { next(err) }
})

// ---- Picklist editor ----
settingsRouter.get('/picklists', async (req, res, next) => {
  try {
    const { module, field } = req.query
    const where: any = { isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    if (module) where.moduleName = module as string
    if (field) where.fieldName = field as string
    const data = await prisma.picklistOption.findMany({ where, orderBy: [{ moduleName: 'asc' }, { fieldName: 'asc' }, { sequence: 'asc' }] })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.get('/picklists/all', async (req, res, next) => {
  try {
    const { module } = req.query
    const where: any = { isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    if (module) where.moduleName = module as string
    const rows = await prisma.picklistOption.findMany({ where, orderBy: { sequence: 'asc' } })
    const map: Record<string, Record<string, string[]>> = {}
    for (const row of rows) {
      if (!map[row.moduleName]) map[row.moduleName] = {}
      if (!map[row.moduleName][row.fieldName]) map[row.moduleName][row.fieldName] = []
      map[row.moduleName][row.fieldName].push(row.label)
    }
    res.json({ data: map })
  } catch (err) { next(err) }
})

settingsRouter.post('/picklists', requireAdmin, async (req, res, next) => {
  try {
    const { moduleName, fieldName, label, sequence } = req.body
    if (!moduleName || !fieldName || !label) return res.status(400).json({ error: 'moduleName, fieldName and label are required' })
    const existing = await prisma.picklistOption.findFirst({ where: { companyId: req.user!.companyId, moduleName, fieldName, label, isActive: true } })
    if (existing) return res.status(400).json({ error: 'Option already exists' })
    const count = await prisma.picklistOption.count({ where: { companyId: req.user!.companyId, moduleName, fieldName } })
    const opt = await prisma.picklistOption.create({ data: { companyId: req.user!.companyId, moduleName, fieldName, label, sequence: sequence != null ? sequence : count } })
    res.status(201).json(opt)
  } catch (err) { next(err) }
})

settingsRouter.put('/picklists/:id', requireAdmin, async (req, res, next) => {
  try {
    const { label, sequence, isActive } = req.body
    const opt = await prisma.picklistOption.update({ where: { id: req.params.id }, data: { label, sequence, isActive } })
    res.json(opt)
  } catch (err) { next(err) }
})

settingsRouter.delete('/picklists/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.picklistOption.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

settingsRouter.post('/picklists/reorder', requireAdmin, async (req, res, next) => {
  try {
    const { ids } = req.body
    if (Array.isArray(ids)) {
      for (let i = 0; i < ids.length; i++) {
        await prisma.picklistOption.update({ where: { id: ids[i] }, data: { sequence: i } })
      }
    }
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Custom fields ----
settingsRouter.get('/custom-fields', requireAdmin, async (req, res, next) => {
  try {
    const { module } = req.query
    const where: any = {}
    if (req.user!.companyId) where.companyId = req.user!.companyId
    if (module) where.moduleName = module as string
    const data = await prisma.customField.findMany({ where, orderBy: [{ moduleName: 'asc' }, { sequence: 'asc' }] })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/custom-fields', requireAdmin, async (req, res, next) => {
  try {
    const { moduleName, label, type, options, isRequired, fieldName } = req.body
    if (!moduleName || !label || !type) return res.status(400).json({ error: 'moduleName, label and type are required' })
    let fname = fieldName
    if (!fname) {
      fname = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
      if (!/^[a-z]/.test(fname)) fname = 'field_' + fname
      fname = 'cf_' + fname
    }
    const dup = await prisma.customField.findFirst({ where: { companyId: req.user!.companyId, moduleName, fieldName: fname } })
    if (dup) return res.status(400).json({ error: 'A field with this name already exists' })
    const count = await prisma.customField.count({ where: { companyId: req.user!.companyId, moduleName } })
    const field = await prisma.customField.create({
      data: { companyId: req.user!.companyId, moduleName, label, fieldName: fname, type, options: options || undefined, isRequired: isRequired || false, sequence: count }
    })
    res.status(201).json(field)
  } catch (err) { next(err) }
})

settingsRouter.put('/custom-fields/:id', requireAdmin, async (req, res, next) => {
  try {
    const { label, type, options, isRequired, isActive, sequence } = req.body
    const field = await prisma.customField.update({ where: { id: req.params.id }, data: { label, type, options, isRequired, isActive, sequence } })
    res.json(field)
  } catch (err) { next(err) }
})

settingsRouter.delete('/custom-fields/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.customField.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Module manager ----
settingsRouter.get('/modules/menu', userOnly(async (req, res, next) => {
  try {
    const moduleRows = await prisma.module.findMany({ where: { isActive: true }, orderBy: { sequence: 'asc' } })
    const configs = getModuleConfigCache()
    let data = moduleRows.map(row => {
      const cfg = configs[row.name]
      return {
        name: row.name,
        label: row.label || cfg?.label || row.name,
        parent: row.parent || cfg?.parent || '',
        icon: row.icon || cfg?.icon || null,
        sequence: row.sequence,
      }
    })
    // Non-admin users only see modules their role has view permission on
    if (!req.user!.isAdmin && !req.user!.isSuperAdmin) {
      let allowed = new Set<string>()
      if (req.user!.roleId) {
        const perms = await prisma.rolePermission.findMany({
          where: { roleId: req.user!.roleId, view: true },
          select: { moduleName: true },
        })
        allowed = new Set(perms.map(p => p.moduleName))
      }
      data = data.filter(m => allowed.has(m.name))
    }
    res.json({ data })
  } catch (err) { next(err) }
}))

settingsRouter.get('/modules', requireAdmin, async (req, res, next) => {
  try {
    const moduleRows = await prisma.module.findMany({ orderBy: { sequence: 'asc' } })
    const rowMap = new Map(moduleRows.map(m => [m.name, m]))
    const configs = getModuleConfigCache()
    const names = Object.keys(configs)
    const data = names.map(name => {
      const row = rowMap.get(name)
      const cfg = configs[name]
      return {
        name,
        label: row?.label || cfg?.label || name,
        parent: row?.parent ?? cfg?.parent ?? '',
        sequence: row?.sequence ?? cfg?.sequence ?? 0,
        isActive: row ? row.isActive : true,
        isEntity: cfg?.modelName ? true : false,
        icon: row?.icon || cfg?.icon || null,
      }
    })
    for (const row of moduleRows) {
      if (!configs[row.name]) {
        data.push({ name: row.name, label: row.label, parent: row.parent || '', sequence: row.sequence, isActive: row.isActive, isEntity: row.isEntity, icon: row.icon || null })
      }
    }
    data.sort((a, b) => a.sequence - b.sequence)
    res.json({ data })
  } catch (err) { next(err) }
})

function getModuleConfigCache() {
  // @ts-ignore - imported lazily to avoid circular dep at module load time
  const configs: Record<string, any> = {}
  for (const mod of ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails', 'emailtemplates', 'projects', 'projecttasks', 'projectmilestones', 'assets', 'servicecontracts', 'smsnotifier', 'receipts', 'payments', 'recurringinvoices', 'calllogs', 'reports', 'mailboxes', 'rssfeeds', 'currencies', 'taxinfo', 'roles', 'usergroups', 'rolepermissions']) {
    const c = getModuleConfig(mod)
    if (c) configs[mod] = c
  }
  return configs
}

settingsRouter.put('/modules/:name', requireAdmin, async (req, res, next) => {
  try {
    const { name } = req.params
    const { label, isActive, sequence, icon, parent } = req.body
    const data: any = {}
    if (label != null) data.label = label
    if (isActive != null) data.isActive = isActive
    if (sequence != null) data.sequence = sequence
    if (icon != null) data.icon = icon
    if (parent != null) data.parent = parent
    const row = await prisma.module.upsert({
      where: { name },
      update: data,
      create: { name, label: label || name, isActive: isActive != null ? isActive : true, sequence: sequence || 0, parent: parent || '', icon: icon || null },
    })
    await writeAudit({ moduleName: 'settings', action: 'UPDATE', fieldName: `module:${name}`, newValue: JSON.stringify(data), userId: req.user!.userId, req })
    res.json(row)
  } catch (err) { next(err) }
})

// ---- Sharing rules ----
settingsRouter.get('/sharing-rules', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.sharingRule.findMany({ where: { companyId: req.user!.companyId } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.put('/sharing-rules/:moduleName', requireAdmin, async (req, res, next) => {
  try {
    const { moduleName } = req.params
    const { accessType, roleIds } = req.body
    const companyId = req.user!.companyId
    let rule = await prisma.sharingRule.findFirst({ where: { companyId, moduleName } })
    if (rule) {
      rule = await prisma.sharingRule.update({ where: { id: rule.id }, data: { accessType: accessType || 'PublicReadWriteDelete', roleIds: roleIds || [] } })
    } else {
      rule = await prisma.sharingRule.create({ data: { companyId, moduleName, accessType: accessType || 'PublicReadWriteDelete', roleIds: roleIds || [] } }).catch(async () => {
        const existing = await prisma.sharingRule.findFirst({ where: { companyId, moduleName } })
        return existing ? prisma.sharingRule.update({ where: { id: existing.id }, data: { accessType: accessType || 'PublicReadWriteDelete', roleIds: roleIds || [] } }) : null
      })
    }
    res.json(rule)
  } catch (err) { next(err) }
})

// ---- Permission profiles ----
settingsRouter.get('/profiles', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.permissionProfile.findMany({ where: { companyId: req.user!.companyId }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/profiles', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, roleIds, permissions } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    const profile = await prisma.permissionProfile.create({
      data: { companyId: req.user!.companyId, name, description, roleIds: roleIds || [], permissions: permissions || {} }
    })
    res.status(201).json(profile)
  } catch (err) { next(err) }
})

settingsRouter.put('/profiles/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, roleIds, permissions, isActive } = req.body
    const profile = await prisma.permissionProfile.update({ where: { id: req.params.id }, data: { name, description, roleIds, permissions, isActive } })
    res.json(profile)
  } catch (err) { next(err) }
})

settingsRouter.delete('/profiles/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.permissionProfile.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

settingsRouter.post('/profiles/:id/apply', requireAdmin, async (req, res, next) => {
  try {
    const profile = await prisma.permissionProfile.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } })
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    const perms: Record<string, any> = (profile.permissions as any) || {}
    const roleIds: string[] = (profile.roleIds as any) || []
    let applied = 0
    for (const roleId of roleIds) {
      const role = await prisma.role.findFirst({ where: { id: roleId, companyId: req.user!.companyId } })
      if (!role) continue
      for (const moduleName of Object.keys(perms)) {
        const p = perms[moduleName] || {}
        await prisma.rolePermission.upsert({
          where: { roleId_moduleName: { roleId, moduleName } },
          update: { view: !!p.view, create: !!p.create, edit: !!p.edit, delete: !!p.delete, import: !!p.import, export: !!p.export },
          create: { roleId, moduleName, view: !!p.view, create: !!p.create, edit: !!p.edit, delete: !!p.delete, import: !!p.import, export: !!p.export },
        })
      }
      applied++
    }
    res.json({ success: true, appliedRoles: applied })
  } catch (err) { next(err) }
})

// ---- Workflows ----
settingsRouter.get('/workflows', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.workflow.findMany({ where: { companyId: req.user!.companyId }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/workflows', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, triggerType, conditions, actions, isActive } = req.body
    if (!name || !moduleName || !triggerType) return res.status(400).json({ error: 'name, moduleName and triggerType are required' })
    const wf = await prisma.workflow.create({ data: { companyId: req.user!.companyId, name, moduleName, triggerType, conditions: conditions || {}, actions: actions || [], isActive: isActive != null ? isActive : true, createdBy: req.user!.userId } })
    res.status(201).json(wf)
  } catch (err) { next(err) }
})

settingsRouter.put('/workflows/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, triggerType, conditions, actions, isActive } = req.body
    const wf = await prisma.workflow.update({ where: { id: req.params.id }, data: { name, moduleName, triggerType, conditions, actions, isActive } })
    res.json(wf)
  } catch (err) { next(err) }
})

settingsRouter.delete('/workflows/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Scheduled tasks (cron) ----
function computeNextRun(frequency: string): Date {
  const now = new Date()
  const d = new Date(now)
  switch (frequency) {
    case 'hourly': d.setHours(d.getHours() + 1); break
    case 'daily': d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); break
    case 'weekly': d.setDate(d.getDate() + 7); d.setHours(0, 0, 0, 0); break
    case 'monthly': d.setMonth(d.getMonth() + 1); d.setDate(1); d.setHours(0, 0, 0, 0); break
    default: d.setMinutes(d.getMinutes() + 5)
  }
  return d
}

settingsRouter.get('/cron', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.scheduledTask.findMany({ where: { companyId: req.user!.companyId }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/cron', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, frequency, actions, isActive } = req.body
    if (!name || !frequency) return res.status(400).json({ error: 'name and frequency are required' })
    const task = await prisma.scheduledTask.create({
      data: { companyId: req.user!.companyId, name, moduleName: moduleName || null, frequency, actions: actions || [], isActive: isActive != null ? isActive : true, nextRun: computeNextRun(frequency) }
    })
    res.status(201).json(task)
  } catch (err) { next(err) }
})

settingsRouter.put('/cron/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, frequency, actions, isActive } = req.body
    const data: any = { name, moduleName, actions, isActive }
    if (frequency) { data.frequency = frequency; data.nextRun = computeNextRun(frequency) }
    const task = await prisma.scheduledTask.update({ where: { id: req.params.id }, data })
    res.json(task)
  } catch (err) { next(err) }
})

settingsRouter.delete('/cron/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.scheduledTask.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

settingsRouter.post('/cron/:id/run', requireAdmin, async (req, res, next) => {
  try {
    const task = await prisma.scheduledTask.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } })
    if (!task) return res.status(404).json({ error: 'Task not found' })
    const { runScheduledTaskActions } = await import('../lib/settings')
    await runScheduledTaskActions(task)
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Webforms ----
settingsRouter.get('/webforms', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.webform.findMany({ where: { companyId: req.user!.companyId }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/webforms', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, fields, successMessage, redirectUrl, isActive } = req.body
    if (!name || !moduleName) return res.status(400).json({ error: 'name and moduleName are required' })
    const token = generateSecret(16).toLowerCase()
    const wf = await prisma.webform.create({
      data: { companyId: req.user!.companyId, name, moduleName, fields: fields || [], successMessage, redirectUrl, isActive: isActive != null ? isActive : true, token, createdBy: req.user!.userId }
    })
    res.status(201).json(wf)
  } catch (err) { next(err) }
})

settingsRouter.put('/webforms/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, moduleName, fields, successMessage, redirectUrl, isActive } = req.body
    const wf = await prisma.webform.update({ where: { id: req.params.id }, data: { name, moduleName, fields, successMessage, redirectUrl, isActive } })
    res.json(wf)
  } catch (err) { next(err) }
})

settingsRouter.delete('/webforms/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.webform.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

settingsRouter.post('/webforms/:id/token', requireAdmin, async (req, res, next) => {
  try {
    const token = generateSecret(16).toLowerCase()
    const wf = await prisma.webform.update({ where: { id: req.params.id }, data: { token } })
    res.json(wf)
  } catch (err) { next(err) }
})

// ---- Notifications (any user) ----
settingsRouter.get('/notifications', userOnly(async (req, res, next) => {
  try {
    const data = await prisma.notification.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: 'desc' }, take: 50 })
    res.json({ data })
  } catch (err) { next(err) }
}))

settingsRouter.put('/notifications/read-all', userOnly(async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true } })
    res.json({ success: true })
  } catch (err) { next(err) }
}))

settingsRouter.put('/notifications/:id/read', userOnly(async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json({ success: true })
  } catch (err) { next(err) }
}))

// ---- Announcements ----
settingsRouter.get('/announcements/active', async (req, res, next) => {
  try {
    const now = new Date()
    const data = await prisma.announcement.findMany({
      where: {
        companyId: req.user!.companyId,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.get('/announcements', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.announcement.findMany({ where: { companyId: req.user!.companyId }, orderBy: { createdAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/announcements', requireAdmin, async (req, res, next) => {
  try {
    const { title, message, startsAt, expiresAt, isActive } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })
    const ann = await prisma.announcement.create({ data: { companyId: req.user!.companyId, title, message, startsAt: startsAt ? new Date(startsAt) : null, expiresAt: expiresAt ? new Date(expiresAt) : null, isActive: isActive != null ? isActive : true, createdBy: req.user!.userId } })
    res.status(201).json(ann)
  } catch (err) { next(err) }
})

settingsRouter.put('/announcements/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, message, startsAt, expiresAt, isActive } = req.body
    const ann = await prisma.announcement.update({ where: { id: req.params.id }, data: { title, message, startsAt: startsAt ? new Date(startsAt) : null, expiresAt: expiresAt ? new Date(expiresAt) : null, isActive } })
    res.json(ann)
  } catch (err) { next(err) }
})

settingsRouter.delete('/announcements/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Holidays ----
settingsRouter.get('/holidays', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.holiday.findMany({ where: { companyId: req.user!.companyId }, orderBy: { date: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/holidays', requireAdmin, async (req, res, next) => {
  try {
    const { title, date, description } = req.body
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' })
    const holiday = await prisma.holiday.create({ data: { companyId: req.user!.companyId, title, date: new Date(date), description } })
    res.status(201).json(holiday)
  } catch (err) { next(err) }
})

settingsRouter.put('/holidays/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, date, description } = req.body
    const holiday = await prisma.holiday.update({ where: { id: req.params.id }, data: { title, date: date ? new Date(date) : undefined, description } })
    res.json(holiday)
  } catch (err) { next(err) }
})

settingsRouter.delete('/holidays/:id', requireAdmin, async (req, res, next) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Audit trail ----
settingsRouter.get('/audit', requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const { module, action, userId } = req.query
    const search = (req.query.search as string) || ''
    const companyIds = new Set<string>()
    const users = await prisma.user.findMany({ where: { companyId: req.user!.companyId }, select: { id: true } })
    for (const u of users) companyIds.add(u.id)
    const where: any = { userId: { in: [...companyIds] } }
    if (module) where.moduleName = module as string
    if (action) where.action = action as string
    if (userId) where.userId = userId as string
    if (search) {
      where.OR = [
        { recordId: { contains: search, mode: 'insensitive' } },
        { fieldName: { contains: search, mode: 'insensitive' } },
        { oldValue: { contains: search, mode: 'insensitive' } },
        { newValue: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.auditLog.count({ where }),
    ])
    const userMap = new Map(users.map(u => [u.id, true]))
    const enriched = await Promise.all(data.map(async (log: any) => {
      let actor: any = null
      if (log.userId) {
        actor = await prisma.user.findUnique({ where: { id: log.userId }, select: { firstName: true, lastName: true, email: true } }).catch(() => null)
      }
      const resolved = await resolveAuditReferences(log)
      return { ...log, actor, oldValue: resolved.oldValue, newValue: resolved.newValue }
    }))
    res.json({ data: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

// ---- Login history (per org) ----
settingsRouter.get('/login-history', requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = (req.query.search as string) || ''
    const users = await prisma.user.findMany({ where: { companyId: req.user!.companyId }, select: { id: true } })
    const userIds = users.map(u => u.id)
    const where: any = { userId: { in: userIds } }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { publicIp: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      prisma.loginLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { user: { select: { firstName: true, lastName: true } } } }),
      prisma.loginLog.count({ where }),
    ])
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (err) { next(err) }
})

// ---- Backup ----
settingsRouter.post('/backup', requireAdmin, async (req, res, next) => {
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://crm:crm@127.0.0.1:5432/crm'
    const backupDir = path.resolve(process.cwd(), 'uploads', 'backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
    const fileName = `bizforce-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
    const filePath = path.join(backupDir, fileName)
    await new Promise<void>((resolve, reject) => {
      execFile('pg_dump', [dbUrl, '--no-owner', '--no-privileges'], { maxBuffer: 512 * 1024 * 1024 }, (err, stdout) => {
        if (err) return reject(new Error('pg_dump failed: ' + (err.message || 'ensure postgresql-client is installed')))
        fs.writeFileSync(filePath, stdout)
        resolve()
      })
    })
    await writeAudit({ moduleName: 'settings', action: 'BACKUP', newValue: fileName, userId: req.user!.userId, req })
    res.json({ fileName, path: `/uploads/backups/${fileName}`, size: fs.statSync(filePath).size })
  } catch (err) { next(err) }
})

settingsRouter.get('/backups', requireAdmin, async (_req, res) => {
  try {
    const backupDir = path.resolve(process.cwd(), 'uploads', 'backups')
    if (!fs.existsSync(backupDir)) return res.json({ data: [] })
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql')).map(f => {
      const st = fs.statSync(path.join(backupDir, f))
      return { fileName: f, path: `/uploads/backups/${f}`, size: st.size, modifiedAt: st.mtime }
    }).sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
    res.json({ data: files })
  } catch { res.json({ data: [] }) }
})

// ---- Export / Import ----
const IMPORTABLE = new Set(['account', 'contact', 'lead', 'potential', 'campaign', 'product', 'service', 'vendor', 'priceBook', 'quote', 'salesOrder', 'purchaseOrder', 'invoice', 'ticket', 'faq', 'project', 'projectTask', 'projectMilestone', 'asset', 'serviceContract', 'smsNotifier'])

settingsRouter.get('/export/:module', requireAdmin, async (req, res, next) => {
  try {
    const moduleName = req.params.module
    const config = getModuleConfig(moduleName)
    if (!config) return res.status(404).json({ error: 'Unknown module' })
    const model = (prisma as any)[config.modelName]
    if (!model) return res.status(404).json({ error: 'Unknown model' })
    const where: any = { isActive: true }
    where.companyId = req.user!.companyId ?? null
    const records: any[] = await model.findMany({ where })
    const skipKeys = new Set(['id', 'companyId', 'createdAt', 'updatedAt', 'password'])
    const allKeys = Array.from(new Set(records.flatMap((r: any) => Object.keys(r)))).filter(k => !skipKeys.has(k))
    const format = (req.query.format as string) || 'csv'
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${moduleName}.json"`)
      return res.send(JSON.stringify(records, null, 2))
    }
    const escape = (v: any) => {
      if (v == null) return ''
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }
    const csv = [allKeys.join(',')].concat(records.map(r => allKeys.map(k => escape(r[k])).join(','))).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${moduleName}.csv"`)
    res.send(csv)
  } catch (err) { next(err) }
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

settingsRouter.post('/import/:module', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const moduleName = req.params.module
    const config = getModuleConfig(moduleName)
    if (!config) return res.status(404).json({ error: 'Unknown module' })
    const model = (prisma as any)[config.modelName]
    if (!model) return res.status(404).json({ error: 'Unknown model' })
    if (!req.file) return res.status(400).json({ error: 'CSV file required' })
    const content = req.file.buffer.toString('utf-8')
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header row and data rows' })
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const parseRow = (line: string): string[] => {
      const out: string[] = []
      let cur = ''
      let inQ = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ }
        else if (c === ',' && !inQ) { out.push(cur); cur = '' }
        else cur += c
      }
      out.push(cur)
      return out.map(x => x.trim())
    }
    const skipKeys = new Set(['id', 'companyId', 'createdAt', 'updatedAt', 'password', 'createdBy'])
    let created = 0
    let failed = 0
    const limit = (await getOrgSetting(req.user!.companyId, 'importExport')).maxRows || 1000
    for (const line of lines.slice(1, limit + 1)) {
      try {
        const cells = parseRow(line)
        const data: any = {}
        header.forEach((h, i) => {
          if (!h || skipKeys.has(h)) return
          const v = cells[i]
          if (v == null || v === '') { data[h] = null; return }
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) data[h] = new Date(v + 'T12:00:00').toISOString()
          else if (v === 'true' || v === 'false') data[h] = v === 'true'
          else if (/^-?\d+(\.\d+)?$/.test(v)) data[h] = Number(v)
          else data[h] = v
        })
        if (req.user!.companyId) data.companyId = req.user!.companyId
        data.createdBy = req.user!.userId
        if (!data.assignedTo) data.assignedTo = req.user!.userId
        await model.create({ data })
        created++
      } catch { failed++ }
    }
    await writeAudit({ moduleName: moduleName, action: 'IMPORT', newValue: `created=${created} failed=${failed}`, userId: req.user!.userId, req })
    res.json({ success: true, created, failed, total: Math.min(lines.length - 1, limit) })
  } catch (err) { next(err) }
})

function coerceCell(v: any): any {
  if (v == null || v === '') return null
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T12:00:00').toISOString()
  if (s === 'true' || s === 'false') return s === 'true'
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  return v
}

const IMPORT_BOOLEANS = new Set(['emailOptOut', 'notifyOwner', 'doNotCall', 'portal', 'vat', 'isService', 'isSales', 'active', 'discontinued'])

settingsRouter.post('/import/:module/rows', requireAdmin, async (req, res, next) => {
  try {
    const moduleName = req.params.module
    const config = getModuleConfig(moduleName)
    if (!config) return res.status(404).json({ error: 'Unknown module' })
    const model = (prisma as any)[config.modelName]
    if (!model) return res.status(404).json({ error: 'Unknown model' })
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : []
    const options = req.body?.options || {}
    const matchField = options.matchField as string | undefined
    const updateExisting = !!options.updateExisting && !!matchField
    if (!rows.length) return res.status(400).json({ error: 'No rows to import' })
    const limit = (await getOrgSetting(req.user!.companyId, 'importExport')).maxRows || 1000
    const skipKeys = new Set(['id', 'companyId', 'createdAt', 'updatedAt', 'password', 'createdBy'])
    const errors: { row: number; error: string }[] = []
    let created = 0
    let updated = 0
    for (let i = 0; i < rows.length && i < limit; i++) {
      const row = rows[i]
      if (!row || typeof row !== 'object') { errors.push({ row: i + 1, error: 'Invalid row' }); continue }
      const data: any = {}
      let hadData = false
      for (const [k, raw] of Object.entries(row)) {
        if (!k || skipKeys.has(k)) continue
        let v: any = coerceCell(raw)
        if (IMPORT_BOOLEANS.has(k) && typeof raw === 'string' && v === null) {
          const low = String(raw).trim().toLowerCase()
          if (['yes', 'no', '1', '0', 'y', 'n'].includes(low)) v = ['yes', '1', 'y'].includes(low)
        }
        data[k] = v
        if (v != null && v !== '') hadData = true
      }
      if (!hadData) { errors.push({ row: i + 1, error: 'Row is empty' }); continue }
      if (req.user!.companyId) data.companyId = req.user!.companyId
      data.createdBy = req.user!.userId
      if (!data.assignedTo) data.assignedTo = req.user!.userId
      if (config.modelName === 'purchaseOrder' && (data.conversionRate == null || data.conversionRate === '')) data.conversionRate = 1
      try {
        if (updateExisting && matchField && data[matchField] != null) {
          const existing = await model.findFirst({ where: { [matchField]: data[matchField], companyId: data.companyId } })
          if (existing) {
            await model.update({ where: { id: existing.id }, data })
            updated++
            continue
          }
        }
        await model.create({ data })
        created++
      } catch (e: any) {
        errors.push({ row: i + 1, error: e?.message || 'Failed to save record' })
      }
    }
    await writeAudit({ moduleName, action: 'IMPORT', newValue: `created=${created} updated=${updated} failed=${errors.length}`, userId: req.user!.userId, req })
    res.json({ success: true, created, updated, failed: errors.length, total: Math.min(rows.length, limit), errors: errors.slice(0, 50) })
  } catch (err) { next(err) }
})

settingsRouter.post('/smtp/test', requireAdmin, async (req, res, next) => {
  try {
    const cfg = req.body
    const result = await testSmtpConnection(cfg)
    if (!result.ok) return res.status(400).json({ error: result.error || 'Connection failed' })
    res.json({ success: true, message: 'SMTP connection verified' })
  } catch (err) { next(err) }
})

settingsRouter.post('/email/send', requireAdmin, async (req, res, next) => {
  try {
    const { to, subject, html, text } = req.body
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' })
    const result = await sendMail({ to, subject, html, text, companyId: req.user!.companyId })
    res.json(result)
  } catch (err) { next(err) }
})

// ---- 2FA ----
settingsRouter.get('/2fa/setup', userOnly(async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.twoFactorEnabled) return res.json({ enabled: true })
    const secret = user.twoFactorSecret || generateSecret()
    if (!user.twoFactorSecret) await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } })
    res.json({ enabled: false, secret, otpauthUri: otpauthUri(secret, user.email) })
  } catch (err) { next(err) }
}))

settingsRouter.post('/2fa/enable', userOnly(async (req, res, next) => {
  try {
    const { code } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA not initialized' })
    if (!verifyTotp(user.twoFactorSecret, code)) return res.status(400).json({ error: 'Invalid verification code' })
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
    res.json({ success: true })
  } catch (err) { next(err) }
}))

settingsRouter.post('/2fa/disable', userOnly(async (req, res, next) => {
  try {
    const { code, password } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user || !user.twoFactorEnabled) return res.status(400).json({ error: '2FA not enabled' })
    let ok = false
    if (code && user.twoFactorSecret) ok = verifyTotp(user.twoFactorSecret, code)
    if (!ok && password) ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ error: 'Invalid verification code or password' })
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    res.json({ success: true })
  } catch (err) { next(err) }
}))

// ---- Change own password ----
settingsRouter.post('/password/change', userOnly(async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!(await bcrypt.compare(currentPassword || '', user.password))) return res.status(400).json({ error: 'Current password is incorrect' })
    const policyError = await validatePassword(req.user!.companyId, newPassword)
    if (policyError) return res.status(400).json({ error: policyError })
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 10), resetToken: null, resetTokenExpires: null } })
    res.json({ success: true })
  } catch (err) { next(err) }
}))

// ---- Sequence numbers (auto numbering preview) ----
settingsRouter.get('/sequence-numbers', requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.sequenceNumber.findMany({
      where: req.user!.isSuperAdmin ? {} : { companyId: req.user!.companyId },
      orderBy: { moduleName: 'asc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.put('/sequence-numbers/:moduleName', requireAdmin, async (req, res, next) => {
  try {
    const { moduleName } = req.params
    const { prefix, suffix, digitWidth, currentNo } = req.body
    const companyId = req.user!.isSuperAdmin ? (req.body.companyId ?? null) : req.user!.companyId
    let row = await prisma.sequenceNumber.findFirst({ where: { moduleName, companyId } })
    if (!row) {
      row = await prisma.sequenceNumber.create({
        data: { moduleName, companyId, prefix: prefix || '', suffix: suffix || '', digitWidth: digitWidth || 4, currentNo: currentNo || 1 },
      }).catch(async () => {
        const existing = await prisma.sequenceNumber.findFirst({ where: { moduleName, companyId } })
        if (existing) {
          return prisma.sequenceNumber.update({ where: { id: existing.id }, data: { prefix, suffix, digitWidth, currentNo } })
        }
        return null
      })
    } else {
      row = await prisma.sequenceNumber.update({ where: { id: row.id }, data: { prefix, suffix, digitWidth, currentNo } })
    }
    res.json(row)
  } catch (err) { next(err) }
})

// ---- Tags (company-scoped) ----
settingsRouter.get('/tags', async (req, res, next) => {
  try {
    const where: any = req.user!.isSuperAdmin ? {} : { companyId: req.user!.companyId }
    const data = await prisma.tag.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/tags', async (req, res, next) => {
  try {
    const { name, module, recordId } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const tag = await prisma.tag.create({
      data: { name, module: module || null, recordId: recordId || null, userId: req.user!.userId, companyId: req.user!.isSuperAdmin ? null : req.user!.companyId },
    })
    await writeAudit({ moduleName: 'tags', recordId: tag.id, action: 'CREATE', newValue: name, userId: req.user!.userId, req })
    res.status(201).json(tag)
  } catch (err) { next(err) }
})

settingsRouter.put('/tags/:id', async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const where: any = { id: req.params.id }
    if (!req.user!.isSuperAdmin) where.companyId = req.user!.companyId
    const tag = await prisma.tag.updateMany({ where, data: { name } })
    if (tag.count === 0) return res.status(404).json({ error: 'Tag not found' })
    await writeAudit({ moduleName: 'tags', recordId: req.params.id, action: 'UPDATE', newValue: name, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

settingsRouter.delete('/tags/:id', async (req, res, next) => {
  try {
    const where: any = { id: req.params.id }
    if (!req.user!.isSuperAdmin) where.companyId = req.user!.companyId
    await prisma.tag.deleteMany({ where })
    await writeAudit({ moduleName: 'tags', recordId: req.params.id, action: 'DELETE', userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Custom views (company-scoped) ----
settingsRouter.get('/customviews/:moduleName', async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({ where: { name: req.params.moduleName } })
    if (!module) return res.json({ data: [] })
    const where: any = { moduleId: module.id }
    if (!req.user!.isSuperAdmin) where.companyId = req.user!.companyId
    const data = await prisma.customView.findMany({ where, orderBy: { createdAt: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

settingsRouter.post('/customviews', async (req, res, next) => {
  try {
    const { moduleName, name, columns, conditions, orderBy, isPublic, isDefault } = req.body
    const module = await prisma.module.findUnique({ where: { name: moduleName } })
    if (!module) return res.status(404).json({ error: 'Module not found' })
    const view = await prisma.customView.create({
      data: {
        moduleId: module.id,
        name,
        columns: columns || [],
        conditions: conditions || [],
        orderBy: orderBy || null,
        isPublic: !!isPublic,
        isDefault: !!isDefault,
        userId: req.user!.isSuperAdmin ? null : req.user!.userId,
        companyId: req.user!.isSuperAdmin ? null : req.user!.companyId,
      },
    })
    res.status(201).json(view)
  } catch (err) { next(err) }
})

settingsRouter.put('/customviews/:id', async (req, res, next) => {
  try {
    const where: any = { id: req.params.id }
    if (!req.user!.isSuperAdmin) where.companyId = req.user!.companyId
    const { name, columns, conditions, orderBy, isPublic, isDefault } = req.body
    const view = await prisma.customView.update({
      where,
      data: { name, columns: columns || [], conditions: conditions || [], orderBy: orderBy || null, isPublic: !!isPublic, isDefault: !!isDefault },
    })
    res.json(view)
  } catch (err) { next(err) }
})

settingsRouter.delete('/customviews/:id', async (req, res, next) => {
  try {
    const where: any = { id: req.params.id }
    if (!req.user!.isSuperAdmin) where.companyId = req.user!.companyId
    await prisma.customView.deleteMany({ where })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export { nextSequenceNumber }
