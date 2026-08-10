import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, BarChart3, Play, Printer, Table2, ChartPie } from 'lucide-react'
import { getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { formatDate } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails', 'projects', 'projecttasks', 'projectmilestones', 'assets', 'servicecontracts']

const moduleFields: Record<string, string[]> = {
  accounts: ['accountName', 'accountNo', 'accountType', 'industry', 'annualRevenue', 'phone', 'email', 'website', 'billingCity', 'billingState', 'billingCountry', 'employees', 'description'],
  contacts: ['firstName', 'lastName', 'title', 'department', 'email', 'secondaryEmail', 'phone', 'mobile', 'leadSource', 'assignedTo', 'description'],
  leads: ['firstName', 'lastName', 'company', 'title', 'email', 'phone', 'mobile', 'website', 'leadStatus', 'leadSource', 'industry', 'annualRevenue', 'description'],
  potentials: ['potentialName', 'potentialNo', 'amount', 'forecastAmount', 'closingDate', 'stage', 'probability', 'type', 'leadSource', 'nextStep', 'assignedTo', 'description'],
  campaigns: ['campaignName', 'campaignType', 'status', 'startDate', 'endDate', 'expectedRevenue', 'actualCost', 'budget', 'expectedResponse', 'actualCount', 'description'],
  products: ['productName', 'productNo', 'productCategory', 'unitPrice', 'costPrice', 'commissionRate', 'qtyInStock', 'qtyPerUnit', 'usageUnit', 'isService', 'isSales', 'vat', 'description'],
  services: ['serviceName', 'serviceNo', 'serviceCategory', 'unitPrice', 'commissionRate', 'description'],
  vendors: ['vendorName', 'vendorNo', 'category', 'phone', 'email', 'website', 'street', 'city', 'state', 'country', 'description'],
  pricebooks: ['priceBookName', 'active', 'description'],
  quotes: ['quoteNo', 'subject', 'grandTotal', 'subTotal', 'quoteStage', 'validUntil', 'accountId', 'contactId', 'assignedTo', 'createdAt'],
  salesorders: ['salesOrderNo', 'subject', 'grandTotal', 'subTotal', 'soStatus', 'validUntil', 'accountId', 'contactId', 'assignedTo', 'createdAt'],
  purchaseorders: ['purchaseOrderNo', 'subject', 'grandTotal', 'subTotal', 'poStatus', 'vendorId', 'contactId', 'createdAt'],
  invoices: ['invoiceNo', 'subject', 'grandTotal', 'subTotal', 'invoiceStatus', 'invoiceDate', 'dueDate', 'accountId', 'contactId', 'assignedTo', 'createdAt'],
  tickets: ['ticketNo', 'title', 'status', 'priority', 'category', 'severity', 'contactId', 'assignedTo', 'createdAt'],
  faq: ['title', 'category', 'status', 'faqNo', 'description'],
  documents: ['title', 'fileName', 'fileType', 'fileSize', 'downloadType', 'folderName', 'createdAt'],
  emails: ['subject', 'fromEmail', 'toEmails', 'emailFlag', 'dateSent', 'createdAt'],
  projects: ['projectName', 'projectNo', 'status', 'priority', 'progress', 'startDate', 'targetEndDate', 'actualEndDate', 'targetBudget', 'actualCost', 'assignedTo'],
  projecttasks: ['title', 'status', 'priority', 'progress', 'projectId', 'startDate', 'endDate', 'assignedTo'],
  projectmilestones: ['title', 'status', 'progress', 'projectId', 'startDate', 'endDate'],
  assets: ['assetName', 'serialNo', 'status', 'category', 'model', 'purchaseDate', 'assignedTo'],
  servicecontracts: ['contractName', 'contractNo', 'contractType', 'status', 'startDate', 'endDate', 'trackingUnit', 'description'],
}

const NUMERIC_FIELDS = ['amount', 'grandTotal', 'subTotal', 'annualRevenue', 'unitPrice', 'costPrice', 'commissionRate', 'qtyInStock', 'expectedRevenue', 'actualCost', 'budget', 'targetBudget', 'actualBudget', 'forecastAmount', 'qtyPerUnit', 'expectedCount', 'actualCount', 'progress']

export function ReportsPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [running, setRunning] = useState<any | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['reports'], queryFn: () => api.list('reports', { limit: '100' }) })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('reports', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reports'] }); addToast({ title: 'Report deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.update('reports', editing.id, d) : api.create('reports', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      addToast({ title: editing ? 'Report updated' : 'Report created', variant: 'success' })
      setShowForm(false); setEditing(null)
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="text-primary" /> Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build tabular and summary reports over CRM modules (vtiger report module).</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={15} className="mr-1.5" /> New Report</Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (v, r) => <span className="font-medium">{v}</span> },
          { key: 'moduleName', label: 'Module', render: (v) => <span className="text-muted-foreground capitalize">{v}</span> },
          { key: 'reportType', label: 'Type', render: (v) => <span className="capitalize">{v}</span> },
          { key: 'createdAt', label: 'Created', render: (v) => <span className="text-muted-foreground">{v ? formatDate(v) : '—'}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No reports yet. Create your first report."
        pageSize={10}
        actions={(r) => (
          <>
            <Button variant="ghost" size="icon" title="Run report" onClick={() => setRunning(r)}><Play size={14} className="text-emerald-500" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditing(null); setShowForm(o) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Report' : 'New Report'}</DialogTitle></DialogHeader>
          <ReportForm
            initial={editing}
            onSave={(d) => saveMutation.mutate(d)}
            saving={saveMutation.isPending}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!running} onOpenChange={() => setRunning(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{running?.name}</DialogTitle></DialogHeader>
          {running && <ReportRunner report={running} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Report"
        description="Are you sure you want to delete this report?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function ReportForm({ initial, onSave, saving, onCancel }: { initial: any; onSave: (d: any) => void; saving: boolean; onCancel: () => void }) {
  const [form, setForm] = useState<any>({
    name: initial?.name || '',
    moduleName: initial?.moduleName || 'accounts',
    reportType: initial?.reportType || 'tabular',
    chartType: initial?.chartType || 'bar',
    columns: initial?.columns || [],
    grouping: initial?.grouping || {},
    filters: initial?.filters || [],
    sort: initial?.sort || [],
  })
  const [filterField, setFilterField] = useState('')
  const fields = moduleFields[form.moduleName] || []
  const available = fields.filter((f) => !form.columns.includes(f))

  const toggleColumn = (f: string) => {
    setForm((prev: any) => ({
      ...prev,
      columns: prev.columns.includes(f) ? prev.columns.filter((c: string) => c !== f) : [...prev.columns, f],
    }))
  }

  const addFilter = () => {
    if (!filterField) return
    setForm((prev: any) => ({ ...prev, filters: [...prev.filters, { field: filterField, op: 'eq', value: '' }] }))
    setFilterField('')
  }

  const setGroupBy = (field: string) => {
    setForm((prev: any) => ({ ...prev, grouping: { ...prev.grouping, field } }))
  }

  const submit = () => {
    if (!form.name.trim()) return
    onSave({ ...form, columns: form.columns, filters: form.filters, sort: form.sort })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Report Name</label>
          <Input placeholder="e.g. Open Opportunities" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Module</label>
          <Select value={form.moduleName} onValueChange={(v) => setForm((f: any) => ({ ...f, moduleName: v, columns: [], grouping: {}, filters: [] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Type</label>
          <Select value={form.reportType} onValueChange={(v) => setForm((f: any) => ({ ...f, reportType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tabular">Tabular</SelectItem>
              <SelectItem value="summary">Summary (grouped)</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.reportType === 'chart' && (
          <div>
            <label className="text-sm font-medium block mb-1.5">Chart Type</label>
            <Select value={form.chartType || 'bar'} onValueChange={(v) => setForm((f: any) => ({ ...f, chartType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Columns</label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border p-2.5 min-h-[42px]">
          {form.columns.map((c: string) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
              {getFieldLabel(c)}
              <button type="button" onClick={() => toggleColumn(c)} className="hover:text-destructive"><XIcon size={12} /></button>
            </span>
          ))}
          {form.columns.length === 0 && <span className="text-sm text-muted-foreground">No columns selected — pick from the list</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {available.map((f) => (
            <button key={f} type="button" onClick={() => toggleColumn(f)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted transition-colors">
              {getFieldLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {form.reportType === 'summary' && (
        <div>
          <label className="text-sm font-medium block mb-1.5">Group By (for summary)</label>
          <Select value={form.grouping?.field || ''} onValueChange={setGroupBy}>
            <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
            <SelectContent>
              {form.columns.map((c: string) => <SelectItem key={c} value={c}>{getFieldLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium block mb-1.5">Filters</label>
        {form.filters.map((flt: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <span className="text-sm w-40 truncate">{getFieldLabel(flt.field)}</span>
            <Select value={flt.op} onValueChange={(v) => setForm((f: any) => ({ ...f, filters: f.filters.map((x: any, i: number) => i === idx ? { ...x, op: v } : x) }))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eq">Equals</SelectItem>
                <SelectItem value="neq">Not equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="gt">Greater than</SelectItem>
                <SelectItem value="lt">Less than</SelectItem>
                <SelectItem value="is_empty">Is empty</SelectItem>
                <SelectItem value="is_not_empty">Is not empty</SelectItem>
              </SelectContent>
            </Select>
            <Input className="flex-1" placeholder="Value" value={flt.value || ''} onChange={(e) => setForm((f: any) => ({ ...f, filters: f.filters.map((x: any, i: number) => i === idx ? { ...x, value: e.target.value } : x) }))} />
            <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f: any) => ({ ...f, filters: f.filters.filter((_: any, i: number) => i !== idx) }))}><XIcon size={14} className="text-destructive" /></Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Add filter field" /></SelectTrigger>
            <SelectContent>
              {fields.map((f) => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={addFilter} disabled={!filterField}>Add Filter</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} disabled={saving || !form.name}>
          {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
          {initial ? 'Update' : 'Create'} Report
        </Button>
      </div>
    </div>
  )
}

function ReportRunner({ report }: { report: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-run', report.id],
    queryFn: () => api.listAll(report.moduleName, { limit: '2000' }),
  })

  const rows = useMemo(() => {
    let list = [...(data?.data || [])]
    for (const flt of report.filters || []) {
      const val = flt.value
      list = list.filter((r) => {
        const rv = r[flt.field]
        switch (flt.op) {
          case 'eq': return String(rv ?? '') === String(val ?? '')
          case 'neq': return String(rv ?? '') !== String(val ?? '')
          case 'contains': return String(rv ?? '').toLowerCase().includes(String(val ?? '').toLowerCase())
          case 'gt': return Number(rv) > Number(val)
          case 'lt': return Number(rv) < Number(val)
          case 'is_empty': return rv == null || rv === ''
          case 'is_not_empty': return rv != null && rv !== ''
          default: return true
        }
      })
    }
    return list
  }, [data, report])

  const columns = report.columns?.length ? report.columns : Object.keys(rows[0] || {}).filter((k) => !['id', 'companyId', 'isActive'].includes(k))

  const totals = (key: string) => NUMERIC_FIELDS.includes(key) ? rows.reduce((s, r) => s + Number(r[key] || 0), 0) : null

  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  const exportPdf = () => {
    setBusy(true)
    api.exportReport(report, rows)
      .then((res: any) => {
        if (!res.ok) addToast({ title: 'Export failed', description: res.error, variant: 'destructive' })
      })
      .finally(() => setBusy(false))
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>

  const exportBtn = (
    <Button variant="outline" size="sm" onClick={exportPdf} disabled={busy}>
      {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Printer size={14} className="mr-1.5" />}
      Print / PDF
    </Button>
  )

  if (report.reportType === 'chart') {
    const groupField = report.grouping?.field || columns.find((c: string) => !NUMERIC_FIELDS.includes(c)) || columns[0]
    const numericField = columns.find((c: string) => NUMERIC_FIELDS.includes(c))
    const groups: Record<string, number> = {}
    for (const r of rows) {
      const key = String(r[groupField] ?? '(blank)')
      const v = numericField ? Number(r[numericField] || 0) : 1
      groups[key] = (groups[key] || 0) + v
    }
    const entries = Object.entries(groups)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">{exportBtn}</div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No matching records.</p>
        ) : (
          report.chartType === 'pie' ? <PieChart data={entries} label={getFieldLabel(groupField)} /> : <BarChart data={entries} label={getFieldLabel(groupField)} valueLabel={numericField ? getFieldLabel(numericField) : 'Count'} />
        )}
      </div>
    )
  }

  if (report.reportType === 'summary' && report.grouping?.field) {
    const groups: Record<string, any[]> = {}
    for (const r of rows) {
      const key = String(r[report.grouping.field] ?? '(blank)')
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    const groupField = report.grouping.field
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end">{exportBtn}</div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {Object.entries(groups).map(([key, items]) => (
          <div key={key} className="rounded-lg border">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-lg">
              <span className="text-sm font-semibold">{getFieldLabel(groupField)}: {key}</span>
              <span className="text-xs text-muted-foreground">{items.length} records</span>
            </div>
            <div className="px-3 py-2 space-y-1">
              {columns.filter((c: string) => c !== groupField).map((c: string) => {
                const total = totals(c)
                return (
                  <div key={c} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{getFieldLabel(c)}</span>
                    <span className="font-medium">{total != null ? formatFieldValue(total, c) : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No matching records.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">{exportBtn}</div>
      <div className="max-h-[60vh] overflow-auto">
        <DataTable
          columns={columns.map((c: string) => ({ key: c, label: getFieldLabel(c), render: (v: any) => <span>{formatFieldValue(v, c)}</span> }))}
          data={rows}
          loading={false}
          emptyMessage="No matching records."
          pageSize={20}
        />
        <div className="flex gap-4 justify-end pt-2 text-sm font-medium">
          <span>Total records: {rows.length}</span>
          {columns.map((c: string) => {
            const total = totals(c)
            return total != null ? <span key={c}>{getFieldLabel(c)} total: {formatFieldValue(total, c)}</span> : null
          })}
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, label, valueLabel }: { data: [string, number][]; label: string; valueLabel: string }) {
  const max = Math.max(...data.map(([, v]) => v), 1)
  const width = 560
  const height = 260
  const padL = 54
  const padB = 48
  const padT = 16
  const chartW = width - padL - 12
  const chartH = height - padB - padT
  const barW = Math.min(64, (chartW / data.length) * 0.55)
  const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(Math.round(v))
  const steps = 5
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline gap-2 mb-3">
        <span className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 size={14} className="text-primary" /> {valueLabel} by {label}</span>
        <span className="text-xs text-muted-foreground ml-auto">{data.length} groups</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-h-[300px]">
        {Array.from({ length: steps + 1 }).map((_, i) => {
          const y = padT + (chartH / steps) * i
          const val = max * (1 - i / steps)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={width - 12} y2={y} stroke="currentColor" strokeOpacity="0.08" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity="0.5">{fmt(val)}</text>
            </g>
          )
        })}
        {data.map(([key, v], i) => {
          const x = padL + (chartW / data.length) * i + (chartW / data.length - barW) / 2
          const h = Math.max((v / max) * chartH, 2)
          const y = padT + chartH - h
          const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16']
          return (
            <g key={key}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={colors[i % colors.length]} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor">{fmt(v)}</text>
              <text x={x + barW / 2} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.65" style={{ transform: data.length > 6 ? `translateX(0)` : undefined }}>{data.length > 6 ? String(key).slice(0, 8) + (String(key).length > 8 ? '…' : '') : String(key).slice(0, 16)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16', '#f97316', '#14b8a6']

function PieChart({ data, label }: { data: [string, number][]; label: string }) {
  const total = data.reduce((s, [, v]) => s + v, 0)
  const cx = 90
  const cy = 90
  const r = 70
  let angle = -Math.PI / 2
  const segments = data.map(([key, v], i) => {
    const a1 = angle
    const a2 = angle + (v / total) * Math.PI * 2
    angle = a2
    const large = a2 - a1 > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy + r * Math.sin(a2)
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    return { key, v, path, color: PIE_COLORS[i % PIE_COLORS.length] }
  })
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-sm font-semibold flex items-center gap-1.5"><ChartPie size={14} className="text-primary" /> {label} distribution</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No numeric data to chart.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
            {segments.map(s => <path key={s.key} d={s.path} fill={s.color} />)}
            <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--background, #fff)" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{total.toLocaleString()}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.6">TOTAL</text>
          </svg>
          <div className="space-y-1.5 min-w-[220px] max-h-[260px] overflow-y-auto flex-1">
            {segments.map(s => (
              <div key={s.key} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="truncate flex-1">{s.key}</span>
                <span className="text-muted-foreground font-mono">{((s.v / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function XIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
