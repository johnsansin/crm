import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'

export const reportEnhancedRouter = Router()
reportEnhancedRouter.use(authMiddleware)

function fixedDecimal(v: any, d = 2): number {
  return Number(Number(v || 0).toFixed(d))
}

const REPORT_TYPES = [
  { id: 'sales-pipeline', name: 'Sales Pipeline Report', icon: 'TrendingUp', description: 'Opportunities grouped by stage with counts and total amounts' },
  { id: 'revenue', name: 'Revenue Report', icon: 'DollarSign', description: 'Revenue breakdown by period (monthly, quarterly, yearly)' },
  { id: 'lead-source', name: 'Lead Source Report', icon: 'UserPlus', description: 'Leads grouped by source with conversion rates' },
  { id: 'activity', name: 'Activity Report', icon: 'CalendarDays', description: 'Activities by type, status, and user' },
  { id: 'ticket-performance', name: 'Ticket Performance Report', icon: 'LifeBuoy', description: 'Ticket resolution times, priorities, and SLA compliance' },
  { id: 'invoice-aging', name: 'Invoice Aging Report', icon: 'Receipt', description: 'Outstanding invoices grouped by age buckets' },
  { id: 'user-performance', name: 'User Performance Report', icon: 'Users', description: 'Deals, revenue, and activity per user' },
  { id: 'campaign-roi', name: 'Campaign ROI Report', icon: 'Megaphone', description: 'Campaign costs vs. revenue generated' },
]

// =====================================================================
// GET /api/reports/available — list available report types
// =====================================================================
reportEnhancedRouter.get('/available', requireModulePermission('reports', 'view'), async (_req, res, next) => {
  try {
    res.json({ data: REPORT_TYPES })
  } catch (err) { next(err) }
})

