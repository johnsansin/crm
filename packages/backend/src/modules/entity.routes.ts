import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { getModuleConfig } from './moduleSetup'
import { runWorkflows } from '../lib/settings'
import { writeAudit, writeAuditFields } from '../lib/audit'
import { sendMail, getSmtpConfig } from '../lib/mailer'

const moduleActiveCache = new Map<string, { active: boolean; at: number }>()
async function isModuleActive(moduleName: string): Promise<boolean | null> {
  const cached = moduleActiveCache.get(moduleName)
  if (cached && Date.now() - cached.at < 30000) return cached.active
  const row = await prisma.module.findUnique({ where: { name: moduleName } }).catch(() => null)
  const active = row ? row.isActive : null
  moduleActiveCache.set(moduleName, { active: active ?? true, at: Date.now() })
  return active
}

async function getSharingAccess(companyId: string | undefined, moduleName: string) {
  if (!companyId) return null
  return prisma.sharingRule.findUnique({
    where: { companyId_moduleName: { companyId, moduleName } },
  }).catch(() => null)
}

async function sharedUserIds(companyId: string | undefined, moduleName: string, selfId: string): Promise<Set<string>> {
  const ids = new Set<string>([selfId])
  if (!companyId) return ids
  const rule = await getSharingAccess(companyId, moduleName)
  if (!rule) return ids
  const roleIds: string[] = (rule.roleIds as any[]) || []
  if (roleIds.length) {
    const usersInRoles = await prisma.user.findMany({ where: { roleId: { in: roleIds }, isActive: true }, select: { id: true } })
    for (const u of usersInRoles) ids.add(u.id)
  }
  return ids
}

async function canMutateRecord(req: any, record: any, moduleName: string): Promise<boolean> {
  if (req.user?.isSuperAdmin || req.user?.isAdmin) return true
  const rule = await getSharingAccess(req.user!.companyId, moduleName)
  if (!rule || rule.accessType === 'PublicReadWrite' || rule.accessType === 'PublicReadWriteDelete' || rule.accessType === 'PublicReadWriteDeleteImport') {
    return true
  }
  const ids = await sharedUserIds(req.user!.companyId, moduleName, req.user!.userId)
  const owner = record?.createdBy || record?.assignedTo
  return owner ? ids.has(owner) : true
}

const CUSTOM_FIELD_PREFIX = 'cf_'

const modelMap: Record<string, string> = {
  accounts: 'account',
  contacts: 'contact',
  leads: 'lead',
  potentials: 'potential',
  campaigns: 'campaign',
  products: 'product',
  services: 'service',
  vendors: 'vendor',
  pricebooks: 'priceBook',
  quotes: 'quote',
  salesorders: 'salesOrder',
  purchaseorders: 'purchaseOrder',
  invoices: 'invoice',
  tickets: 'ticket',
  faq: 'faq',
  documents: 'document',
  emails: 'email',
  emailtemplates: 'emailTemplate',
  projects: 'project',
  projecttasks: 'projectTask',
  projectmilestones: 'projectMilestone',
  assets: 'asset',
  servicecontracts: 'serviceContract',
  smsnotifier: 'smsNotifier',
  currencies: 'currency',
  taxinfo: 'taxInfo',
  roles: 'role'
}

const modelPrismaName: Record<string, string> = {
  usergroups: 'userGroup',
  rolepermissions: 'rolePermission'
}

const scopedModels = new Set([
  'account', 'contact', 'lead', 'potential', 'campaign',
  'product', 'service', 'vendor', 'priceBook',
  'quote', 'salesOrder', 'purchaseOrder', 'invoice',
  'ticket', 'faq', 'document', 'email', 'emailTemplate',
  'project', 'projectTask', 'projectMilestone',
  'asset', 'serviceContract', 'smsNotifier', 'role',
  'userGroup', 'userGroupMember'
])

const permissionModules = new Set([
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns',
  'products', 'services', 'vendors', 'pricebooks',
  'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'documents', 'emails', 'emailtemplates',
  'projects', 'projecttasks', 'projectmilestones',
  'assets', 'servicecontracts', 'smsnotifier'
])

const settingsModules = new Set([
  'currencies', 'taxinfo', 'roles', 'usergroups', 'rolepermissions'
])

const booleanFields = new Set([
  'emailOptOut', 'notifyOwner', 'doNotCall', 'portal', 'discontinued',
  'active', 'isDefault', 'isActive', 'isPublic', 'isAdmin',
  'enableRecurring', 'pending'
])

const decimalFields = new Set([
  'total', 'subTotal', 'discount', 'discountPercent', 'adjustment',
  'shipping', 'shippingHandling', 'taxAmount', 'grandTotal',
  'amount', 'unitPrice', 'costPrice', 'commissionRate',
  'annualRevenue', 'expectedRevenue', 'budget', 'actualCost',
  'expectedResponse', 'targetSize', 'expectedROI', 'actualROI',
  'expectedCount', 'actualCount', 'salesCommission', 'exciseDuty',
  'targetBudget', 'actualBudget', 'rate', 'progress', 'probability',
  'commissionPercentage', 'listPrice', 'netPrice', 'lineTotal',
  'qtyInStock', 'qtyOnOrder', 'qtyInDemand', 'reorderLevel',
  'weight', 'packSize', 'employees', 'noOfEmployees',
  'hours', 'days', 'totalUnits', 'usedUnits',
  'plannedHours', 'actualHours', 'sequence',
])

