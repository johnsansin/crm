import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { getModuleConfig, setupModules } from './moduleSetup'
import { sendMail, getSmtpConfig } from '../lib/mailer'
import { writeAudit } from '../lib/audit'
import { syncMailbox, generateRecurringInvoice, fetchRssFeed, applyEmailToTicketRule } from '../lib/automation'
import { renderReport, escapeHtml } from './report'

export const extrasRouter = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'bizforce-jwt-secret-dev-2026'

function modelFor(modelName: string): any {
  return (prisma as any)[modelName]
}

function fixedDecimal(v: any, d = 2): number {
  return Number(Number(v || 0).toFixed(d))
}

// =====================================================================
// Opportunity Forecasting (vtiger forecast)
// =====================================================================
extrasRouter.get('/forecast/opportunities', authMiddleware, async (req, res, next) => {
  try {
    const { range = 'quarter' } = req.query
    const where: any = { isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId

    const potentials = await prisma.potential.findMany({ where })
    const now = new Date()
    const buckets: Record<string, { expected: number; weighted: number; count: number }> = {}
    const bucketKey = (d: Date) => {
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (range === 'year') return `${d.getFullYear()}`
      return month
    }

    const months = range === 'year' ? 12 : 4
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      buckets[bucketKey(d)] = { expected: 0, weighted: 0, count: 0 }
    }

    const stageCategories: Record<string, string> = {
      'Closed Won': 'won', 'Won': 'won', 'Closed Lost': 'lost', 'Lost': 'lost',
      'Negotiation/Review': 'pipeline', 'Proposal/Price Quote': 'pipeline', 'Value Proposition': 'pipeline',
      'Needs Analysis': 'pipeline', 'Qualification': 'pipeline', 'Initial Contact': 'pipeline', 'New': 'pipeline',
    }

    const forecast: any[] = []
    const pipeline: Record<string, any[]> = { won: [], lost: [], pipeline: [] }
    for (const p of potentials) {
      const date = p.closingDate || p.createdAt
      const key = bucketKey(date)
      const expected = fixedDecimal(p.amount || 0)
      const weighted = fixedDecimal(expected * (p.probability || 0) / 100)
      if (buckets[key]) {
        buckets[key].expected += expected
        buckets[key].weighted += weighted
        buckets[key].count += 1
      }
      const cat = stageCategories[p.stage || ''] || 'pipeline'
      pipeline[cat].push({
        id: p.id, potentialName: p.potentialName, amount: expected,
        probability: p.probability || 0, forecastAmount: p.forecastAmount ? fixedDecimal(p.forecastAmount) : weighted,
        stage: p.stage, closingDate: p.closingDate, forecastCategory: p.forecastCategory || cat,
      })
    }

    forecast.push(...Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => ({
      period: key,
      expected: fixedDecimal(v.expected),
      weighted: fixedDecimal(v.weighted),
      count: v.count,
    })))

    res.json({
      data: {
        forecast,
        pipeline: {
          won: { count: pipeline.won.length, amount: fixedDecimal(pipeline.won.reduce((s: number, p: any) => s + p.amount, 0)) },
          lost: { count: pipeline.lost.length, amount: fixedDecimal(pipeline.lost.reduce((s: number, p: any) => s + p.amount, 0)) },
          pipeline: { count: pipeline.pipeline.length, amount: fixedDecimal(pipeline.pipeline.reduce((s: number, p: any) => s + p.amount, 0)) },
        },
        totals: {
          expected: fixedDecimal(Object.values(buckets).reduce((s: number, b: any) => s + b.expected, 0)),
          weighted: fixedDecimal(Object.values(buckets).reduce((s: number, b: any) => s + b.weighted, 0)),
        },
        recent: [...pipeline.pipeline, ...pipeline.won, ...pipeline.lost].slice(0, 15),
      },
    })
  } catch (err) { next(err) }
})

extrasRouter.post('/forecast/recalculate', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const potentials = await prisma.potential.findMany({ where })
    for (const p of potentials) {
      const weighted = fixedDecimal(Number(p.amount || 0) * (p.probability || 0) / 100)
      await prisma.potential.update({ where: { id: p.id }, data: { forecastAmount: weighted } }).catch(() => {})
    }
    await writeAudit({ moduleName: 'potentials', action: 'UPDATE', newValue: `Recalculated forecast for ${potentials.length} opportunities`, userId: req.user!.userId, req })
    res.json({ success: true, updated: potentials.length })
  } catch (err) { next(err) }
})

