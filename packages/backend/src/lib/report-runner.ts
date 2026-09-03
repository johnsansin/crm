import { prisma } from './prisma'
import { sendMail } from './mailer'
import { escapeHtml } from '../modules/report'
import { modelMap, scopedModels } from '../modules/entity.routes'

const NUMERIC_FIELDS = new Set([
  'amount', 'grandTotal', 'subTotal', 'annualRevenue', 'unitPrice', 'costPrice',
  'commissionRate', 'qtyInStock', 'expectedRevenue', 'actualCost', 'budget',
  'targetBudget', 'actualBudget', 'forecastAmount', 'qtyPerUnit', 'expectedCount',
  'actualCount', 'progress', 'probability', 'rate', 'discount', 'tax',
])

function fmtNum(v: any): string {
  if (v == null || v === '') return '0.00'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)
}

function num(v: any): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function resolveReportReferences(rows: any[], companyId?: string | null): Promise<any[]> {
  if (!rows.length) return rows
  const userIds = new Set<string>()
  const groupIds = new Set<string>()
  for (const row of rows) {
    if (row.assignedTo) { userIds.add(String(row.assignedTo)); groupIds.add(String(row.assignedTo)) }
    if (row.createdBy) userIds.add(String(row.createdBy))
    if (row.assignedGroupId) groupIds.add(String(row.assignedGroupId))
  }
  const [users, roles, groups] = await Promise.all([
    userIds.size ? prisma.user.findMany({ where: { id: { in: [...userIds] }, ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}) }, select: { id: true, firstName: true, lastName: true, userName: true, email: true } }).catch(() => []) : [],
    userIds.size ? prisma.role.findMany({ where: { id: { in: [...userIds] }, ...(companyId ? { companyId } : {}) }, select: { id: true, name: true } }).catch(() => []) : [],
    groupIds.size ? prisma.userGroup.findMany({ where: { id: { in: [...groupIds] }, ...(companyId ? { companyId } : {}) }, select: { id: true, name: true } }).catch(() => []) : [],
  ])
  const userNames = new Map(users.map(user => [user.id, [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.userName || user.email]))
  const roleNames = new Map(roles.map(role => [role.id, role.name]))
  const groupNames = new Map(groups.map(group => [group.id, group.name]))
  return rows.map(row => {
    const assignedToName = row.assignedToName || (row.assignedTo ? userNames.get(String(row.assignedTo)) || roleNames.get(String(row.assignedTo)) || groupNames.get(String(row.assignedTo)) : null)
    const assignedGroupName = row.assignedGroupName || (row.assignedGroupId ? groupNames.get(String(row.assignedGroupId)) : null)
    const createdByName = row.createdByName || (row.createdBy ? userNames.get(String(row.createdBy)) : null)
    return {
      ...row,
      ...(row.assignedTo !== undefined && { assignedTo: assignedToName || assignedGroupName || 'Unassigned' }),
      ...(row.assignedGroupId !== undefined && { assignedGroupId: assignedGroupName || row.assignedGroupId }),
      ...(row.createdBy !== undefined && { createdBy: createdByName || row.createdBy }),
      assignedToName: assignedToName || assignedGroupName || null,
      createdByName: createdByName || null,
    }
  })
}

export async function fetchReportRows(report: any, companyId?: string | null): Promise<any[]> {
  const modelName = modelMap[report.moduleName]
  if (!modelName) return []
  const prismaModel = (prisma as any)[modelName]
  if (!prismaModel?.findMany) return []

  const where: any = modelName === 'product' || modelName === 'service' ? { isDeleted: false } : { isActive: true }
  if (scopedModels.has(modelName) && companyId) where.companyId = companyId

  const rows = await prismaModel.findMany({ where, take: 2000, orderBy: { createdAt: 'desc' } }).catch(() => [])

  const custom = await prisma.customFieldValue.findMany({
    where: { moduleName: report.moduleName, recordId: { in: rows.map((r: any) => r.id) } },
  }).catch(() => [])
  const map = new Map(custom.map((r: any) => [r.recordId, (r.values as any) || {}]))
  return resolveReportReferences(rows.map((r: any) => ({ ...r, customFields: map.get(r.id) || {} })), companyId)
}

