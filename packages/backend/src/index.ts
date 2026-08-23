import './loadEnv'
import dns from 'node:dns'
import net from 'node:net'
// Prefer IPv4 and disable happy-eyeballs: on hosts without a working IPv6 route,
// Node 20's autoSelectFamily can abort otherwise-good IPv4 connects (observed as
// "connect ETIMEDOUT ... ; connect ENETUNREACH ..." to imap.gmail.com:993).
try {
  dns.setDefaultResultOrder('ipv4first')
  ;(net as any).setDefaultAutoSelectFamily?.(false)
} catch { /* older runtime */ }
import express from 'express'
import http from 'node:http'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import path from 'path'
import { authRouter } from './auth/auth.routes'
import { entityRouter } from './modules/entity.routes'
import { userRouter } from './modules/users.routes'
import { companyRouter } from './modules/company.routes'
import { rbacRouter } from './modules/rbac.routes'
import { uploadRouter } from './modules/upload.routes'
import { adminRouter } from './modules/admin.routes'
import { agentsRouter } from './modules/agents.routes'
import { settingsRouter } from './modules/settings.routes'
import { webformRouter } from './modules/webform.routes'
import { quotationsRouter } from './modules/quotations.routes'
import { salesOrdersRouter } from './modules/salesorders.routes'
import { invoicesRouter } from './modules/invoices.routes'
import { purchaseOrdersRouter } from './modules/purchaseorders.routes'
import { calendarRouter } from './modules/calendar.routes'
import { recordRouter } from './modules/record.routes'
import { leadRouter } from './modules/lead.routes'
import { extrasRouter } from './modules/extras.routes'
import { pbxRouter } from './modules/pbx.routes'
import { presenceRouter } from './modules/presence.routes'
import { chatRouter } from './modules/chat.routes'
import { dashboardRouter } from './modules/dashboard.routes'
import { reportEnhancedRouter } from './modules/report-enhanced.routes'
import { emailCampaignsRouter } from './modules/email-campaigns.routes'
import { smsRouter } from './modules/sms.routes'
import { chatWidgetRouter, chatWidgetAdminRouter } from './modules/chat-widget.routes'
import { landingPagesRouter } from './modules/landing-pages.routes'
import { socialRouter } from './modules/social.routes'
import { webhooksRouter, incomingWebhookRouter } from './modules/webhooks.routes'
import { i18nRouter } from './modules/i18n.routes'
import { portalRouter } from './modules/portal.routes'
import { aiRouter } from './modules/ai.routes'
import { supportRouter, adminSupportRouter } from './modules/support.routes'
import { errorHandler } from './middleware/errorHandler'
import { setupModules, getModuleConfig } from './modules/moduleSetup'
import { startCron } from './lib/cron'
import { prisma } from './lib/prisma'
import { PERMISSION_MODULES } from './lib/module-permissions'
import { setupSupportWebSocket } from './lib/support-websocket'
import { authMiddleware } from './middleware/auth'

const app = express()
// Nginx is the single trusted reverse proxy. This keeps rate limiting keyed to
// the real client address without trusting arbitrary forwarded-hop chains.
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3000
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production'

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
app.use(cors({ origin: isProduction ? corsOrigins : true }))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }))
// Authentication traffic can originate from many users behind the same office/NAT
// address. Scope login protection by client + account instead of blocking the
// entire organisation after twenty combined auth requests.
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: req => `${ipKeyGenerator(req.ip || '')}:${String(req.body?.email || req.body?.challenge || 'unknown').trim().toLowerCase()}`,
  handler: (_req, res) => res.status(429).json({ error: 'Too many unsuccessful sign-in attempts for this account. Please wait a few minutes and try again.' }),
}))
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many unsuccessful authentication requests. Please wait a few minutes and try again.' }),
}))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {}
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email and message are required' })
    return
  }
  // Avoid writing customer messages and email addresses to process logs.
  console.info('[CONTACT] message received', { hasSubject: Boolean(subject), receivedAt: new Date().toISOString() })
  res.status(200).json({ ok: true })
})

