import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RowActions } from '@/components/ui/row-actions'
import { getFieldLabel } from '@/lib/field-utils'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Plus, Search, RefreshCw, LayoutGrid, List } from 'lucide-react'

const kanbanModules = ['potentials', 'tickets', 'projects']

const labelMap: Record<string, string> = {
  accounts: 'Accounts', contacts: 'Contacts', leads: 'Leads',
  potentials: 'Opportunities', campaigns: 'Campaigns',
  products: 'Products', services: 'Services', vendors: 'Vendors',
  pricebooks: 'Price Books', quotes: 'Quotes',
  salesorders: 'Sales Orders', purchaseorders: 'Purchase Orders',
  invoices: 'Invoices', tickets: 'Tickets', faq: 'FAQ',
  documents: 'Documents', emails: 'Emails',
  emailtemplates: 'Email Templates', projects: 'Projects',
  projecttasks: 'Project Tasks', projectmilestones: 'Project Milestones',
  assets: 'Assets', servicecontracts: 'Service Contracts',
  smsnotifier: 'SMS Notifier'
}

const displayFields: Record<string, string[]> = {
  accounts: ['accountName', 'email', 'phone', 'industry'],
  contacts: ['firstName', 'lastName', 'email', 'phone'],
  leads: ['firstName', 'lastName', 'company', 'email', 'leadStatus'],
  potentials: ['potentialName', 'amount', 'stage', 'closingDate'],
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
      addToast({ title: 'Deleted', description: 'Record has been deleted', variant: 'success' })
    },
    onError: (err: Error) => {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const fields = displayFields[mod] || ['id']
  const label = labelMap[mod] || mod

  const monetaryColumns = ['amount', 'grandTotal', 'subTotal', 'unitPrice', 'costPrice', 'annualRevenue', 'expectedRevenue', 'budget', 'actualCost', 'shipping', 'shippingHandling', 'discount', 'adjustment', 'salesCommission', 'exciseDuty', 'targetBudget', 'actualBudget']
  const columns = fields.filter(f => f).map(f => ({
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
              {viewMode === 'list' ? 'Kanban' : 'List'}
            </Button>
          )}
          <Button onClick={() => navigate(`/${mod}/new`)} className="whitespace-nowrap">
            <Plus size={16} className="mr-1 md:mr-2" /> <span className="hidden sm:inline">New {label.slice(0, -1)}</span><span className="sm:hidden">New</span>
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
                placeholder="Search..."
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
            actions={(record: any) => (
              <RowActions
                onView={() => navigate(`/${mod}/${record.id}`)}
                onEdit={() => navigate(`/${mod}/${record.id}?edit=true`)}
                onDelete={() => setDeleteTarget({ id: record.id, name: record[fields[0]] || record.id })}
              />
            )}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        description={`Are you sure you want to delete "${deleteTarget?.name || 'this record'}"? This action can be undone from the Recycle Bin.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