export function applyReportFilters(rows: any[], filters: any[]): any[] {
  let list = [...rows]
  for (const flt of filters || []) {
    const val = flt.value
    list = list.filter((r) => {
      const rv = r[flt.field]
      switch (flt.op) {
        case 'eq': return String(rv ?? '') === String(val ?? '')
        case 'neq': return String(rv ?? '') !== String(val ?? '')
        case 'contains': return String(rv ?? '').toLowerCase().includes(String(val ?? '').toLowerCase())
        case 'gt': return Number(rv) > Number(val)
        case 'lt': return Number(rv) < Number(val)
        case 'gte': return Number(rv) >= Number(val)
        case 'lte': return Number(rv) <= Number(val)
        case 'is_empty': return rv == null || rv === ''
        case 'is_not_empty': return rv != null && rv !== ''
        default: return true
      }
    })
  }
  return list
}

function escCell(v: any, isNumeric: boolean): string {
  if (v == null) return '<td></td>'
  if (isNumeric) return `<td class="num">${escapeHtml(fmtNum(v))}</td>`
  if (typeof v === 'boolean') return `<td>${v ? 'Yes' : 'No'}</td>`
  if (v instanceof Date || /^\d{4}-\d{2}-\d{2}T/.test(String(v))) {
    try { return `<td>${escapeHtml(new Date(v).toLocaleDateString())}</td>` } catch { /* fallthrough */ }
  }
  return `<td>${escapeHtml(String(v))}</td>`
}

function matrixData(report: any, rows: any[]) {
  const mc = report.grouping?.matrix || {}
  const { rowField, columnField, valueField, aggregate } = mc
  if (!rowField || !columnField) return null
  const rowVals = [...new Set(rows.map(r => String(r[rowField] ?? '(blank)')))]
  const colVals = [...new Set(rows.map(r => String(r[columnField] ?? '(blank)')))]
  const cell = (rv: string, cv: string): number => {
    const recs = rows.filter(r => String(r[rowField] ?? '(blank)') === rv && String(r[columnField] ?? '(blank)') === cv)
    if (aggregate === 'count') return recs.length
    return recs.reduce((s, r) => s + num(r[valueField]), 0)
  }
  return { rowField, columnField, valueField, aggregate, rowVals, colVals, cell }
}

function matrixHtml(report: any, rows: any[]): string {
  const m = matrixData(report, rows)
  if (!m) return '<p>No matching records.</p>'
  if (!rows.length) return '<p>No matching records.</p>'
  const rowTotals = m.rowVals.map(rv => m.colVals.reduce((s, cv) => s + m.cell(rv, cv), 0))
  const colTotals = m.colVals.map(cv => m.rowVals.reduce((s, rv) => s + m.cell(rv, cv), 0))
  const grand = rowTotals.reduce((s, v) => s + v, 0)
  const head = `<tr><th>${escapeHtml(m.rowField)}</th>${m.colVals.map(c => `<th>${escapeHtml(c)}</th>`).join('')}<th>Total</th></tr>`
  const body = m.rowVals.map((rv, i) =>
    `<tr><th class="rowh">${escapeHtml(rv)}</th>${m.colVals.map(cv => `<td class="num">${fmtNum(m.cell(rv, cv))}</td>`).join('')}<td class="num total">${fmtNum(rowTotals[i])}</td></tr>`
  ).join('')
  const foot = `<tr><th>Total</th>${colTotals.map(t => `<td class="num total">${fmtNum(t)}</td>`).join('')}<td class="num grand">${fmtNum(grand)}</td></tr>`
  const unit = m.aggregate === 'count' ? 'Count' : `Sum of ${m.valueField}`
  return `<table class="matrix"><caption class="mc">${escapeHtml(m.rowField)} × ${escapeHtml(m.columnField)} — ${escapeHtml(unit)}</caption><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>`
}