// =====================================================================
// POST /api/reports/generate — generate a report with filters
// =====================================================================
reportEnhancedRouter.post('/generate', requireModulePermission('reports', 'view'), async (req, res, next) => {
  try {
    const { reportType, dateFrom, dateTo } = req.body
    if (!reportType) return res.status(400).json({ error: 'reportType is required' })

    const companyId = req.user!.companyId
    const base = companyId ? { companyId } : {}
    const active = { isActive: true }
    const dateFilter = dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    } : {}

    let rows: any[] = []
    let columns: string[] = []
    let title = ''

    switch (reportType) {
      case 'sales-pipeline': {
        title = 'Sales Pipeline Report'
        const potentials = await prisma.potential.findMany({ where: { ...base, ...active } })
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
        columns = ['Stage', 'Count', 'Total Amount', 'Weighted Amount']
        rows = [...stageMap.entries()].map(([stage, v]) => ({
          Stage: stage,
          Count: v.count,
          'Total Amount': v.amount,
          'Weighted Amount': v.weighted,
        }))
        break
      }
      case 'revenue': {
        title = 'Revenue Report'
        const invoices = await prisma.invoice.findMany({ where: { ...base, ...active, invoiceStatus: 'Paid', ...dateFilter } })
        const monthMap = new Map<string, { count: number; amount: number }>()
        for (const inv of invoices) {
          const d = inv.invoiceDate || inv.createdAt
          const key = new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short' })
          const entry = monthMap.get(key) || { count: 0, amount: 0 }
          entry.count += 1
          entry.amount += fixedDecimal(inv.grandTotal)
          monthMap.set(key, entry)
        }
        columns = ['Period', 'Invoice Count', 'Total Revenue']
        rows = [...monthMap.entries()].map(([period, v]) => ({
          Period: period,
          'Invoice Count': v.count,
          'Total Revenue': v.amount,
        }))
        break
      }
      case 'lead-source': {
        title = 'Lead Source Report'
        const leads = await prisma.lead.findMany({ where: { ...base, ...active, ...dateFilter } })
        const sourceMap = new Map<string, { total: number; converted: number }>()
        for (const l of leads) {
          const src = l.leadSource || 'Unknown'
          const entry = sourceMap.get(src) || { total: 0, converted: 0 }
          entry.total += 1
          if (l.isConverted) entry.converted += 1
          sourceMap.set(src, entry)
        }
        columns = ['Lead Source', 'Total Leads', 'Converted', 'Conversion Rate']
        rows = [...sourceMap.entries()].map(([src, v]) => ({
          'Lead Source': src,
          'Total Leads': v.total,
          Converted: v.converted,
          'Conversion Rate': v.total > 0 ? fixedDecimal((v.converted / v.total) * 100, 1) + '%' : '0%',
        }))
        break
      }
      case 'activity': {
        title = 'Activity Report'
        const activities = await prisma.activity.findMany({ where: { ...base, ...active, ...dateFilter } })
        const typeMap = new Map<string, { total: number; completed: number }>()
        for (const a of activities) {
          const type = a.activityType || 'Other'
          const entry = typeMap.get(type) || { total: 0, completed: 0 }
          entry.total += 1
          if ((a.status || '').toLowerCase() === 'completed') entry.completed += 1
          typeMap.set(type, entry)
        }
        columns = ['Activity Type', 'Total', 'Completed', 'Completion Rate']
        rows = [...typeMap.entries()].map(([type, v]) => ({
          'Activity Type': type,
          Total: v.total,
          Completed: v.completed,
          'Completion Rate': v.total > 0 ? fixedDecimal((v.completed / v.total) * 100, 1) + '%' : '0%',
        }))
        break
      }
      case 'ticket-performance': {
        title = 'Ticket Performance Report'
        const tickets = await prisma.ticket.findMany({ where: { ...base, ...active, ...dateFilter } })
        const priorityMap = new Map<string, { total: number; resolved: number; avgResolution: number; resolutions: number[] }>()
        for (const t of tickets) {
          const priority = t.priority || 'Unknown'
          const entry = priorityMap.get(priority) || { total: 0, resolved: 0, avgResolution: 0, resolutions: [] }
          entry.total += 1
          if (['Closed', 'Resolved'].includes(t.status || '')) {
            entry.resolved += 1
            if (t.resolutionTime) entry.resolutions.push(t.resolutionTime)
          }
          priorityMap.set(priority, entry)
        }
        columns = ['Priority', 'Total Tickets', 'Resolved', 'Avg Resolution (hrs)', 'Resolution Rate']
        rows = [...priorityMap.entries()].map(([priority, v]) => ({
          Priority: priority,
          'Total Tickets': v.total,
          Resolved: v.resolved,
          'Avg Resolution (hrs)': v.resolutions.length > 0 ? Math.round(v.resolutions.reduce((s, r) => s + r, 0) / v.resolutions.length) : 'N/A',
          'Resolution Rate': v.total > 0 ? fixedDecimal((v.resolved / v.total) * 100, 1) + '%' : '0%',
        }))
        break
      }
      case 'invoice-aging': {
        title = 'Invoice Aging Report'
        const invoices = await prisma.invoice.findMany({ where: { ...base, ...active, invoiceStatus: { not: 'Paid' } } })
        const now = new Date()
        const buckets = [
          { label: 'Current (0-30 days)', min: 0, max: 30 },
          { label: '31-60 days', min: 31, max: 60 },
          { label: '61-90 days', min: 61, max: 90 },
          { label: 'Over 90 days', min: 91, max: Infinity },
        ]
        const agingMap = new Map<string, { count: number; amount: number }>()
        for (const b of buckets) agingMap.set(b.label, { count: 0, amount: 0 })
        for (const inv of invoices) {
          const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
          const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
          const bucket = buckets.find(b => daysOverdue >= b.min && daysOverdue <= b.max)
          if (bucket) {
            const entry = agingMap.get(bucket.label)!
            entry.count += 1
            entry.amount += fixedDecimal(inv.grandTotal) - fixedDecimal(inv.paidAmount)
          }
        }
        columns = ['Aging Bucket', 'Invoice Count', 'Outstanding Amount']
        rows = [...agingMap.entries()].map(([label, v]) => ({
          'Aging Bucket': label,
          'Invoice Count': v.count,
          'Outstanding Amount': v.amount,
        }))
        break
      }
      case 'user-performance': {
        title = 'User Performance Report'
        const users = await prisma.user.findMany({ where: companyId ? { companyId } : {}, select: { id: true, firstName: true, lastName: true, userName: true } })
        const userMap = new Map<string, { name: string; deals: number; revenue: number; leads: number; tickets: number }>()
        for (const u of users) {
          userMap.set(u.id, { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName, deals: 0, revenue: 0, leads: 0, tickets: 0 })
        }
        const [allPotentials, allLeads, allTickets] = await Promise.all([
          prisma.potential.findMany({ where: { ...base, ...active, stage: 'Closed Won' }, select: { assignedTo: true, amount: true } }),
          prisma.lead.findMany({ where: { ...base, ...active }, select: { assignedTo: true } }),
          prisma.ticket.findMany({ where: { ...base, ...active }, select: { assignedTo: true } }),
        ])
        for (const p of allPotentials) {
          if (p.assignedTo && userMap.has(p.assignedTo)) {
            const u = userMap.get(p.assignedTo)!
            u.deals += 1
            u.revenue += fixedDecimal(p.amount)
          }
        }
        for (const l of allLeads) {
          if (l.assignedTo && userMap.has(l.assignedTo)) userMap.get(l.assignedTo)!.leads += 1
        }
        for (const t of allTickets) {
          if (t.assignedTo && userMap.has(t.assignedTo)) userMap.get(t.assignedTo)!.tickets += 1
        }
        columns = ['User', 'Closed Deals', 'Revenue', 'Leads Assigned', 'Tickets Assigned']
        rows = [...userMap.values()].map(u => ({
          User: u.name,
          'Closed Deals': u.deals,
          Revenue: u.revenue,
          'Leads Assigned': u.leads,
          'Tickets Assigned': u.tickets,
        }))
        break
      }
      case 'campaign-roi': {
        title = 'Campaign ROI Report'
        const campaigns = await prisma.campaign.findMany({ where: { ...base, ...active, ...dateFilter } })
        columns = ['Campaign', 'Type', 'Status', 'Budget', 'Actual Cost', 'Expected Revenue', 'ROI']
        rows = campaigns.map(c => ({
          Campaign: c.campaignName,
          Type: c.campaignType || 'N/A',
          Status: c.status || 'N/A',
          Budget: fixedDecimal(c.budget),
          'Actual Cost': fixedDecimal(c.actualCost),
          'Expected Revenue': fixedDecimal(c.expectedRevenue),
          ROI: c.actualCost && Number(c.actualCost) > 0
            ? fixedDecimal(((Number(c.expectedRevenue || 0) - Number(c.actualCost)) / Number(c.actualCost)) * 100, 1) + '%'
            : 'N/A',
        }))
        break
      }
      default:
        return res.status(400).json({ error: `Unknown report type: ${reportType}` })
    }

    res.json({ data: { title, reportType, columns, rows, generatedAt: new Date().toISOString() } })
  } catch (err) { next(err) }
})