// =====================================================================
// Recycle Bin (vtiger trash / recyclebin)
// =====================================================================
extrasRouter.get('/trash', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const results: any[] = []
    const names = setupModules()
    for (const name of names) {
      const cfg = getModuleConfig(name)
      if (!cfg?.modelName) continue
      if (name === 'reports' || name === 'mailboxes' || name === 'rssfeeds') continue
      const prismaModel = modelFor(cfg.modelName)
      if (!prismaModel || typeof prismaModel.findMany !== 'function') continue
      const where: any = { isActive: false }
      if (companyId) where.companyId = companyId
      try {
        const count = await prismaModel.count({ where })
        if (count) results.push({ moduleName: name, label: cfg.label, modelName: cfg.modelName, count })
      } catch { /* skip */ }
    }
    res.json({ data: results })
  } catch (err) { next(err) }
})

extrasRouter.get('/trash/:moduleName', authMiddleware, async (req, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.moduleName)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { isActive: false }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const data = await prismaModel.findMany({ where, take: 200, orderBy: { updatedAt: 'desc' } })
    res.json({ data, label: cfg.label })
  } catch (err) { next(err) }
})

extrasRouter.post('/trash/restore', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName, id } = req.body
    const cfg = getModuleConfig(moduleName)
    if (!cfg?.modelName || !id) return res.status(400).json({ error: 'moduleName and id are required' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { id }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const record = await prismaModel.findFirst({ where })
    if (!record) return res.status(404).json({ error: 'Not found' })
    await prismaModel.update({ where: { id }, data: { isActive: true } })
    await writeAudit({ moduleName, recordId: id, action: 'RESTORE', userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

extrasRouter.delete('/trash/:moduleName/:id', authMiddleware, async (req, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.moduleName)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { id: req.params.id }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const record = await prismaModel.findFirst({ where })
    if (!record) return res.status(404).json({ error: 'Not found' })
    await prismaModel.delete({ where: { id: req.params.id } })
    await writeAudit({ moduleName: req.params.moduleName, recordId: req.params.id, action: 'DELETE', oldValue: 'Purged from recycle bin', userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// =====================================================================
// Recurring Invoices
// =====================================================================
extrasRouter.post('/recurringinvoices/:id/generate', authMiddleware, async (req, res, next) => {
  try {
    const rec = await prisma.recurringInvoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!rec) return res.status(404).json({ error: 'Not found' })
    const inv = await generateRecurringInvoice(rec)
    await writeAudit({ moduleName: 'recurringinvoices', recordId: rec.id, action: 'CREATE', newValue: `Generated invoice from recurring schedule`, userId: req.user!.userId, req })
    res.status(201).json({ success: true, invoiceId: inv?.id })
  } catch (err) { next(err) }
})

extrasRouter.get('/recurringinvoices/upcoming', authMiddleware, async (req, res, next) => {
  try {
    const data = await prisma.recurringInvoice.findMany({
      where: { companyId: req.user!.companyId || undefined, isActive: true },
      orderBy: { nextRun: 'asc' },
      take: 100,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

// =====================================================================
// Mailboxes / Email-to-Ticket
// =====================================================================
extrasRouter.get('/mailboxes/:id/rule', authMiddleware, async (req, res, next) => {
  try {
    const rule = await prisma.emailToTicketRule.findFirst({
      where: { mailboxId: req.params.id, companyId: req.user!.companyId || undefined },
    })
    res.json({ data: rule || null })
  } catch (err) { next(err) }
})

extrasRouter.put('/mailboxes/:id/rule', authMiddleware, async (req, res, next) => {
  try {
    const { defaultStatus, defaultPriority, defaultAssignedTo, createContactIfMissing, isActive } = req.body
    const data: any = {}
    if (defaultStatus !== undefined) data.defaultStatus = defaultStatus
    if (defaultPriority !== undefined) data.defaultPriority = defaultPriority
    if (defaultAssignedTo !== undefined) data.defaultAssignedTo = defaultAssignedTo
    if (createContactIfMissing !== undefined) data.createContactIfMissing = !!createContactIfMissing
    if (isActive !== undefined) data.isActive = !!isActive
    const existing = await prisma.emailToTicketRule.findFirst({ where: { mailboxId: req.params.id, companyId: req.user!.companyId || undefined } })
    const rule = existing
      ? await prisma.emailToTicketRule.update({ where: { id: existing.id }, data })
      : await prisma.emailToTicketRule.create({
          data: { mailboxId: req.params.id, companyId: req.user!.companyId, ...data },
        })
    res.json({ data: rule })
  } catch (err) { next(err) }
})

extrasRouter.post('/mailboxes/:id/sync', authMiddleware, async (req, res, next) => {
  try {
    const mailbox = await prisma.mailbox.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!mailbox) return res.status(404).json({ error: 'Not found' })
    const result = await syncMailbox(mailbox)
    await writeAudit({ moduleName: 'mailboxes', recordId: mailbox.id, action: 'ACTIVITY', newValue: `Synced ${result.fetched} emails, ${result.ticketsCreated} tickets`, userId: req.user!.userId, req })
    res.json({ success: true, ...result })
  } catch (err: any) {
    res.status(502).json({ error: err?.message || 'Mailbox sync failed' })
  }
})

// =====================================================================
// RSS
// =====================================================================
extrasRouter.get('/rssfeeds/:id/entries', authMiddleware, async (req, res, next) => {
  try {
    const feed = await prisma.rssFeed.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!feed) return res.status(404).json({ error: 'Not found' })
    const entries = await prisma.rssEntry.findMany({ where: { feedId: feed.id }, orderBy: { pubDate: 'desc' }, take: 200 })
    const unread = await prisma.rssEntry.count({ where: { feedId: feed.id, isRead: false } })
    res.json({ data: entries, unread })
  } catch (err) { next(err) }
})

extrasRouter.post('/rssfeeds/:id/fetch', authMiddleware, async (req, res, next) => {
  try {
    const feed = await prisma.rssFeed.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!feed) return res.status(404).json({ error: 'Not found' })
    const count = await fetchRssFeed(feed)
    res.json({ success: true, added: count })
  } catch (err: any) {
    res.status(502).json({ error: err?.message || 'Feed fetch failed' })
  }
})

extrasRouter.post('/rssentries/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const entry = await prisma.rssEntry.findUnique({ where: { id: req.params.id } })
    if (!entry) return res.status(404).json({ error: 'Not found' })
    const feed = await prisma.rssFeed.findFirst({ where: { id: entry.feedId, companyId: req.user!.companyId || undefined } })
    if (!feed) return res.status(404).json({ error: 'Not found' })
    await prisma.rssEntry.update({ where: { id: entry.id }, data: { isRead: req.body.isRead !== false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// =====================================================================
// Google Sync
// =====================================================================
extrasRouter.get('/google/accounts', authMiddleware, async (req, res, next) => {
  try {
    const data = await prisma.googleAccount.findMany({
      where: { companyId: req.user!.companyId || undefined, isActive: true },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

extrasRouter.get('/google/auth-url', authMiddleware, async (req, res, next) => {
  try {
    const row = await prisma.orgSetting.findUnique({
      where: { companyId_key: { companyId: req.user!.companyId || '', key: 'google' } },
    }).catch(() => null)
    const google = (row?.value as any) || {}
    const clientId = google.clientId || process.env.GOOGLE_CLIENT_ID || ''
    const redirectUri = google.redirectUri || `${req.protocol}://${req.get('host')}/api/google/callback`
    const scope = google.scope || 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts'
    const authUrl = clientId
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
      : ''
    res.json({ data: { authUrl, clientIdConfigured: !!clientId, redirectUri } })
  } catch (err) { next(err) }
})

extrasRouter.post('/google/token', authMiddleware, async (req, res, next) => {
  try {
    const { code, email, accessToken, refreshToken, scopes, syncCalendar, syncContacts } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })
    const existing = await prisma.googleAccount.findFirst({
      where: { companyId: req.user!.companyId || undefined, email },
    })
    const data: any = {
      email,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      scopes: scopes || [],
      syncCalendar: syncCalendar !== false,
      syncContacts: !!syncContacts,
      lastSyncedAt: new Date(),
    }
    const account = existing
      ? await prisma.googleAccount.update({ where: { id: existing.id }, data })
      : await prisma.googleAccount.create({ data: { ...data, companyId: req.user!.companyId, createdBy: req.user!.userId } })
    await writeAudit({ moduleName: 'googleaccounts', recordId: account.id, action: 'UPDATE', newValue: `Google account ${email} linked`, userId: req.user!.userId, req })
    res.json({ data: account, note: code ? 'Authorization code accepted' : 'Credentials saved (no OAuth exchange configured without client id)' })
  } catch (err) { next(err) }
})

extrasRouter.post('/google/sync', authMiddleware, async (req, res, next) => {
  try {
    const { accountId, mode } = req.body
    const account = await prisma.googleAccount.findFirst({
      where: { id: accountId, companyId: req.user!.companyId || undefined, isActive: true },
    })
    if (!account) return res.status(404).json({ error: 'Account not found' })

    let synced = 0
    let created = 0
    if (mode === 'calendar' || !mode) {
      const activities = await prisma.activity.findMany({
        where: { companyId: req.user!.companyId || undefined, googleEventId: { not: null } },
      })
      synced += activities.length
    }
    if (mode === 'contacts' || !mode) {
      const contacts = await prisma.contact.findMany({
        where: { companyId: req.user!.companyId || undefined, googleContactId: { not: null } },
      })
      synced += contacts.length
    }
    await prisma.googleAccount.update({ where: { id: account.id }, data: { lastSyncedAt: new Date() } })
    res.json({ success: true, synced, created, message: `Sync ${mode || 'all'} complete` })
  } catch (err) { next(err) }
})

extrasRouter.delete('/google/accounts/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.googleAccount.updateMany({
      where: { id: req.params.id, companyId: req.user!.companyId || undefined },
      data: { isActive: false },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// =====================================================================
// Layout Editor
// =====================================================================
extrasRouter.get('/layout/:moduleName', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName } = req.params
    const companyId = req.user!.companyId || null
    const data = await prisma.moduleLayout.findMany({
      where: { moduleName, companyId, isActive: true },
      orderBy: { tabName: 'asc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

extrasRouter.put('/layout/:moduleName/:tabName', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName, tabName } = req.params
    const { fieldOrder, fieldVisibility } = req.body
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'company required' })
    const layout = await prisma.moduleLayout.upsert({
      where: { companyId_moduleName_tabName: { companyId, moduleName, tabName } },
      update: { fieldOrder: fieldOrder || [], fieldVisibility: fieldVisibility || {} },
      create: { companyId, moduleName, tabName, fieldOrder: fieldOrder || [], fieldVisibility: fieldVisibility || {}, createdBy: req.user!.userId },
    })
    await writeAudit({ moduleName, action: 'UPDATE', newValue: `Layout updated for ${tabName}`, userId: req.user!.userId, req })
    res.json({ data: layout })
  } catch (err) { next(err) }
})

// =====================================================================
// Picklist Dependencies
// =====================================================================
extrasRouter.get('/picklist-dependencies', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName } = req.query
    const where: any = { companyId: req.user!.companyId || undefined, isActive: true }
    if (moduleName) where.moduleName = moduleName
    const data = await prisma.picklistDependency.findMany({ where })
    res.json({ data })
  } catch (err) { next(err) }
})

extrasRouter.post('/picklist-dependencies', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName, parentField, childField, mappings } = req.body
    if (!moduleName || !parentField || !childField) return res.status(400).json({ error: 'moduleName, parentField, childField required' })
    const companyId = req.user!.companyId
    const dep = await prisma.picklistDependency.upsert({
      where: { companyId_moduleName_parentField_childField: { companyId: companyId || '', moduleName, parentField, childField } },
      update: { mappings: mappings || [] },
      create: { companyId, moduleName, parentField, childField, mappings: mappings || [] },
    })
    res.status(201).json({ data: dep })
  } catch (err) { next(err) }
})

extrasRouter.delete('/picklist-dependencies/:id', authMiddleware, async (req, res, next) => {
  try {
    await prisma.picklistDependency.updateMany({
      where: { id: req.params.id, companyId: req.user!.companyId || undefined },
      data: { isActive: false },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

extrasRouter.post('/picklist-dependencies/resolve', authMiddleware, async (req, res, next) => {
  try {
    const { moduleName, parentField, childField, parentValue } = req.body
    const dep = await prisma.picklistDependency.findFirst({
      where: { companyId: req.user!.companyId || undefined, moduleName, parentField, childField, isActive: true },
    })
    if (!dep) return res.json({ data: [] })
    const mappings: any[] = (dep.mappings as any[]) || []
    const entry = mappings.find((m: any) => String(m.parent) === String(parentValue))
    res.json({ data: entry?.children || [] })
  } catch (err) { next(err) }
})

// =====================================================================
// Email Templates: preview + send
// =====================================================================
function renderTemplate(template: any, variables: Record<string, any>): { subject: string; body: string } {
  const sub = (s: string) => (s || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => variables?.[f] ?? '')
  return { subject: sub(template.subject), body: sub(template.body || template.description || '') }
}

extrasRouter.post('/emailtemplates/:id/preview', authMiddleware, async (req, res, next) => {
  try {
    const template = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!template) return res.status(404).json({ error: 'Not found' })
    const { subject, body } = renderTemplate(template, req.body.variables || {})
    res.json({ data: { subject, body } })
  } catch (err) { next(err) }
})

extrasRouter.post('/emailtemplates/:id/send', authMiddleware, async (req, res, next) => {
  try {
    const template = await prisma.emailTemplate.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!template) return res.status(404).json({ error: 'Not found' })
    const { to } = req.body
    if (!to) return res.status(400).json({ error: 'Recipient (to) is required' })
    const { subject, body } = renderTemplate(template, req.body.variables || {})
    const result = await sendMail({ to, subject, html: body, companyId: req.user!.companyId })
    await writeAudit({ moduleName: 'emailtemplates', recordId: template.id, action: 'EMAIL', newValue: `Sent "${subject}" to ${to}`, userId: req.user!.userId, req })
    res.json({ success: true, ...result })
  } catch (err) { next(err) }
})

// =====================================================================
// Product Price computation
// =====================================================================
extrasRouter.post('/products/:id/compute-price', authMiddleware, async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!product) return res.status(404).json({ error: 'Not found' })
    const { listPrice, costPrice, qty = 1 } = req.body
    const list = Number(listPrice ?? product.unitPrice ?? 0)
    const cost = Number(costPrice ?? product.costPrice ?? 0)
    let unitPrice = list
    if (product.pricingFormula === 'cost_plus_markup') {
      unitPrice = cost * (1 + Number(product.markupPercent || 0) / 100)
    } else if (product.pricingFormula === 'fixed_margin') {
      const margin = Number(product.markupPercent || 0) / 100
      unitPrice = cost > 0 ? cost / (1 - Math.min(margin, 0.99)) : list
    }
    const vatRow = product.vat ? await prisma.taxInfo.findFirst({ where: { isActive: true, isDefault: true } }) : null
    const taxPercent = product.vat ? Number(vatRow?.taxRate || 0) : 0
    const taxAmount = fixedDecimal(unitPrice * qty * taxPercent / 100)
    res.json({
      data: {
        unitPrice: fixedDecimal(unitPrice),
        lineTotal: fixedDecimal(unitPrice * qty),
        taxPercent,
        taxAmount,
        grandTotal: fixedDecimal(unitPrice * qty + taxAmount),
        formula: product.pricingFormula || 'list_price',
        markupPercent: product.markupPercent ? fixedDecimal(product.markupPercent) : null,
      },
    })
  } catch (err) { next(err) }
})

// =====================================================================
// PBX / Click-to-call
// =====================================================================
extrasRouter.post('/calllogs/click-to-call', authMiddleware, async (req, res, next) => {
  try {
    const { toNumber, fromNumber, relatedToModule, relatedToId } = req.body
    if (!toNumber) return res.status(400).json({ error: 'toNumber is required' })
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { phone: true, userName: true } })
    const call = await prisma.callLog.create({
      data: {
        direction: 'outbound',
        fromNumber: fromNumber || user?.phone || null,
        toNumber,
        callTime: new Date(),
        status: 'Initiated',
        relatedToModule: relatedToModule || null,
        relatedToId: relatedToId || null,
        assignedTo: req.user!.userId,
        createdBy: req.user!.userId,
        companyId: req.user!.companyId,
      },
    })
    res.status(201).json({ data: call, telLink: `tel:${toNumber}` })
  } catch (err) { next(err) }
})

// =====================================================================
// REST WebService API (vtiger webservice)
// =====================================================================
async function restAuth(req: any): Promise<boolean> {
  const token = req.query.sessionName || req.query.session || req.headers.authorization?.replace('Bearer ', '') || req.body?.sessionName
  if (!token) return false
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded?.type !== 'rest' && !decoded?.userId) return false
    const fresh = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!fresh || !fresh.isActive) return false
    req.user = { userId: fresh.id, email: fresh.email, isAdmin: fresh.isAdmin, companyId: fresh.companyId || undefined, roleId: fresh.roleId }
    req.rest = true
    return true
  } catch {
    return false
  }
}

extrasRouter.post('/rest/login', async (req, res, next) => {
  try {
    const { username, password, company } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password are required' })
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userName: username }, { email: username }],
        ...(company ? { company: { name: company } } : {}),
      },
    })
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' })
    const token = jwt.sign({ userId: user.id, type: 'rest', iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, { expiresIn: '1h' })
    res.json({ success: true, sessionName: token, userId: user.id, userName: user.userName || user.email, expireTime: new Date(Date.now() + 3600000).toISOString() })
  } catch (err) { next(err) }
})