export function renderReportHtml(report: any, rows: any[], companyName?: string | null): string {
  const cols: string[] = Array.isArray(report.columns) && report.columns.length
    ? report.columns
    : Object.keys(rows[0] || {}).filter((k) => !['id', 'companyId', 'isActive'].includes(k))
  const isNumeric = (c: string) => NUMERIC_FIELDS.has(c)
  const total = (c: string) => (isNumeric(c) ? rows.reduce((s, r) => s + num(r[c]), 0) : null)

  let body = ''
  const groupField = report.reportType === 'summary' ? report.grouping?.field : null

  if (report.reportType === 'matrix') {
    body = matrixHtml(report, rows)
  } else if (groupField && cols.includes(groupField)) {
    const groups: Record<string, any[]> = {}
    for (const r of rows) {
      const key = String(r[groupField] ?? '(blank)')
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    const rest = cols.filter((c: string) => c !== groupField)
    const groupRows = Object.entries(groups).map(([key, items]) => {
      if (rest.length === 0) {
        return `<tr><th>${escapeHtml(String(key))}</th><td class="num">${items.length}</td></tr>`
      }
      return rest.map((c: string) => {
        const t = items.reduce((s, r) => s + num(r[c]), 0)
        return `<tr><th>${escapeHtml(String(key))}</th><td>${escapeHtml(c)}</td><td class="num">${fmtNum(t)}</td><td class="num">${items.length}</td></tr>`
      }).join('')
    }).join('')
    body = `<table><thead><tr><th>${escapeHtml(groupField)}</th>${rest.length ? '<th>Metric</th><th>Total</th><th>Count</th>' : '<th>Count</th>'}</tr></thead><tbody>${groupRows}</tbody></table>`
  } else if (report.reportType === 'chart') {
    const groupFieldC = report.grouping?.field || cols.find((c: string) => !isNumeric(c)) || cols[0]
    const numericField = cols.find((c: string) => isNumeric(c))
    const groups: Record<string, number> = {}
    for (const r of rows) {
      const key = String(r[groupFieldC] ?? '(blank)')
      const v = numericField ? num(r[numericField]) : 1
      groups[key] = (groups[key] || 0) + v
    }
    body = `<table><thead><tr><th>${escapeHtml(groupFieldC)}</th><th>${escapeHtml(numericField || 'Count')}</th></tr></thead><tbody>${
      Object.entries(groups).map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="num">${fmtNum(v)}</td></tr>`).join('')
    }</tbody></table>`
  } else {
    body = `<table><thead><tr>${cols.map((c: string) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r: any) => `<tr>${cols.map((c: string) => escCell(r[c], isNumeric(c))).join('')}</tr>`).join('')}</tbody></table>`
    if (rows.length) {
      const totals = cols.filter((c: string) => total(c) != null)
      if (totals.length) {
        body += `<table class="totals"><tbody><tr><th>Totals</th>${cols.map((c: string) => {
          const t = total(c)
          return `<td>${t != null ? fmtNum(t) : ''}</td>`
        }).join('')}</tr></tbody></table>`
      }
    }
  }

  if (!rows.length) body = '<p>No matching records.</p>'

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.name || 'Report')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #172033; margin: 0; padding: 32px; background:#f4f6f9; }
  body:before { content:''; display:block; height:7px; max-width:1180px; margin:0 auto; border-radius:18px 18px 0 0; background:#1a1a2e; }
  h1,.meta,body>table,body>p { max-width:1180px; margin-left:auto; margin-right:auto; }
  h1 { font-size: 26px; margin-top:0; margin-bottom:5px; padding:28px 30px 0; background:#fff; letter-spacing:-.02em; }
  .meta { color: #64748b; font-size: 12px; margin-bottom:0; padding:0 30px 24px; background:#fff; border-bottom:1px solid #e5e9f0; }
  table { width: calc(100% - 60px); border-collapse:separate; border-spacing:0; font-size: 12px; margin-bottom:18px; background:#fff; border:1px solid #e1e6ed; border-radius:11px; overflow:hidden; }
  body>table:first-of-type { margin-top:26px; }
  th, td { border:0; border-bottom:1px solid #e8ecf1; padding:10px 12px; text-align: left; }
  tr:last-child>th,tr:last-child>td { border-bottom:0; }
  th { background: #1a1a2e; color:#fff; font-weight: 700; font-size:11px; text-transform:uppercase; letter-spacing:.035em; }
  tbody tr:nth-child(even) td { background:#fafbfd; }
  th.rowh { text-align: left; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.total, td.grand { font-weight: 700; background: #f1f4f8; }
  td.grand { background: #1a1a2e; color:#fff; }
  table.totals td { border: none; background: #f8fafc; font-weight: 600; text-align: right; }
  table.totals th { border: none; background: transparent; }
  caption.mc { caption-side: top; text-align: left; font-size: 11px; color: #64748b; padding-bottom: 6px; }
  @media(max-width:700px){body{padding:10px;overflow-x:auto}h1{font-size:21px;padding:20px 18px 0}.meta{padding:0 18px 18px}table{width:calc(100% - 20px);font-size:10px}th,td{padding:7px 8px}}
  @media print { @page{size:A4 landscape;margin:10mm} body { padding: 0; background:#fff } body:before{border-radius:0} h1,.meta{padding-left:12px;padding-right:12px} table{width:100%;page-break-inside:auto} tr{page-break-inside:avoid} *{-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style></head><body>
<h1>${escapeHtml(report.name || 'Report')}</h1>
<div class="meta">Module: ${escapeHtml(report.moduleName || '')} · Type: ${escapeHtml(report.reportType || 'tabular')} · Generated: ${escapeHtml(new Date().toLocaleString())} · By: ${escapeHtml(companyName || 'BizForce CRM')}</div>
${body}
<p style="margin-top:24px;color:#94a3b8;font-size:11px;">Generated by BizForce CRM</p>
</body></html>`
}

