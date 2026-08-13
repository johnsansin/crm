import { Router } from 'express'
import { resolveAuditReferences } from '../lib/audit'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { sendMail, getSmtpConfig } from '../lib/mailer'
import { writeAudit } from '../lib/audit'
import { notifyFollowersAndAssignee, userName } from '../lib/notify'

export const recordRouter = Router()

recordRouter.use(authMiddleware)

const modelMap: Record<string, string> = {
  accounts: 'account', contacts: 'contact', leads: 'lead', potentials: 'potential',
  campaigns: 'campaign', products: 'product', services: 'service', vendors: 'vendor',
  quotes: 'quote', salesorders: 'salesOrder', purchaseorders: 'purchaseOrder',
  invoices: 'invoice', tickets: 'ticket', faq: 'faq', documents: 'document',
  emails: 'email', projects: 'project', assets: 'asset', servicecontracts: 'serviceContract',
}

async function findParent(moduleName: string, id: string, companyId?: string) {
  const modelName = modelMap[moduleName]
  if (!modelName) return null
  const prismaModel: any = (prisma as any)[modelName]
  const where: any = { id }
  if (companyId) where.companyId = companyId
  return prismaModel.findFirst({ where })
}

function moduleTitle(m: string): string {
  const s = m.endsWith('s') ? m.slice(0, -1) : m
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function recordLabel(moduleName: string, record: any): string {
  if (!record) return 'record'
  const r = record
  const nameKey = ['firstName', 'name', 'accountName', 'contactName', 'potentialName', 'ticketNo', 'title', 'subject']
    .find(k => r[k] != null && r[k] !== '')
  if (nameKey === 'firstName') {
    return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.company || 'record'
  }
  return nameKey ? r[nameKey] ?? r.id ?? 'record' : r.id || 'record'
}

async function assertParent(req: any, res: any, moduleName: string, id: string) {
  const parent = await findParent(moduleName, id, req.user!.companyId)
  if (!parent) {
    res.status(404).json({ error: 'Parent record not found' })
    return null
  }
  return parent
}

async function notifyActivityAssignment(opts: {
  activityType: string
  subject: string
  dueAt?: Date | null
  assigneeId?: string | null
  parentModule: string
  parentId: string
  parent?: any
  creatorId?: string | null
  companyId?: string | null
  isUpdate?: boolean
}) {
  const { activityType, subject, dueAt, assigneeId, parentModule, parentId, parent, creatorId, companyId, isUpdate } = opts
  const recipients = new Set<string>()
  if (assigneeId) recipients.add(assigneeId)
  if (parent?.assignedTo) recipients.add(parent.assignedTo)
  if (parent?.createdBy) recipients.add(parent.createdBy)
  const admins = await prisma.user.findMany({
    where: companyId ? { companyId, isActive: true } : { isActive: true },
    select: { id: true, isAdmin: true, profile: { select: { isSuperAdmin: true } } },
  })
  for (const u of admins) {
    if (u.isAdmin || u.profile?.isSuperAdmin) recipients.add(u.id)
  }
  recipients.delete(creatorId || '')
  if (!recipients.size) return

  const users = await prisma.user.findMany({
    where: { id: { in: [...recipients] } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const typeLabel = activityType === 'Task' ? 'task' : activityType ? activityType.toLowerCase() : 'activity'
  const verb = isUpdate ? 'updated' : 'assigned'
  const due = dueAt ? ` (due ${new Date(dueAt).toLocaleString()})` : ''
  const link = `/${parentModule}/${parentId}`
  const title = isUpdate
    ? `${activityType || 'Activity'} updated: ${subject}`
    : `New ${activityType || 'activity'}: ${subject}`
  const message = `A ${typeLabel} "${subject}" was ${verb} to you.${due}`
  const html = `<p>${message}</p><p><a href="${link}">Open record</a></p>`

  for (const u of users) {
    await prisma.notification.create({ data: { userId: u.id, title, message, link, companyId } }).catch(() => {})
  }
  const to = users.map(u => u.email).filter(Boolean)
  if (to.length) {
    const smtp = await getSmtpConfig(companyId)
    await sendMail({ to, subject: title, html, text: `${message}\nRecord: ${link}`, companyId, fromOverride: smtp })
  }
}

async function resolveNames(rows: any[]): Promise<any[]> {
  const userIds = new Set<string>()
  for (const r of rows) {
    if (r.userId) userIds.add(r.userId)
    if (r.createdBy) userIds.add(r.createdBy)
    if (r.assignedTo) userIds.add(r.assignedTo)
  }
  if (!userIds.size) return rows
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })
  const map = new Map(users.map(u => [u.id, u]))
  const name = (id?: string | null) => {
    if (!id) return null
    const u = map.get(id)
    return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : null
  }
  return rows.map(r => ({ ...r, userName: name(r.userId) || name(r.createdBy), ownerName: name(r.assignedTo) }))
}

async function checkPermission(req: any, moduleName: string, action: string): Promise<boolean> {
  const user = req.user
  if (user?.isSuperAdmin || user?.isAdmin) return true
  if (!user?.companyId) return false
  const role = await prisma.role.findFirst({
    where: { id: user.roleId, companyId: user.companyId, isActive: true },
    include: { permissions: { where: { moduleName } } },
  })
  if (!role) return false
  const perm = role.permissions[0]
  if (!perm) return false
  switch (action) {
    case 'view': return perm.view
    case 'create': return perm.create
    case 'edit': return perm.edit
    case 'delete': return perm.delete
    default: return false
  }
}

function scopedWhere(companyId?: string) {
  return companyId ? { companyId } : {}
}

// ---------- Activities ----------
recordRouter.get('/:module/:id/activities', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const rows = await prisma.activity.findMany({
      where: { parentModule: req.params.module, parentId: req.params.id, isActive: true, ...scopedWhere(req.user!.companyId) },
      orderBy: [{ startAt: 'asc' }, { dueAt: 'asc' }],
    })
    res.json({ data: await resolveNames(rows) })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/activities', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'create'))) return res.status(403).json({ error: 'Access denied' })
    const parent = await assertParent(req, res, req.params.module, req.params.id)
    if (!parent) return
    const { subject, description, activityType, status, priority, location, startAt, endAt, dueAt, reminderAt } = req.body
    if (!subject) return res.status(400).json({ error: 'Subject is required' })
    const activity = await prisma.activity.create({
      data: {
        subject, description, activityType: activityType || 'Task', status: status || 'Planned',
        priority: priority || 'Medium', location, startAt: startAt || null, endAt: endAt || null,
        dueAt: dueAt || null, reminderAt: reminderAt || null,
        parentModule: req.params.module, parentId: req.params.id,
        companyId: req.user!.companyId || null,
        assignedTo: req.body.assignedTo || req.user!.userId,
        createdBy: req.user!.userId,
      },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'ACTIVITY', newValue: `Added ${activity.activityType}: ${activity.subject}`, userId: req.user!.userId, req })
    await notifyActivityAssignment({
      activityType: activity.activityType,
      subject: activity.subject,
      dueAt: activity.dueAt,
      assigneeId: activity.assignedTo,
      parentModule: req.params.module,
      parentId: req.params.id,
      parent,
      creatorId: req.user!.userId,
      companyId: req.user!.companyId,
    })
    res.status(201).json(activity)
  } catch (err) { next(err) }
})

