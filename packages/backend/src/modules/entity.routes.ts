import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireTenant } from '../lib/module-permissions'
import { getModuleConfig } from './moduleSetup'
import { runWorkflows, nextSequenceNumber, setOrgSetting } from '../lib/settings'
import { writeAudit, writeAuditFields, auditSummary } from '../lib/audit'
import { sendMail, getSmtpConfig } from '../lib/mailer'
import { notifyFollowersAndAssignee } from '../lib/notify'

async function syncInvoiceBalance(invoiceId: string, companyId: string) {
  try {
    const inv = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } })
    if (!inv) return
    const receipts = await prisma.receipt.findMany({ where: { invoiceId, isActive: true } })
    const totalPaid = receipts.reduce((s, r) => s + Number(r.amount || 0), 0)
    let invoiceStatus = inv.invoiceStatus
    const grandTotal = Number(inv.grandTotal || 0)
    if (totalPaid >= grandTotal - 0.005) invoiceStatus = 'Paid'
    else if (totalPaid > 0) invoiceStatus = 'Partially Paid'
    else invoiceStatus = inv.invoiceStatus === 'Paid' || inv.invoiceStatus === 'Partially Paid' ? 'Sent' : inv.invoiceStatus
    await prisma.invoice.update({ where: { id: invoiceId }, data: { paidAmount: Number(totalPaid.toFixed(2)), invoiceStatus } })
  } catch {}
}

async function syncPOBalance(poId: string, companyId: string) {
  try {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: poId, companyId } })
    if (!po) return
    const payments = await prisma.payment.findMany({ where: { purchaseOrderId: poId, isActive: true } })
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    let poStatus = po.poStatus
    const grandTotal = Number(po.grandTotal || 0)
    if (totalPaid >= grandTotal - 0.005) poStatus = 'Paid'
    else if (totalPaid > 0) poStatus = 'Partially Paid'
    else poStatus = po.poStatus === 'Paid' || po.poStatus === 'Partially Paid' ? 'Approved' : po.poStatus
    await prisma.purchaseOrder.update({ where: { id: poId }, data: { paidAmount: Number(totalPaid.toFixed(2)), poStatus } })
  } catch {}
}

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
  const me = await prisma.user.findUnique({ where: { id: selfId }, select: { roleId: true } }).catch(() => null)
  if (me?.roleId) ids.add(me.roleId)
  const memberships = await prisma.userGroupMember.findMany({
    where: { userId: selfId, group: { companyId, isActive: true } },
    select: { groupId: true },
  }).catch(() => [])
  for (const membership of memberships) ids.add(membership.groupId)
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

const NO_ASSIGNED_TO = new Set([
  'recurringInvoice', 'receipt', 'payment', 'mailbox', 'rssFeed', 'rssEntry', 'report',
  'apiKey', 'moduleLayout', 'picklistDependency', 'emailToTicketRule',
  'portalUser', 'googleAccount',
  'ticketComment', 'escalationHistory', 'stageProbability',
  'quantityDiscount', 'timeEntry', 'projectResource', 'potentialCompetitor',
])

// Products/Services keep their "active" flag independent of soft-delete,
// matching vtiger (an inactive product stays visible in the list).
const TRASH_BY_IS_DELETED = new Set(['product', 'service'])

export const modelMap: Record<string, string> = {
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
  receipts: 'receipt',
  payments: 'payment',
  recurringinvoices: 'recurringInvoice',
  calllogs: 'callLog',
  reports: 'report',
  mailboxes: 'mailbox',
  rssfeeds: 'rssFeed',
  rssentries: 'rssEntry',
  currencies: 'currency',
  taxinfo: 'taxInfo',
  roles: 'role',
  competitors: 'competitor',
  timeentries: 'timeEntry',
  stageprobability: 'stageProbability',
  quantitydiscounts: 'quantityDiscount',
  ticketcomments: 'ticketComment',
  escalationhistory: 'escalationHistory',
  projectresources: 'projectResource',
}

const modelPrismaName: Record<string, string> = {
  usergroups: 'userGroup',
  rolepermissions: 'rolePermission'
}

export const scopedModels = new Set([
  'account', 'contact', 'lead', 'potential', 'campaign',
  'product', 'service', 'vendor', 'priceBook',
  'quote', 'salesOrder', 'purchaseOrder', 'invoice',
  'ticket', 'faq', 'document', 'email', 'emailTemplate',
  'project', 'projectTask', 'projectMilestone',
  'asset', 'serviceContract', 'smsNotifier', 'role',
  'userGroup', 'userGroupMember',
  'currency', 'taxInfo', 'tag', 'customView',
  'potentialProduct', 'potentialStageHistory', 'callLog', 'report',
  'competitor', 'potentialCompetitor', 'timeEntry', 'stageProbability',
  'quantityDiscount', 'ticketComment', 'escalationHistory', 'projectResource',
  'receipt', 'payment',
])

