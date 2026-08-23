import { prisma } from './prisma'
import { sendMail } from './mailer'
import { getModuleConfig } from '../modules/moduleSetup'

function prismaModelFor(moduleName: string): any {
  const modelName = getModuleConfig(moduleName)?.modelName || moduleName
  return (prisma as any)[modelName]
}

export const DEFAULT_ORG_SETTINGS: Record<string, any> = {
  smtp: { host: '', port: 587, secure: false, user: '', pass: '', fromEmail: '', fromName: '' },
  passwordPolicy: { minLength: 6, requireUpper: false, requireLower: false, requireNumber: false, requireSymbol: false, expiryDays: 0, preventReuse: 0 },
  loginSecurity: { maxAttempts: 5, lockMinutes: 15, twoFactorRequired: false },
  leadConfig: { enableLeadConversion: true, defaultLeadStatus: 'New', defaultLeadSource: '', createOnContact: true },
  leadConversionMapping: { account: {}, contact: {}, potential: {} },
  terms: { quote: '', salesOrder: '', invoice: '', purchaseOrder: '' },
  documentTemplate: {
    isActive: true,
    headerText: '', bodyText: '', footerText: 'Thank you for your business.',
    accentColor: '#2563eb', fontFamily: 'Arial', showLogo: true, showCompanyName: true,
  },
  language: 'en_us',
  timezone: 'Asia/Karachi',
  dateFormat: 'mm-dd-yyyy',
  hourFormat: '12h',
  defaultCurrency: 'USD',
  currencySymbol: '$',
  inventory: { enableStockTracking: true, autoNumbering: true, productImageRequired: false },
  globalVariables: {},
  calendar: { workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], workingHoursStart: '09:00', workingHoursEnd: '18:00', firstDayOfWeek: 'Sunday' },
  importExport: { maxRows: 1000 },
  pbx: { enabled: false, webappUrl: '', outboundContext: '', outboundTrunk: '', secretKey: '', companyToken: '' },
}

export async function getOrgSetting(companyId: string | null | undefined, key: string, fallback?: any): Promise<any> {
  const def = key in DEFAULT_ORG_SETTINGS ? DEFAULT_ORG_SETTINGS[key] : undefined
  if (!companyId) return fallback !== undefined ? fallback : def
  const row = await prisma.orgSetting.findUnique({
    where: { companyId_key: { companyId, key } },
  }).catch(() => null)
  if (!row) return fallback !== undefined ? fallback : def
  return row.value
}

export async function setOrgSetting(companyId: string | null | undefined, key: string, value: any): Promise<void> {
  if (!companyId) return
  await prisma.orgSetting.upsert({
    where: { companyId_key: { companyId, key } },
    update: { value },
    create: { companyId, key, value },
  })
}

export async function getAllOrgSettings(companyId: string | null | undefined): Promise<Record<string, any>> {
  const result: Record<string, any> = {}
  for (const key of Object.keys(DEFAULT_ORG_SETTINGS)) {
    result[key] = await getOrgSetting(companyId, key)
  }
  if (companyId) {
    const rows = await prisma.orgSetting.findMany({ where: { companyId } }).catch(() => [])
    for (const row of rows) {
      if (!(row.key in DEFAULT_ORG_SETTINGS)) result[row.key] = row.value
    }
  }
  return result
}

// ---- Global settings (used by superadmin, not tied to a company) ----
export async function getGlobalSetting(key: string, fallback?: any): Promise<any> {
  const def = key in DEFAULT_ORG_SETTINGS ? DEFAULT_ORG_SETTINGS[key] : undefined
  const row = await prisma.globalSetting.findUnique({ where: { key } }).catch(() => null)
  if (!row) return fallback !== undefined ? fallback : def
  return row.value
}