recordRouter.put('/activities/:id', async (req, res, next) => {
  try {
    const activity = await prisma.activity.findFirst({ where: { id: req.params.id, ...scopedWhere(req.user!.companyId) } })
    if (!activity) return res.status(404).json({ error: 'Not found' })
    const { subject, description, activityType, status, priority, location, startAt, endAt, dueAt, reminderAt } = req.body
    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: { subject, description, activityType, status, priority, location, startAt, endAt, dueAt, reminderAt, assignedTo: req.body.assignedTo || activity.assignedTo || req.user!.userId },
    })
    const parent = activity.parentModule ? await findParent(activity.parentModule, activity.parentId || '', req.user!.companyId) : null
    await notifyActivityAssignment({
      activityType: updated.activityType,
      subject: updated.subject,
      dueAt: updated.dueAt,
      assigneeId: updated.assignedTo,
      parentModule: activity.parentModule || 'leads',
      parentId: activity.parentId || '',
      parent,
      creatorId: req.user!.userId,
      companyId: req.user!.companyId,
      isUpdate: true,
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

recordRouter.delete('/activities/:id', async (req, res, next) => {
  try {
    const activity = await prisma.activity.findFirst({ where: { id: req.params.id, ...scopedWhere(req.user!.companyId) } })
    if (!activity) return res.status(404).json({ error: 'Not found' })
    await prisma.activity.update({ where: { id: activity.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Emails ----------
recordRouter.get('/:module/:id/emails', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const rows = await prisma.email.findMany({
      where: { parentModule: req.params.module, parentId: req.params.id, isActive: true, ...scopedWhere(req.user!.companyId) },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: await resolveNames(rows) })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/emails', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'create'))) return res.status(403).json({ error: 'Access denied' })
    const parent = await assertParent(req, res, req.params.module, req.params.id)
    if (!parent) return
    const { subject, toEmails, ccEmails, bccEmails, body } = req.body
    if (!subject) return res.status(400).json({ error: 'Subject is required' })
    const email = await prisma.email.create({
      data: {
        subject, body,
        fromEmail: req.user!.email,
        toEmails: toEmails || parent.email || null,
        ccEmails: ccEmails || null,
        bccEmails: bccEmails || null,
        emailFlag: 'Sent',
        parentModule: req.params.module, parentId: req.params.id,
        companyId: req.user!.companyId || null,
        assignedTo: req.user!.userId,
        createdBy: req.user!.userId,
        dateSent: new Date(),
      },
    })
    const smtp = await getSmtpConfig(req.user!.companyId).catch(() => null)
    if (smtp && email.toEmails) {
      sendMail({
        to: String(email.toEmails).split(',').map(s => s.trim()).filter(Boolean),
        subject: email.subject || '',
        html: email.body || undefined,
        fromOverride: smtp,
      }).catch(() => {})
    }
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'EMAIL', newValue: `Email sent: ${email.subject}`, userId: req.user!.userId, req })
    res.status(201).json(email)
  } catch (err) { next(err) }
})

// ---------- Documents ----------
recordRouter.get('/:module/:id/documents', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const rows = await prisma.document.findMany({
      where: { parentModule: req.params.module, parentId: req.params.id, isActive: true, ...scopedWhere(req.user!.companyId) },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: await resolveNames(rows) })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/documents', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'create'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const { title, fileName, filePath, fileType, fileSize, noteContent, fileStatus } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })
    const doc = await prisma.document.create({
      data: {
        title, fileName, filePath, fileType, fileSize: fileSize ? Number(fileSize) : null,
        noteContent, fileStatus: fileStatus || 'Active',
        parentModule: req.params.module, parentId: req.params.id,
        companyId: req.user!.companyId || null,
        assignedTo: req.body.assignedTo || req.user!.userId,
        createdBy: req.user!.userId,
      },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'DOCUMENT', newValue: `Document added: ${doc.title}`, userId: req.user!.userId, req })
    res.status(201).json(doc)
  } catch (err) { next(err) }
})

recordRouter.delete('/documents/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({ where: { id: req.params.id, ...scopedWhere(req.user!.companyId) } })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    await prisma.document.update({ where: { id: doc.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Comments ----------
recordRouter.get('/:module/:id/comments', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    const rows = await prisma.comment.findMany({
      where: { moduleName: req.params.module, recordId: req.params.id, companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: await resolveNames(rows) })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/comments', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'create'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const comment = (req.body.comment || '').trim()
    if (!comment) return res.status(400).json({ error: 'Comment is required' })
    const created = await prisma.comment.create({
      data: {
        moduleName: req.params.module, recordId: req.params.id,
        comment, userId: req.user!.userId, isPrivate: !!req.body.isPrivate,
        companyId: req.user!.companyId,
      },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'COMMENT', newValue: comment.slice(0, 120), userId: req.user!.userId, req })
    res.status(201).json(created)
  } catch (err) { next(err) }
})

recordRouter.delete('/comments/:id', async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) return res.status(404).json({ error: 'Not found' })
    if (comment.userId !== req.user!.userId && !req.user!.isAdmin && !req.user!.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' })
    }
    await prisma.comment.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Updates (audit) ----------
recordRouter.get('/:module/:id/updates', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    const limit = Math.min(parseInt(String(req.query.limit || '50')), 100)
    const rows = await prisma.auditLog.findMany({
      where: { moduleName: req.params.module, recordId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    const resolved = await Promise.all(rows.map(async (r: any) => {
      const refs = await resolveAuditReferences(r)
      return { ...r, oldValue: refs.oldValue, newValue: refs.newValue }
    }))
    res.json({ data: await resolveNames(resolved) })
  } catch (err) { next(err) }
})

// ---------- Follow ----------
recordRouter.get('/:module/:id/followers', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    const rows = await prisma.follow.findMany({ where: { moduleName: req.params.module, recordId: req.params.id } })
    const users = await prisma.user.findMany({
      where: { id: { in: rows.map(r => r.userId) } },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    res.json({
      data: users.map(u => ({ id: u.id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email })),
      isFollowing: rows.some(r => r.userId === req.user!.userId),
    })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/follow', async (req, res, next) => {
  try {
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const exists = await prisma.follow.findFirst({
      where: { userId: req.user!.userId, moduleName: req.params.module, recordId: req.params.id, companyId: req.user!.companyId ?? null },
    })
    if (!exists) {
      await prisma.follow.create({
        data: { userId: req.user!.userId, moduleName: req.params.module, recordId: req.params.id, companyId: req.user!.companyId ?? null },
      }).catch(() => {})
    }
    const parent = await findParent(req.params.module, req.params.id, req.user!.companyId)
    notifyFollowersAndAssignee({
      moduleName: req.params.module,
      recordId: req.params.id,
      assigneeId: parent?.assignedTo,
      title: `${moduleTitle(req.params.module)} followed: ${recordLabel(req.params.module, parent)}`,
      message: `${await userName(req.user!.userId)} started following this record`,
      link: `/${req.params.module}/${req.params.id}`,
      companyId: req.user!.companyId,
      actorId: req.user!.userId,
    }).catch(() => {})
    res.json({ success: true })
  } catch (err) { next(err) }
})

recordRouter.delete('/:module/:id/follow', async (req, res, next) => {
  try {
    await prisma.follow.deleteMany({
      where: { userId: req.user!.userId, moduleName: req.params.module, recordId: req.params.id },
    })
    const parent = await findParent(req.params.module, req.params.id, req.user!.companyId)
    notifyFollowersAndAssignee({
      moduleName: req.params.module,
      recordId: req.params.id,
      assigneeId: parent?.assignedTo,
      title: `${moduleTitle(req.params.module)} unfollowed: ${recordLabel(req.params.module, parent)}`,
      message: `${await userName(req.user!.userId)} unfollowed this record`,
      link: `/${req.params.module}/${req.params.id}`,
      companyId: req.user!.companyId,
      actorId: req.user!.userId,
    }).catch(() => {})
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Related records ----------
recordRouter.get('/:module/:id/related/:relatedModule', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    const parent = await assertParent(req, res, req.params.module, req.params.id)
    if (!parent) return
    const rel = req.params.relatedModule
    let ids: string[] = []
    if (req.params.module === 'leads' && rel === 'products') {
      const links = await prisma.leadProduct.findMany({
        where: { leadId: req.params.id, ...scopedWhere(req.user!.companyId) },
        orderBy: { createdAt: 'asc' },
      })
      const productIds = links.map(l => l.productId)
      if (!productIds.length) return res.json({ data: [] })
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
      })
      const linkMap = new Map(links.map(l => [l.productId, l]))
      const rows = products.map(p => ({ ...p, qty: linkMap.get(p.id)?.qty ?? 1, listPrice: linkMap.get(p.id)?.listPrice ?? p.unitPrice, linkedAt: linkMap.get(p.id)?.createdAt }))
      return res.json({ data: rows })
    } else if (req.params.module === 'leads' && rel === 'services') {
      const links = await prisma.leadService.findMany({
        where: { leadId: req.params.id, ...scopedWhere(req.user!.companyId) },
        orderBy: { createdAt: 'asc' },
      })
      const serviceIds = links.map(l => l.serviceId)
      if (!serviceIds.length) return res.json({ data: [] })
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
      })
      const linkMap = new Map(links.map(l => [l.serviceId, l]))
      const rows = services.map(s => ({ ...s, qty: linkMap.get(s.id)?.qty ?? 1, listPrice: linkMap.get(s.id)?.listPrice ?? s.unitPrice, linkedAt: linkMap.get(s.id)?.createdAt }))
      return res.json({ data: rows })
    } else if (req.params.module === 'leads' && rel === 'campaigns') {
      if (parent.campaignId) ids = [parent.campaignId]
    } else if (req.params.module === 'potentials' && rel === 'accounts') {
      if (parent.accountId) ids = [parent.accountId]
    } else if (req.params.module === 'potentials' && rel === 'contacts') {
      if (parent.contactId) ids = [parent.contactId]
    } else if (req.params.module === 'potentials' && rel === 'campaigns') {
      if (parent.campaignId) ids = [parent.campaignId]
    }
    const modelName = modelMap[rel]
    if (!modelName || !ids.length) return res.json({ data: [] })
    const prismaModel: any = (prisma as any)[modelName]
    const rows = await prismaModel.findMany({
      where: { id: { in: ids }, isActive: true, ...scopedWhere(req.user!.companyId) },
    })
    res.json({ data: rows })
  } catch (err) { next(err) }
})

// ---------- Linked products on a record ----------
recordRouter.get('/:module/:id/products', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const links = await prisma.leadProduct.findMany({
      where: { leadId: req.params.id, ...scopedWhere(req.user!.companyId) },
      orderBy: { createdAt: 'asc' },
    })
    const productIds = links.map(l => l.productId)
    if (!productIds.length) return res.json({ data: [] })
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
    })
    const linkMap = new Map(links.map(l => [l.productId, l]))
    const rows = products.map(p => ({ ...p, qty: linkMap.get(p.id)?.qty ?? 1, listPrice: linkMap.get(p.id)?.listPrice ?? p.unitPrice, linkedAt: linkMap.get(p.id)?.createdAt }))
    res.json({ data: rows })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/products', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const items: { productId: string; qty?: number; listPrice?: number }[] = req.body?.products || [req.body]
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Select at least one product' })
    const productIds = items.map(i => i.productId).filter(Boolean)
    if (!productIds.length) return res.status(400).json({ error: 'productId is required' })
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
      select: { id: true, unitPrice: true },
    })
    const existing = await prisma.leadProduct.findMany({
      where: { leadId: req.params.id, productId: { in: productIds } },
      select: { productId: true },
    })
    const existingSet = new Set(existing.map(e => e.productId))
    const priceMap = new Map(products.map(p => [p.id, p.unitPrice]))
    const created = []
    for (const item of items) {
      if (!item.productId || !priceMap.has(item.productId)) continue
      const qty = item.qty == null || isNaN(Number(item.qty)) ? 1 : Math.max(1, Number(item.qty))
      const listPrice = item.listPrice == null || isNaN(Number(item.listPrice)) ? priceMap.get(item.productId) : Number(item.listPrice)
      if (existingSet.has(item.productId)) {
        created.push(await prisma.leadProduct.update({
          where: { leadId_productId: { leadId: req.params.id, productId: item.productId } },
          data: { qty, listPrice },
        }))
      } else {
        created.push(await prisma.leadProduct.create({
          data: {
            leadId: req.params.id, productId: item.productId,
            qty, listPrice, companyId: req.user!.companyId || null, createdBy: req.user!.userId,
          },
        }))
      }
    }
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'LINK', newValue: `Linked ${created.length} product(s)`, userId: req.user!.userId, req })
    res.status(201).json({ success: true, count: created.length })
  } catch (err) { next(err) }
})

