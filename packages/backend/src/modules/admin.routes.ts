import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { getAllGlobalSettings, getGlobalSetting, setGlobalSetting, validatePassword } from '../lib/settings'
import bcrypt from 'bcryptjs'
import { publicUser } from '../lib/public-user'
import fs from 'fs'
import { createDatabaseBackup, emailDatabaseBackup, getDatabaseBackupConfig, listDatabaseBackups, resolveBackupFile, saveDatabaseBackupConfig } from '../lib/database-backup'
import { checkOrganizationLimit, getOrganizationUsage } from '../lib/organization-limits'
import { getLogs, clearLogs } from '../lib/log-buffer'

export const adminRouter = Router()

adminRouter.use(authMiddleware)

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' })
  }
  next()
}

adminRouter.use(requireSuperAdmin)

adminRouter.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || ''
    if (q.length < 2) return res.json({ data: { companies: [], users: [] } })
    const [companies, users] = await Promise.all([
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { addressCity: { contains: q, mode: 'insensitive' } },
            { addressCountry: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { userName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: { company: { select: { id: true, name: true, logo: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])
    res.json({ data: { companies, users } })
  } catch (err) { next(err) }
})

adminRouter.get('/settings', async (_req, res, next) => {
  try {
    const settings = await getAllGlobalSettings()
    if (settings.smtp) settings.smtp = { ...settings.smtp, pass: '', configured: !!(settings.smtp.host && settings.smtp.fromEmail && settings.smtp.pass), resendApiKey: '', resendConfigured: !!(settings.smtp.resendApiKey && settings.smtp.resendFromEmail) }
    res.json(settings)
  } catch (err) { next(err) }
})

adminRouter.put('/settings', async (req, res, next) => {
  try {
    const body = req.body
    const keys = body && body.settings ? body.settings : body
    for (const key of Object.keys(keys || {})) {
      if (key === 'smtp' && (keys[key] && !keys[key]?.pass || keys[key] && !keys[key]?.resendApiKey)) {
        const current = await getGlobalSetting('smtp', {})
        const incoming = keys[key] || {}
        keys[key] = {
          ...current,
          ...incoming,
          pass: 'pass' in incoming ? (incoming.pass || current?.pass || '') : current?.pass || '',
          resendApiKey: 'resendApiKey' in incoming ? (incoming.resendApiKey || current?.resendApiKey || '') : current?.resendApiKey || '',
        }
      }
      await setGlobalSetting(key, keys[key])
    }
    const settings = await getAllGlobalSettings()
    if (settings.smtp) settings.smtp = { ...settings.smtp, pass: '', configured: !!(settings.smtp.host && settings.smtp.fromEmail && settings.smtp.pass), resendApiKey: '', resendConfigured: !!(settings.smtp.resendApiKey && settings.smtp.resendFromEmail) }
    res.json(settings)
  } catch (err) { next(err) }
})

adminRouter.get('/backups', async (_req, res, next) => {
  try {
    const [config, data] = await Promise.all([getDatabaseBackupConfig(), listDatabaseBackups()])
    res.json({ config, data })
  } catch (err) { next(err) }
})

adminRouter.put('/backups/config', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (!['daily', 'weekly', 'monthly'].includes(body.frequency)) return res.status(400).json({ error: 'Invalid backup frequency' })
    const hour = Number(body.hour), minute = Number(body.minute), dayOfWeek = Number(body.dayOfWeek), dayOfMonth = Number(body.dayOfMonth), retentionCount = Number(body.retentionCount)
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return res.status(400).json({ error: 'Invalid backup time' })
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) return res.status(400).json({ error: 'Invalid schedule day' })
    if (!Number.isInteger(retentionCount) || retentionCount < 1 || retentionCount > 365) return res.status(400).json({ error: 'Retention must be between 1 and 365 backups' })
    const emailTo = String(body.emailTo || '').trim()
    if (body.emailEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) return res.status(400).json({ error: 'A valid backup email is required' })
    const config = await saveDatabaseBackupConfig({
      enabled: !!body.enabled, frequency: body.frequency, hour, minute, dayOfWeek, dayOfMonth,
      retentionCount, emailEnabled: !!body.emailEnabled, emailTo,
    })
    res.json({ config, message: 'Backup schedule saved successfully' })
  } catch (err) { next(err) }
})