app.use('/api/auth', authRouter)
// Support agents are platform staff, not CRM tenant users. Even if an agent was
// accidentally linked to a company, their token is restricted to support-only APIs.
app.use('/api', (req, res, next) => {
  if (!req.headers.authorization) return next()
  authMiddleware(req, res, () => {
    if (!req.user?.isAgent || req.user.isSuperAdmin) return next()
    const allowed = ['/support', '/admin/support', '/presence', '/settings/notifications']
    if (allowed.some(prefix => req.path === prefix || req.path.startsWith(`${prefix}/`))) return next()
    return res.status(403).json({ error: 'Support agents can only access the Support Workspace' })
  })
})
app.use('/api', extrasRouter)
app.use('/api/pbx', pbxRouter)
app.use('/api/users', userRouter)
app.use('/api/company', companyRouter)
app.use('/api', rbacRouter)
app.use('/api', uploadRouter)
app.use('/api/admin', adminRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/webforms', webformRouter)
app.use('/api/quotations', quotationsRouter)
app.use('/api/salesorders', salesOrdersRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/purchaseorders', purchaseOrdersRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/records', recordRouter)
app.use('/api/leads', leadRouter)
app.use('/api/presence', presenceRouter)
app.use('/api/chat', chatRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportEnhancedRouter)
app.use('/api/email-campaigns', emailCampaignsRouter)
app.use('/api/sms', smsRouter)
app.use('/api/chat-widget', chatWidgetRouter)
app.use('/api/chat-widget', chatWidgetAdminRouter)
app.use('/api/landing-pages', landingPagesRouter)
app.use('/api/social', socialRouter)
app.use('/api/webhooks', webhooksRouter)
app.use('/api/webhooks', incomingWebhookRouter)
app.use('/api/i18n', i18nRouter)
app.use('/api/portal', portalRouter)
app.use('/api/ai', aiRouter)
app.use('/api/support', supportRouter)
app.use('/api/admin/support', adminSupportRouter)
// Legacy backup files may exist under uploads/backups. Never expose database dumps publicly.
app.use('/uploads/backups', (_req, res) => res.status(404).json({ error: 'Not found' }))
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  setHeaders(res, filePath) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    if (!/\.(png|jpe?g|gif|webp)$/i.test(filePath)) res.setHeader('Content-Disposition', 'attachment')
  },
}))

async function seedModules() {
  try {
    const names = setupModules()
    for (const name of names) {
      const cfg = getModuleConfig(name)
      if (!cfg) continue
      await prisma.module.upsert({
        where: { name },
        update: { label: cfg.label, parent: cfg.parent, sequence: cfg.sequence, icon: cfg.icon },
        create: { name, label: cfg.label, parent: cfg.parent, sequence: cfg.sequence, icon: cfg.icon, isEntity: !!cfg.modelName },
      })
    }
    const roles = await prisma.role.findMany({ select: { id: true, name: true } })
    for (const role of roles) {
      const existing = await prisma.rolePermission.findMany({ where: { roleId: role.id }, select: { moduleName: true } })
      const configured = new Set(existing.map(permission => permission.moduleName))
      const fullAccess = role.name.toLowerCase() === 'ceo'
      const missing = PERMISSION_MODULES.filter(moduleName => !configured.has(moduleName))
      if (missing.length) {
        await prisma.rolePermission.createMany({
          data: missing.map(moduleName => ({
            roleId: role.id,
            moduleName,
            view: true,
            create: fullAccess,
            edit: fullAccess,
            delete: fullAccess,
            import: fullAccess,
            export: fullAccess,
          })),
          skipDuplicates: true,
        })
      }
    }
    console.log(`[MODULES] seeded ${names.length} modules`)
  } catch (err) {
    console.error('[MODULES] seed failed', err)
  }
}

const moduleNames = setupModules()
for (const mod of moduleNames) {
  app.use(`/api/${mod}`, entityRouter(mod))
}

app.use(errorHandler)

const server = http.createServer(app)
setupSupportWebSocket(server)
server.listen(PORT, () => {
  console.log(`BizForce CRM Backend running on port ${PORT}`)
  seedModules()
  startCron()
})

export default app
