import { prisma } from './prisma'
import type { Request } from 'express'

const AUDIT_NAME_FIELDS = [
  'name', 'title', 'subject', 'leadName', 'contactName', 'potentialName', 'projectName',
  'activityName', 'eventName', 'taskName', 'accountName', 'campaignName', 'productName',
  'priceBookName', 'serviceName', 'assetName', 'contractName', 'templateName', 'vendorName',
  'taxName', 'itemName', 'folderName', 'fileName', 'userName', 'emailSubject',
]

export function auditSummary(record: Record<string, any> | null | undefined): string {
  const r = record || {}
  for (const f of AUDIT_NAME_FIELDS) {
    const v = r[f]
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 200)
  }
  const first = r.firstName, last = r.lastName
  if (typeof first === 'string' && first) return [first, last].filter((x) => typeof x === 'string' && x).join(' ')
  if (r.id) return `#${String(r.id).slice(0, 8)}`
  return 'record'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RefTarget = { model: string; select: Record<string, boolean>; name: (r: any) => string | null }
const USER_TARGET: RefTarget = { model: 'user', select: { id: true, firstName: true, lastName: true, userName: true, email: true }, name: (r: any) => [r?.firstName, r?.lastName].filter(Boolean).join(' ').trim() || r?.userName || r?.email || null }
const ROLE_TARGET: RefTarget = { model: 'role', select: { id: true, name: true }, name: (r: any) => r?.name || null }

const REF_FIELDS: Record<string, RefTarget[]> = {
  assignedTo: [USER_TARGET, ROLE_TARGET],
  createdBy: [USER_TARGET, ROLE_TARGET],
  accountId: [{ model: 'account', select: { id: true, accountName: true }, name: (r: any) => r?.accountName || null }],
  contactId: [{ model: 'contact', select: { id: true, firstName: true, lastName: true, email: true }, name: (r: any) => [r?.firstName, r?.lastName].filter(Boolean).join(' ').trim() || r?.email || null }],
  leadId: [{ model: 'lead', select: { id: true, firstName: true, lastName: true, company: true }, name: (r: any) => [r?.firstName, r?.lastName].filter(Boolean).join(' ').trim() || r?.company || null }],
  potentialId: [{ model: 'potential', select: { id: true, potentialName: true }, name: (r: any) => r?.potentialName || null }],
  campaignId: [{ model: 'campaign', select: { id: true, campaignName: true }, name: (r: any) => r?.campaignName || null }],
  productId: [{ model: 'product', select: { id: true, productName: true }, name: (r: any) => r?.productName || null }],
  serviceId: [{ model: 'service', select: { id: true, serviceName: true }, name: (r: any) => r?.serviceName || null }],
  vendorId: [{ model: 'vendor', select: { id: true, vendorName: true }, name: (r: any) => r?.vendorName || null }],
  priceBookId: [{ model: 'priceBook', select: { id: true, priceBookName: true }, name: (r: any) => r?.priceBookName || null }],
  quoteId: [{ model: 'quote', select: { id: true, subject: true }, name: (r: any) => r?.subject || null }],
  salesOrderId: [{ model: 'salesOrder', select: { id: true, subject: true }, name: (r: any) => r?.subject || null }],
  purchaseOrderId: [{ model: 'purchaseOrder', select: { id: true, subject: true }, name: (r: any) => r?.subject || null }],
  invoiceId: [{ model: 'invoice', select: { id: true, subject: true }, name: (r: any) => r?.subject || null }],
  ticketId: [{ model: 'ticket', select: { id: true, title: true }, name: (r: any) => r?.title || null }],
  faqId: [{ model: 'faq', select: { id: true, title: true }, name: (r: any) => r?.title || null }],
  projectId: [{ model: 'project', select: { id: true, projectName: true }, name: (r: any) => r?.projectName || null }],
  assetId: [{ model: 'asset', select: { id: true, assetName: true }, name: (r: any) => r?.assetName || null }],
  contractId: [{ model: 'serviceContract', select: { id: true, contractName: true }, name: (r: any) => r?.contractName || null }],
  templateId: [{ model: 'emailTemplate', select: { id: true, templateName: true }, name: (r: any) => r?.templateName || null }],
}

