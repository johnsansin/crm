import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

export const dashboardRouter = Router()

function fixedDecimal(v: any, d = 2): number {
  return Number(Number(v || 0).toFixed(d))
}

function startOfPeriod(period: 'month' | 'quarter' | 'year'): Date {
  const now = new Date()
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  return new Date(now.getFullYear(), 0, 1)
}

// =====================================================================
// GET /api/dashboard/stats — aggregated stats across all modules
// =====================================================================
dashboardRouter.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const base = companyId ? { companyId } : {}
    const active = { isActive: true }

    const now = new Date()
    const monthStart = startOfPeriod('month')
    const quarterStart = startOfPeriod('quarter')
    const yearStart = startOfPeriod('year')

    const [
      totalAccounts, totalContacts, totalLeads, totalPotentials, totalTickets, totalInvoices,
      openTickets,
      revenueMonth, revenueQuarter, revenueYear,
      closedWonMonth, closedWonQuarter, closedWonYear,
      quotesThisMonth, ordersThisMonth,
      convertedLeads, totalActiveLeads,
    ] = await Promise.all([
      prisma.account.count({ where: { ...base, ...active } }),
      prisma.contact.count({ where: { ...base, ...active } }),
      prisma.lead.count({ where: { ...base, ...active } }),
      prisma.potential.count({ where: { ...base, ...active } }),
      prisma.ticket.count({ where: { ...base, ...active } }),
      prisma.invoice.count({ where: { ...base, ...active } }),
      prisma.ticket.count({ where: { ...base, ...active, status: { notIn: ['Closed', 'Resolved'] } } }),
      prisma.invoice.aggregate({ where: { ...base, ...active, invoiceStatus: 'Paid', invoiceDate: { gte: monthStart } }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({ where: { ...base, ...active, invoiceStatus: 'Paid', invoiceDate: { gte: quarterStart } }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({ where: { ...base, ...active, invoiceStatus: 'Paid', invoiceDate: { gte: yearStart } }, _sum: { grandTotal: true } }),
      prisma.potential.aggregate({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.potential.aggregate({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: quarterStart } }, _sum: { amount: true } }),
      prisma.potential.aggregate({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: yearStart } }, _sum: { amount: true } }),
      prisma.quote.count({ where: { ...base, ...active, createdAt: { gte: monthStart } } }),
      prisma.salesOrder.count({ where: { ...base, ...active, createdAt: { gte: monthStart } } }),
      prisma.lead.count({ where: { ...base, ...active, isConverted: true } }),
      prisma.lead.count({ where: { ...base, ...active } }),
    ])

    const leadConversionRate = totalActiveLeads > 0 ? fixedDecimal((convertedLeads / totalActiveLeads) * 100, 1) : 0

    const [totalQuotes, convertedQuotes] = await Promise.all([
      prisma.quote.count({ where: { ...base, ...active } }),
      prisma.quote.count({ where: { ...base, ...active, quoteStage: 'Accepted' } }),
    ])
    const quoteConversionRate = totalQuotes > 0 ? fixedDecimal((convertedQuotes / totalQuotes) * 100, 1) : 0

    // Pipeline by stage
    const potentials = await prisma.potential.findMany({ where: { ...base, ...active }, select: { stage: true, amount: true } })
    const stageMap = new Map<string, { count: number; amount: number }>()
    for (const p of potentials) {
      const stage = p.stage || 'Unknown'
      const entry = stageMap.get(stage) || { count: 0, amount: 0 }
      entry.count += 1
      entry.amount += fixedDecimal(p.amount)
      stageMap.set(stage, entry)
    }
    const pipelineByStage = [...stageMap.entries()].map(([stage, v]) => ({ stage, count: v.count, amount: v.amount }))

    res.json({
      data: {
        totalAccounts,
        totalContacts,
        totalLeads,
        totalPotentials,
        totalTickets,
        totalInvoices,
        openTickets,
        revenueMonth: fixedDecimal(revenueMonth._sum.grandTotal),
        revenueQuarter: fixedDecimal(revenueQuarter._sum.grandTotal),
        revenueYear: fixedDecimal(revenueYear._sum.grandTotal),
        closedWonMonth: fixedDecimal(closedWonMonth._sum.amount),
        closedWonQuarter: fixedDecimal(closedWonQuarter._sum.amount),
        closedWonYear: fixedDecimal(closedWonYear._sum.amount),
        quotesThisMonth,
        ordersThisMonth,
        leadConversionRate,
        quoteConversionRate,
        pipelineByStage,
      },
    })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/pipeline — sales pipeline by stage
// =====================================================================
dashboardRouter.get('/pipeline', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const where: any = { isActive: true }
    if (companyId) where.companyId = companyId

    const potentials = await prisma.potential.findMany({ where })
    const stageMap = new Map<string, { count: number; amount: number; weighted: number }>()
    for (const p of potentials) {
      const stage = p.stage || 'Unknown'
      const entry = stageMap.get(stage) || { count: 0, amount: 0, weighted: 0 }
      entry.count += 1
      const amt = fixedDecimal(p.amount)
      entry.amount += amt
      entry.weighted += fixedDecimal(amt * (p.probability || 0) / 100)
      stageMap.set(stage, entry)
    }

    const stages = [...stageMap.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([stage, v]) => ({ stage, count: v.count, amount: v.amount, weighted: v.weighted }))

    const totalPipeline = stages.reduce((s, st) => s + st.amount, 0)
    const totalWeighted = stages.reduce((s, st) => s + st.weighted, 0)
    const openCount = potentials.filter(p => !['Closed Won', 'Closed Lost'].includes(p.stage || '')).length

    res.json({ data: { stages, totalPipeline, totalWeighted, openCount } })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/forecast — revenue forecast
// =====================================================================
dashboardRouter.get('/forecast', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const where: any = { isActive: true }
    if (companyId) where.companyId = companyId

    const potentials = await prisma.potential.findMany({ where })
    const now = new Date()

    const buckets: Record<string, { expected: number; weighted: number; count: number }> = {}
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { expected: 0, weighted: 0, count: 0 }
    }

    for (const p of potentials) {
      if (['Closed Won', 'Closed Lost'].includes(p.stage || '')) continue
      const date = p.closingDate || p.createdAt
      const d = new Date(date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (buckets[key]) {
        const amt = fixedDecimal(p.amount)
        buckets[key].expected += amt
        buckets[key].weighted += fixedDecimal(amt * (p.probability || 0) / 100)
        buckets[key].count += 1
      }
    }

    const forecast = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({ period, expected: v.expected, weighted: v.weighted, count: v.count }))

    res.json({ data: { forecast } })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/activity — recent activity feed
// =====================================================================
dashboardRouter.get('/activity', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const where: any = companyId ? { companyId } : {}

    const [auditLogs, activities] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, moduleName: true, action: true, newValue: true, userId: true, createdAt: true } }),
      prisma.activity.findMany({ where: { ...where, isActive: true }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, subject: true, activityType: true, status: true, startAt: true, dueAt: true, createdAt: true } }),
    ])

    const feed = [
      ...auditLogs.map((l: any) => ({ type: 'audit' as const, id: l.id, module: l.moduleName, action: l.action, description: l.newValue || '', timestamp: l.createdAt })),
      ...activities.map((a: any) => ({ type: 'activity' as const, id: a.id, module: 'activities', action: a.activityType, description: a.subject, status: a.status, startAt: a.startAt, dueAt: a.dueAt, timestamp: a.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)

    res.json({ data: feed })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/kpis — key performance indicators
// =====================================================================
dashboardRouter.get('/kpis', authMiddleware, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    const base = companyId ? { companyId } : {}
    const active = { isActive: true }

    const now = new Date()
    const monthStart = startOfPeriod('month')
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const yearStart = startOfPeriod('year')

    const [
      wonPotentials, lostPotentials, allPotentials,
      tickets, resolvedTickets, allTickets,
      leads, convertedLeads,
      users, invoices,
      wonThisMonth, wonPrevMonth,
      allPotentialsThisMonth, allPotentialsPrevMonth,
    ] = await Promise.all([
      prisma.potential.findMany({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: yearStart } }, select: { amount: true, createdAt: true } }),
      prisma.potential.count({ where: { ...base, ...active, stage: 'Closed Lost', createdAt: { gte: yearStart } } }),
      prisma.potential.findMany({ where: { ...base, ...active }, select: { stage: true, amount: true, createdAt: true, closingDate: true, probability: true } }),
      prisma.ticket.findMany({ where: { ...base, ...active, resolutionTime: { not: null } }, select: { resolutionTime: true } }),
      prisma.ticket.count({ where: { ...base, ...active, status: { in: ['Closed', 'Resolved'] } } }),
      prisma.ticket.count({ where: { ...base, ...active } }),
      prisma.lead.findMany({ where: { ...base, ...active }, select: { id: true, isConverted: true, leadSource: true, createdAt: true, convertedAccountId: true } }),
      prisma.lead.count({ where: { ...base, ...active, isConverted: true } }),
      prisma.user.findMany({ where: { ...base, isActive: true }, select: { id: true } }),
      prisma.invoice.findMany({ where: { ...base, ...active, invoiceStatus: 'Paid', invoiceDate: { gte: monthStart } }, select: { grandTotal: true } }),
      prisma.potential.aggregate({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.potential.aggregate({ where: { ...base, ...active, stage: 'Closed Won', createdAt: { gte: prevMonthStart, lt: monthStart } }, _sum: { amount: true } }),
      prisma.potential.findMany({ where: { ...base, ...active, createdAt: { gte: monthStart } }, select: { amount: true, stage: true } }),
      prisma.potential.findMany({ where: { ...base, ...active, createdAt: { gte: prevMonthStart, lt: monthStart } }, select: { amount: true, stage: true } }),
    ])

    const totalWon = wonPotentials.length
    const totalLost = lostPotentials
    const winRate = (totalWon + totalLost) > 0 ? fixedDecimal((totalWon / (totalWon + totalLost)) * 100, 1) : 0

    const totalDealValue = wonPotentials.reduce((s, p) => s + fixedDecimal(p.amount), 0)
    const avgDealSize = totalWon > 0 ? fixedDecimal(totalDealValue / totalWon) : 0

    const closedPotentials = allPotentials.filter(p => ['Closed Won', 'Closed Lost'].includes(p.stage || ''))
    const avgCycleLength = closedPotentials.length > 0
      ? fixedDecimal(closedPotentials.reduce((s, p) => {
          const created = new Date(p.createdAt).getTime()
          const closed = new Date(p.closingDate || p.createdAt).getTime()
          return s + Math.max(0, (closed - created) / (1000 * 60 * 60 * 24))
        }, 0) / closedPotentials.length, 0)
      : 0

    const revenuePerUser = users.length > 0 ? fixedDecimal(totalDealValue / users.length) : 0

    const avgResolutionTime = tickets.length > 0
      ? fixedDecimal(tickets.reduce((s, t) => s + (t.resolutionTime || 0), 0) / tickets.length, 0)
      : 0

    // Revenue metrics
    const totalRevenue = fixedDecimal(totalDealValue)
    const mrr = fixedDecimal(invoices.reduce((s, inv) => s + fixedDecimal(inv.grandTotal), 0))
    const closedWonThisMonth = fixedDecimal(wonThisMonth._sum.amount)
    const closedWonPrevMonth = fixedDecimal(wonPrevMonth._sum.amount)
    const revenueGrowth = closedWonPrevMonth > 0 ? fixedDecimal(((closedWonThisMonth - closedWonPrevMonth) / closedWonPrevMonth) * 100, 1) : (closedWonThisMonth > 0 ? 100 : 0)

    // Pipeline metrics
    const openPotentials = allPotentials.filter(p => !['Closed Won', 'Closed Lost'].includes(p.stage || ''))
    const pipelineValue = fixedDecimal(openPotentials.reduce((s, p) => s + fixedDecimal(p.amount), 0))
    const weightedPipeline = fixedDecimal(openPotentials.reduce((s, p) => s + fixedDecimal(p.amount) * (p.probability || 0) / 100, 0))

    // Pipeline funnel stages
    const stageOrder = ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Negotiation', 'Proposal/Price Quote', 'Closed Won']
    const stageMap = new Map<string, { count: number; value: number }>()
    for (const p of allPotentials) {
      const stage = p.stage || 'Unknown'
      const entry = stageMap.get(stage) || { count: 0, value: 0 }
      entry.count += 1
      entry.value += fixedDecimal(p.amount)
      stageMap.set(stage, entry)
    }
    const stages = stageOrder.map(name => ({
      name,
      count: (stageMap.get(name) || { count: 0 }).count,
      value: (stageMap.get(name) || { value: 0 }).value,
    })).filter(s => s.count > 0)

    // Lead metrics
    const newLeadsThisMonth = leads.filter(l => new Date(l.createdAt) >= monthStart).length
    const totalLeads = leads.length
    const leadConversionRate = totalLeads > 0 ? fixedDecimal((convertedLeads / totalLeads) * 100, 1) : 0
    const avgTimeToConvert = convertedLeads > 0 ? 0 : 0 // Simplified; real computation needs conversion dates

    // Lead sources breakdown
    const sourceMap = new Map<string, number>()
    for (const l of leads) {
      const src = l.leadSource || 'Unknown'
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    }
    const topSources = [...sourceMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, pct: totalLeads > 0 ? fixedDecimal((count / totalLeads) * 100, 1) : 0 }))

    // Ticket metrics
    const openTicketCount = allTickets - resolvedTickets
    const avgResponseTime = tickets.length > 0
      ? fixedDecimal(tickets.reduce((s, t) => s + (t.resolutionTime || 0), 0) / tickets.length, 0)
      : 0
    const resolutionRate = allTickets > 0 ? fixedDecimal((resolvedTickets / allTickets) * 100, 1) : 0

    // Activity feed
    const [auditLogs, activities] = await Promise.all([
      prisma.auditLog.findMany({ where: base, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, moduleName: true, action: true, newValue: true, createdAt: true } }),
      prisma.activity.findMany({ where: { ...base, isActive: true }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, subject: true, activityType: true, status: true, createdAt: true } }),
    ])
    const activityFeed = [
      ...auditLogs.map((l: any) => ({ type: 'audit', id: l.id, module: l.moduleName, action: l.action, description: l.newValue || '', timestamp: l.createdAt })),
      ...activities.map((a: any) => ({ type: 'activity', id: a.id, module: 'activities', action: a.activityType, description: a.subject, timestamp: a.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

    res.json({
      data: {
        revenue: {
          total: totalRevenue,
          mrr,
          avgDealSize,
          growth: revenueGrowth,
          thisMonth: closedWonThisMonth,
          lastMonth: closedWonPrevMonth,
        },
        pipeline: {
          value: pipelineValue,
          weighted: weightedPipeline,
          openCount: openPotentials.length,
          stages,
        },
        leads: {
          new: newLeadsThisMonth,
          total: totalLeads,
          conversionRate: leadConversionRate,
          avgTimeToConvert: Math.round(avgTimeToConvert),
          topSources,
        },
        tickets: {
          open: openTicketCount,
          total: allTickets,
          avgResponseTime: Math.round(avgResponseTime),
          resolutionRate,
        },
        activity: activityFeed,
        // Legacy fields for backward compat
        avgDealSize,
        winRate,
        avgCycleLength: Math.round(avgCycleLength),
        revenuePerUser,
        avgResolutionTime: Math.round(avgResolutionTime),
        totalWonDeals: totalWon,
        totalLostDeals: totalLost,
      },
    })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/assigned-to-me — records assigned to current user
// =====================================================================
dashboardRouter.get('/assigned-to-me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const companyId = req.user!.companyId
    const base = companyId ? { companyId } : {}

    const [leads, potentials, tickets, tasks, projects] = await Promise.all([
      prisma.lead.findMany({
        where: { ...base, assignedTo: userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, company: true, leadStatus: true, updatedAt: true },
      }),
      prisma.potential.findMany({
        where: { ...base, assignedTo: userId, isActive: true, stage: { notIn: ['Closed Won', 'Closed Lost'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, potentialName: true, stage: true, amount: true, closingDate: true, updatedAt: true },
      }),
      prisma.ticket.findMany({
        where: { ...base, assignedTo: userId, isActive: true, status: { notIn: ['Closed', 'Resolved'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, updatedAt: true },
      }),
      prisma.activity.findMany({
        where: { ...base, assignedTo: userId, isActive: true, status: { notIn: ['Completed', 'Cancelled'] } },
        orderBy: { dueAt: 'asc' },
        take: 5,
        select: { id: true, subject: true, activityType: true, status: true, dueAt: true, updatedAt: true },
      }),
      prisma.project.findMany({
        where: { ...base, assignedTo: userId, isActive: true, status: { notIn: ['Completed', 'Cancelled'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, projectName: true, status: true, progress: true, updatedAt: true },
      }),
    ])

    res.json({
      data: {
        leads: leads.map(l => ({ ...l, module: 'leads', name: `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unnamed', link: `/leads/${l.id}` })),
        opportunities: potentials.map(p => ({ ...p, module: 'potentials', name: p.potentialName || 'Unnamed', link: `/potentials/${p.id}` })),
        tickets: tickets.map(t => ({ ...t, module: 'tickets', name: t.title || 'Untitled', link: `/tickets/${t.id}` })),
        tasks: tasks.map(a => ({ ...a, module: 'activities', name: a.subject || 'Untitled', link: `/activities/${a.id}` })),
        projects: projects.map(p => ({ ...p, module: 'projects', name: p.projectName || 'Unnamed', link: `/projects/${p.id}` })),
      },
    })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/dashboard/widgets — user's dashboard widgets
// =====================================================================
dashboardRouter.get('/widgets', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { isActive: true, userId: req.user!.userId }
    const data = await prisma.dashboardWidget.findMany({ where, orderBy: { position: 'asc' } })
    res.json({ data })
  } catch (err) { next(err) }
})

// =====================================================================
// POST /api/dashboard/widgets — create widget
// =====================================================================
dashboardRouter.post('/widgets', authMiddleware, async (req, res, next) => {
  try {
    const { widgetName, widgetType, moduleName, config, position, size } = req.body
    if (!widgetName || !widgetType) return res.status(400).json({ error: 'widgetName and widgetType are required' })
    const widget = await prisma.dashboardWidget.create({
      data: {
        widgetName,
        widgetType,
        moduleName: moduleName || 'dashboard',
        config: config || {},
        position: position ?? 0,
        size: size || 'medium',
        companyId: req.user!.companyId,
        userId: req.user!.userId,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json({ data: widget })
  } catch (err) { next(err) }
})

// =====================================================================
// PUT /api/dashboard/widgets/:id — update widget
// =====================================================================
dashboardRouter.put('/widgets/:id', authMiddleware, async (req, res, next) => {
  try {
    const { widgetName, widgetType, moduleName, config, position, size, isActive } = req.body
    const where: any = { id: req.params.id, userId: req.user!.userId }
    const existing = await prisma.dashboardWidget.findFirst({ where })
    if (!existing) return res.status(404).json({ error: 'Widget not found' })
    const data: any = {}
    if (widgetName !== undefined) data.widgetName = widgetName
    if (widgetType !== undefined) data.widgetType = widgetType
    if (moduleName !== undefined) data.moduleName = moduleName
    if (config !== undefined) data.config = config
    if (position !== undefined) data.position = position
    if (size !== undefined) data.size = size
    if (isActive !== undefined) data.isActive = isActive
    const widget = await prisma.dashboardWidget.update({ where: { id: req.params.id }, data })
    res.json({ data: widget })
  } catch (err) { next(err) }
})

// =====================================================================
// DELETE /api/dashboard/widgets/:id — delete widget
// =====================================================================
dashboardRouter.delete('/widgets/:id', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { id: req.params.id, userId: req.user!.userId }
    const existing = await prisma.dashboardWidget.findFirst({ where })
    if (!existing) return res.status(404).json({ error: 'Widget not found' })
    await prisma.dashboardWidget.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { next(err) }
})