const permissionModules = new Set([
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns',
  'products', 'services', 'vendors', 'pricebooks',
  'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'documents', 'emails', 'emailtemplates',
  'projects', 'projecttasks', 'projectmilestones',
  'assets', 'servicecontracts', 'smsnotifier',
  'payments', 'receipts', 'recurringinvoices', 'calllogs', 'reports',
  'mailboxes', 'rssfeeds',
  'competitors', 'timeentries', 'stageprobability',
  'quantitydiscounts', 'ticketcomments', 'escalationhistory', 'projectresources',
])

const settingsModules = new Set([
  'currencies', 'taxinfo', 'roles', 'usergroups', 'rolepermissions'
])

const booleanFields = new Set([
  'emailOptOut', 'notifyOwner', 'doNotCall', 'portal', 'discontinued',
  'active', 'isDefault', 'isActive', 'isPublic', 'isAdmin',
  'enableRecurring', 'pending', 'isRead', 'shared',
  'syncCalendar', 'syncContacts', 'createContactIfMissing',
  'vat', 'isService', 'isSales',
  'decisionMaker', 'autoAssigned', 'trialAvailable', 'discountAllowed',
  'qtyDiscountEnabled', 'billable', 'approved',
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
  'amount', 'markupPercent', 'paidAmount',
  'vatPercentage', 'servicePercentage', 'salesPercentage',
  'setupFee', 'purchasePrice', 'salvageValue', 'billingRate',
  'estimatedHours', 'loggedHours', 'lateFeePercent',
  'minimumOrderQty', 'maximumOrderQty', 'marketShare',
  'hourlyRate', 'maxDiscountPercent', 'conversionRate',
  'taxPercent', 'discountPercent',
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

const dmmfModels = () => Prisma.dmmf?.datamodel?.models || []
function modelHasScalarField(modelName: string, fieldName: string): boolean {
  const model = dmmfModels().find((m) => m.name.toLowerCase() === modelName.toLowerCase())
  return !!model?.fields.some((field) => field.kind === 'scalar' && field.name === fieldName)
}
function requiredModelFields(modelName: string): string[] {
  const model = dmmfModels().find((m) => m.name.toLowerCase() === modelName.toLowerCase())
  if (!model) return []
  return model.fields
    .filter((f) => f.kind === 'scalar' && f.isRequired && !f.isId && !f.hasDefaultValue && !f.isUpdatedAt)
    .map((f) => f.name)
}
function missingRequiredFields(modelName: string, data: any): string[] {
  return requiredModelFields(modelName).filter((f) => data[f] == null || data[f] === '')
}
function emptyRequiredFields(modelName: string, data: any): string[] {
  return requiredModelFields(modelName).filter((f) => f in data && (data[f] == null || data[f] === ''))
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
  if (moduleName === 'currencies' && action === 'view') return true
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

function buildInclude(moduleName: string): Record<string, any> {
  if (moduleName === 'potentials') {
    return {
      products: { include: { product: { select: { id: true, productName: true, productNo: true, unitPrice: true } } } },
      stageHistory: { include: { changedByUser: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
      competitors: { include: { competitor: true } },
    }
  }
  if (moduleName === 'products') {
    return { images: { orderBy: { sortOrder: 'asc' as const } } }
  }
  if (moduleName === 'purchaseorders') {
    return { lineItems: { orderBy: { sequence: 'asc' as const } } }
  }
  if (moduleName === 'projects') {
    return { resources: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } } }
  }
  return {}
}

async function validateProjectLinks(modelName: string, data: any, companyId: string) {
  if (['projectTask', 'projectMilestone', 'timeEntry', 'projectResource'].includes(modelName) && data.projectId) {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, companyId, isActive: true }, select: { id: true } })
    if (!project) throw Object.assign(new Error('Project not found in this organization'), { status: 404 })
  }
  if (modelName === 'timeEntry' && data.taskId) {
    const task = await prisma.projectTask.findFirst({ where: { id: data.taskId, projectId: data.projectId, companyId, isActive: true }, select: { id: true } })
    if (!task) throw Object.assign(new Error('Task does not belong to this project'), { status: 400 })
  }
  if (modelName === 'projectTask' && data.milestoneId) {
    const milestone = await prisma.projectMilestone.findFirst({ where: { id: data.milestoneId, projectId: data.projectId, companyId, isActive: true }, select: { id: true } })
    if (!milestone) throw Object.assign(new Error('Milestone does not belong to this project'), { status: 400 })
  }
  if (['timeEntry', 'projectResource'].includes(modelName) && data.userId) {
    const user = await prisma.user.findFirst({ where: { id: data.userId, companyId, isActive: true }, select: { id: true } })
    if (!user) throw Object.assign(new Error('User not found in this organization'), { status: 404 })
  }
  if (data.progress != null && (Number(data.progress) < 0 || Number(data.progress) > 100)) throw Object.assign(new Error('Progress must be between 0 and 100'), { status: 400 })
  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) throw Object.assign(new Error('End date cannot be before start date'), { status: 400 })
}

