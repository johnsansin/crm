import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { getOrgSetting, setOrgSetting } from '../lib/settings'
import { writeAudit } from '../lib/audit'

export const pbxRouter = Router()

const PBX_KEY = 'pbx'
const DEFAULT_PBX = { enabled: false, webappUrl: '', outboundContext: '', outboundTrunk: '', secretKey: '', companyToken: '' }

export interface PbxConfig {
  enabled: boolean
  webappUrl: string
  outboundContext: string
  outboundTrunk: string
  secretKey: string
  companyToken: string
}

export async function getPbxConfig(companyId: string | null | undefined): Promise<PbxConfig> {
  const cfg = (await getOrgSetting(companyId, PBX_KEY, DEFAULT_PBX)) || {}
  return { ...DEFAULT_PBX, ...cfg }
}

function normalizePhone(v: any): string {
  return String(v || '').replace(/[^\d]/g, '')
}

const PHONE_LOOKUP_TARGETS = [
  {
    model: 'contact',
    fields: ['phone', 'mobile', 'homePhone', 'otherPhone', 'fax'],
    name: (r: any) => [r?.firstName, r?.lastName].filter(Boolean).join(' ') || r?.email || null,
  },
  {
    model: 'lead',
    fields: ['phone', 'mobile', 'fax'],
    name: (r: any) => [r?.firstName, r?.lastName].filter(Boolean).join(' ') || r?.company || null,
  },
  {
    model: 'account',
    fields: ['phone', 'otherPhone', 'fax'],
    name: (r: any) => r?.accountName || null,
  },
]

async function lookupCustomer(companyId: string | undefined, number: any): Promise<{ id: string; type: string; name: string | null; field: string } | null> {
  const digits = normalizePhone(number)
  if (!digits) return null
  const suffix = digits.length > 7 ? digits.slice(-7) : digits
  for (const t of PHONE_LOOKUP_TARGETS) {
    const model = (prisma as any)[t.model]
    if (!model) continue
    const where: any = { isActive: true, OR: t.fields.map((f: string) => ({ [f]: { contains: suffix } })) }
    if (companyId) where.companyId = companyId
    const rows = await model.findMany({ where, take: 100 })
    const hit = rows.find((r: any) => {
      const n = normalizePhone(r && t.fields.map((f: string) => r[f]).filter(Boolean).join(' '))
      if (!n) return false
      return n.includes(digits)
    })
    if (hit) {
      return { id: hit.id, type: t.model, name: t.name(hit), field: t.fields.find((f: string) => normalizePhone(hit[f]) && (hit[f] || '').replace(/[^\d]/g, '').includes(digits)) || t.fields[0] }
    }
  }
  return null
}

async function lookupUserByExtension(companyId: string | undefined, number: any) {
  const ext = String(number || '').trim()
  if (!ext) return null
  return prisma.user.findFirst({ where: { companyId: companyId || undefined, isActive: true, pbxExtension: ext } })
}

async function findCompanyIdByToken(token: string): Promise<string | null> {
  const rows = await prisma.orgSetting.findMany({ where: { key: PBX_KEY } })
  for (const row of rows) {
    const v = (row.value as any) || {}
    if (v.companyToken && v.companyToken === token) return row.companyId
  }
  return null
}

async function findCallBySourceUuid(companyId: string, sourceUuid: string) {
  return prisma.callLog.findFirst({ where: { companyId, sourceUuid } })
}