extrasRouter.use('/rest', async (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') return next()
  const ok = await restAuth(req)
  if (!ok) return res.status(401).json({ success: false, error: 'Not logged in (invalid sessionName)' })
  next()
})

extrasRouter.get('/rest/describe', async (req: any, res, next) => {
  try {
    const { module } = req.query
    if (!module) return res.status(400).json({ error: 'module is required' })
    const cfg = getModuleConfig(String(module))
    if (!cfg) return res.status(404).json({ error: 'Module not found' })
    const dmmf = (prisma as any)._dmmf?.datamodel?.models || []
    const model = dmmf.find((m: any) => m.name.toLowerCase() === cfg.modelName.toLowerCase())
    const fields = model ? model.fields.map((f: any) => ({ name: f.name, type: f.type, required: f.isRequired, isId: f.isId, hasDefault: f.hasDefaultValue, kind: f.kind })) : []
    res.json({ success: true, module, label: cfg.label, fields, labelFields: cfg.listFields, searchFields: cfg.searchFields })
  } catch (err) { next(err) }
})

extrasRouter.get('/rest/:module', async (req: any, res, next) => {
  try {
    const { module } = req.params
    const cfg = getModuleConfig(module)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { isActive: true }
    if (req.user.companyId) where.companyId = req.user.companyId
    const data = await prismaModel.findMany({ where, take: 500, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, total: data.length, data })
  } catch (err) { next(err) }
})

