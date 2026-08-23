import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TabsRoot, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, BarChart3, Play, Printer, Table2, ChartPie, Download, Folder, Clock, TrendingUp, DollarSign, UserPlus, CalendarDays, LifeBuoy, Receipt, Users, Megaphone } from 'lucide-react'
import { getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { formatDate } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails', 'projects', 'projecttasks', 'projectmilestones', 'assets', 'servicecontracts']

const moduleFields: Record<string, string[]> = {
  accounts: ['accountName', 'accountNo', 'accountType', 'industry', 'annualRevenue', 'phone', 'email', 'website', 'billingCity', 'billingState', 'billingCountry', 'employees', 'description'],
  contacts: ['firstName', 'lastName', 'title', 'department', 'email', 'secondaryEmail', 'phone', 'mobile', 'leadSource', 'assignedTo', 'description'],
  leads: ['firstName', 'lastName', 'company', 'title', 'email', 'phone', 'mobile', 'website', 'leadStatus', 'leadSource', 'industry', 'annualRevenue', 'description'],
  potentials: ['potentialName', 'potentialNo', 'amount', 'currency', 'forecastAmount', 'closingDate', 'stage', 'probability', 'type', 'leadSource', 'nextStep', 'assignedTo', 'description'],
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

const NUMERIC_FIELDS = ['amount', 'grandTotal', 'subTotal', 'annualRevenue', 'unitPrice', 'costPrice', 'commissionRate', 'qtyInStock', 'expectedRevenue', 'actualCost', 'budget', 'targetBudget', 'actualBudget', 'forecastAmount', 'qtyPerUnit', 'expectedCount', 'actualCount', 'progress', 'probability', 'rate', 'discount', 'tax']

const DEFAULT_SCHEDULE = { enabled: false, frequency: 'daily', hour: 8, minute: 0, dayOfWeek: 1, dayOfMonth: 1, emailTo: '' }

function fmtNum(v: any): string {
  if (v == null || v === '') return '0.00'
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)
}

export function ReportsPage() {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [running, setRunning] = useState<any | null>(null)
  const [folderFilter, setFolderFilter] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['reports'], queryFn: () => api.list('reports', { limit: '100' }) })

  const reports = data?.data || []
  const folders = useMemo(() => [...new Set(reports.map((r: any) => r.folder).filter(Boolean) as string[])].sort(), [reports])
  const visible = folderFilter ? reports.filter((r: any) => r.folder === folderFilter) : reports

  const [reportView, setReportView] = useState<'analytics' | 'custom'>('analytics')
  const [selectedPrebuilt, setSelectedPrebuilt] = useState<any>(null)
  const [prebuiltDateFrom, setPrebuiltDateFrom] = useState('')
  const [prebuiltDateTo, setPrebuiltDateTo] = useState('')
  const [generatingPrebuilt, setGeneratingPrebuilt] = useState(false)
  const [prebuiltResult, setPrebuiltResult] = useState<any>(null)

  const PREBUILT_REPORTS = [
    { id: 'sales-pipeline', name: 'Sales Pipeline Report', icon: TrendingUp, description: 'Opportunities grouped by stage', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
    { id: 'revenue', name: 'Revenue Report', icon: DollarSign, description: 'Revenue breakdown by period', color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' },
    { id: 'lead-source', name: 'Lead Source Report', icon: UserPlus, description: 'Leads grouped by source', color: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
    { id: 'activity', name: 'Activity Report', icon: CalendarDays, description: 'Activities by type and status', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
    { id: 'ticket-performance', name: 'Ticket Performance', icon: LifeBuoy, description: 'Resolution times and SLA', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
    { id: 'invoice-aging', name: 'Invoice Aging', icon: Receipt, description: 'Outstanding invoices by age', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
    { id: 'user-performance', name: 'User Performance', icon: Users, description: 'Deals and revenue per user', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
    { id: 'campaign-roi', name: 'Campaign ROI', icon: Megaphone, description: 'Campaign costs vs. revenue', color: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400' },
  ]

  const generatePrebuilt = async (reportId: string) => {
    setGeneratingPrebuilt(true)
    setPrebuiltResult(null)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ reportType: reportId, dateFrom: prebuiltDateFrom || undefined, dateTo: prebuiltDateTo || undefined }),
        signal: controller.signal,
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error || `Report request failed (${res.status})`)
      if (!payload.data) throw new Error('The report service returned no data')
      setPrebuiltResult(payload.data)
    } catch (error: any) {
      const message = error?.name === 'AbortError' ? 'The report took too long. Please try a shorter date range.' : error?.message
      addToast({ title: 'Error generating report', description: message || 'Please try again.', variant: 'destructive' })
      setSelectedPrebuilt(null)
    } finally {
      window.clearTimeout(timeout)
      setGeneratingPrebuilt(false)
    }
  }

  const exportPrebuiltCsv = async (reportId: string) => {
    try { await api.openAuthenticatedFile(`/reports/export/${reportId}`, `${reportId}.csv`) }
    catch (e: any) { addToast({ title: 'Export failed', description: e.message, variant: 'destructive' }) }
  }

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
          <p className="text-sm text-muted-foreground mt-0.5">Pre-built analytics reports and custom report builder with folders and scheduling.</p>
        </div>
        <div className="flex items-center gap-2">
          {folders.length > 0 && (
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-44"><span className="flex items-center gap-1.5"><Folder size={13} /> <SelectValue /></span></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All folders</SelectItem>
                {folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={15} className="mr-1.5" /> New Report</Button>
        </div>
      </div>

      <TabsRoot value={reportView} onValueChange={v => setReportView(v as typeof reportView)}>
        <TabsList>
          <TabsTrigger value="analytics"><TrendingUp size={14} className="mr-2" />Analytics library</TabsTrigger>
          <TabsTrigger value="custom"><Table2 size={14} className="mr-2" />Custom reports ({reports.length})</TabsTrigger>
        </TabsList>
      </TabsRoot>

      {reportView === 'analytics' && <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Quick Analytics Reports</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Generate pre-built reports with a single click. Add date filters for specific periods.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PREBUILT_REPORTS.map((report) => (
            <button
              key={report.id}
              onClick={() => { setSelectedPrebuilt(report); generatePrebuilt(report.id) }}
              className="group rounded-lg border p-3 text-left transition-all hover:border-primary hover:shadow-sm"
            >
              <div className={`grid h-8 w-8 place-items-center rounded-md mb-2 ${report.color}`}>
                <report.icon size={15} />
              </div>
              <p className="text-xs font-semibold group-hover:text-primary transition-colors">{report.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{report.description}</p>
            </button>
          ))}
        </div>
      </div>}

      <Dialog open={!!selectedPrebuilt && !prebuiltResult} onOpenChange={(open) => { if (!open) { setSelectedPrebuilt(null); setPrebuiltResult(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedPrebuilt?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Generating report… This should only take a moment.</p>
            {generatingPrebuilt && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={24} /></div>}
            <Button variant="outline" className="w-full" onClick={() => { setSelectedPrebuilt(null); setPrebuiltResult(null) }}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!prebuiltResult} onOpenChange={() => setPrebuiltResult(null)}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {prebuiltResult?.title}
              <span className="text-xs font-normal text-muted-foreground ml-2">{prebuiltResult?.rows?.length ?? 0} rows</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium block mb-1">From</label>
                  <Input type="date" value={prebuiltDateFrom} onChange={(e) => setPrebuiltDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">To</label>
                  <Input type="date" value={prebuiltDateTo} onChange={(e) => setPrebuiltDateTo(e.target.value)} />
                </div>
              </div>
              <Button size="sm" onClick={() => { if (selectedPrebuilt) generatePrebuilt(selectedPrebuilt.id) }} disabled={generatingPrebuilt} className="mt-5">
                {generatingPrebuilt ? <Loader2 size={14} className="animate-spin" /> : 'Refresh'}
              </Button>
            </div>
            {prebuiltResult?.rows?.length > 0 ? (
              <div className="max-h-[50vh] overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {prebuiltResult.columns?.map((col: string) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prebuiltResult.rows.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                        {prebuiltResult.columns?.map((col: string) => (
                          <td key={col} className="px-3 py-2 text-xs">{typeof row[col] === 'number' ? row[col].toLocaleString() : (row[col] ?? '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No data found for the selected period.</p>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => exportPrebuiltCsv(selectedPrebuilt?.id || '')}>
                <Download size={14} className="mr-1.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrebuiltResult(null)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {reportView === 'custom' && <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (v, r) => <span className="font-medium">{v}{r.schedule?.enabled ? <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 text-[11px]"><Clock size={11} /> Scheduled</span> : null}</span> },
          { key: 'folder', label: 'Folder', render: (v) => v ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Folder size={12} /> {v}</span> : <span className="text-muted-foreground">—</span> },
          { key: 'moduleName', label: 'Module', render: (v) => <span className="text-muted-foreground capitalize">{v}</span> },
          { key: 'reportType', label: 'Type', render: (v) => <span className="capitalize">{v}</span> },
          { key: 'lastRunAt', label: 'Last Run', render: (v) => <span className="text-muted-foreground">{v ? formatDate(v) : '—'}</span> },
          { key: 'createdAt', label: 'Created', render: (v) => <span className="text-muted-foreground">{v ? formatDate(v) : '—'}</span> },
        ]}
        data={visible}
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
      />}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditing(null); setShowForm(o) }}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
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
  const matrix = initial?.grouping?.matrix || {}
  const [form, setForm] = useState<any>({
    name: initial?.name || '',
    moduleName: initial?.moduleName || 'accounts',
    reportType: initial?.reportType || 'tabular',
    chartType: initial?.chartType || 'bar',
    folder: initial?.folder || '',
    columns: initial?.columns || [],
    grouping: initial?.grouping || {},
    matrix: { rowField: matrix.rowField || '', columnField: matrix.columnField || '', valueField: matrix.valueField || '', aggregate: matrix.aggregate || 'sum' },
    filters: initial?.filters || [],
    sort: initial?.sort || [],
    schedule: initial?.schedule || { ...DEFAULT_SCHEDULE },
  })
  const [filterField, setFilterField] = useState('')
  const fields = moduleFields[form.moduleName] || []
  const available = fields.filter((f) => !form.columns.includes(f))
  const set = (patch: any) => setForm((p: any) => ({ ...p, ...patch }))

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
    const grouping = form.reportType === 'matrix'
      ? { matrix: { rowField: form.matrix.rowField, columnField: form.matrix.columnField, valueField: form.matrix.valueField, aggregate: form.matrix.aggregate } }
      : form.grouping
    const schedule = form.schedule?.enabled ? form.schedule : null
    onSave({
      name: form.name,
      moduleName: form.moduleName,
      reportType: form.reportType,
      chartType: form.reportType === 'chart' ? form.chartType : null,
      folder: form.folder || null,
      columns: form.columns,
      grouping,
      filters: form.filters,
      sort: form.sort,
      schedule,
    })
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5)
  const dowOptions = [
    { v: '1', l: 'Monday' }, { v: '2', l: 'Tuesday' }, { v: '3', l: 'Wednesday' },
    { v: '4', l: 'Thursday' }, { v: '5', l: 'Friday' }, { v: '6', l: 'Saturday' }, { v: '0', l: 'Sunday' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Report Name</label>
          <Input placeholder="e.g. Open Opportunities" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Folder</label>
          <Input placeholder="e.g. Sales" value={form.folder} onChange={(e) => set({ folder: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Module</label>
          <Select value={form.moduleName} onValueChange={(v) => setForm((f: any) => ({ ...f, moduleName: v, columns: [], grouping: {}, matrix: { rowField: '', columnField: '', valueField: '', aggregate: 'sum' }, filters: [] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Type</label>
          <Select value={form.reportType} onValueChange={(v) => set({ reportType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tabular">Tabular</SelectItem>
              <SelectItem value="summary">Summary (grouped)</SelectItem>
              <SelectItem value="matrix">Matrix (pivot)</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.reportType === 'chart' && (
          <div>
            <label className="text-sm font-medium block mb-1.5">Chart Type</label>
            <Select value={form.chartType || 'bar'} onValueChange={(v) => set({ chartType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {form.reportType === 'matrix' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border p-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Row Field</label>
            <Select value={form.matrix.rowField} onValueChange={(v) => setForm((f: any) => ({ ...f, matrix: { ...f.matrix, rowField: v } }))}>
              <SelectTrigger><SelectValue placeholder="Field for rows" /></SelectTrigger>
              <SelectContent>
                {fields.map((f) => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Column Field</label>
            <Select value={form.matrix.columnField} onValueChange={(v) => setForm((f: any) => ({ ...f, matrix: { ...f.matrix, columnField: v } }))}>
              <SelectTrigger><SelectValue placeholder="Field for columns" /></SelectTrigger>
              <SelectContent>
                {fields.map((f) => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Value Field</label>
              <Select value={form.matrix.valueField} onValueChange={(v) => setForm((f: any) => ({ ...f, matrix: { ...f.matrix, valueField: v } }))}>
                <SelectTrigger><SelectValue placeholder="Numeric field" /></SelectTrigger>
                <SelectContent>
                  {fields.filter((f) => NUMERIC_FIELDS.includes(f)).map((f) => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Aggregate</label>
              <Select value={form.matrix.aggregate} onValueChange={(v) => setForm((f: any) => ({ ...f, matrix: { ...f.matrix, aggregate: v } }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {form.reportType !== 'matrix' && (
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
      )}

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

      {form.reportType === 'chart' && (
        <div>
          <label className="text-sm font-medium block mb-1.5">Chart Group By</label>
          <Select value={form.grouping?.field || ''} onValueChange={setGroupBy}>
            <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
            <SelectContent>
              {fields.map((f) => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
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
                <SelectItem value="gte">Greater or equal</SelectItem>
                <SelectItem value="lt">Less than</SelectItem>
                <SelectItem value="lte">Less or equal</SelectItem>
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

      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Schedule &amp; Email</div>
            <div className="text-xs text-muted-foreground">Run this report periodically and email the results</div>
          </div>
          <Switch checked={form.schedule?.enabled} onCheckedChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, enabled: v } }))} />
        </div>
        {form.schedule?.enabled && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Frequency</label>
              <Select value={form.schedule.frequency} onValueChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, frequency: v } }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.schedule.frequency === 'weekly' && (
              <div>
                <label className="text-xs font-medium block mb-1">Day of week</label>
                <Select value={String(form.schedule.dayOfWeek)} onValueChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, dayOfWeek: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dowOptions.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.schedule.frequency === 'monthly' && (
              <div>
                <label className="text-xs font-medium block mb-1">Day of month</label>
                <Select value={String(form.schedule.dayOfMonth)} onValueChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, dayOfMonth: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium block mb-1">Time</label>
              <div className="flex gap-1.5">
                <Select value={String(form.schedule.hour)} onValueChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, hour: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {hourOptions.map(h => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(form.schedule.minute)} onValueChange={(v) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, minute: Number(v) } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map(m => <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="text-xs font-medium block mb-1">Email to (comma separated)</label>
              <Input placeholder="reports@example.com, mgr@example.com" value={form.schedule.emailTo || ''} onChange={(e) => setForm((f: any) => ({ ...f, schedule: { ...f.schedule, emailTo: e.target.value } }))} />
            </div>
          </div>
        )}
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
          case 'gte': return Number(rv) >= Number(val)
          case 'lt': return Number(rv) < Number(val)
          case 'lte': return Number(rv) <= Number(val)
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

  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null)
  const { addToast } = useToast()

  const exportPdf = () => {
    setBusy('pdf')
    api.exportReport(report, rows)
      .then((res: any) => {
        if (!res.ok) addToast({ title: 'Export failed', description: res.error, variant: 'destructive' })
      })
      .finally(() => setBusy(null))
  }

  const exportCsv = () => {
    setBusy('csv')
    api.exportReportCsv(report, rows)
      .then((res: any) => {
        if (!res.ok) addToast({ title: 'Export failed', description: res.error, variant: 'destructive' })
      })
      .finally(() => setBusy(null))
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>

  const exportBtns = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportCsv} disabled={busy !== null}>
        {busy === 'csv' ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf} disabled={busy !== null}>
        {busy === 'pdf' ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Printer size={14} className="mr-1.5" />}
        Print / PDF
      </Button>
    </div>
  )

  if (report.reportType === 'matrix') {
    const mc = report.grouping?.matrix || {}
    const { rowField, columnField, valueField, aggregate } = mc
    const rowVals = [...new Set(rows.map((r: any) => String(r[rowField] ?? '(blank)')))]
    const colVals = [...new Set(rows.map((r: any) => String(r[columnField] ?? '(blank)')))]
    const cell = (rv: string, cv: string): number => {
      const recs = rows.filter((r: any) => String(r[rowField] ?? '(blank)') === rv && String(r[columnField] ?? '(blank)') === cv)
      if (aggregate === 'count') return recs.length
      return recs.reduce((s, r: any) => s + Number(r[valueField] || 0), 0)
    }
    const rowTotals = rowVals.map(rv => colVals.reduce((s, cv) => s + cell(rv, cv), 0))
    const colTotals = colVals.map(cv => rowVals.reduce((s, rv) => s + cell(rv, cv), 0))
    const grand = rowTotals.reduce((s, v) => s + v, 0)
    if (!rowField || !columnField) {
      return <div className="space-y-3"><div className="flex justify-end">{exportBtns}</div><p className="text-sm text-muted-foreground py-6 text-center">Matrix requires row and column fields. Edit the report to configure them.</p></div>
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end">{exportBtns}</div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No matching records.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <div className="text-xs text-muted-foreground mb-2">
              {getFieldLabel(rowField)} × {getFieldLabel(columnField)} — {aggregate === 'count' ? 'Count' : `Sum of ${getFieldLabel(valueField)}`}
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border bg-muted/50 px-2 py-1.5 text-left font-semibold">{getFieldLabel(rowField)}</th>
                  {colVals.map((cv: string) => <th key={cv} className="border bg-muted/50 px-2 py-1.5 font-semibold whitespace-nowrap">{cv}</th>)}
                  <th className="border bg-muted/60 px-2 py-1.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rowVals.map((rv: string, i: number) => (
                  <tr key={rv}>
                    <th className="border px-2 py-1.5 text-left font-medium whitespace-nowrap">{rv}</th>
                    {colVals.map((cv: string) => <td key={cv} className="border px-2 py-1.5 text-right font-mono tabular-nums">{fmtNum(cell(rv, cv))}</td>)}
                    <td className="border bg-muted/40 px-2 py-1.5 text-right font-semibold font-mono tabular-nums">{fmtNum(rowTotals[i])}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="border bg-muted/60 px-2 py-1.5 text-left font-semibold">Total</th>
                  {colTotals.map((t: number, i: number) => <td key={i} className="border bg-muted/40 px-2 py-1.5 text-right font-semibold font-mono tabular-nums">{fmtNum(t)}</td>)}
                  <td className="border bg-primary/10 px-2 py-1.5 text-right font-bold font-mono tabular-nums">{fmtNum(grand)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

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
        <div className="flex items-center justify-end">{exportBtns}</div>
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
        <div className="flex items-center justify-end">{exportBtns}</div>
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
      <div className="flex items-center justify-end">{exportBtns}</div>
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
              <text x={x + barW / 2} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.65">{data.length > 6 ? String(key).slice(0, 8) + (String(key).length > 8 ? '…' : '') : String(key).slice(0, 16)}</text>
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