async function runBackupNow(_req: Request, res: Response, next: NextFunction) {
  try {
    const backup = await createDatabaseBackup()
    res.json({ backup, message: 'Full system backup (database, files & configuration) completed successfully' })
  } catch (err) { next(err) }
}

adminRouter.post('/backups/run', runBackupNow)
// Compatibility endpoint for deployments/proxies that reserve the `/run` suffix.
adminRouter.post('/backups/create', runBackupNow)

adminRouter.post('/backups/:fileName/email', async (req, res, next) => {
  try {
    const emailTo = String(req.body?.emailTo || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) return res.status(400).json({ error: 'A valid backup email is required' })
    await emailDatabaseBackup(req.params.fileName, emailTo)
    res.json({ message: `Backup emailed successfully to ${emailTo}` })
  } catch (err) { next(err) }
})

function subscriptionModelInput(body: any) {
  const code = String(body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_')
  const name = String(body?.name || '').trim()
  if (!code || !name) throw Object.assign(new Error('Plan code and name are required'), { status: 400 })
  const billingCycle = ['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'].includes(body?.billingCycle) ? body.billingCycle : 'MONTHLY'
  const price = body?.price === '' || body?.price == null ? null : Number(body.price)
  if (price != null && (!Number.isFinite(price) || price < 0)) throw Object.assign(new Error('Price must be zero or greater'), { status: 400 })
  return {
    code, name, description: String(body?.description || '').trim() || null, price,
    billingCycle, userLimit: Math.max(1, Number(body?.userLimit) || 1),
    contactLimit: Math.max(1, Number(body?.contactLimit) || 1),
    features: Array.isArray(body?.features) ? body.features.map((item: any) => String(item).trim()).filter(Boolean) : [],
    isActive: body?.isActive !== false,
  }
}

async function ensureDefaultSubscriptionModels() {
  if (await prisma.subscriptionModel.count()) return
  await prisma.subscriptionModel.createMany({ data: [
    { code: 'STARTER', name: 'Starter', description: 'Core CRM for small teams', userLimit: 3, contactLimit: 2000, features: [] },
    { code: 'GROWTH', name: 'Growth', description: 'More capacity for growing organisations', userLimit: 50, contactLimit: 50000, features: [] },
    { code: 'ENTERPRISE', name: 'Enterprise', description: 'Enterprise-scale CRM access', userLimit: 250, contactLimit: 250000, features: [] },
    { code: 'CUSTOM', name: 'Custom', description: 'Custom limits and commercial terms', userLimit: 3, contactLimit: 2000, billingCycle: 'CUSTOM', features: [] },
  ], skipDuplicates: true })
}

adminRouter.get('/subscription-models', async (_req, res, next) => {
  try {
    await ensureDefaultSubscriptionModels()
    const data = await prisma.subscriptionModel.findMany({ include: { _count: { select: { companies: true } } }, orderBy: [{ isActive: 'desc' }, { name: 'asc' }] })
    res.json({ data })
  } catch (err) { next(err) }
})

adminRouter.post('/subscription-models', async (req, res, next) => {
  try { res.status(201).json(await prisma.subscriptionModel.create({ data: subscriptionModelInput(req.body) })) }
  catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'A plan with this code already exists' })
    next(err)
  }
})

adminRouter.put('/subscription-models/:id', async (req, res, next) => {
  try { res.json(await prisma.subscriptionModel.update({ where: { id: req.params.id }, data: subscriptionModelInput(req.body) })) }
  catch (err: any) {
    if (err?.code === 'P2002') return res.status(409).json({ error: 'A plan with this code already exists' })
    next(err)
  }
})