function csvCell(v: any): string {
  if (v == null) return ''
  if (v instanceof Date) return `"${v.toLocaleDateString()}"`
  let s = String(v)
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function renderReportCsv(report: any, rows: any[]): string {
  const cols: string[] = Array.isArray(report.columns) && report.columns.length
    ? report.columns
    : Object.keys(rows[0] || {}).filter((k) => !['id', 'companyId', 'isActive'].includes(k))
  const lines: string[] = [cols.map(csvCell).join(',')]
  if (report.reportType === 'matrix') {
    const m = matrixData(report, rows)
    if (m) {
      lines[0] = [m.rowField, ...m.colVals, 'Total'].map(csvCell).join(',')
      const rowTotals = m.rowVals.map(rv => m.colVals.reduce((s, cv) => s + m.cell(rv, cv), 0))
      const colTotals = m.colVals.map(cv => m.rowVals.reduce((s, rv) => s + m.cell(rv, cv), 0))
      const grand = rowTotals.reduce((s, v) => s + v, 0)
      m.rowVals.forEach((rv, i) => {
        lines.push([rv, ...m.colVals.map(cv => String(m.cell(rv, cv))), String(rowTotals[i])].map(csvCell).join(','))
      })
      lines.push(['Total', ...colTotals.map(String), String(grand)].map(csvCell).join(','))
      return lines.join('\r\n')
    }
  }
  for (const r of rows) {
    lines.push(cols.map((c: string) => csvCell(r[c])).join(','))
  }
  return lines.join('\r\n')
}

export function nextRunForReport(report: any, from: Date): Date {
  const s = report.schedule || {}
  const next = new Date(from)
  const hour = s.hour ?? 8
  const minute = s.minute ?? 0
  switch (s.frequency) {
    case 'hourly':
      next.setMinutes(next.getMinutes() + 60)
      next.setSeconds(0, 0)
      break
    case 'weekly': {
      const dow = s.dayOfWeek ?? 1
      const diff = (dow - next.getDay() + 7) % 7 || 7
      next.setDate(next.getDate() + diff)
      next.setHours(hour, minute, 0, 0)
      break
    }
    case 'monthly': {
      const dom = Math.min(s.dayOfMonth ?? 1, new Date(next.getFullYear(), next.getMonth() + 2, 0).getDate())
      next.setDate(1)
      next.setMonth(next.getMonth() + 1)
      next.setDate(dom)
      next.setHours(hour, minute, 0, 0)
      break
    }
    default:
      next.setDate(next.getDate() + 1)
      next.setHours(hour, minute, 0, 0)
  }
  return next
}

export function isReportDue(report: any, now: Date): boolean {
  const s = report.schedule
  if (!s || !s.enabled) return false
  if (!s.emailTo) return false
  if (!report.lastRunAt) return true
  const next = nextRunForReport(report, new Date(report.lastRunAt))
  return now.getTime() >= next.getTime()
}

export async function runScheduledReport(report: any): Promise<void> {
  const s = report.schedule || {}
  const recipients = String(s.emailTo || '').split(',').map((e: string) => e.trim()).filter(Boolean)
  if (!recipients.length) return
  const rows = await fetchReportRows(report, report.companyId)
  const filtered = applyReportFilters(rows, report.filters)
  const company = report.companyId ? await prisma.company.findUnique({ where: { id: report.companyId } }).catch(() => null) : null
  const html = renderReportHtml({ ...report, filters: report.filters }, filtered, company?.name || 'BizForce CRM')
  await sendMail({
    to: recipients,
    subject: `Report: ${report.name}`,
    html,
    companyId: report.companyId,
  })
  await prisma.report.update({
    where: { id: report.id },
    data: { lastRunAt: new Date() },
  }).catch(() => {})
}

export async function runScheduledReports(): Promise<void> {
  const reports = await prisma.report.findMany({ take: 100 }).catch(() => [])
  const now = new Date()
  for (const r of reports) {
    if (!isReportDue(r, now)) continue
    try {
      await runScheduledReport(r)
      console.log(`[CRON] scheduled report ran: ${r.name}`)
    } catch (err) {
      console.error(`[CRON] scheduled report failed: ${r.name}`, err)
    }
  }
}