async function upsertOutboundRinging(opts: {
  companyId: string
  user: any
  to: string
  customer: any
  startTime: Date
  sourceUuid: string
  fromNumber: string | null
}) {
  const toDigits = normalizePhone(opts.to)
  const recent = await prisma.callLog.findMany({
    where: { companyId: opts.companyId, direction: 'outbound', status: 'Initiated', assignedTo: opts.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const existing = recent.find((r: any) => toDigits && normalizePhone(r.toNumber) === toDigits)
  const data: any = {
    sourceUuid: opts.sourceUuid,
    direction: 'outbound',
    fromNumber: opts.fromNumber || opts.user.pbxExtension || null,
    toNumber: opts.to,
    callTime: opts.startTime,
    startTime: opts.startTime,
    status: 'ringing',
    customerNumber: opts.to,
    customerType: opts.customer?.type || null,
    customerId: opts.customer?.id || null,
    relatedToModule: opts.customer?.type || null,
    relatedToId: opts.customer?.id || null,
    assignedTo: opts.user.id,
  }
  if (existing) {
    return prisma.callLog.update({ where: { id: existing.id }, data })
  }
  return prisma.callLog.create({ data: { ...data, companyId: opts.companyId, createdBy: opts.user.id } })
}

// =====================================================================
// Org PBX configuration (admin)
// =====================================================================
pbxRouter.get('/config', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const cfg = await getPbxConfig(req.user!.companyId)
    const host = req.headers.host || req.headers.origin || ''
    const origin = /^https?:\/\//.test(host) ? host : `http://${host}`
    res.json({
      data: { ...cfg, secretKey: cfg.secretKey ? '••••••••' : '', webhookUrl: `${origin}/api/pbx/webhook/${cfg.companyToken || '<company-token>'}` },
    })
  } catch (err) { next(err) }
})

pbxRouter.put('/config', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const current = await getPbxConfig(req.user!.companyId)
    const { enabled, webappUrl, outboundContext, outboundTrunk, secretKey } = req.body || {}
    const nextCfg: PbxConfig = {
      enabled: !!enabled,
      webappUrl: String(webappUrl || '').trim(),
      outboundContext: String(outboundContext || '').trim(),
      outboundTrunk: String(outboundTrunk || '').trim(),
      secretKey: secretKey && secretKey !== '••••••••' ? String(secretKey).trim() : current.secretKey,
      companyToken: current.companyToken || crypto.randomUUID(),
    }
    await setOrgSetting(req.user!.companyId, PBX_KEY, nextCfg)
    await writeAudit({ moduleName: 'settings', action: 'UPDATE', fieldName: 'pbx', newValue: JSON.stringify({ enabled: nextCfg.enabled, webappUrl: nextCfg.webappUrl }), userId: req.user!.userId, req })
    const host = req.headers.host || req.headers.origin || ''
    const origin = /^https?:\/\//.test(host) ? host : `http://${host}`
    res.json({ data: { ...nextCfg, secretKey: '••••••••', webhookUrl: `${origin}/api/pbx/webhook/${nextCfg.companyToken}` } })
  } catch (err) { next(err) }
})

pbxRouter.post('/test', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const cfg = await getPbxConfig(req.user!.companyId)
    if (!cfg.webappUrl) return res.status(400).json({ error: 'Webapp URL is not configured' })
    const base = cfg.webappUrl.replace(/\/+$/, '')
    let reachable = false
    let status = 0
    let detail = ''
    try {
      const resp = await fetch(base, { method: 'GET', signal: AbortSignal.timeout(8000) })
      status = resp.status
      reachable = true
    } catch (e: any) {
      detail = e?.message || 'unreachable'
    }
    res.json({ ok: reachable, status, detail, message: reachable ? `Server responded with HTTP ${status}` : `Connection failed: ${detail}` })
  } catch (err) { next(err) }
})

// =====================================================================
// Outgoing click-to-call (places the call via the PBX webapp)
// =====================================================================
export async function dialViaPbx(opts: {
  companyId: string | null | undefined
  fromNumber?: string | null
  toNumber: string
  userId?: string | null
}): Promise<{ dialed: boolean; message?: string }> {
  const cfg = await getPbxConfig(opts.companyId)
  if (!cfg.enabled || !cfg.webappUrl) {
    return { dialed: false, message: 'PBX not configured' }
  }
  let extension = opts.fromNumber || null
  if (!extension && opts.userId) {
    const u = await prisma.user.findUnique({ where: { id: opts.userId }, select: { pbxExtension: true } })
    extension = u?.pbxExtension || null
  }
  const serviceURL = `${cfg.webappUrl.replace(/\/+$/, '')}/makecall?event=OutgoingCall&secret=${encodeURIComponent(cfg.secretKey)}&from=${encodeURIComponent(extension || '')}&to=${encodeURIComponent(opts.toNumber)}&context=${encodeURIComponent(cfg.outboundContext || '')}`
  try {
    const resp = await fetch(serviceURL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: '', signal: AbortSignal.timeout(12000) })
    const text = await resp.text()
    const t = (text || '').trim()
    if (t === 'Error' || t === '' || t === 'null' || t === 'Authentication Failure') {
      return { dialed: false, message: t === 'Authentication Failure' ? 'Authentication Failure' : t || `PBX responded with HTTP ${resp.status}` }
    }
    return { dialed: true }
  } catch (e: any) {
    return { dialed: false, message: e?.message || 'PBX unreachable' }
  }
}