// =====================================================================
// GET /api/reports/export/:id — export report as CSV
// =====================================================================
reportEnhancedRouter.get('/export/:id', requireModulePermission('reports', 'export'), async (req, res, next) => {
  try {
    const { id } = req.params
    const report = REPORT_TYPES.find(r => r.id === id)
    if (!report) return res.status(404).json({ error: 'Report type not found' })

    // Re-generate the report data
    const companyId = req.user!.companyId
    const base = companyId ? { companyId } : {}
    const active = { isActive: true }
    let rows: any[] = []
    let columns: string[] = []

    switch (id) {
      case 'sales-pipeline': {
        const potentials = await prisma.potential.findMany({ where: { ...base, ...active } })
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
        columns = ['Stage', 'Count', 'Total Amount', 'Weighted Amount']
        rows = [...stageMap.entries()].map(([stage, v]) => ({ Stage: stage, Count: v.count, 'Total Amount': v.amount, 'Weighted Amount': v.weighted }))
        break
      }
      case 'revenue': {
        const invoices = await prisma.invoice.findMany({ where: { ...base, ...active, invoiceStatus: 'Paid' } })
        const monthMap = new Map<string, { count: number; amount: number }>()
        for (const inv of invoices) {
          const d = inv.invoiceDate || inv.createdAt
          const key = new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short' })
          const entry = monthMap.get(key) || { count: 0, amount: 0 }
          entry.count += 1
          entry.amount += fixedDecimal(inv.grandTotal)
          monthMap.set(key, entry)
        }
        columns = ['Period', 'Invoice Count', 'Total Revenue']
        rows = [...monthMap.entries()].map(([period, v]) => ({ Period: period, 'Invoice Count': v.count, 'Total Revenue': v.amount }))
        break
      }
      case 'lead-source': {
        const leads = await prisma.lead.findMany({ where: { ...base, ...active } })
        const sourceMap = new Map<string, { total: number; converted: number }>()
        for (const l of leads) {
          const src = l.leadSource || 'Unknown'
          const entry = sourceMap.get(src) || { total: 0, converted: 0 }
          entry.total += 1
          if (l.isConverted) entry.converted += 1
          sourceMap.set(src, entry)
        }
        columns = ['Lead Source', 'Total Leads', 'Converted', 'Conversion Rate']
        rows = [...sourceMap.entries()].map(([src, v]) => ({ 'Lead Source': src, 'Total Leads': v.total, Converted: v.converted, 'Conversion Rate': v.total > 0 ? fixedDecimal((v.converted / v.total) * 100, 1) + '%' : '0%' }))
        break
      }
      case 'activity': {
        const activities = await prisma.activity.findMany({ where: { ...base, ...active } })
        const typeMap = new Map<string, { total: number; completed: number }>()
        for (const a of activities) {
          const type = a.activityType || 'Other'
          const entry = typeMap.get(type) || { total: 0, completed: 0 }
          entry.total += 1
          if ((a.status || '').toLowerCase() === 'completed') entry.completed += 1
          typeMap.set(type, entry)
        }
        columns = ['Activity Type', 'Total', 'Completed', 'Completion Rate']
        rows = [...typeMap.entries()].map(([type, v]) => ({ 'Activity Type': type, Total: v.total, Completed: v.completed, 'Completion Rate': v.total > 0 ? fixedDecimal((v.completed / v.total) * 100, 1) + '%' : '0%' }))
        break
      }
      case 'ticket-performance': {
        const tickets = await prisma.ticket.findMany({ where: { ...base, ...active } })
        const priorityMap = new Map<string, { total: number; resolved: number; resolutions: number[] }>()
        for (const t of tickets) {
          const priority = t.priority || 'Unknown'
          const entry = priorityMap.get(priority) || { total: 0, resolved: 0, resolutions: [] }
          entry.total += 1
          if (['Closed', 'Resolved'].includes(t.status || '')) {
            entry.resolved += 1
            if (t.resolutionTime) entry.resolutions.push(t.resolutionTime)
          }
          priorityMap.set(priority, entry)
        }
        columns = ['Priority', 'Total Tickets', 'Resolved', 'Avg Resolution (hrs)', 'Resolution Rate']
        rows = [...priorityMap.entries()].map(([priority, v]) => ({ Priority: priority, 'Total Tickets': v.total, Resolved: v.resolved, 'Avg Resolution (hrs)': v.resolutions.length > 0 ? Math.round(v.resolutions.reduce((s, r) => s + r, 0) / v.resolutions.length) : 'N/A', 'Resolution Rate': v.total > 0 ? fixedDecimal((v.resolved / v.total) * 100, 1) + '%' : '0%' }))
        break
      }
      case 'invoice-aging': {
        const invoices = await prisma.invoice.findMany({ where: { ...base, ...active, invoiceStatus: { not: 'Paid' } } })
        const now = new Date()
        const buckets = [
          { label: 'Current (0-30 days)', min: 0, max: 30 },
          { label: '31-60 days', min: 31, max: 60 },
          { label: '61-90 days', min: 61, max: 90 },
          { label: 'Over 90 days', min: 91, max: Infinity },
        ]
        const agingMap = new Map<string, { count: number; amount: number }>()
        for (const b of buckets) agingMap.set(b.label, { count: 0, amount: 0 })
        for (const inv of invoices) {
          const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
          const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
          const bucket = buckets.find(b => daysOverdue >= b.min && daysOverdue <= b.max)
          if (bucket) {
            const entry = agingMap.get(bucket.label)!
            entry.count += 1
            entry.amount += fixedDecimal(inv.grandTotal) - fixedDecimal(inv.paidAmount)
          }
        }
        columns = ['Aging Bucket', 'Invoice Count', 'Outstanding Amount']
        rows = [...agingMap.entries()].map(([label, v]) => ({ 'Aging Bucket': label, 'Invoice Count': v.count, 'Outstanding Amount': v.amount }))
        break
      }
      case 'user-performance': {
        const users = await prisma.user.findMany({ where: companyId ? { companyId } : {}, select: { id: true, firstName: true, lastName: true, userName: true } })
        const userMap = new Map<string, { name: string; deals: number; revenue: number; leads: number; tickets: number }>()
        for (const u of users) userMap.set(u.id, { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName, deals: 0, revenue: 0, leads: 0, tickets: 0 })
        const [allPotentials, allLeads, allTickets] = await Promise.all([
          prisma.potential.findMany({ where: { ...base, ...active, stage: 'Closed Won' }, select: { assignedTo: true, amount: true } }),
          prisma.lead.findMany({ where: { ...base, ...active }, select: { assignedTo: true } }),
          prisma.ticket.findMany({ where: { ...base, ...active }, select: { assignedTo: true } }),
        ])
        for (const p of allPotentials) { if (p.assignedTo && userMap.has(p.assignedTo)) { const u = userMap.get(p.assignedTo)!; u.deals += 1; u.revenue += fixedDecimal(p.amount) } }
        for (const l of allLeads) { if (l.assignedTo && userMap.has(l.assignedTo)) userMap.get(l.assignedTo)!.leads += 1 }
        for (const t of allTickets) { if (t.assignedTo && userMap.has(t.assignedTo)) userMap.get(t.assignedTo)!.tickets += 1 }
        columns = ['User', 'Closed Deals', 'Revenue', 'Leads Assigned', 'Tickets Assigned']
        rows = [...userMap.values()].map(u => ({ User: u.name, 'Closed Deals': u.deals, Revenue: u.revenue, 'Leads Assigned': u.leads, 'Tickets Assigned': u.tickets }))
        break
      }
      case 'campaign-roi': {
        const campaigns = await prisma.campaign.findMany({ where: { ...base, ...active } })
        columns = ['Campaign', 'Type', 'Status', 'Budget', 'Actual Cost', 'Expected Revenue', 'ROI']
        rows = campaigns.map(c => ({ Campaign: c.campaignName, Type: c.campaignType || 'N/A', Status: c.status || 'N/A', Budget: fixedDecimal(c.budget), 'Actual Cost': fixedDecimal(c.actualCost), 'Expected Revenue': fixedDecimal(c.expectedRevenue), ROI: c.actualCost && Number(c.actualCost) > 0 ? fixedDecimal(((Number(c.expectedRevenue || 0) - Number(c.actualCost)) / Number(c.actualCost)) * 100, 1) + '%' : 'N/A' }))
        break
      }
      default:
        return res.status(400).json({ error: 'Unknown report type' })
    }

    // Generate CSV
    const csvHeader = columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',')
    const csvRows = rows.map(row => columns.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(','))
    const csv = [csvHeader, ...csvRows].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${report.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (err) { next(err) }
})
