import { prisma } from './prisma'
import type { Request } from 'express'

export function getClientIp(req: Request): string | null {
  const raw = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || req.ip
  return raw?.replace(/^::ffff:/, '') || null
}

export async function writeAudit(params: {
  moduleName: string
  recordId?: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'BACKUP' | 'IMPORT' | 'EXPORT' | 'LOGIN_FAILED' | 'ACTIVITY' | 'EMAIL' | 'DOCUMENT' | 'COMMENT' | 'CONVERT' | 'FOLLOW' | 'LINK' | 'UNLINK'
  fieldName?: string | null
  oldValue?: string | null
  newValue?: string | null
  userId?: string | null
  req?: Request
}) {
  try {
    await prisma.auditLog.create({
      data: {
        moduleName: params.moduleName,
        recordId: params.recordId || null,
        action: params.action,
        fieldName: params.fieldName || null,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
        userId: params.userId || null,
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
      oldValue: oldVal == null ? null : String(oldVal),
      newValue: newVal == null ? null : String(newVal),
      userId: params.userId,
      req: params.req,
    })
  }
}