async function validateQuantityDiscount(data: any, companyId: string, excludeId?: string) {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, companyId, isActive: true, isDeleted: false },
    select: { id: true },
  })
  if (!product) return 'Select an active product from this organization'
  const minQty = Number(data.minQty)
  const maxQty = data.maxQty == null || data.maxQty === '' ? null : Number(data.maxQty)
  const discount = Number(data.discountPercent)
  if (!Number.isFinite(minQty) || minQty <= 0) return 'Minimum quantity must be greater than 0'
  if (maxQty != null && (!Number.isFinite(maxQty) || maxQty < minQty)) return 'Maximum quantity must be at least the minimum quantity'
  if (!Number.isFinite(discount) || discount <= 0 || discount > 100) return 'Discount must be greater than 0 and no more than 100%'
  const existing = await prisma.quantityDiscount.findMany({
    where: { productId: data.productId, companyId, isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { minQty: true, maxQty: true },
  })
  const overlaps = existing.some((range) => {
    const existingMax = range.maxQty == null ? Infinity : Number(range.maxQty)
    return minQty <= existingMax && Number(range.minQty) <= (maxQty ?? Infinity)
  })
  return overlaps ? 'This quantity range overlaps an active discount for the selected product' : null
}

async function syncProjectSummary(projectId?: string | null) {
  if (!projectId) return
  const [project, tasks, milestones, time, resources] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.projectTask.findMany({ where: { projectId, isActive: true }, select: { progress: true, status: true, loggedHours: true } }),
    prisma.projectMilestone.findMany({ where: { projectId, isActive: true }, select: { progress: true, status: true } }),
    prisma.timeEntry.aggregate({ where: { projectId, isActive: true }, _sum: { hours: true } }),
    prisma.projectResource.count({ where: { projectId, isActive: true } }),
  ])
  if (!project) return
  const work = tasks.length ? tasks : milestones
  const progress = work.length ? Math.round(work.reduce((sum, item) => sum + Number(item.progress || (item.status === 'Completed' ? 100 : 0)), 0) / work.length) : Number(project.progress || 0)
  const actualHours = Number(time._sum.hours || tasks.reduce((sum, task) => sum + Number(task.loggedHours || 0), 0))
  const estimated = Number(project.estimatedHours || 0)
  const overdue = !!project.endDate && project.endDate < new Date() && progress < 100
  const healthStatus = overdue || (estimated > 0 && actualHours > estimated * 1.2) ? 'Off Track' : estimated > 0 && actualHours > estimated ? 'At Risk' : 'On Track'
  await prisma.project.update({ where: { id: projectId }, data: { progress, actualHours, resourceCount: resources, healthStatus } })
}

async function replacePotentialProducts(potentialId: string, products: any[], companyId?: string | null) {
  const items = Array.isArray(products) ? products : []
  await prisma.potentialProduct.deleteMany({ where: { potentialId } }).catch(() => {})
  for (const p of items) {
    if (!p?.productId) continue
    await prisma.potentialProduct.create({
      data: {
        potentialId,
        productId: p.productId,
        qty: p.qty ?? 1,
        listPrice: p.listPrice ?? null,
        companyId: companyId ?? null,
      },
    }).catch(() => {})
  }
}

async function replaceProductImages(productId: string, images: any[]) {
  const list = Array.isArray(images) ? images.filter((i: any) => i?.url && String(i.url).trim()) : []
  await prisma.productImage.deleteMany({ where: { productId } }).catch(() => {})
  const hasDefault = list.some((i: any) => !!i.isDefault)
  for (let i = 0; i < list.length; i++) {
    await prisma.productImage.create({
      data: {
        productId,
        imageUrl: String(list[i].url).trim(),
        isDefault: hasDefault ? !!list[i].isDefault : i === 0,
        sortOrder: i,
      },
    }).catch(() => {})
  }
}

async function replacePurchaseOrderLineItems(purchaseOrderId: string, items: any[]) {
  const list = Array.isArray(items) ? items : []
  await prisma.purchaseOrderLineItem.deleteMany({ where: { purchaseOrderId } }).catch(() => {})
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (!item) continue
    await prisma.purchaseOrderLineItem.create({
      data: {
        purchaseOrderId,
        productId: item.productId || null,
        serviceId: item.serviceId || null,
        itemName: item.itemName || '',
        qty: Number(item.qty) || 1,
        listPrice: Number(item.listPrice) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        discountPercent: Number(item.discountPercent) || 0,
        tax: Number(item.tax) || 0,
        taxPercent: Number(item.taxPercent) || 0,
        netPrice: Number(item.netPrice) || 0,
        lineTotal: Number(item.lineTotal) || 0,
        sequence: i,
        description: item.description || null,
      },
    }).catch(() => {})
  }
}

async function ensureUniqueProductNo(productNo: string, excludeId?: string): Promise<string | null> {
  const where: any = { productNo }
  if (excludeId) where.id = { not: excludeId }
  const existing = await prisma.product.findFirst({ where })
  if (existing) return 'Product No already exists. Please use a different value.'
  return null
}