export async function resolveAuditReferences(log: { fieldName?: string | null; oldValue?: string | null; newValue?: string | null }): Promise<{ oldValue: string | null; newValue: string | null }> {
  const targets = REF_FIELDS[log.fieldName || '']
  if (!targets) return { oldValue: log.oldValue ?? null, newValue: log.newValue ?? null }
  const oldRaw = log.oldValue == null ? null : String(log.oldValue)
  const newRaw = log.newValue == null ? null : String(log.newValue)
  const oldId = oldRaw && UUID_RE.test(oldRaw.trim()) ? oldRaw.trim() : null
  const newId = newRaw && UUID_RE.test(newRaw.trim()) ? newRaw.trim() : null
  if (!oldId && !newId) return { oldValue: log.oldValue ?? null, newValue: log.newValue ?? null }
  const ids = [...new Set<string>([oldId, newId].filter((x): x is string => !!x))]
  const nameMap = new Map<string, string>()
  for (const target of targets) {
    try {
      const rows = await (prisma as any)[target.model].findMany({ where: { id: { in: ids } }, select: target.select })
      for (const r of rows) {
        if (!nameMap.has(r.id)) {
          const n = target.name(r)
          if (n) nameMap.set(r.id, n)
        }
      }
    } catch { /* try next candidate model */ }
  }
  return {
    oldValue: oldId && nameMap.has(oldId) ? nameMap.get(oldId)! : (log.oldValue ?? null),
    newValue: newId && nameMap.has(newId) ? nameMap.get(newId)! : (log.newValue ?? null),
  }
}

export function getClientIp(req: Request): string | null {
  const raw = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || req.ip
  return raw?.replace(/^::ffff:/, '') || null
}

export async function writeAudit(params: {
  moduleName: string
  recordId?: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'BACKUP' | 'IMPORT' | 'EXPORT' | 'LOGIN_FAILED' | 'ACTIVITY' | 'EMAIL' | 'DOCUMENT' | 'COMMENT' | 'CONVERT' | 'FOLLOW' | 'LINK' | 'UNLINK' | 'MERGE'
  fieldName?: string | null
  oldValue?: string | null
  newValue?: string | null
  userId?: string | null
  companyId?: string | null
  req?: Request
}) {
  try {
    const companyId = params.companyId ?? (params.req as any)?.user?.companyId ?? null
    await prisma.auditLog.create({
      data: {
        moduleName: params.moduleName,
        recordId: params.recordId || null,
        action: params.action,
        fieldName: params.fieldName || null,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
        userId: params.userId || null,
        companyId,
        ipAddress: params.req ? getClientIp(params.req) : null,
      },
    })
  } catch {}
}

export async function writeAuditFields(params: {
  moduleName: string
  recordId: string | null
  before: Record<string, any>
  after: Record<string, any>
  userId?: string | null
  req?: Request
  skip?: Set<string>
}) {
  const skip = params.skip || new Set(['createdAt', 'updatedAt', 'id', 'lastLogin', 'updatedAt'])
  const keys = new Set([...Object.keys(params.before || {}), ...Object.keys(params.after || {})])
  for (const key of keys) {
    if (skip.has(key)) continue
    const oldVal = params.before?.[key]
    const newVal = params.after?.[key]
    if (String(oldVal ?? '') === String(newVal ?? '')) continue
    await writeAudit({
      moduleName: params.moduleName,
      recordId: params.recordId,
      action: 'UPDATE',
      fieldName: key,
      oldValue: oldVal == null ? null : auditValueString(oldVal),
      newValue: newVal == null ? null : auditValueString(newVal),
      userId: params.userId,
      req: params.req,
    })
  }
}

function auditValueString(value: any): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return String(value)
}
