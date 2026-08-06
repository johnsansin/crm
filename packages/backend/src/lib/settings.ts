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
  terms: { quote: '', salesOrder: '', invoice: '' },
  language: 'en_us',
  timezone: 'Asia/Karachi',
  dateFormat: 'mm-dd-yyyy',
  inventory: { enableStockTracking: true, autoNumbering: true, productImageRequired: false },
  globalVariables: {},
  calendar: { workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], workingHoursStart: '09:00', workingHoursEnd: '18:00', firstDayOfWeek: 'Sunday' },
  importExport: { maxRows: 1000 },
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
      }
    })
  } catch {}
}

export async function resetLoginFailures(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { failedLoginAttempts: 0, lockedUntil: null } })
}

// ---- Sequence numbers (used by module auto-numbering) ----
export async function nextSequenceNumber(moduleName: string): Promise<string> {
  const row = await prisma.sequenceNumber.upsert({
    where: { moduleName },
    update: { currentNo: { increment: 1 } },
    create: { moduleName, currentNo: 1 },
  })
  const num = row.currentNo.toString().padStart(row.digitWidth, '0')
  return `${row.prefix}${num}${row.suffix}`
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
  const workflows = await prisma.workflow.findMany({
    where: { companyId, moduleName, triggerType, isActive: true },
  }).catch(() => [])
  for (const wf of workflows) {
    try {
      if (!evaluateConditions(wf.conditions, record)) continue
      const actions: any[] = (wf.actions as any[]) || []
      for (const action of actions) {
        await executeWorkflowAction(action, { companyId, moduleName, record, prevRecord, req })
      }
    } catch (err) {
      console.error('[WORKFLOW] error running', wf.name, err)
    }
  }
}

async function executeWorkflowAction(action: any, ctx: { companyId: string; moduleName: string; record: any; prevRecord?: any; req?: any }): Promise<void> {
  const prismaModel = prismaModelFor(ctx.moduleName)
  switch (action.type) {
    case 'updateField': {
      if (!action.field) break
      const val = typeof action.value === 'string' && action.value.startsWith('$') ? ctx.record[action.value.slice(1)] : action.value
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
      const to = action.to && action.to.startsWith('$') ? ctx.record[action.to.slice(1)] : action.to
      if (to) {
        const subject = (action.subject || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => ctx.record?.[f] ?? '')
        const body = (action.body || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => ctx.record?.[f] ?? '')
        await sendMail({ to, subject, html: body, companyId: ctx.companyId })
      }
      break
    }
    case 'createNotification': {
      const users = await prisma.user.findMany({ where: { companyId: ctx.companyId, isActive: true } })
      const targetUserId = action.userId && action.userId.startsWith('$') ? ctx.record[action.userId.slice(1)] : action.userId
      const targets = targetUserId ? users.filter(u => u.id === targetUserId) : users
      const title = (action.title || 'Workflow notification').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => ctx.record?.[f] ?? '')
      const message = (action.message || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_: string, f: string) => ctx.record?.[f] ?? '')
      for (const u of targets) {
        await prisma.notification.create({ data: { userId: u.id, title, message } }).catch(() => {})
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
          await prisma.notification.create({ data: { userId: u.id, title: action.title || 'Scheduled task', message: action.message || '' } }).catch(() => {})
        }
        break
      }
      default:
        break
    }
  }
}
