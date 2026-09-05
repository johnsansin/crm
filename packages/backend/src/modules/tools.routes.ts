import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { writeAudit } from '../lib/audit'
import path from 'path'
import fs from 'fs'

export const scorecardsRouter = Router()
export const reportSchedulesRouter = Router()
export const relatedListsRouter = Router()
export const adminDataRouter = Router()

scorecardsRouter.use(authMiddleware)
reportSchedulesRouter.use(authMiddleware)
relatedListsRouter.use(authMiddleware)
adminDataRouter.use(authMiddleware)

// ---- Scorecards ----
const SCORE_MODULES = ['leads', 'potentials', 'accounts', 'contacts', 'tickets', 'products', 'projects', 'campaigns', 'invoices']
const SCORE_PERIODS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
const SCORE_STATUSES = ['On Track', 'At Risk', 'Off Track', 'Completed']

async function canWrite(req: any): Promise<boolean> {
  return !!(req.user?.isAdmin || req.user?.isSuperAdmin)
}

scorecardsRouter.get('/', async (req, res, next) => {
  try {
    const data = await prisma.scorecard.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: { updatedAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

scorecardsRouter.post('/', async (req, res, next) => {
  try {
    if (!(await canWrite(req))) return res.status(403).json({ error: 'Admin or manager permission required' })
    const { name, moduleName, metrics, period, target, actual, status } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name is required' })
    const data = await prisma.scorecard.create({
      data: {
        name: String(name).slice(0, 200),
        moduleName: SCORE_MODULES.includes(moduleName) ? moduleName : 'potentials',
        metrics: Array.isArray(metrics) ? metrics : [],
        period: SCORE_PERIODS.includes(period) ? period : 'Monthly',
        target: target != null ? Number(target) : undefined,
        actual: actual != null ? Number(actual) : undefined,
        status: SCORE_STATUSES.includes(status) ? status : 'On Track',
        companyId: req.user!.companyId || undefined,
        createdBy: req.user!.userId,
      },
    })
    await writeAudit({ moduleName: 'scorecards', action: 'CREATE', recordId: data.id, newValue: JSON.stringify({ name }), userId: req.user!.userId, req })
    res.status(201).json({ data })
  } catch (err) { next(err) }
})

scorecardsRouter.put('/:id', async (req, res, next) => {
  try {
    if (!(await canWrite(req))) return res.status(403).json({ error: 'Admin or manager permission required' })
    const existing = await prisma.scorecard.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Scorecard not found' })
    const { name, moduleName, metrics, period, target, actual, status } = req.body || {}
    const data = await prisma.scorecard.update({
      where: { id: existing.id },
      data: {
        name: name != null ? String(name).slice(0, 200) : undefined,
        moduleName: moduleName != null ? (SCORE_MODULES.includes(moduleName) ? moduleName : existing.moduleName) : undefined,
        metrics: metrics != null ? (Array.isArray(metrics) ? metrics : []) : undefined,
        period: period != null ? (SCORE_PERIODS.includes(period) ? period : existing.period) : undefined,
        target: target != null ? Number(target) : undefined,
        actual: actual != null ? Number(actual) : undefined,
        status: status != null ? (SCORE_STATUSES.includes(status) ? status : existing.status) : undefined,
      },
    })
    await writeAudit({ moduleName: 'scorecards', action: 'UPDATE', recordId: data.id, newValue: JSON.stringify(data), userId: req.user!.userId, req })
    res.json({ data })
  } catch (err) { next(err) }
})

scorecardsRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!(await canWrite(req))) return res.status(403).json({ error: 'Admin or manager permission required' })
    const existing = await prisma.scorecard.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Scorecard not found' })
    await prisma.scorecard.delete({ where: { id: existing.id } })
    await writeAudit({ moduleName: 'scorecards', action: 'DELETE', recordId: existing.id, userId: req.user!.userId, req })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- Report Schedules ----
reportSchedulesRouter.get('/', async (req, res, next) => {
  try {
    const data = await prisma.reportSchedule.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: { updatedAt: 'desc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

reportSchedulesRouter.post('/', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'Organization required' })
    const { reportName, moduleName, reportType, frequency, recipients, isActive } = req.body || {}
    if (!reportName) return res.status(400).json({ error: 'reportName is required' })
    let recs: string[] = []
    if (Array.isArray(recipients)) recs = recipients.filter(r => typeof r === 'string').map(r => r.trim()).filter(Boolean)
    const data = await prisma.reportSchedule.create({
      data: {
        reportName: String(reportName).slice(0, 200),
        moduleName: String(moduleName || '').slice(0, 100),
        reportType: String(reportType || 'tabular').slice(0, 50),
        frequency: String(frequency || 'weekly').slice(0, 50),
        recipients: recs,
        isActive: isActive !== false,
        companyId,
        createdBy: req.user!.userId,
      },
    })
    await writeAudit({ moduleName: 'reports', action: 'CREATE', recordId: data.id, newValue: JSON.stringify({ reportName, frequency }), userId: req.user!.userId, req })
    res.status(201).json({ data })
  } catch (err) { next(err) }
})

reportSchedulesRouter.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.reportSchedule.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Schedule not found' })
    const { reportName, moduleName, reportType, frequency, recipients, isActive } = req.body || {}
    let recs: string[] | undefined
    if (recipients != null) {
      recs = Array.isArray(recipients) ? recipients.filter(r => typeof r === 'string').map(r => r.trim()).filter(Boolean) : []
    }
    const data = await prisma.reportSchedule.update({
      where: { id: existing.id },
      data: {
        reportName: reportName != null ? String(reportName).slice(0, 200) : undefined,
        moduleName: moduleName != null ? String(moduleName).slice(0, 100) : undefined,
        reportType: reportType != null ? String(reportType).slice(0, 50) : undefined,
        frequency: frequency != null ? String(frequency).slice(0, 50) : undefined,
        recipients: recs,
        isActive: isActive != null ? !!isActive : undefined,
      },
    })
    await writeAudit({ moduleName: 'reports', action: 'UPDATE', recordId: data.id, newValue: JSON.stringify(data), userId: req.user!.userId, req })
    res.json({ data })
  } catch (err) { next(err) }
})

reportSchedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.reportSchedule.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Schedule not found' })
    await prisma.reportSchedule.delete({ where: { id: existing.id } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- Related Lists (admin config) ----
relatedListsRouter.get('/', async (req, res, next) => {
  try {
    const data = await prisma.relatedList.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: [{ moduleName: 'asc' }, { sequence: 'asc' }] })
    res.json({ data })
  } catch (err) { next(err) }
})

relatedListsRouter.post('/', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'Organization required' })
    const { moduleName, relatedModule, label, sequence, isActive } = req.body || {}
    if (!moduleName || !relatedModule || !label) return res.status(400).json({ error: 'moduleName, relatedModule and label are required' })
    const data = await prisma.relatedList.create({
      data: {
        moduleName: String(moduleName).slice(0, 100),
        relatedModule: String(relatedModule).slice(0, 100),
        label: String(label).slice(0, 200),
        sequence: Number(sequence || 0),
        isActive: isActive !== false,
        companyId,
      },
    }).catch(async () => {
      const existing = await prisma.relatedList.findFirst({ where: { companyId, moduleName, relatedModule } })
      if (existing) {
        return prisma.relatedList.update({ where: { id: existing.id }, data: { label, isActive: isActive !== false, sequence: Number(sequence || 0) } })
      }
      throw new Error('Related list already exists')
    })
    res.status(201).json({ data })
  } catch (err) { next(err) }
})

relatedListsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.relatedList.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Related list not found' })
    await prisma.relatedList.delete({ where: { id: existing.id } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ---- User Profiles (read-only listing) ----
adminDataRouter.get('/user-profiles', async (req, res, next) => {
  try {
    const data = await prisma.userProfile.findMany({
      where: { user: { companyId: req.user!.companyId || undefined } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

// ---- Attachments (org-scoped list + delete) ----
adminDataRouter.get('/attachments', async (req, res, next) => {
  try {
    const data = await prisma.attachment.findMany({ where: { companyId: req.user!.companyId || undefined }, orderBy: { createdAt: 'desc' }, take: 300 })
    res.json({ data })
  } catch (err) { next(err) }
})

adminDataRouter.delete('/attachments/:id', async (req, res, next) => {
  try {
    const existing = await prisma.attachment.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Attachment not found' })
    await prisma.attachment.delete({ where: { id: existing.id } })
    if (existing.filePath && !/^https?:\/\//i.test(existing.filePath)) {
      try {
        const abs = path.isAbsolute(existing.filePath) ? existing.filePath : path.resolve(process.cwd(), existing.filePath)
        if (abs.startsWith(path.resolve(process.cwd(), 'uploads'))) await fs.promises.unlink(abs)
      } catch { /* file already gone */ }
    }
    res.json({ ok: true })
  } catch (err) { next(err) }
})