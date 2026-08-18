import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const webhooksRouter = Router()
webhooksRouter.use(authMiddleware)

webhooksRouter.get('/', async (req, res, next) => {
  try {
    const data = await prisma.webhookEndpoint.findMany({
      where: { companyId: req.user!.companyId || undefined },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data })
  } catch (err) { next(err) }
})

webhooksRouter.post('/', async (req, res, next) => {
  try {
    const { name, url, secret, events, headers, isActive } = req.body || {}
    if (!name || !url) return res.status(400).json({ error: 'name and url are required' })
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name, url, secret: secret || crypto.randomBytes(32).toString('hex'),
        events: events || [], headers: headers || {},
        isActive: isActive !== false,
        companyId: req.user!.companyId || null, createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: endpoint })
  } catch (err) { next(err) }
})

webhooksRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Endpoint not found' })
    const data: any = {}
    for (const key of ['name', 'url', 'secret', 'isActive']) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.events !== undefined) data.events = req.body.events
    if (req.body.headers !== undefined) data.headers = req.body.headers
    const endpoint = await prisma.webhookEndpoint.update({ where: { id }, data })
    res.json({ data: endpoint })
  } catch (err) { next(err) }
})

webhooksRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!existing) return res.status(404).json({ error: 'Endpoint not found' })
    await prisma.webhookEndpoint.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

webhooksRouter.post('/:id/test', async (req, res, next) => {
  try {
    const { id } = req.params
    const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' })
    const payload = { event: 'webhook.test', timestamp: new Date().toISOString(), data: { message: 'Test webhook delivery' } }
    const start = Date.now()
    let responseStatus = 0
    let responseBody = ''
    let success = false
    let error: string | null = null
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(endpoint.headers as Record<string, string> || {}) }
      if (endpoint.secret) {
        const signature = crypto.createHmac('sha256', endpoint.secret).update(JSON.stringify(payload)).digest('hex')
        headers['X-Webhook-Signature'] = signature
      }
      const resp = await fetch(endpoint.url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })
      responseStatus = resp.status
      responseBody = await resp.text().catch(() => '')
      success = resp.ok
    } catch (e: any) {
      error = e.message || String(e)
    }
    const duration = Date.now() - start
    await prisma.webhookLog.create({
      data: {
        endpointId: id, event: 'webhook.test', payload: payload as any,
        responseStatus, responseBody: responseBody?.substring(0, 5000), duration, success, error,
        companyId: req.user!.companyId || null,
      },
    })
    await prisma.webhookEndpoint.update({ where: { id }, data: { lastTriggeredAt: new Date(), ...(success ? {} : { failureCount: { increment: 1 } }) } })
    res.json({ success, responseStatus, duration, error })
  } catch (err) { next(err) }
})

webhooksRouter.get('/:id/logs', async (req, res, next) => {
  try {
    const { id } = req.params
    const endpoint = await prisma.webhookEndpoint.findFirst({ where: { id, companyId: req.user!.companyId || undefined } })
    if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' })
    const data = await prisma.webhookLog.findMany({
      where: { endpointId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

// ---- Trigger helper (exported for use by other modules) ----
export async function triggerWebhooks(companyId: string | null, event: string, payload: any) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { companyId: companyId || undefined, isActive: true },
    })
    for (const ep of endpoints) {
      const events = (ep.events as string[]) || []
      if (events.length > 0 && !events.includes(event)) continue
      const body = { event, timestamp: new Date().toISOString(), data: payload }
      const start = Date.now()
      let responseStatus = 0
      let responseBody = ''
      let success = false
      let error: string | null = null
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(ep.headers as Record<string, string> || {}) }
        if (ep.secret) {
          const signature = crypto.createHmac('sha256', ep.secret).update(JSON.stringify(body)).digest('hex')
          headers['X-Webhook-Signature'] = signature
        }
        const resp = await fetch(ep.url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) })
        responseStatus = resp.status
        responseBody = await resp.text().catch(() => '')
        success = resp.ok
      } catch (e: any) {
        error = e.message || String(e)
      }
      const duration = Date.now() - start
      await prisma.webhookLog.create({
        data: {
          endpointId: ep.id, event, payload: body as any,
          responseStatus, responseBody: responseBody?.substring(0, 5000), duration, success, error,
          companyId,
        },
      })
      await prisma.webhookEndpoint.update({
        where: { id: ep.id },
        data: { lastTriggeredAt: new Date(), ...(success ? {} : { failureCount: { increment: 1 } }) },
      })
    }
  } catch (err) {
    console.error('[WEBHOOK] triggerWebhooks error', err)
  }
}

// ---- Incoming webhook (public) ----
export const incomingWebhookRouter = Router()
incomingWebhookRouter.post('/incoming/:token', async (req, res, next) => {
  try {
    const { token } = req.params
    const endpoint = await prisma.webhookEndpoint.findFirst({ where: { secret: token, isActive: true } })
    if (!endpoint) return res.status(404).json({ error: 'Webhook endpoint not found' })
    const payload = req.body
    await prisma.webhookLog.create({
      data: {
        endpointId: endpoint.id, event: 'incoming', payload: payload || {},
        responseStatus: 200, success: true, companyId: endpoint.companyId,
      },
    })
    await prisma.webhookEndpoint.update({ where: { id: endpoint.id }, data: { lastTriggeredAt: new Date() } })
    res.json({ success: true })
  } catch (err) { next(err) }
})