export async function setGlobalSetting(key: string, value: any): Promise<void> {
  await prisma.globalSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function getAllGlobalSettings(): Promise<Record<string, any>> {
  const result: Record<string, any> = {}
  for (const key of Object.keys(DEFAULT_ORG_SETTINGS)) {
    result[key] = await getGlobalSetting(key)
  }
  const rows = await prisma.globalSetting.findMany().catch(() => [])
  for (const row of rows) {
    if (!(row.key in DEFAULT_ORG_SETTINGS)) result[row.key] = row.value
  }
  return result
}

export interface PasswordPolicy {
  minLength: number
  requireUpper: boolean
  requireLower: boolean
  requireNumber: boolean
  requireSymbol: boolean
  expiryDays: number
  preventReuse: number
}

export async function validatePassword(companyId: string | null | undefined, password: string): Promise<string | null> {
  const policy = (await getOrgSetting(companyId, 'passwordPolicy')) as PasswordPolicy
  if (!policy || policy.minLength <= 0) return null
  if (!password || password.length < policy.minLength) return `Password must be at least ${policy.minLength} characters`
  if (policy.requireUpper && !/[A-Z]/.test(password)) return 'Password must contain an uppercase letter'
  if (policy.requireLower && !/[a-z]/.test(password)) return 'Password must contain a lowercase letter'
  if (policy.requireNumber && !/\d/.test(password)) return 'Password must contain a number'
  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character'
  return null
}

export function canLogin(user: { failedLoginAttempts?: number; lockedUntil?: Date | null }): { allowed: boolean; reason?: string } {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return { allowed: false, reason: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }
  }
  return { allowed: true }
}

export async function recordLoginFailure(userId: string, companyId: string | null | undefined, req?: any): Promise<void> {
  const sec = (await getOrgSetting(companyId, 'loginSecurity')) as { maxAttempts?: number; lockMinutes?: number }
  const maxAttempts = sec?.maxAttempts || 5
  const lockMinutes = sec?.lockMinutes || 15
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return
  const attempts = (user.failedLoginAttempts || 0) + 1
  const data: any = { failedLoginAttempts: attempts }
  if (attempts >= maxAttempts) {
    data.lockedUntil = new Date(Date.now() + lockMinutes * 60000)
    data.failedLoginAttempts = 0
  }
  await prisma.user.update({ where: { id: userId }, data })
  try {
    const rawIp = req?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() || req?.socket?.remoteAddress || req?.ip
    await prisma.loginLog.create({
      data: {
        userId,
        email: user.email,
        userName: user.userName,
        ipAddress: rawIp?.replace(/^::ffff:/, '') || null,
        userAgent: req?.headers?.['user-agent'] || null,
        status: 'Failed',
        companyId: user.companyId,
      }
    })
  } catch {}
}

export async function resetLoginFailures(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } })
}

// ---- Sequence numbers (used by module auto-numbering) ----
export async function nextSequenceNumber(moduleName: string, companyId?: string | null): Promise<string> {
  const key = companyId ?? null
  const fmt = (row: any) => `${row.prefix}${row.currentNo.toString().padStart(row.digitWidth, '0')}${row.suffix}`
  let row = await prisma.sequenceNumber.findFirst({ where: { moduleName, companyId: key } })
  if (!row) {
    try {
      row = await prisma.sequenceNumber.create({ data: { moduleName, companyId: key, currentNo: 1 } })
      return fmt(row)
    } catch {
      row = await prisma.sequenceNumber.findFirst({ where: { moduleName, companyId: key } })
    }
  }
  if (!row) throw new Error('Could not create sequence for ' + moduleName)
  const updated = await prisma.sequenceNumber.update({
    where: { id: row.id },
    data: { currentNo: { increment: 1 } },
  })
  return fmt(updated)
}

export function evaluateConditions(conditions: any, record: any): boolean {
  if (!conditions || typeof conditions !== 'object') return true
  const list = Array.isArray(conditions) ? conditions : conditions.rules || []
  if (list.length === 0) return true
  const match = (cond: any) => {
    if (!cond?.field) return true
    const val = record?.[cond.field]
    switch (cond.op) {
      case 'eq': return String(val ?? '') === String(cond.value ?? '')
      case 'neq': return String(val ?? '') !== String(cond.value ?? '')
      case 'contains': return String(val ?? '').toLowerCase().includes(String(cond.value ?? '').toLowerCase())
      case 'starts_with': return String(val ?? '').toLowerCase().startsWith(String(cond.value ?? '').toLowerCase())
      case 'gt': return Number(val) > Number(cond.value)
      case 'lt': return Number(val) < Number(cond.value)
      case 'is_empty': return val == null || val === ''
      case 'is_not_empty': return val != null && val !== ''
      default: return true
    }
  }
  const logic = conditions.logic || 'all'
  const results = list.map(match)
  return logic === 'any' ? results.some(Boolean) : results.every(Boolean)
}