recordRouter.put('/:module/:id/products/:productId', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const link = await prisma.leadProduct.findFirst({
      where: { leadId: req.params.id, productId: req.params.productId, ...scopedWhere(req.user!.companyId) },
    })
    if (!link) return res.status(404).json({ error: 'Product not linked to this record' })
    const qty = req.body.qty == null || isNaN(Number(req.body.qty)) ? link.qty : Math.max(1, Number(req.body.qty))
    const listPrice = req.body.listPrice == null || isNaN(Number(req.body.listPrice)) ? link.listPrice : Number(req.body.listPrice)
    await prisma.leadProduct.update({
      where: { id: link.id },
      data: { qty, listPrice },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UPDATE', newValue: `Updated linked product`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

recordRouter.delete('/:module/:id/products/:productId', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'delete'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const link = await prisma.leadProduct.findFirst({
      where: { leadId: req.params.id, productId: req.params.productId, ...scopedWhere(req.user!.companyId) },
    })
    if (!link) return res.status(404).json({ error: 'Product not linked to this record' })
    await prisma.leadProduct.delete({ where: { id: link.id } })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UNLINK', newValue: `Unlinked product`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Linked services on a record ----------
recordRouter.get('/:module/:id/services', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'view'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const links = await prisma.leadService.findMany({
      where: { leadId: req.params.id, ...scopedWhere(req.user!.companyId) },
      orderBy: { createdAt: 'asc' },
    })
    const serviceIds = links.map(l => l.serviceId)
    if (!serviceIds.length) return res.json({ data: [] })
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
    })
    const linkMap = new Map(links.map(l => [l.serviceId, l]))
    const rows = services.map(s => ({ ...s, qty: linkMap.get(s.id)?.qty ?? 1, listPrice: linkMap.get(s.id)?.listPrice ?? s.unitPrice, linkedAt: linkMap.get(s.id)?.createdAt }))
    res.json({ data: rows })
  } catch (err) { next(err) }
})