export function entityRouter(moduleName: string): Router {
  const router = Router()
  const modelName = modelMap[moduleName] || modelPrismaName[moduleName]
  if (!modelName) return router
  const prismaModel = (prisma as any)[modelName]
  const isScoped = scopedModels.has(modelName)

  router.use(authMiddleware)
  router.use(requireTenant)
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

      let where: any = TRASH_BY_IS_DELETED.has(modelName) ? { isDeleted: false } : { isActive: true }
      if (modelName === 'currency' && req.user!.isAdmin && req.query.includeInactive === 'true') where = {}
      if (isScoped) addScope(where, req.user!.companyId)
      if (search && config) {
        where.OR = config.searchFields.map((f: string) => ({
          [f]: { contains: search, mode: 'insensitive' }
        }))
      }
      if (filter) {
        try {
          const parsed = JSON.parse(filter as string)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            delete parsed.companyId
            Object.assign(where, parsed)
          }
        } catch { /* ignore invalid filter */ }
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

  router.get('/users', async (req: any, res, next) => {
    try {
      if (!req.user!.companyId) return res.json({ data: [], roles: [] })
      const users = await prisma.user.findMany({
        where: { companyId: req.user!.companyId, isActive: true },
        select: {
          id: true, firstName: true, lastName: true, email: true, userName: true,
          roleId: true, role: { select: { id: true, name: true } },
        },
        orderBy: { firstName: 'asc' },
      })
      const roles = await prisma.role.findMany({
        where: { companyId: req.user!.companyId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
      res.json({ data: users, roles })
    } catch (err) { next(err) }
  })

  router.get('/all', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      if (modelName === 'currency' && req.user!.companyId) {
        const currencyCount = await prisma.currency.count({ where: { companyId: req.user!.companyId } })
        if (currencyCount === 0) {
          const code = 'USD'
          const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹', AED: 'د.إ', SAR: '﷼', JPY: '¥', CNY: '¥', CAD: 'C$', AUD: 'A$' }
          await prisma.currency.create({ data: { companyId: req.user!.companyId, code, name: code, symbol: symbols[code] || code, rate: 1, isDefault: true, isActive: true } })
        }
      }
      const { search, sortBy, sortOrder, filter } = req.query
      const config = getModuleConfig(moduleName)
      let where: any = { isActive: true }
      if (modelName === 'currency' && req.user!.isAdmin && req.query.includeInactive === 'true') where = {}
      if (isScoped) addScope(where, req.user!.companyId)
      if (search && config) {
        where.OR = config.searchFields.map((f: string) => ({
          [f]: { contains: search, mode: 'insensitive' }
        }))
      }
      if (filter) {
        try {
          const parsed = JSON.parse(filter as string)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            delete parsed.companyId
            Object.assign(where, parsed)
          }
        } catch { /* ignore invalid filter */ }
      }
      let orderBy: any = { createdAt: 'desc' }
      if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }
      const include = moduleName === 'products' ? { images: { orderBy: { sortOrder: 'asc' as const } } } : {}
      const data = await prismaModel.findMany({ where, orderBy, include })
      const merged = await mergeCustomValues(moduleName, data)
      res.json({ data: merged })
    } catch (err) { next(err) }
  })
  router.post('/:id/close-as-won', async (req, res, next) => {
    try {
      if (moduleName !== 'potentials') return res.status(404).json({ error: 'Not found' })
      if (!(await checkPermission(req, 'edit'))) return res.status(403).json({ error: 'Access denied' })

      let where: any = { id: req.params.id, isActive: true }
      if (isScoped) addScope(where, req.user!.companyId)
      const potential = await prismaModel.findFirst({ where })
      if (!potential) return res.status(404).json({ error: 'Opportunity not found' })

      const merged = await mergeCustomValues(moduleName, [potential])
      const pv = merged[0] || potential
      const cf = pv.customFields || {}
      const companyId = req.user!.companyId || null
      const { createAccount = true, createContact = true } = req.body || {}

      const result = await prisma.$transaction(async (tx) => {
        let account: any = null
        let contact: any = null

        if (createAccount) {
          account = await tx.account.create({
            data: {
              accountNo: await nextSequenceNumber('Account', companyId),
              accountName: potential.potentialName || 'Untitled',
              phone: cf.phone || cf.cPhone || null,
              website: cf.website || null,
              email: cf.email || cf.cEmail || null,
              industry: cf.industry || null,
              annualRevenue: potential.amount,
              rating: cf.rating || null,
              employees: cf.employees || cf.noOfEmployees || null,
              billingStreet: cf.street || cf.billingStreet || null,
              billingCity: cf.city || cf.billingCity || null,
              billingState: cf.state || cf.billingState || null,
              billingCountry: cf.country || cf.billingCountry || null,
              billingPostalCode: cf.postalCode || cf.billingPostalCode || null,
              description: potential.description || null,
              companyId,
              createdBy: req.user!.userId,
              assignedTo: potential.assignedTo || req.user!.userId,
            },
          })
        }

        if (createContact) {
          const firstName = cf.contactFirstName || cf.firstName || cf.cFirstName || ''
          const lastName = cf.contactLastName || cf.lastName || cf.cLastName || potential.potentialName || 'Contact'
          contact = await tx.contact.create({
            data: {
              contactNo: await nextSequenceNumber('Contact', companyId),
              firstName,
              lastName,
              title: cf.contactTitle || cf.title || null,
              email: cf.email || cf.contactEmail || cf.cEmail || null,
              phone: cf.phone || cf.contactPhone || cf.cPhone || null,
              mobile: cf.mobile || cf.cMobile || null,
              accountId: account ? account.id : potential.accountId || null,
              mailingStreet: cf.street || cf.mailingStreet || null,
              mailingCity: cf.city || cf.mailingCity || null,
              mailingState: cf.state || cf.mailingState || null,
              mailingCountry: cf.country || cf.mailingCountry || null,
              mailingPostalCode: cf.postalCode || cf.mailingPostalCode || null,
              description: potential.description || null,
              companyId,
              createdBy: req.user!.userId,
              assignedTo: potential.assignedTo || req.user!.userId,
            },
          })
        }

        const updated = await tx.potential.update({
          where: { id: potential.id },
          data: {
            stage: 'Closed Won',
            probability: 100,
            accountId: account ? account.id : potential.accountId || null,
            contactId: contact ? contact.id : potential.contactId || null,
          },
        })

        await tx.potentialStageHistory.create({
          data: { potentialId: potential.id, stage: 'Closed Won', changedBy: req.user!.userId, companyId },
        }).catch(() => {})

        return { potential: updated, account, contact }
      })

      await writeAudit({
        moduleName: 'potentials', recordId: potential.id,
        action: 'CONVERT',
        newValue: `Opportunity closed as won. Amount: ${potential.amount != null ? Number(potential.amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : 'N/A'}${result.account ? `. Account: ${result.account.accountName}` : ''}${result.contact ? `. Contact: ${result.contact.firstName} ${result.contact.lastName}` : ''}`,
        userId: req.user!.userId, req,
      }).catch(() => {})

      notifyFollowersAndAssignee({
        moduleName: 'potentials', recordId: potential.id, assigneeId: potential.assignedTo,
        title: `Opportunity closed as won: ${potential.potentialName}`,
        message: `"${potential.potentialName}" has been marked as Closed Won.${result.account ? ` Account "${result.account.accountName}" created.` : ''}${result.contact ? ` Contact "${result.contact.firstName} ${result.contact.lastName}" created.` : ''}`,
        link: `/potentials/${potential.id}`, companyId, actorId: req.user!.userId,
      }).catch(() => {})

      res.json(result)
    } catch (err) { next(err) }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      let record = await prismaModel.findFirst({ where, include: buildInclude(moduleName) })
      if (!record) return res.status(404).json({ error: 'Not found' })
      // Repair legacy leads created before organization-scoped auto numbering
      // was enabled. New leads receive the number during creation above.
      if (modelName === 'lead' && !record.leadNo) {
        record = await prisma.lead.update({
          where: { id: record.id },
          data: { leadNo: await nextSequenceNumber('Lead', req.user!.companyId) },
        })
      }
      const merged = await mergeCustomValues(moduleName, [record])
      if (record.assignedTo || record.createdBy) {
        const uids = [...new Set([record.assignedTo, record.createdBy].filter(Boolean))]
        const users = await prisma.user.findMany({
          where: { id: { in: uids } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
        const umap = new Map(users.map(u => [u.id, u]))
        const roles = await prisma.role.findMany({
          where: { id: { in: uids } },
          select: { id: true, name: true },
        })
        const rmap = new Map(roles.map(r => [r.id, r.name]))
        const groups = await prisma.userGroup.findMany({
          where: { id: { in: uids }, companyId: req.user!.companyId, isActive: true },
          select: { id: true, name: true },
        })
        const gmap = new Map(groups.map(g => [g.id, g.name]))
        const name = (id?: string | null) => {
          if (!id) return null
          const u = umap.get(id)
          if (u) return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
          return gmap.get(id) || rmap.get(id) || null
        }
        merged[0].ownerName = name(record.assignedTo) || name(record.createdBy)
        merged[0].createdByName = name(record.createdBy)
      }
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
      if (modelName === 'purchaseOrder' && (data.conversionRate == null || data.conversionRate === '')) data.conversionRate = 1
      if (modelHasScalarField(modelName, 'createdBy')) {
        data.createdBy = req.user!.userId
      }
      if (modelHasScalarField(modelName, 'assignedTo') && !NO_ASSIGNED_TO.has(modelName)) data.assignedTo = req.body.assignedTo || req.user!.userId
      if (modelName === 'timeEntry') {
        if (!req.user!.isAdmin && !req.user!.isSuperAdmin) data.userId = req.user!.userId
        data.approved = false
        data.approvedBy = null
      }
      if (modelName === 'product' && !data.productNo) {
        data.productNo = await nextSequenceNumber('Product', req.user!.companyId)
      }
      if (modelName === 'lead' && !data.leadNo) {
        data.leadNo = await nextSequenceNumber('Lead', req.user!.companyId)
      }
      if (modelName === 'product' && data.productNo) {
        const dupErr = await ensureUniqueProductNo(String(data.productNo))
        if (dupErr) return res.status(400).json({ error: dupErr })
      }
      if (modelName === 'escalationHistory') {
        const ticket = await prisma.ticket.findFirst({ where: { id: data.ticketId, companyId: req.user!.companyId, isActive: true } })
        if (!ticket) return res.status(404).json({ error: 'Ticket not found in this organization' })
        if (!Number.isInteger(Number(data.fromLevel)) || !Number.isInteger(Number(data.toLevel)) || Number(data.toLevel) <= Number(data.fromLevel)) return res.status(400).json({ error: 'Escalation level must be greater than the current level' })
        data.escalatedBy = req.user!.userId
      }
      fixBooleans(data)
      fixDecimals(data)
      await validateProjectLinks(modelName, data, req.user!.companyId!)
      if (modelName === 'quantityDiscount') {
        const validationError = await validateQuantityDiscount(data, req.user!.companyId!)
        if (validationError) return res.status(400).json({ error: validationError })
      }
      if (modelName === 'projectTask' && data.status === 'Completed') { data.progress = 100; data.completedAt = data.completedAt || new Date() }
      if (modelName === 'projectMilestone' && data.status === 'Completed') data.progress = 100
      delete data.products
      delete data.stageHistory
      delete data.images
      const poLineItems = data.lineItems
      delete data.lineItems
      const missing = missingRequiredFields(modelName, data)
      if (missing.length) {
        return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` })
      }
      if (modelName === 'currency') {
        const activeCount = await prisma.currency.count({ where: { companyId: req.user!.companyId, isActive: true } })
        if (data.isDefault || activeCount === 0) { data.isDefault = true; data.isActive = true }
        if (data.isDefault) {
          await prisma.currency.updateMany({ where: { isDefault: true, companyId: req.user!.companyId }, data: { isDefault: false } })
        }
      }
      const record = await prismaModel.create({ data })
      if (modelName === 'currency' && record.isDefault) {
        await setOrgSetting(req.user!.companyId, 'defaultCurrency', record.code)
        await setOrgSetting(req.user!.companyId, 'currencySymbol', record.symbol)
        await prisma.company.updateMany({ where: { id: req.user!.companyId! }, data: { defaultCurrency: record.code } })
      }
      if (['projectTask', 'projectMilestone', 'timeEntry', 'projectResource'].includes(modelName)) await syncProjectSummary(record.projectId)
      if (custom) await saveCustomData(moduleName, record.id, custom)
      if (modelName === 'product' && Array.isArray(req.body.images)) {
        await replaceProductImages(record.id, req.body.images)
      }
      if (modelName === 'potential' && Array.isArray(req.body.products)) {
        await replacePotentialProducts(record.id, req.body.products, req.user!.companyId)
      }
      if (modelName === 'purchaseOrder' && Array.isArray(poLineItems)) {
        await replacePurchaseOrderLineItems(record.id, poLineItems)
      }
      if (modelName === 'potential' && record.stage) {
        await prisma.potentialStageHistory.create({
          data: { potentialId: record.id, stage: record.stage, changedBy: req.user!.userId, companyId: req.user!.companyId },
        }).catch(() => {})
      }
      await writeAudit({ moduleName, recordId: record.id, action: 'CREATE', newValue: auditSummary(record), userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onCreate', record, req })
      if (modelName === 'receipt' && record.invoiceId) syncInvoiceBalance(record.invoiceId, req.user!.companyId!)
      if (modelName === 'payment' && record.purchaseOrderId) syncPOBalance(record.purchaseOrderId, req.user!.companyId!)
      if (modelName === 'lead') {
        const label = `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.company || record.id
        notifyFollowersAndAssignee({
          moduleName, recordId: record.id, assigneeId: record.assignedTo,
          title: `New lead: ${label}`,
          message: `A new lead "${label}" has been assigned to you.`,
          link: `/leads/${record.id}`, companyId: req.user!.companyId, actorId: req.user!.userId,
        }).catch(() => {})
      }

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
      delete data.companyId
      if (modelName === 'product' && data.productNo) {
        const dupErr = await ensureUniqueProductNo(String(data.productNo), req.params.id)
        if (dupErr) return res.status(400).json({ error: dupErr })
      }
      for (const k of Object.keys(data)) {
        if (typeof data[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data[k])) {
          data[k] = new Date(data[k] + 'T12:00:00').toISOString()
        }
        if (data[k] === '') data[k] = null
      }
      if (modelName === 'purchaseOrder' && (data.conversionRate == null || data.conversionRate === '')) data.conversionRate = 1
      if (modelName === 'timeEntry' && data.approved !== undefined) {
        if (!req.user!.isAdmin && !req.user!.isSuperAdmin) return res.status(403).json({ error: 'Administrator approval is required for time entries' })
        data.approvedBy = data.approved ? req.user!.userId : null
      }
      fixBooleans(data)
      fixDecimals(data)
      await validateProjectLinks(modelName, { ...before, ...data }, req.user!.companyId!)
      if (modelName === 'quantityDiscount') {
        const validationError = await validateQuantityDiscount({ ...before, ...data }, req.user!.companyId!, req.params.id)
        if (validationError) return res.status(400).json({ error: validationError })
      }
      if (modelName === 'projectTask' && data.status === 'Completed') { data.progress = 100; data.completedAt = data.completedAt || new Date() }
      if (modelName === 'projectMilestone' && data.status === 'Completed') data.progress = 100
      delete data.products
      delete data.stageHistory
      delete data.images
      const poLineItems = data.lineItems
      delete data.lineItems
      const emptyReq = emptyRequiredFields(modelName, data)
      if (emptyReq.length) {
        return res.status(400).json({ error: `Field(s) cannot be empty: ${emptyReq.join(', ')}` })
      }
      if (modelName === 'currency') {
        if (before.isDefault && data.isActive === false) return res.status(400).json({ error: 'Set another active currency as default before deactivating this currency' })
        if (data.isDefault) {
          data.isActive = true
          await prisma.currency.updateMany({ where: { isDefault: true, companyId: req.user!.companyId }, data: { isDefault: false } })
        }
      }
      const record = await prismaModel.update({ where, data })
      if (modelName === 'currency' && record.isDefault) {
        await setOrgSetting(req.user!.companyId, 'defaultCurrency', record.code)
        await setOrgSetting(req.user!.companyId, 'currencySymbol', record.symbol)
        await prisma.company.updateMany({ where: { id: req.user!.companyId! }, data: { defaultCurrency: record.code } })
      }
      if (['projectTask', 'projectMilestone', 'timeEntry', 'projectResource'].includes(modelName)) await syncProjectSummary(record.projectId || before.projectId)
      if (custom) await saveCustomData(moduleName, record.id, custom)
      if (modelName === 'product' && Array.isArray(req.body.images)) {
        await replaceProductImages(record.id, req.body.images)
      }
      if (modelName === 'purchaseOrder' && Array.isArray(poLineItems)) {
        await replacePurchaseOrderLineItems(record.id, poLineItems)
      }
      if (modelName === 'potential') {
        if (Array.isArray(req.body.products)) {
          await replacePotentialProducts(record.id, req.body.products, req.user!.companyId)
        }
        if (data.stage && data.stage !== before.stage) {
          await prisma.potentialStageHistory.create({
            data: { potentialId: record.id, stage: data.stage, changedBy: req.user!.userId, companyId: req.user!.companyId },
          }).catch(() => {})
          const isClosedStage = data.stage === 'Closed Won' || data.stage === 'Closed Lost'
          notifyFollowersAndAssignee({
            moduleName, recordId: record.id, assigneeId: record.assignedTo,
            title: isClosedStage ? `Opportunity ${data.stage}: ${record.potentialName || record.id}` : `Stage changed: ${record.potentialName || record.id}`,
            message: isClosedStage
              ? `Opportunity "${record.potentialName}" has been marked as ${data.stage}. Amount: ${record.amount != null ? Number(record.amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : 'N/A'}.`
              : `Opportunity "${record.potentialName}" moved from "${before.stage || 'N/A'}" to "${data.stage}".`,
            link: `/potentials/${record.id}`, companyId: req.user!.companyId, actorId: req.user!.userId,
          }).catch(() => {})
        }
      }
      await writeAuditFields({ moduleName, recordId: record.id, before, after: { ...before, ...data }, userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onUpdate', record, prevRecord: before, req })
      if (modelName === 'receipt' && record.invoiceId) syncInvoiceBalance(record.invoiceId, req.user!.companyId!)
      if (modelName === 'payment' && record.purchaseOrderId) syncPOBalance(record.purchaseOrderId, req.user!.companyId!)
      if (modelName === 'lead') {
        const changedFields = Object.keys(data).filter(k => JSON.stringify((before as any)[k]) !== JSON.stringify((record as any)[k]))
        if (changedFields.length) {
          const label = `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.company || record.id
          notifyFollowersAndAssignee({
            moduleName,
            recordId: record.id,
            assigneeId: record.assignedTo,
            title: `Lead updated: ${label}`,
            message: `A lead you follow was updated — changed: ${changedFields.slice(0, 4).join(', ')}${changedFields.length > 4 ? '...' : ''}`,
            link: `/leads/${record.id}`,
            companyId: req.user!.companyId,
            actorId: req.user!.userId,
          }).catch(() => {})
        }
      }
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
      if (modelName === 'currency' && before.isDefault) return res.status(400).json({ error: 'The default currency cannot be deactivated. Set another currency as default first.' })
      if (!(await canMutateRecord(req, before, moduleName))) return res.status(403).json({ error: 'Access denied by sharing rules' })
      await prismaModel.update({ where, data: TRASH_BY_IS_DELETED.has(modelName) ? { isDeleted: true } : { isActive: false } })
      await writeAudit({ moduleName, recordId: before.id, action: 'DELETE', oldValue: auditSummary(before), userId: req.user!.userId, req })
      await runWorkflows({ companyId: req.user!.companyId, moduleName, triggerType: 'onDelete', record: before, req })
      if (modelName === 'receipt' && before.invoiceId) syncInvoiceBalance(before.invoiceId, req.user!.companyId!)
      if (modelName === 'payment' && before.purchaseOrderId) syncPOBalance(before.purchaseOrderId, req.user!.companyId!)
      if (['projectTask', 'projectMilestone', 'timeEntry', 'projectResource'].includes(modelName)) await syncProjectSummary(before.projectId)
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
      const record = await prismaModel.update({ where, data: TRASH_BY_IS_DELETED.has(modelName) ? { isDeleted: false } : { isActive: true } })
      res.json(record)
    } catch (err) { next(err) }
  })

  // ---- Merge & Duplicate Handling ----
  const identityFields: Record<string, string[]> = {
    accounts: ['accountName', 'email', 'phone', 'website'],
    contacts: ['email', 'phone'],
    leads: ['email', 'phone', 'company'],
    potentials: ['potentialName'],
    campaigns: ['campaignName'],
    products: ['productName', 'productNo'],
    services: ['serviceName', 'serviceNo'],
    vendors: ['vendorName', 'email'],
    tickets: ['title'],
    faq: ['title'],
    projects: ['projectName', 'projectNo'],
    assets: ['assetName', 'serialNo'],
    servicecontracts: ['contractName', 'contractNo'],
  }

  // Related/child records that should follow a merge (reassigned to the surviving record)
  const mergeChildren: { model: string; field: string; moduleName: string }[] = [
    { model: 'comment', field: 'parentId', moduleName: '' },
    { model: 'activity', field: 'parentId', moduleName: '' },
    { model: 'email', field: 'parentId', moduleName: '' },
    { model: 'document', field: 'parentId', moduleName: '' },
    { model: 'follow', field: 'recordId', moduleName: '' },
    { model: 'customFieldValue', field: 'recordId', moduleName },
    { model: 'quoteLineItem', field: 'quoteId', moduleName: 'quotes' },
    { model: 'salesOrderLineItem', field: 'salesOrderId', moduleName: 'salesorders' },
    { model: 'purchaseOrderLineItem', field: 'purchaseOrderId', moduleName: 'purchaseorders' },
    { model: 'invoiceLineItem', field: 'invoiceId', moduleName: 'invoices' },
  ]

  router.get('/:id/duplicates', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'view'))) return res.status(403).json({ error: 'Access denied' })
      let where: any = { id: req.params.id }
      if (isScoped) addScope(where, req.user!.companyId)
      const record = await prismaModel.findFirst({ where })
      if (!record) return res.status(404).json({ error: 'Not found' })
      const fields = identityFields[moduleName] || []
      const ors: any[] = []
      for (const f of fields) {
        const val = record[f]
        if (val != null && String(val).trim() !== '') {
          ors.push({ [f]: { equals: String(val), mode: 'insensitive' } })
        }
      }
      if (ors.length === 0) return res.json({ data: [] })
      const dupWhere: any = { isActive: true, id: { not: record.id } }
      if (isScoped) addScope(dupWhere, req.user!.companyId)
      dupWhere.OR = ors
      const data = await prismaModel.findMany({ where: dupWhere, take: 20 })
      const merged = await mergeCustomValues(moduleName, data)
      res.json({ data: merged })
    } catch (err) { next(err) }
  })

  router.post('/:id/merge', async (req, res, next) => {
    try {
      if (!(await checkPermission(req, 'edit'))) return res.status(403).json({ error: 'Access denied' })
      const { targetId, keepFields } = req.body
      if (!targetId) return res.status(400).json({ error: 'targetId is required' })
      let scope: any = {}
      if (isScoped) scope.companyId = req.user!.companyId
      const source = await prismaModel.findFirst({ where: { id: req.params.id, ...scope } })
      const target = await prismaModel.findFirst({ where: { id: targetId, ...scope } })
      if (!source || !target) return res.status(404).json({ error: 'Record not found' })

      // 1. Merge fields: prefer target values, fill empties from source
      const mergedData: any = {}
      const keep = new Set<string>(keepFields || [])
      for (const k of Object.keys(source)) {
        if (['id', 'createdAt', 'updatedAt', 'companyId', 'isActive'].includes(k)) continue
        const sourceVal = source[k]
        const targetVal = target[k]
        const isBlank = targetVal == null || targetVal === '' || (typeof targetVal === 'number' && isNaN(targetVal))
        const keepFromSource = keep.has(k)
        if (keepFromSource || (isBlank && sourceVal != null && sourceVal !== '')) {
          mergedData[k] = sourceVal
        }
      }
      await prismaModel.update({ where: { id: target.id }, data: mergedData })

      // 2. Reassign polymorphic children
      for (const child of mergeChildren) {
        try {
          const childModel = (prisma as any)[child.model]
          if (!childModel) continue
          const childScope: any = { [child.field]: source.id }
          if (child.moduleName) childScope.moduleName = child.moduleName
          await childModel.updateMany({
            where: childScope,
            data: { [child.field]: target.id },
          })
        } catch { /* model may not exist */ }
      }

      // 3. Hard-delete source, audit both
      await prismaModel.update({ where: { id: source.id }, data: { isActive: false } })
      await writeAudit({ moduleName, recordId: target.id, action: 'MERGE', newValue: `Merged ${moduleName} ${source.id} into ${target.id}`, userId: req.user!.userId, req })
      res.json({ success: true, targetId: target.id })
    } catch (err) { next(err) }
  })

  return router
}