function fixBooleans(data: any) {
  for (const k of Object.keys(data)) {
    if (booleanFields.has(k) && data[k] == null) data[k] = false
  }
}

function fixDecimals(data: any) {
  for (const k of Object.keys(data)) {
    if (decimalFields.has(k) && (data[k] == null || data[k] === '')) data[k] = 0
  }
}

async function getCustomFieldDefs(companyId: string | undefined, moduleName: string) {
  if (!companyId) return []
  return prisma.customField.findMany({ where: { companyId, moduleName, isActive: true }, orderBy: { sequence: 'asc' } })
}

async function mergeCustomValues(moduleName: string, records: any[]): Promise<any[]> {
  if (!records.length) return records
  const rows = await prisma.customFieldValue.findMany({
    where: { moduleName, recordId: { in: records.map(r => r.id) } },
  }).catch(() => [])
  const map = new Map(rows.map(r => [r.recordId, (r.values as any) || {}]))
  return records.map(r => ({ ...r, customFields: map.get(r.id) || {} }))
}

function splitCustomData(data: any): { data: any; custom: Record<string, any> | null } {
  const custom: Record<string, any> = {}
  let hasCustom = false
  for (const k of Object.keys(data)) {
    if (k.startsWith(CUSTOM_FIELD_PREFIX)) {
      custom[k] = data[k]
      hasCustom = true
      delete data[k]
    }
  }
  return { data, custom: hasCustom ? custom : null }
}

async function saveCustomData(moduleName: string, recordId: string, custom: Record<string, any> | null) {
  if (!custom || !recordId) return
  await prisma.customFieldValue.upsert({
    where: { moduleName_recordId: { moduleName, recordId } },
    update: { values: custom },
    create: { moduleName, recordId, values: custom },
  })
}

function addScope(where: any, companyId?: string): any {
  if (companyId) where.companyId = companyId
  return where
}

async function checkPermission(req: any, action: string): Promise<boolean> {
  const user = req.user
  if (user?.isSuperAdmin || user?.isAdmin) return true

  const moduleName = req.moduleName || ''
  if (settingsModules.has(moduleName)) return false

  if (!permissionModules.has(moduleName)) return true

  if (!user?.companyId) return false

  const role = await prisma.role.findFirst({
    where: { id: user.roleId, companyId: user.companyId, isActive: true },
    include: { permissions: { where: { moduleName } } }
  })
  if (!role) return false

  const perm = role.permissions[0]
  if (!perm) return false

  switch (action) {
    case 'view': return perm.view
    case 'create': return perm.create
    case 'edit': return perm.edit
    case 'delete': return perm.delete
    case 'import': return perm.import
    case 'export': return perm.export
    default: return false
  }
}

function buildInclude(_moduleName: string): Record<string, any> {
  return {}
}