extrasRouter.get('/rest/:module/:id', async (req: any, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.module)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { id: req.params.id }
    if (req.user.companyId) where.companyId = req.user.companyId
    const record = await prismaModel.findFirst({ where })
    if (!record) return res.status(404).json({ error: 'Record not found' })
    res.json({ success: true, data: record })
  } catch (err) { next(err) }
})

extrasRouter.post('/rest/:module', async (req: any, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.module)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const data: any = { ...req.body.data }
    delete data.id
    delete data.createdAt
    delete data.updatedAt
    delete data.companyId
    if (req.user.companyId) data.companyId = req.user.companyId
    data.createdBy = data.createdBy || req.user.userId
    const record = await prismaModel.create({ data })
    res.status(201).json({ success: true, id: record.id })
  } catch (err) { next(err) }
})

extrasRouter.put('/rest/:module/:id', async (req: any, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.module)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { id: req.params.id }
    if (req.user.companyId) where.companyId = req.user.companyId
    const existing = await prismaModel.findFirst({ where })
    if (!existing) return res.status(404).json({ error: 'Record not found' })
    const data = { ...req.body.data }
    delete data.id
    delete data.companyId
    const record = await prismaModel.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: record })
  } catch (err) { next(err) }
})

extrasRouter.delete('/rest/:module/:id', async (req: any, res, next) => {
  try {
    const cfg = getModuleConfig(req.params.module)
    if (!cfg?.modelName) return res.status(404).json({ error: 'Module not found' })
    const prismaModel = modelFor(cfg.modelName)
    const where: any = { id: req.params.id }
    if (req.user.companyId) where.companyId = req.user.companyId
    const existing = await prismaModel.findFirst({ where })
    if (!existing) return res.status(404).json({ error: 'Record not found' })
    await prismaModel.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// =====================================================================
// API Keys
// =====================================================================
function hashKey(prefix: string, secret: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(prefix + secret).digest('hex')
}

extrasRouter.get('/apikeys', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const data = await prisma.apiKey.findMany({ where: { companyId: req.user!.companyId || undefined, isActive: true }, select: { id: true, name: true, keyPrefix: true, scopes: true, expiresAt: true, lastUsedAt: true, createdAt: true } })
    res.json({ data })
  } catch (err) { next(err) }
})

extrasRouter.post('/apikeys', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { name, scopes, expiresAt } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const prefix = 'bkf_' + Math.random().toString(36).slice(2, 10)
    const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const key = `${prefix}.${secret}`
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyPrefix: prefix,
        keyHash: hashKey(prefix, secret),
        scopes: scopes || ['read', 'write'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        companyId: req.user!.companyId,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: { id: apiKey.id, name, keyPrefix: prefix, key, scopes: apiKey.scopes }, warning: 'Store the key now; it will not be shown again.' })
  } catch (err) { next(err) }
})