adminRouter.delete('/subscription-models/:id', async (req, res, next) => {
  try {
    const assigned = await prisma.company.count({ where: { subscriptionModelId: req.params.id } })
    if (assigned) return res.status(409).json({ error: `This plan is assigned to ${assigned} organisation(s). Reassign them before deleting it.` })
    await prisma.subscriptionModel.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

adminRouter.get('/backups/:fileName/download', async (req, res, next) => {
  try {
    const filePath = resolveBackupFile(req.params.fileName)
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Backup file not found' })
    res.download(filePath, req.params.fileName)
  } catch (err) { next(err) }
})

adminRouter.get('/companies/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const since = req.query.since as string
    const where: any = {}
    if (since) where.createdAt = { gt: new Date(since) }
    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { subscriptionModel: true, _count: { select: { users: true } } },
    })
    res.json({ data: companies })
  } catch (err) { next(err) }
})

adminRouter.get('/companies', async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        subscriptionModel: true,
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    const withStats = await Promise.all(companies.map(async (c) => {
      const models = ['account', 'contact', 'lead', 'potential', 'campaign', 'product', 'service', 'vendor', 'quote', 'salesOrder', 'purchaseOrder', 'invoice', 'ticket']
      const counts: Record<string, number> = {}
      for (const m of models) {
        const key = m as keyof typeof prisma
        if (typeof (prisma as any)[key]?.count === 'function') {
          counts[m + 's'] = await (prisma as any)[key].count({ where: { companyId: c.id } })
        }
      }
      return { ...c, _count: c._count, recordCounts: counts }
    }))
    res.json({ data: withStats })
  } catch (err) { next(err) }
})

adminRouter.post('/companies/:id/logout-all', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id }, select: { id: true, name: true } })
    if (!company) return res.status(404).json({ error: 'Organization not found' })
    const result = await prisma.user.updateMany({
      where: { companyId: company.id },
      data: { tokenVersion: { increment: 1 }, lastActiveAt: null },
    })
    res.json({ success: true, count: result.count, message: `${result.count} user session(s) ended for ${company.name}` })
  } catch (err) { next(err) }
})

adminRouter.get('/companies/:id', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        subscriptionModel: true,
        users: {
          select: { id: true, userName: true, email: true, firstName: true, lastName: true, isAdmin: true, isActive: true, lastLogin: true, createdAt: true }
        }
      }
    })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    const usage = await getOrganizationUsage(company.id)
    res.json({ ...company, usage: { users: usage.users, contacts: usage.contacts } })
  } catch (err) { next(err) }
})

adminRouter.put('/companies/:id/toggle', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    const updated = await prisma.company.update({
      where: { id: req.params.id },
      data: { isActive: !company.isActive }
    })
    res.json(updated)
  } catch (err) { next(err) }
})

adminRouter.post('/companies/:id/trial', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) return res.status(404).json({ error: 'Organization not found' })
    const days = Math.min(365, Math.max(1, Number(req.body?.days) || 14))
    const now = new Date()
    const growthModel = await prisma.subscriptionModel.findUnique({ where: { code: 'GROWTH' } })
    const trialEndsAt = new Date(now.getTime() + days * 86_400_000)
    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionModelId: growthModel?.id, subscriptionPlan: 'GROWTH', subscriptionStatus: 'TRIAL',
        userLimit: Math.max(1, Number(req.body?.userLimit) || 50),
        contactLimit: Math.max(1, Number(req.body?.contactLimit) || 50000),
        trialStartsAt: now, trialEndsAt, subscriptionStartsAt: null, subscriptionEndsAt: null,
        isActive: true,
      },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