export async function runWorkflows(opts: {
  companyId: string | null | undefined
  moduleName: string
  triggerType: string
  record: any
  prevRecord?: any
  req?: any
}): Promise<void> {
  const { companyId, moduleName, triggerType, record, prevRecord, req } = opts
  if (!companyId) return

  const shouldTrigger = (wf: any, trigger: string, rec: any, prev: any): boolean => {
    if (wf.triggerType !== trigger) return false
    switch (trigger) {
      case 'onAssign':
        return prev && rec?.assignedTo !== prev.assignedTo
      case 'onStageChange':
        return prev && (rec?.stage !== prev.stage || rec?.status !== prev.status)
      case 'onConditionMet':
        return !prev || evaluateConditions(wf.conditions, rec)
      default:
        return true
    }
  }

  const workflows = await prisma.workflow.findMany({
    where: { companyId, moduleName, isActive: true },
  }).catch(() => [] as any[])

  for (const wf of workflows) {
    if (!shouldTrigger(wf, triggerType, record, prevRecord)) continue
    const startTime = Date.now()
    let conditionsMet = false
    let actionsExecuted = 0
    let error: string | null = null
    try {
      if (!evaluateConditions(wf.conditions, record)) {
        conditionsMet = false
        continue
      }
      conditionsMet = true
      const actions: any[] = (wf.actions as any[]) || []
      for (const action of actions) {
        await executeWorkflowAction(action, { companyId, moduleName, record, prevRecord, req })
        actionsExecuted++
      }
    } catch (err: any) {
      error = err?.message || String(err)
      console.error('[WORKFLOW] error running', wf.name, err)
    } finally {
      const duration = Date.now() - startTime
      prisma.workflowLog.create({
        data: {
          workflowId: wf.id,
          workflowName: wf.name,
          moduleName,
          recordId: record?.id || null,
          triggerType,
          conditionsMet,
          actionsExecuted,
          error,
          duration,
          companyId,
        },
      }).catch(() => {})

      prisma.workflow.update({
        where: { id: wf.id },
        data: {
          runCount: { increment: 1 },
          lastRunAt: new Date(),
          lastError: error || undefined,
        },
      }).catch(() => {})
    }
  }
}