recordRouter.post('/:module/:id/services', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const items: { serviceId: string; qty?: number; listPrice?: number }[] = req.body?.services || [req.body]
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Select at least one service' })
    const serviceIds = items.map(i => i.serviceId).filter(Boolean)
    if (!serviceIds.length) return res.status(400).json({ error: 'serviceId is required' })
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
      select: { id: true, unitPrice: true },
    })
    const existing = await prisma.leadService.findMany({
      where: { leadId: req.params.id, serviceId: { in: serviceIds } },
      select: { serviceId: true },
    })
    const existingSet = new Set(existing.map(e => e.serviceId))
    const priceMap = new Map(services.map(s => [s.id, s.unitPrice]))
    const created = []
    for (const item of items) {
      if (!item.serviceId || !priceMap.has(item.serviceId)) continue
      const qty = item.qty == null || isNaN(Number(item.qty)) ? 1 : Math.max(1, Number(item.qty))
      const listPrice = item.listPrice == null || isNaN(Number(item.listPrice)) ? priceMap.get(item.serviceId) : Number(item.listPrice)
      if (existingSet.has(item.serviceId)) {
        created.push(await prisma.leadService.update({
          where: { leadId_serviceId: { leadId: req.params.id, serviceId: item.serviceId } },
          data: { qty, listPrice },
        }))
      } else {
        created.push(await prisma.leadService.create({
          data: {
            leadId: req.params.id, serviceId: item.serviceId,
            qty, listPrice, companyId: req.user!.companyId || null, createdBy: req.user!.userId,
          },
        }))
      }
    }
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'LINK', newValue: `Linked ${created.length} service(s)`, userId: req.user!.userId, req })
    res.status(201).json({ success: true, count: created.length })
  } catch (err) { next(err) }
})