adminRouter.put('/companies/:id/subscription', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } })
    if (!company) return res.status(404).json({ error: 'Organization not found' })
    const statuses = ['ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED', 'CANCELLED']
    const model = req.body?.subscriptionModelId
      ? await prisma.subscriptionModel.findFirst({ where: { id: req.body.subscriptionModelId, isActive: true } })
      : null
    if (req.body?.subscriptionModelId && !model) return res.status(400).json({ error: 'Select an active subscription plan' })
    const plan = model?.code || company.subscriptionPlan
    const status = statuses.includes(req.body?.subscriptionStatus) ? req.body.subscriptionStatus : company.subscriptionStatus
    const userLimit = Math.max(1, Number(req.body?.userLimit) || company.userLimit)
    const contactLimit = Math.max(1, Number(req.body?.contactLimit) || company.contactLimit)
    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionModelId: model?.id || company.subscriptionModelId,
        subscriptionPlan: plan, subscriptionStatus: status, userLimit, contactLimit,
        trialStartsAt: req.body?.trialStartsAt ? new Date(req.body.trialStartsAt) : req.body?.trialStartsAt === null ? null : undefined,
        trialEndsAt: req.body?.trialEndsAt ? new Date(req.body.trialEndsAt) : req.body?.trialEndsAt === null ? null : undefined,
        subscriptionStartsAt: req.body?.subscriptionStartsAt ? new Date(req.body.subscriptionStartsAt) : req.body?.subscriptionStartsAt === null ? null : undefined,
        subscriptionEndsAt: req.body?.subscriptionEndsAt ? new Date(req.body.subscriptionEndsAt) : req.body?.subscriptionEndsAt === null ? null : undefined,
      },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

adminRouter.get('/login-history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = (req.query.search as string) || ''
    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { publicIp: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } }
      }),
      prisma.loginLog.count({ where })
    ])
    const normalized = data.map((log: any) => ({
      ...log,
      ipAddress: (log.ipAddress || '').replace(/^::ffff:/, ''),
    }))
    res.json({
      data: normalized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) { next(err) }
})

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { company: { select: { name: true } }, profile: { select: { isSuperAdmin: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const safe = users.map(({ password, profile, ...u }) => ({ ...u, isSuperAdmin: profile?.isSuperAdmin || false }))
    res.json({ data: safe })
  } catch (err) { next(err) }
})

adminRouter.post('/users/:id/logout-all', async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!target) return res.status(404).json({ error: 'User not found' })
    await prisma.user.update({ where: { id: target.id }, data: { tokenVersion: { increment: 1 }, lastActiveAt: null } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

adminRouter.get('/companies/:id/roles', async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      where: { companyId: req.params.id },
      orderBy: { name: 'asc' },
    })
    res.json({ data: roles })
  } catch (err) { next(err) }
})

adminRouter.post('/users', async (req, res, next) => {
  try {
    const { userName, email, firstName, lastName, password, companyId, isAdmin, roleId, phone, department, title } = req.body
    if (!userName || !email || !firstName || !lastName || !password || !companyId) {
      return res.status(400).json({ error: 'Missing required fields: userName, email, firstName, lastName, password, companyId' })
    }
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { userName }] } })
    if (existing) return res.status(409).json({ error: 'A user with this email or username already exists' })
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return res.status(404).json({ error: 'Organization not found' })
    const capacity = await checkOrganizationLimit(companyId, 'users')
    if (!capacity.allowed) return res.status(409).json({ error: `User limit reached (${capacity.used}/${capacity.limit}). Increase the organization limit before adding another user.` })
    const policyError = await validatePassword(companyId, password)
    if (policyError) return res.status(400).json({ error: policyError })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        userName, email, firstName, lastName,
        password: hashed,
        isAdmin: isAdmin || false,
        roleId: roleId || null,
        phone: phone || null,
        department: department || null,
        title: title || null,
        companyId,
      }
    })
    res.status(201).json(publicUser(user))
  } catch (err) { next(err) }
})

adminRouter.get('/logs', (req, res) => {
  const { level, q, limit } = req.query
  res.json({ data: getLogs(level as string, q as string, limit ? Number(limit) : 200) })
})

adminRouter.delete('/logs', (_req, res) => {
  clearLogs()
  res.json({ success: true })
})