async function executeWorkflowAction(action: any, ctx: { companyId: string; moduleName: string; record: any; prevRecord?: any; req?: any }): Promise<void> {
  const prismaModel = prismaModelFor(ctx.moduleName)
  const tpl = (s: string) => (s || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => ctx.record?.[f] ?? '')
  const resolveVal = (v: any) => typeof v === 'string' && v.startsWith('$') ? ctx.record[v.slice(1)] : v

  switch (action.type) {
    case 'updateField': {
      if (!action.field) break
      const val = resolveVal(action.value)
      if (prismaModel && ctx.record?.id) {
        await prismaModel.update({ where: { id: ctx.record.id }, data: { [action.field]: val } }).catch(() => {})
      }
      break
    }
    case 'createRecord': {
      const target = action.module ? prismaModelFor(action.module) : prismaModel
      if (target) {
        const data: any = { ...(action.data || {}) }
        if (ctx.companyId) data.companyId = ctx.companyId
        data.assignedTo = data.assignedTo || ctx.req?.user?.userId || ctx.record?.assignedTo
        await target.create({ data }).catch(() => {})
      }
      break
    }
    case 'sendEmail': {
      const to = resolveVal(action.to)
      if (to) {
        await sendMail({ to, subject: tpl(action.subject || ''), html: tpl(action.body || ''), companyId: ctx.companyId })
      }
      break
    }
    case 'createNotification': {
      const users = await prisma.user.findMany({ where: { companyId: ctx.companyId, isActive: true } })
      const targetUserId = action.userId && action.userId.startsWith('$') ? ctx.record[action.userId.slice(1)] : action.userId
      const targets = targetUserId ? users.filter(u => u.id === targetUserId) : users
      const title = tpl(action.title || 'Workflow notification')
      const message = tpl(action.message || '')
      for (const u of targets) {
        await prisma.notification.create({ data: { userId: u.id, title, message, companyId: ctx.companyId } }).catch(() => {})
      }
      break
    }
    case 'updateRelatedField': {
      if (!action.relatedModule || !action.relatedIdField || !action.field) break
      const relatedModel = prismaModelFor(action.relatedModule)
      const relatedId = resolveVal(action.relatedIdField)
      if (relatedModel && relatedId) {
        const val = resolveVal(action.value)
        await relatedModel.update({ where: { id: relatedId }, data: { [action.field]: val } }).catch(() => {})
      }
      break
    }
    case 'sendNotification': {
      const targetUserId = action.userId && action.userId.startsWith('$') ? ctx.record[action.userId.slice(1)] : action.userId
      const targetUserIds: string[] = action.userIds || (targetUserId ? [targetUserId] : [])
      if (action.role) {
        const roleUsers = await prisma.user.findMany({ where: { roleId: action.role, isActive: true }, select: { id: true } })
        targetUserIds.push(...roleUsers.map(u => u.id))
      }
      const title = tpl(action.title || 'Notification')
      const message = tpl(action.message || '')
      const link = action.link ? tpl(action.link) : null
      for (const uid of [...new Set(targetUserIds)]) {
        await prisma.notification.create({ data: { userId: uid, title, message, link, companyId: ctx.companyId } }).catch(() => {})
      }
      break
    }
    case 'createActivity': {
      const subject = tpl(action.subject || 'Follow-up')
      const description = tpl(action.description || '')
      const assignedTo = resolveVal(action.assignedTo) || ctx.record?.assignedTo || ctx.req?.user?.userId
      const dueAt = action.dueInMinutes ? new Date(Date.now() + Number(action.dueInMinutes) * 60000) : action.dueAt ? new Date(action.dueAt) : null
      await prisma.activity.create({
        data: {
          subject: subject.slice(0, 255),
          description: description || null,
          activityType: action.activityType || 'Task',
          status: 'Planned',
          priority: action.priority || 'Normal',
          dueAt,
          parentModule: ctx.moduleName,
          parentId: ctx.record?.id || null,
          assignedTo,
          createdBy: ctx.req?.user?.userId || null,
          companyId: ctx.companyId,
        },
      }).catch(() => {})
      break
    }
    case 'webhook': {
      const url = tpl(action.url || '')
      if (!url) break
      const payload = {
        moduleName: ctx.moduleName,
        record: ctx.record,
        triggerType: action.triggerType || 'workflow',
        timestamp: new Date().toISOString(),
        ...(action.payload || {}),
      }
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(action.headers || {}) },
        body: JSON.stringify(payload),
      }).catch(() => {})
      break
    }
    case 'changeOwner': {
      const newOwner = resolveVal(action.assignedTo) || action.assignedTo
      if (prismaModel && ctx.record?.id && newOwner) {
        await prismaModel.update({ where: { id: ctx.record.id }, data: { assignedTo: newOwner } }).catch(() => {})
      }
      break
    }
    default:
      break
  }
}

export async function runScheduledTaskActions(task: { id: string; moduleName?: string | null; actions: any; companyId?: string | null }): Promise<void> {
  const actions: any[] = (task.actions as any[]) || []
  for (const action of actions) {
    switch (action.type) {
      case 'updateModuleRecords': {
        if (!task.moduleName) break
        const prismaModel = prismaModelFor(task.moduleName)
        if (!prismaModel) break
        const where: any = { isActive: true }
        if (task.companyId) where.companyId = task.companyId
        if (action.whereField) where[action.whereField] = action.whereValue
        await prismaModel.updateMany({ where, data: { [action.field]: action.value } }).catch(() => {})
        break
      }
      case 'sendEmail': {
        const users = await prisma.user.findMany({ where: { companyId: task.companyId || undefined, isActive: true } })
        const to = action.to || users.map(u => u.email)
        await sendMail({ to, subject: action.subject || 'Scheduled email', html: action.body || '', companyId: task.companyId })
        break
      }
      case 'createNotifications': {
        const users = await prisma.user.findMany({ where: { companyId: task.companyId || undefined, isActive: true } })
        for (const u of users) {
          await prisma.notification.create({ data: { userId: u.id, title: action.title || 'Scheduled task', message: action.message || '', companyId: task.companyId || undefined } }).catch(() => {})
        }
        break
      }
      default:
        break
    }
  }
}
