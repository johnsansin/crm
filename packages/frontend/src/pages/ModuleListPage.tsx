import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RowActions } from '@/components/ui/row-actions'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { getFieldLabel } from '@/lib/field-utils'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Plus, Search, RefreshCw, LayoutGrid, List, Download, Upload, Columns3, Loader2, Mail, FileDown, Copy, GitMerge, Trash2, Bell, SlidersHorizontal, TrendingUp, Clock3, CheckSquare2, Pencil, MoreHorizontal } from 'lucide-react'
import { t } from '@/lib/i18n'

const kanbanModules = ['potentials', 'tickets', 'projects']

const labelMap: Record<string, string> = {
  accounts: 'Accounts', contacts: 'Contacts', leads: 'Leads',
  potentials: 'Opportunities', campaigns: 'Campaigns', competitors: 'Competitors',
  products: 'Products', services: 'Services', vendors: 'Vendors',
  pricebooks: 'Price Books', quotes: 'Quotes',
  salesorders: 'Sales Orders', purchaseorders: 'Purchase Orders',
  invoices: 'Invoices', tickets: 'Tickets', faq: 'FAQ',
  documents: 'Documents', emails: 'Emails',
  emailtemplates: 'Email Templates', projects: 'Projects',
  projecttasks: 'Project Tasks', projectmilestones: 'Project Milestones',
  timeentries: 'Time Entries', projectresources: 'Project Resources',
  assets: 'Assets', servicecontracts: 'Service Contracts',
  smsnotifier: 'SMS Notifier', receipts: 'Receipts', payments: 'Payments',
  recurringinvoices: 'Recurring Invoices', calllogs: 'Phone Calls',
  reports: 'Reports', mailboxes: 'Mailboxes', rssfeeds: 'RSS Feeds',
  stageprobability: 'Stage Probabilities',
  quantitydiscounts: 'Quantity Discounts',
}

const displayFields: Record<string, string[]> = {
  accounts: ['accountName', 'email', 'phone', 'industry'],
  contacts: ['firstName', 'lastName', 'email', 'phone'],
  leads: ['firstName', 'lastName', 'company', 'email', 'leadStatus'],
  potentials: ['potentialName', 'amount', 'currency', 'stage', 'closingDate'],
  competitors: ['competitorName', 'website', 'marketShare', 'rating', 'products'],
  campaigns: ['campaignName', 'campaignType', 'status', 'startDate'],
  products: ['productName', 'productCategory', 'unitPrice', 'qtyInStock'],
  services: ['serviceName', 'serviceCategory', 'unitPrice'],
  vendors: ['vendorName', 'email', 'phone', 'category'],
  pricebooks: ['priceBookName'],
  quotes: ['quoteNo', 'subject', 'grandTotal', 'quoteStage'],
  salesorders: ['salesOrderNo', 'subject', 'grandTotal', 'soStatus'],
  purchaseorders: ['purchaseOrderNo', 'subject', 'grandTotal', 'poStatus'],
  invoices: ['invoiceNo', 'subject', 'grandTotal', 'invoiceStatus'],
  tickets: ['ticketNo', 'title', 'status', 'priority'],
  faq: ['title', 'category', 'status'],
  documents: ['title', 'fileName', 'fileType'],
  emails: ['subject', 'fromEmail', 'dateSent'],
  emailtemplates: ['templateName', 'subject', 'module'],
  projects: ['projectName', 'status', 'priority', 'progress'],
  projecttasks: ['title', 'status', 'priority', 'progress'],
  projectmilestones: ['title', 'status', 'progress'],
  timeentries: ['projectId', 'date', 'hours', 'billable', 'approved'],
  projectresources: ['projectId', 'userId', 'role', 'allocationPercent'],
  assets: ['assetName', 'serialNo', 'status'],
  servicecontracts: ['contractName', 'contractType', 'status'],
  smsnotifier: ['toNumber', 'message', 'status'],
  receipts: ['invoiceId', 'amount', 'paymentDate', 'method', 'reference'],
  payments: ['purchaseOrderId', 'amount', 'paymentDate', 'method', 'reference'],
  recurringinvoices: ['frequency', 'interval', 'nextRun', 'isActive'],
  calllogs: ['fromNumber', 'toNumber', 'direction', 'callTime', 'status'],
  reports: ['name', 'moduleName', 'reportType'],
  stageprobability: ['stageName', 'probability', 'sequence', 'color'],
  quantitydiscounts: ['productId', 'minQty', 'maxQty', 'discountPercent', 'isActive'],
  mailboxes: ['name', 'host', 'user', 'lastSyncAt'],
  rssfeeds: ['name', 'category', 'lastFetchedAt'],
}

