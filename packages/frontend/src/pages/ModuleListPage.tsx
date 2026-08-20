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
import { Plus, Search, RefreshCw, LayoutGrid, List, Download, Upload, Columns3, Loader2, Mail, FileDown, Copy, GitMerge, Trash2 } from 'lucide-react'
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
  assets: 'Assets', servicecontracts: 'Service Contracts',
  smsnotifier: 'SMS Notifier', receipts: 'Receipts', payments: 'Payments',
  recurringinvoices: 'Recurring Invoices', calllogs: 'Phone Calls',
  reports: 'Reports', mailboxes: 'Mailboxes', rssfeeds: 'RSS Feeds',
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
  assets: ['assetName', 'serialNo', 'status'],
  servicecontracts: ['contractName', 'contractType', 'status'],
  smsnotifier: ['toNumber', 'message', 'status'],
  receipts: ['amount', 'paymentDate', 'method', 'reference'],
  payments: ['amount', 'paymentDate', 'method', 'reference'],
  recurringinvoices: ['frequency', 'interval', 'nextRun', 'isActive'],
  calllogs: ['fromNumber', 'toNumber', 'direction', 'callTime', 'status'],
  reports: ['name', 'moduleName', 'reportType'],
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

  const fields = displayFields[mod] || ['id']
  const label = t(labelMap[mod] || mod)

  const monetaryColumns = ['amount', 'grandTotal', 'subTotal', 'unitPrice', 'costPrice', 'annualRevenue', 'expectedRevenue', 'budget', 'actualCost', 'shipping', 'shippingHandling', 'discount', 'adjustment', 'salesCommission', 'exciseDuty', 'targetBudget', 'actualBudget']
  const columns = fields
    .filter(f => f && !hiddenCols.includes(f))
    .map(f => ({
      key: f,
      label: getFieldLabel(f),
      sortable: true,
      className: monetaryColumns.includes(f) ? 'text-right' : '',
    }))

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setSortKey(key)
    setSortOrder(order)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{label}</h1>
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
