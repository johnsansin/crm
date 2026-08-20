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
import cors from 'cors'
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
import { errorHandler } from './middleware/errorHandler'
import { setupModules, getModuleConfig } from './modules/moduleSetup'
import { startCron } from './lib/cron'
import { prisma } from './lib/prisma'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {}
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email and message are required' })
    return
  }
  console.log('[CONTACT]', JSON.stringify({ name, email, subject: subject || '', message, receivedAt: new Date().toISOString() }, null, 2))
  res.status(200).json({ ok: true })
})

app.use('/api/auth', authRouter)
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
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

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

app.listen(PORT, () => {
  console.log(`BizForce CRM Backend running on port ${PORT}`)
  seedModules()
  startCron()
})

export default app