export function ModuleListPage() {
  const { module } = useParams<{ module: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [hiddenCols, setHiddenCols] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [leadView, setLeadView] = useState<'all' | 'overdue' | 'followup'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mod = module || ''
  const hasKanban = kanbanModules.includes(mod)

  const { data, isLoading } = useQuery({
    queryKey: [mod, 'list', page, search, sortKey, sortOrder],
    queryFn: () => api.list(mod, { page: String(page), limit: '25', search, ...(sortKey ? { sortBy: sortKey, sortOrder } : {}) }),
    enabled: !!mod && mod !== 'settings' && viewMode === 'list',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(mod, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [mod] })
      addToast({ title: t('Deleted'), description: t('Record has been deleted'), variant: 'success' })
    },
    onError: (err: Error) => {
      addToast({ title: t('Error'), description: err.message, variant: 'destructive' })
    },
  })

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    Promise.all(ids.map(id => api.delete(mod, id).catch(() => null)))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [mod] })
        addToast({ title: t('Deleted'), description: `${ids.length} ${t('record(s) deleted')}`, variant: 'success' })
        setSelectedIds(new Set())
      })
  }

  const handleBulkEmail = async () => {
    const to = prompt('Send to email (comma-separated for multiple):')
    if (!to) return
    const ids = Array.from(selectedIds)
    try {
      for (const id of ids) {
        await api.request(`/${mod}/${id}/email`, { method: 'POST', body: JSON.stringify({ to }) }).catch(() => null)
      }
      addToast({ title: 'Sent', description: `Email sent to ${to}`, variant: 'success' })
      setSelectedIds(new Set())
    } catch {
      addToast({ title: 'Error', description: 'Failed to send emails', variant: 'destructive' })
    }
  }

  const handleBulkPdf = () => {
    const ids = Array.from(selectedIds)
    ids.forEach(id => {
      const token = localStorage.getItem('token')
      window.open(`/api/${mod}/${id}/pdf?token=${encodeURIComponent(token || '')}`, '_blank')
    })
  }

  const handleRowEmail = (record: any) => {
    const to = prompt('Send to email:')
    if (!to) return
    api.request(`/${mod}/${record.id}/email`, { method: 'POST', body: JSON.stringify({ to }) })
      .then(() => addToast({ title: 'Sent', description: `Email sent to ${to}`, variant: 'success' }))
      .catch(() => addToast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' }))
  }

  const handleRowPdf = (record: any) => {
    const token = localStorage.getItem('token')
    window.open(`/api/${mod}/${record.id}/pdf?token=${encodeURIComponent(token || '')}`, '_blank')
  }

  const handleRowDuplicate = (record: any) => {
    const { id, createdAt, updatedAt, ...rest } = record
    const payload = { ...rest, [fields[0]]: `${record[fields[0]] || 'Record'} (Copy)` }
    api.create(mod, payload)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [mod] })
        addToast({ title: 'Duplicated', description: 'Record duplicated successfully', variant: 'success' })
      })
      .catch(() => addToast({ title: 'Error', description: 'Failed to duplicate record', variant: 'destructive' }))
  }

  const handleRowMerge = (record: any) => {
    const targetId = prompt('Enter the ID of the record to merge into:')
    if (!targetId || targetId === record.id) return
    api.request(`/${mod}/${record.id}/merge`, { method: 'POST', body: JSON.stringify({ targetId }) })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [mod] })
        addToast({ title: 'Merged', description: 'Records merged successfully', variant: 'success' })
      })
      .catch(() => addToast({ title: 'Error', description: 'Failed to merge records', variant: 'destructive' }))
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === (data?.data || []).length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set((data?.data || []).map((r: any) => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fields = [...(displayFields[mod] || ['id']), '__tags']
  const label = t(labelMap[mod] || mod)

  const { data: tagsData } = useQuery({
    queryKey: ['tags', mod, 'list'],
    queryFn: () => api.getTags({ module: mod }),
    enabled: !!mod,
  })
  const tagsByRecord = new Map<string, any[]>()
  for (const tag of tagsData?.data || []) {
    if (!tag.recordId || tag.module !== mod) continue
    tagsByRecord.set(tag.recordId, [...(tagsByRecord.get(tag.recordId) || []), tag])
  }

  const monetaryColumns = ['amount', 'grandTotal', 'subTotal', 'unitPrice', 'costPrice', 'annualRevenue', 'expectedRevenue', 'budget', 'actualCost', 'shipping', 'shippingHandling', 'discount', 'adjustment', 'salesCommission', 'exciseDuty', 'targetBudget', 'actualBudget', 'paidAmount']

  const { data: receiptsInvoiceData } = useQuery({
    queryKey: ['receipts-invoices-list'],
    queryFn: () => api.listAll('invoices'),
    enabled: mod === 'receipts',
  })
  const { data: paymentsPOData } = useQuery({
    queryKey: ['payments-pos-list'],
    queryFn: () => api.listAll('purchaseorders'),
    enabled: mod === 'payments',
  })
  const invoicesMap: Record<string, any> = {}
  const posMap: Record<string, any> = {}
  for (const inv of (receiptsInvoiceData?.data || [])) invoicesMap[inv.id] = inv
  for (const po of (paymentsPOData?.data || [])) posMap[po.id] = po

  const columns = fields
    .filter(f => f && !hiddenCols.includes(f))
    .map(f => ({
      key: f,
      label: f === '__tags' ? 'Tags' : getFieldLabel(f),
      sortable: f !== '__tags',
      className: monetaryColumns.includes(f) ? 'text-right' : '',
      ...(f === '__tags' ? {
        render: (_val: any, record: any) => <div className="flex max-w-[220px] flex-wrap gap-1">{(tagsByRecord.get(record.id) || []).slice(0, 3).map((tag: any) => <span key={tag.id} style={tag.color ? { color: tag.color, borderColor: tag.color, backgroundColor: `${tag.color}12` } : undefined} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{tag.name}</span>)}{(tagsByRecord.get(record.id) || []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}</div>
      } : f === 'invoiceId' && mod === 'receipts' ? {
        render: (val: string) => {
          const inv = invoicesMap[val]
          return inv ? `${inv.invoiceNo || 'No#'} — ${inv.subject}` : <span className="text-muted-foreground">-</span>
        }
      } : f === 'purchaseOrderId' && mod === 'payments' ? {
        render: (val: string) => {
          const po = posMap[val]
          return po ? `${po.purchaseOrderNo || 'No#'} — ${po.subject}` : <span className="text-muted-foreground">-</span>
        }
      } : f === 'probability' && mod === 'stageprobability' ? {
        render: (val: any, record: any) => <div className="flex min-w-[150px] items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(val) || 0))}%`, backgroundColor: record.color || '#2563eb' }} /></div><span className="w-10 text-right text-xs font-bold tabular-nums">{Number(val) || 0}%</span></div>
      } : f === 'color' && mod === 'stageprobability' ? {
        render: (val: any) => <span className="inline-flex items-center gap-2"><span className="h-5 w-5 rounded-md border shadow-sm" style={{ backgroundColor: val || '#2563eb' }} /><span className="font-mono text-xs text-muted-foreground">{val || '#2563eb'}</span></span>
      } : {}),
    }))

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortKey(key)
    setSortOrder(order)
    setPage(1)
  }

  if (mod === 'leads') {
    const allLeads: any[] = data?.data || []
    const now = new Date()
    const isOverdue = (lead: any) => lead.nextFollowUp && new Date(lead.nextFollowUp).getTime() < now.getTime()
    const visibleLeads = allLeads.filter(lead => leadView === 'all' || (leadView === 'overdue' ? isOverdue(lead) : /follow/i.test(lead.leadStatus || '')))
    const statusTone = (status: string) => /qualif/i.test(status) ? 'bg-emerald-50 text-emerald-700' : /follow|warm|contact/i.test(status) ? 'bg-amber-50 text-amber-700' : /lost|junk|cold/i.test(status) ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
    const initialsFor = (lead: any) => `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`.toUpperCase() || (lead.company?.slice(0, 2).toUpperCase() || 'LD')
    const scoreFor = (lead: any) => {
      const raw = Number(lead.leadScore ?? lead.score ?? lead.rating)
      return Number.isFinite(raw) ? Math.max(0, Math.min(raw > 10 ? raw / 10 : raw, 10)) : null
    }
    const formatFollowUp = (value: any) => {
      if (!value) return { label: 'Not scheduled', tone: 'text-slate-400' }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return { label: String(value), tone: 'text-slate-500' }
      const overdue = date.getTime() < now.getTime()
      return { label: `${overdue ? 'Overdue · ' : ''}${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, tone: overdue ? 'text-rose-600' : 'text-slate-600' }
    }
    const actionCards = [
      { icon: Bell, title: 'Overdue follow-ups', detail: `${allLeads.filter(isOverdue).length} on this page need attention`, tone: 'bg-rose-50 text-rose-600' },
      { icon: SlidersHorizontal, title: 'Focused views', detail: 'Switch between all, follow-up, and overdue leads', tone: 'bg-indigo-50 text-indigo-600' },
      { icon: CheckSquare2, title: 'Bulk actions', detail: 'Email, export, or remove selected records', tone: 'bg-emerald-50 text-emerald-600' },
      { icon: TrendingUp, title: 'Lead score', detail: 'Prioritize stronger-fit prospects at a glance', tone: 'bg-amber-50 text-amber-600' },
    ]
    return (
      <div className="w-full min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-2xl font-bold tracking-tight">Leads</h1><p className="mt-1 text-sm text-muted-foreground">Prioritize prospects, follow up on time, and move qualified leads forward.</p></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()}><Upload size={14} className="mr-1.5" />Import</Button>
            <Button variant="outline" size="sm" disabled={exporting} onClick={async () => { setExporting(true); const r = await api.exportModule(mod, 'csv').catch(() => ({ ok: false, error: 'Export failed' })); setExporting(false); if (!r.ok) addToast({ title: 'Export failed', description: r.error, variant: 'destructive' }) }}><Download size={14} className="mr-1.5" />Export</Button>
            <Button size="sm" onClick={() => navigate('/leads/new')}><Plus size={15} className="mr-1.5" />New lead</Button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={async e => { const file=e.target.files?.[0]; e.target.value=''; if(!file)return; setImporting(true); const res=await api.importModule(mod,file).catch(()=>null); setImporting(false); if(res?.success){addToast({title:'Import complete',description:`${res.created} created, ${res.failed} failed`,variant:'success'});queryClient.invalidateQueries({queryKey:[mod]})}else addToast({title:'Import failed',description:'Check the CSV and try again',variant:'destructive'}) }} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionCards.map(({ icon: Icon, title, detail, tone }) => <div key={title} className="flex gap-3 rounded-xl border bg-card p-3.5 shadow-sm"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={17}/></span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}
        </div>

        {selectedIds.size > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><span>{selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'} selected</span><span className="flex-1"/><Button size="sm" variant="secondary" onClick={handleBulkEmail}><Mail size={14} className="mr-1"/>Email</Button><Button size="sm" variant="secondary" onClick={handleBulkPdf}><FileDown size={14} className="mr-1"/>PDF</Button><Button size="sm" variant="destructive" onClick={handleBulkDelete}><Trash2 size={14} className="mr-1"/>Delete</Button></div>}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b p-3.5">
            <div className="inline-flex rounded-xl bg-muted p-1">
              {[['all','All leads'],['followup','Follow up'],['overdue','Overdue']].map(([value,text]) => <button key={value} onClick={() => setLeadView(value as any)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${leadView === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{text}</button>)}
            </div>
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search leads…" className="h-9 pl-9"/></div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={()=>queryClient.invalidateQueries({queryKey:[mod]})}><RefreshCw size={15}/></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead><tr className="border-b bg-muted/55 text-left text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground"><th className="w-12 px-4 py-3"><input type="checkbox" checked={allLeads.length > 0 && selectedIds.size === allLeads.length} onChange={toggleSelectAll}/></th><th className="px-3 py-3">Lead</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Next follow-up</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Created</th><th className="w-24 px-3 py-3"/></tr></thead>
              <tbody>{visibleLeads.map(lead => { const score=scoreFor(lead); const follow=formatFollowUp(lead.nextFollowUp); const name=[lead.firstName,lead.lastName].filter(Boolean).join(' ')||lead.company||'Untitled lead'; return <tr key={lead.id} className="group cursor-pointer border-b last:border-0 hover:bg-muted/35" onClick={()=>navigate(`/leads/${lead.id}`)}><td className="px-4 py-3" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(lead.id)} onChange={()=>toggleSelect(lead.id)}/></td><td className="px-3 py-3"><button type="button" className="flex items-center gap-2.5 text-left" onClick={e=>{e.stopPropagation();navigate(`/leads/${lead.id}`)}} aria-label={`View ${name}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">{initialsFor(lead)}</span><span><span className="block font-semibold text-foreground underline-offset-4 group-hover:text-indigo-700 group-hover:underline">{name}</span><span className="block text-xs text-muted-foreground">{[lead.company,lead.industry].filter(Boolean).join(' · ')||lead.email||'No company details'}</span></span></button></td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(lead.leadStatus||'New')}`}>{lead.leadStatus||'New'}</span></td><td className="px-3 py-3 text-muted-foreground">{lead.leadSource||'—'}</td><td className="px-3 py-3">{score == null ? <span className="text-muted-foreground">—</span> : <div className="flex items-center gap-2"><span className="w-7 font-semibold tabular-nums">{score.toFixed(1)}</span><span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-indigo-600" style={{width:`${score*10}%`}}/></span></div>}</td><td className={`px-3 py-3 text-xs font-semibold ${follow.tone}`}><Clock3 size={12} className="mr-1 inline"/>{follow.label}</td><td className="px-3 py-3 text-xs text-muted-foreground">{lead.ownerName||lead.assignedToName||'Unassigned'}</td><td className="px-3 py-3 text-xs text-muted-foreground">{lead.createdAt?new Date(lead.createdAt).toLocaleDateString():'—'}</td><td className="px-3 py-3"><div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100" onClick={e=>e.stopPropagation()}><button type="button" title="View lead" className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-indigo-600" onClick={()=>navigate(`/leads/${lead.id}`)}><Search size={13}/></button><button type="button" title="Edit lead" className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-indigo-600" onClick={()=>navigate(`/leads/${lead.id}/edit`)}><Pencil size={13}/></button><DropdownMenu><DropdownMenuTrigger asChild><button type="button" title="More actions" className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground"><MoreHorizontal size={14}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>handleRowEmail(lead)}><Mail size={14} className="mr-2"/>Send email</DropdownMenuItem><DropdownMenuItem onSelect={()=>handleRowPdf(lead)}><FileDown size={14} className="mr-2"/>Download PDF</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem className="text-red-600" onSelect={()=>setDeleteTarget({id:lead.id,name})}><Trash2 size={14} className="mr-2"/>Delete lead</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></td></tr> })}</tbody>
            </table>
            {!isLoading && visibleLeads.length === 0 && <div className="px-6 py-14 text-center"><p className="font-semibold">No leads match this view</p><p className="mt-1 text-sm text-muted-foreground">Try another view or clear the search.</p></div>}
            {isLoading && <div className="grid place-items-center py-14"><Loader2 className="animate-spin text-muted-foreground"/></div>}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {visibleLeads.length} of {data?.pagination?.total ?? visibleLeads.length} leads</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button><Button variant="outline" size="sm" disabled={!data?.pagination || page>=data.pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button></div></div>
        </section>
        <ConfirmDialog open={!!deleteTarget} onOpenChange={()=>setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Record" description="Are you sure you want to delete this lead?" confirmLabel="Delete" variant="destructive"/>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mod === 'stageprobability' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-xl shadow-indigo-500/20 sm:p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Sales configuration</p><h1 className="mt-1 text-2xl font-bold">Stage Probability Matrix</h1><p className="mt-1 max-w-2xl text-sm text-indigo-100">Control opportunity forecasting by assigning a probability and colour to every sales stage.</p></div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {mod !== 'stageprobability' && <h1 className="text-xl md:text-2xl font-bold tracking-tight">{label}</h1>}
        <div className="flex items-center gap-2">
          {hasKanban && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')}
            >
              {viewMode === 'list' ? <LayoutGrid size={14} className="mr-1.5" /> : <List size={14} className="mr-1.5" />}
              {viewMode === 'list' ? t('Kanban') : t('List')}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 size={14} className="mr-1.5" /> {t('Columns')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto w-52">
              {fields.filter(Boolean).map(f => (
                <label key={f} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-input"
                    checked={!hiddenCols.includes(f)}
                    onChange={() => setHiddenCols(h =>
                      h.includes(f) ? h.filter(x => x !== f) : [...h, f]
                    )}
                  />
                  <span className="truncate">{getFieldLabel(f)}</span>
                </label>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exporting}>
                {exporting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
                {t('Export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={async () => {
                setExporting(true)
                const r = await api.exportModule(mod, 'csv').catch(() => ({ ok: false, error: 'Export failed' }))
                setExporting(false)
                if (!r.ok) addToast({ title: 'Export failed', description: r.error, variant: 'destructive' })
              }}>
                <Download size={14} className="mr-2" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={async () => {
                setExporting(true)
                const r = await api.exportModule(mod, 'json').catch(() => ({ ok: false, error: 'Export failed' }))
                setExporting(false)
                if (!r.ok) addToast({ title: 'Export failed', description: r.error, variant: 'destructive' })
              }}>
                <Download size={14} className="mr-2" /> JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
            {t('Import')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setImporting(true)
              const res = await api.importModule(mod, file).catch(() => null)
              setImporting(false)
              if (res?.success) {
                addToast({ title: 'Import complete', description: `${res.created} created, ${res.failed} failed`, variant: res.failed > 0 ? 'default' : 'success' })
                queryClient.invalidateQueries({ queryKey: [mod] })
              } else {
                addToast({ title: 'Import failed', description: 'Check the CSV and try again', variant: 'destructive' })
              }
            }}
          />
          <Button onClick={() => navigate(`/${mod}/new`)} className="whitespace-nowrap">
            <Plus size={16} className="mr-1 md:mr-2" /> <span className="hidden sm:inline">{t('New')} {label.slice(0, -1)}</span><span className="sm:hidden">{t('New')}</span>
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard module={mod} />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('Search...')}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 rounded-lg"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: [mod] })}>
              <RefreshCw size={16} />
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={data?.data || []}
            pagination={data?.pagination}
            onPageChange={setPage}
            onSort={handleSort}
            sortKey={sortKey || undefined}
            sortOrder={sortOrder}
            loading={isLoading}
            onRowClick={(record: any) => navigate(`/${mod}/${record.id}`)}
            selectedCount={selectedIds.size}
            bulkActions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                  <Mail size={14} className="mr-1" /> Email ({selectedIds.size})
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkPdf}>
                  <FileDown size={14} className="mr-1" /> PDF ({selectedIds.size})
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-500">
                  <Trash2 size={14} className="mr-1" /> Delete ({selectedIds.size})
                </Button>
              </div>
            }
            actions={(record: any) => (
              <div className="flex items-center gap-1">
                <label className="flex items-center" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-input cursor-pointer"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                  />
                </label>
                <RowActions
                  onView={() => navigate(`/${mod}/${record.id}`)}
                  onEdit={() => navigate(`/${mod}/${record.id}?edit=true`)}
                  onDelete={() => setDeleteTarget({ id: record.id, name: record[fields[0]] || record.id })}
                  onEmail={() => handleRowEmail(record)}
                  onPdf={() => handleRowPdf(record)}
                  onDuplicate={() => handleRowDuplicate(record)}
                  onMerge={() => handleRowMerge(record)}
                />
              </div>
            )}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('Delete Record')}
        description={t('Are you sure you want to delete "{name}"? This action can be undone from the Recycle Bin.', { name: deleteTarget?.name || 'this record' })}
        confirmLabel={t('Delete')}
        variant="destructive"
      />
    </div>
  )
}