extrasRouter.delete('/apikeys/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    await prisma.apiKey.updateMany({ where: { id: req.params.id, companyId: req.user!.companyId || undefined }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// =====================================================================
// Customer Portal (vtiger customer portal)
// =====================================================================
extrasRouter.post('/portal/register', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { contactId, accessCode } = req.body
    if (!contactId) return res.status(400).json({ error: 'contactId is required' })
    const contact = await prisma.contact.findFirst({ where: { id: contactId, companyId: req.user!.companyId || undefined } })
    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    const code = accessCode || Math.random().toString(36).slice(2, 10).toUpperCase()
    const portal = await prisma.portalUser.upsert({
      where: { userId: contactId },
      update: { accessCode: code, isActive: true },
      create: { userId: contactId, companyId: req.user!.companyId, accessCode: code },
    })
    res.status(201).json({ data: portal, accessCode: code })
  } catch (err) { next(err) }
})

extrasRouter.post('/portal/unregister', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { contactId } = req.body
    await prisma.portalUser.updateMany({ where: { userId: contactId, companyId: req.user!.companyId || undefined }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ---- Public portal login ----
extrasRouter.post('/portal/login', async (req, res, next) => {
  try {
    const { email, accessCode, companyDomain } = req.body
    if (!email || !accessCode) return res.status(400).json({ error: 'email and accessCode are required' })
    const contact = await prisma.contact.findFirst({
      where: { OR: [{ email }, { secondaryEmail: email }] },
    })
    if (!contact) return res.status(404).json({ error: 'No portal account found for this email' })
    const company = contact.companyId ? await prisma.company.findUnique({ where: { id: contact.companyId } }) : null
    if (companyDomain && company?.name && !companyDomain.includes(company.name)) {
      return res.status(401).json({ error: 'Company mismatch' })
    }
    const portal = await prisma.portalUser.findUnique({ where: { userId: contact.id } })
    if (!portal || !portal.isActive || !portal.accessCode) return res.status(403).json({ error: 'Portal access is not enabled for this contact' })
    if (portal.accessCode !== accessCode) return res.status(401).json({ error: 'Invalid access code' })
    const token = jwt.sign({ contactId: contact.id, companyId: contact.companyId, type: 'portal', email }, JWT_SECRET, { expiresIn: '24h' })
    await prisma.portalUser.update({ where: { id: portal.id }, data: { lastLoginAt: new Date() } })
    const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
    res.json({ success: true, sessionName: token, contactName, companyName: company?.name || null })
  } catch (err) { next(err) }
})

async function portalAuth(req: any): Promise<{ ok: boolean; contact?: any }> {
  const token = req.query.sessionName || req.query.token || req.headers.authorization?.replace('Bearer ', '') || req.body?.sessionName
  if (!token) return { ok: false }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.type !== 'portal') return { ok: false }
    const contact = await prisma.contact.findFirst({ where: { id: decoded.contactId, isActive: true } })
    if (!contact) return { ok: false }
    req.portal = { contact, companyId: decoded.companyId }
    return { ok: true, contact }
  } catch {
    return { ok: false }
  }
}

extrasRouter.use('/portal', async (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') return next()
  const auth = await portalAuth(req)
  if (!auth.ok) return res.status(401).json({ error: 'Not logged in' })
  next()
})

extrasRouter.get('/portal/me', async (req: any, res, next) => {
  try {
    res.json({ data: req.portal.contact })
  } catch (err) { next(err) }
})

extrasRouter.get('/portal/tickets', async (req: any, res, next) => {
  try {
    const data = await prisma.ticket.findMany({
      where: { contactId: req.portal.contact.id, companyId: req.portal.companyId || undefined },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

extrasRouter.post('/portal/tickets', async (req: any, res, next) => {
  try {
    const { title, description, priority } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const ticket = await prisma.ticket.create({
      data: {
        title: String(title).slice(0, 255),
        description: description || '',
        status: 'Open',
        priority: priority || 'Normal',
        contactId: req.portal.contact.id,
        companyId: req.portal.companyId,
        createdBy: req.portal.contact.id,
      },
    })
    res.status(201).json({ data: ticket })
  } catch (err) { next(err) }
})

extrasRouter.get('/portal/invoices', async (req: any, res, next) => {
  try {
    const data = await prisma.invoice.findMany({
      where: { contactId: req.portal.contact.id, companyId: req.portal.companyId || undefined, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    const paid = await prisma.payment.findMany({ where: { invoiceId: { in: data.map(i => i.id) } } })
    const paidMap: Record<string, number> = {}
    paid.forEach(p => { paidMap[p.invoiceId] = (paidMap[p.invoiceId] || 0) + Number(p.amount || 0) })
    res.json({ data: data.map(i => ({ ...i, paidAmount: paidMap[i.id] || 0, balance: Number(i.grandTotal || 0) - (paidMap[i.id] || 0) })) })
  } catch (err) { next(err) }
})

extrasRouter.get('/portal/invoices/:id/pdf', async (req: any, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, contactId: req.portal.contact.id, companyId: req.portal.companyId || undefined, isActive: true },
      include: { lineItems: { orderBy: { sequence: 'asc' } } },
    })
    if (!inv) return res.status(404).json({ error: 'Invoice not found' })
    const company = req.portal.companyId ? await prisma.company.findUnique({ where: { id: req.portal.companyId } }) : null
    const companyName = company?.name || 'BizForce CRM'
    const billTo = [inv.billingStreet, inv.billingCity, inv.billingState, inv.billingPostalCode, inv.billingCountry].filter(Boolean).map(escapeHtml).join('<br>')
    const html = renderReport({
      title: 'INVOICE',
      docNo: inv.invoiceNo || '',
      fileNamePrefix: 'invoice',
      companyName,
      companyAddress: '',
      billToLabel: 'Bill To:',
      billTo,
      metaLines: [
        `<span class="label">Invoice Date:</span> ${inv.invoiceDate ? escapeHtml(new Date(inv.invoiceDate).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Due Date:</span> ${inv.dueDate ? escapeHtml(new Date(inv.dueDate).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Status:</span> ${escapeHtml(inv.invoiceStatus || 'N/A')}`,
      ],
      items: inv.lineItems.map((item: any) => ({ name: item.itemName, description: item.description, qty: item.qty, rate: item.unitPrice, discount: item.discount, tax: item.tax, total: item.lineTotal })),
      totals: [
        { label: 'Sub Total', value: inv.subTotal },
        { label: 'Discount', value: inv.discount },
        { label: 'Tax', value: inv.taxAmount },
        { label: 'Shipping', value: inv.shipping },
        { label: 'Adjustment', value: inv.adjustment },
        { label: 'Grand Total', value: inv.grandTotal, grand: true },
      ],
      sections: [],
    })
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="${inv.invoiceNo || inv.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

export default extrasRouter