// =====================================================================
// Public webhook — called by the PBX webapp (Asterisk/VICIDial/GoAutoDial compatible)
// POST /api/pbx/webhook/:companyToken
// =====================================================================
pbxRouter.post('/webhook/:companyToken', async (req, res, next) => {
  try {
    const companyId = await findCompanyIdByToken(req.params.companyToken)
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Invalid company token' })
    }
    const cfg = await getPbxConfig(companyId)
    if (!cfg.enabled) {
      return res.status(403).json({ success: false, error: 'PBX integration disabled' })
    }
    const signature = (req.query as any).pbxsignature || req.body?.pbxsignature
    if (!cfg.secretKey || signature !== cfg.secretKey) {
      return res.status(401).json({ success: false, error: 'Invalid pbxsignature' })
    }

    const body: Record<string, any> = req.body || {}
    const event = String(body.callstatus || body.event || '')

    switch (event) {
      case 'StartApp':
      case 'ringing': {
        const sourceUuid = String(body.callUUID || body.sourceUuid || crypto.randomUUID())
        const callerNumber = body.callerIdNumber || body.from || null
        const userInfo = await lookupUserByExtension(companyId, callerNumber)
        const startTime = new Date(body.StartTime || body.startTime || Date.now())
        let direction: string
        let from: string | null
        let to: string | null
        let customer: any

        if (userInfo) {
          // Outbound — caller is an internal user extension
          direction = 'outbound'
          from = callerNumber
          to = body.to || body.callerIdNumber || body.callerId || null
          if (!to && body.callerIdName) to = body.callerIdName
          customer = await lookupCustomer(companyId, to)
          const rec = await upsertOutboundRinging({ companyId, user: userInfo, to: to || '', customer, startTime, sourceUuid, fromNumber: from })
          await writeAudit({ moduleName: 'calllogs', recordId: rec.id, action: 'CREATE', fieldName: 'pbx-webhook', newValue: 'ringing', companyId, req })
          return res.json({ success: true, direction, callId: rec.id, dial: { type: 'SIP', number: to ? `SIP/${to}${to && to.length > 5 && cfg.outboundTrunk ? '@' + cfg.outboundTrunk : ''}` : null } })
        }

        // Inbound — caller is an external customer
        direction = 'inbound'
        from = callerNumber
        to = body.to || null
        customer = await lookupCustomer(companyId, from)
        const rec = await prisma.callLog.create({
          data: {
            sourceUuid,
            direction,
            fromNumber: from,
            toNumber: to,
            callTime: startTime,
            startTime,
            status: 'ringing',
            customerNumber: from,
            customerType: customer?.type || null,
            customerId: customer?.id || null,
            relatedToModule: customer?.type || null,
            relatedToId: customer?.id || null,
            companyId,
          },
        })
        await writeAudit({ moduleName: 'calllogs', recordId: rec.id, action: 'CREATE', fieldName: 'pbx-webhook', newValue: 'ringing', companyId, req })

        const extensions = await prisma.user.findMany({
          where: { companyId, isActive: true, pbxExtension: { not: null } },
          select: { id: true, pbxExtension: true },
        })
        const ringNumbers = extensions
          .map((u) => u.pbxExtension as string)
          .filter((n) => n !== String(from))
        return res.json({ success: true, direction, callId: rec.id, ring: ringNumbers })
      }

      case 'DialAnswer':
      case 'dial': {
        const sourceUuid = String(body.callUUID || body.sourceUuid || '')
        const record = sourceUuid ? await findCallBySourceUuid(companyId, sourceUuid) : null
        if (!record) return res.json({ success: false, error: 'call not found' })
        const answeredBy = body.callerid2 || body.answeredBy || null
        const caller = body.callerid1 || body.caller || null
        const userNumber = record.direction === 'inbound' ? answeredBy : caller
        const user = userNumber ? await lookupUserByExtension(companyId, userNumber) : null
        const data: any = { status: 'in-progress' }
        if (user) data.assignedTo = user.id
        const updated = await prisma.callLog.update({ where: { id: record.id }, data })
        return res.json({ success: true, callId: updated.id, assignedTo: user?.id || null })
      }

      case 'EndCall':
      case 'end': {
        const sourceUuid = String(body.callUUID || body.sourceUuid || '')
        const record = sourceUuid ? await findCallBySourceUuid(companyId, sourceUuid) : null
        if (!record) return res.json({ success: false, error: 'call not found' })
        const data: any = {}
        if (body.starttime || body.startTime) data.startTime = new Date(body.starttime || body.startTime)
        if (body.endtime || body.endTime) data.endTime = new Date(body.endtime || body.endTime)
        if (body.duration != null) data.totalDuration = Number(body.duration) || null
        if (body.billableseconds != null) data.billDuration = Number(body.billableseconds) || null
        const updated = await prisma.callLog.update({ where: { id: record.id }, data })
        return res.json({ success: true, callId: updated.id })
      }

      case 'Hangup':
      case 'hangup': {
        const sourceUuid = String(body.callUUID || body.sourceUuid || '')
        const record = sourceUuid ? await findCallBySourceUuid(companyId, sourceUuid) : null
        if (!record) return res.json({ success: false, error: 'call not found' })
        const cause = String(body.causetxt || body.hangupCause || body.HangupCause || '')
        let status = 'completed'
        if (cause === 'User busy' || cause === 'Call Rejected' || cause === 'BUSY') status = 'busy'
        else if (cause === 'NO ANSWER' || cause === 'no-answer' || cause === 'No Answer') status = 'no-answer'
        else if (cause && cause !== 'Normal Clearing') status = cause
        const data: any = { status }
        if (body.EndTime || body.endTime) data.endTime = new Date(body.EndTime || body.endTime)
        if (body.Duration != null || body.duration != null) data.totalDuration = Number(body.Duration ?? body.duration) || null
        if (data.endTime && !record.startTime) {
          data.startTime = data.endTime
          if (!data.totalDuration) data.totalDuration = 0
        }
        const updated = await prisma.callLog.update({ where: { id: record.id }, data })
        return res.json({ success: true, callId: updated.id, status })
      }

      case 'Record':
      case 'record': {
        const sourceUuid = String(body.callUUID || body.sourceUuid || '')
        const record = sourceUuid ? await findCallBySourceUuid(companyId, sourceUuid) : null
        if (!record) return res.json({ success: false, error: 'call not found' })
        const updated = await prisma.callLog.update({ where: { id: record.id }, data: { recordingUrl: body.recordinglink || body.recordingUrl || null } })
        return res.json({ success: true, callId: updated.id })
      }

      default: {
        // Simple/fallback event: treat body as a completed call record
        if (body.direction || body.from || body.to) {
          const direction = body.direction === 'outbound' ? 'outbound' : 'inbound'
          const rec = await prisma.callLog.create({
            data: {
              sourceUuid: body.sourceUuid || body.callUUID || null,
              direction,
              fromNumber: body.from || body.fromNumber || null,
              toNumber: body.to || body.toNumber || null,
              callTime: body.callTime ? new Date(body.callTime) : new Date(),
              startTime: body.startTime ? new Date(body.startTime) : null,
              endTime: body.endTime ? new Date(body.endTime) : null,
              duration: body.duration != null ? Number(body.duration) || null : null,
              totalDuration: body.duration != null ? Number(body.duration) || null : null,
              status: body.status || (direction === 'inbound' ? 'completed' : 'Initiated'),
              notes: body.notes || null,
              relatedToModule: body.relatedToModule || null,
              relatedToId: body.relatedToId || null,
              companyId,
            },
          })
          return res.status(201).json({ success: true, callId: rec.id })
        }
        return res.status(400).json({ success: false, error: 'Unknown call event' })
      }
    }
  } catch (err) { next(err) }
})

// =====================================================================
// Outbound dial (authenticated) — convenience route used by the UI
// =====================================================================
pbxRouter.post('/dial', authMiddleware, async (req, res, next) => {
  try {
    const { toNumber, fromNumber, relatedToModule, relatedToId } = req.body || {}
    if (!toNumber) return res.status(400).json({ error: 'toNumber is required' })
    const dial = await dialViaPbx({ companyId: req.user!.companyId, fromNumber: fromNumber || null, toNumber, userId: req.user!.userId })
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { phone: true, pbxExtension: true } })
    const call = await prisma.callLog.create({
      data: {
        direction: 'outbound',
        fromNumber: fromNumber || user?.pbxExtension || user?.phone || null,
        toNumber,
        callTime: new Date(),
        status: dial.dialed ? 'Initiated' : 'Failed',
        notes: dial.dialed ? null : (dial.message || null),
        relatedToModule: relatedToModule || null,
        relatedToId: relatedToId || null,
        assignedTo: req.user!.userId,
        createdBy: req.user!.userId,
        companyId: req.user!.companyId,
      },
    })
    res.status(201).json({ data: call, telLink: `tel:${toNumber}`, dialed: dial.dialed, message: dial.message })
  } catch (err) { next(err) }
})