export function entityRouter(moduleName: string): Router {
  const router = Router()
  const modelName = modelMap[moduleName] || modelPrismaName[moduleName]
  if (!modelName) return router
  const prismaModel = (prisma as any)[modelName]
  const isScoped = scopedModels.has(modelName)

  router.use(authMiddleware)
  router.use(async (req: any, _res, next) => {
    req.moduleName = moduleName
    const active = await isModuleActive(moduleName)
    if (active === false && !(req.user?.isSuperAdmin || req.user?.isAdmin)) {
      return _res.status(403).json({ error: 'Module is disabled' })
    }
    next()
  })

  async function applyReadScope(req: any, where: any) {
    if (req.user?.isSuperAdmin || req.user?.isAdmin) return
    const rule = await getSharingAccess(req.user!.companyId, moduleName)
    if (rule && (rule.accessType === 'Private' || rule.accessType === 'PublicRead')) {
      const ids = await sharedUserIds(req.user!.companyId, moduleName, req.user!.userId)
      where.OR = [...(where.OR || []), { OR: [{ createdBy: { in: [...ids] } }, { assignedTo: { in: [...ids] } }] }]
    }
  }

  router.get('/', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      const { search, page = '1', limit = '25', sortBy, sortOrder, filter } = req.query
      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const skip = (pageNum - 1) * limitNum
      const config = getModuleConfig(moduleName)

      let where: any = { isActive: true }
      if (isScoped) addScope(where, req.user!.companyId)
      if (search && config) {
        where.OR = config.searchFields.map((f: string) => ({
          [f]: { contains: search, mode: 'insensitive' }
        }))
      }
      if (filter) {
        try { Object.assign(where, JSON.parse(filter as string)) } catch { /* ignore invalid filter */ }
      }
      await applyReadScope(req, where)

      let orderBy: any = { createdAt: 'desc' }
      if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }

      const [data, total] = await Promise.all([
        prismaModel.findMany({ where, skip, take: limitNum, orderBy }),
        prismaModel.count({ where })
      ])

      const merged = await mergeCustomValues(moduleName, data)
      res.json({ data: merged, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
    } catch (err) { next(err) }
  })

  router.get('/all', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      const { search, sortBy, sortOrder, filter } = req.query
      const config = getModuleConfig(moduleName)
      let where: any = { isActive: true }
      if (isScoped) addScope(where, req.user!.companyId)
      if (search && config) {
        where.OR = config.searchFields.map((f: string) => ({
          [f]: { contains: search, mode: 'insensitive' }
        }))
      }
      if (filter) {
        try { Object.assign(where, JSON.parse(filter as string)) } catch { /* ignore invalid filter */ }
      }
      let orderBy: any = { createdAt: 'desc' }
      if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }
      const data = await prismaModel.findMany({ where, orderBy })
      const merged = await mergeCustomValues(moduleName, data)
      res.json({ data: merged })
    } catch (err) { next(err) }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      const record = await prismaModel.findFirst({ where, include: buildInclude(moduleName) })
      if (!record) return res.status(404).json({ error: 'Not found' })
      const merged = await mergeCustomValues(moduleName, [record])
      res.json(merged[0])
    } catch (err) { next(err) }
  })

  router.post('/', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'create'))) return res.status(403).json({ error: 'Access denied' })
      const body: any = { ...req.body }
      if (isScoped) body.companyId = req.user!.companyId
      const { data, custom } = splitCustomData(body)
      for (const k of Object.keys(data)) {
        if (typeof data[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data[k])) {
          data[k] = new Date(data[k] + 'T12:00:00').toISOString()
        }
        if (data[k] === '') data[k] = null
      }
      if (modelName !== 'role' && modelName !== 'currency' && modelName !== 'taxInfo') {
        data.createdBy = req.user!.userId
        data.assignedTo = req.body.assignedTo || req.user!.userId
      }
      fixBooleans(data)
      fixDecimals(data)
      if (modelName === 'currency' && data.isDefault) {
        await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
      }
      const record = await prismaModel.create({ data })
      if (custom) await saveCustomData(moduleName, record.id, custom)
      await writeAudit({ moduleName, recordId: record.id, action: 'CREATE', newValue: JSON.stringify({ id: record.id, ...data }), userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onCreate', record, req })

      if (moduleName === 'emails' && record.toEmails && record.subject) {
        const smtp = await getSmtpConfig(req.user!.companyId)
        sendMail({
          to: String(record.toEmails).split(',').map(s => s.trim()).filter(Boolean),
          subject: record.subject,
          html: record.body || undefined,
          fromOverride: smtp,
        }).then(() => {
          prismaModel.update({ where: { id: record.id }, data: { emailFlag: 'Sent' } }).catch(() => {})
        }).catch(() => {})
      }

      res.status(201).json(record)
    } catch (err) { next(err) }
  })

  router.put('/:id', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'edit'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      const before = await prismaModel.findFirst({ where })
      if (!before) return res.status(404).json({ error: 'Not found' })
      if (!(await canMutateRecord(req, before, moduleName))) return res.status(403).json({ error: 'Access denied by sharing rules' })
      const body: any = { ...req.body }
      const { data, custom } = splitCustomData(body)
      for (const k of Object.keys(data)) {
        if (typeof data[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data[k])) {
          data[k] = new Date(data[k] + 'T12:00:00').toISOString()
        }
        if (data[k] === '') data[k] = null
      }
      fixBooleans(data)
      fixDecimals(data)
      if (modelName === 'currency' && data.isDefault) {
        await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
      }
      const record = await prismaModel.update({ where, data })
      if (custom) await saveCustomData(moduleName, record.id, custom)
      await writeAuditFields({ moduleName, recordId: record.id, before, after: { ...before, ...data }, userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onUpdate', record, prevRecord: before, req })
      const merged = await mergeCustomValues(moduleName, [record])
      res.json(merged[0])
    } catch (err) { next(err) }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'delete'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      const before = await prismaModel.findFirst({ where })
      if (!before) return res.status(404).json({ error: 'Not found' })
      if (!(await canMutateRecord(req, before, moduleName))) return res.status(403).json({ error: 'Access denied by sharing rules' })
      await prismaModel.update({ where, data: { isActive: false } })
      await writeAudit({ moduleName, recordId: before.id, action: 'DELETE', oldValue: JSON.stringify({ id: before.id }), userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onDelete', record: before, req })
      res.json({ success: true })
    } catch (err) { next(err) }
  })

  router.delete('/:id/hard', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'delete'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      await prismaModel.delete({ where })
      res.json({ success: true })
    } catch (err) { next(err) }
  })

  router.put('/:id/restore', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'edit'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      const record = await prismaModel.update({ where, data: { isActive: true } })
      res.json(record)
    } catch (err) { next(err) }
  })

  return router
}
