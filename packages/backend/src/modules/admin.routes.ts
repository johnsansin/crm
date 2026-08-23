import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { getAllGlobalSettings, getGlobalSetting, setGlobalSetting, validatePassword } from '../lib/settings'
import bcrypt from 'bcryptjs'
import { publicUser } from '../lib/public-user'
import fs from 'fs'
import { createDatabaseBackup, emailDatabaseBackup, getDatabaseBackupConfig, listDatabaseBackups, resolveBackupFile, saveDatabaseBackupConfig } from '../lib/database-backup'

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
    if (settings.smtp) settings.smtp = { ...settings.smtp, pass: '', configured: !!(settings.smtp.host && settings.smtp.fromEmail && settings.smtp.pass) }
    res.json(settings)
  } catch (err) { next(err) }
})

adminRouter.put('/settings', async (req, res, next) => {
  try {
    const body = req.body
    const keys = body && body.settings ? body.settings : body
    for (const key of Object.keys(keys || {})) {
      if (key === 'smtp' && !keys[key]?.pass) {
        const current = await getGlobalSetting('smtp', {})
        keys[key] = { ...current, ...keys[key], pass: current?.pass || '' }
      }
      await setGlobalSetting(key, keys[key])
    }
    const settings = await getAllGlobalSettings()
    if (settings.smtp) settings.smtp = { ...settings.smtp, pass: '', configured: !!(settings.smtp.host && settings.smtp.fromEmail && settings.smtp.pass) }
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
    res.json({ backup, message: 'Database backup completed successfully' })
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
      include: { _count: { select: { users: true } } },
    })
    res.json({ data: companies })
  } catch (err) { next(err) }
})

adminRouter.get('/companies', async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
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
        users: {
          select: { id: true, userName: true, email: true, firstName: true, lastName: true, isAdmin: true, isActive: true, lastLogin: true, createdAt: true }
        }
      }
    })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    res.json(company)
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