recordRouter.put('/:module/:id/services/:serviceId', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const link = await prisma.leadService.findFirst({
      where: { leadId: req.params.id, serviceId: req.params.serviceId, ...scopedWhere(req.user!.companyId) },
    })
    if (!link) return res.status(404).json({ error: 'Service not linked to this record' })
    const qty = req.body.qty == null || isNaN(Number(req.body.qty)) ? link.qty : Math.max(1, Number(req.body.qty))
    const listPrice = req.body.listPrice == null || isNaN(Number(req.body.listPrice)) ? link.listPrice : Number(req.body.listPrice)
    await prisma.leadService.update({
      where: { id: link.id },
      data: { qty, listPrice },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UPDATE', newValue: `Updated linked service`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

recordRouter.delete('/:module/:id/services/:serviceId', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'delete'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const link = await prisma.leadService.findFirst({
      where: { leadId: req.params.id, serviceId: req.params.serviceId, ...scopedWhere(req.user!.companyId) },
    })
    if (!link) return res.status(404).json({ error: 'Service not linked to this record' })
    await prisma.leadService.delete({ where: { id: link.id } })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UNLINK', newValue: `Unlinked service`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Link existing documents to a record ----------
recordRouter.post('/:module/:id/documents/link', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const documentIds: string[] = req.body?.documentIds || []
    if (!Array.isArray(documentIds) || !documentIds.length) return res.status(400).json({ error: 'documentIds is required' })
    const docs = await prisma.document.findMany({
      where: { id: { in: documentIds }, isActive: true, ...scopedWhere(req.user!.companyId) },
      select: { id: true },
    })
    await prisma.document.updateMany({
      where: { id: { in: docs.map(d => d.id) } },
      data: { parentModule: req.params.module, parentId: req.params.id },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'LINK', newValue: `Linked ${docs.length} document(s)`, userId: req.user!.userId, req })
    res.status(201).json({ success: true, count: docs.length })
  } catch (err) { next(err) }
})

recordRouter.delete('/:module/:id/documents/:documentId', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'delete'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const doc = await prisma.document.findFirst({
      where: { id: req.params.documentId, isActive: true, ...scopedWhere(req.user!.companyId) },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    await prisma.document.update({
      where: { id: doc.id },
      data: { parentModule: null, parentId: null },
    })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UNLINK', newValue: `Unlinked document: ${doc.title}`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---------- Select campaign for a record ----------
recordRouter.put('/:module/:id/campaign', async (req, res, next) => {
  try {
    if (!(await checkPermission(req, req.params.module, 'edit'))) return res.status(403).json({ error: 'Access denied' })
    if (!(await assertParent(req, res, req.params.module, req.params.id))) return
    const campaignId = req.body?.campaignId || null
    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, isActive: true, ...scopedWhere(req.user!.companyId) },
        select: { id: true },
      })
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    }
    await prisma.lead.update({ where: { id: req.params.id }, data: { campaignId } })
    await writeAudit({ moduleName: req.params.module, recordId: req.params.id, action: 'UPDATE', newValue: campaignId ? `Campaign selected` : `Campaign removed`, userId: req.user!.userId, req })
    res.json({ success: true, campaignId })
  } catch (err) { next(err) }
})
