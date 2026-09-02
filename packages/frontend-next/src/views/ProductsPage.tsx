'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/lib/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { formatMoney } from '@/lib/org-format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RowActions } from '@/components/ui/row-actions'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Plus, Search, Download, Upload, RefreshCw, Loader2, Boxes,
} from 'lucide-react'

interface Product {
  id: string
  productNo?: string | null
  partNumber?: string | null
  productName: string
  productCategory?: string | null
  manufacturer?: string | null
  unitPrice?: number | string | null
  qtyInStock?: number | string | null
  reorderLevel?: number | string | null
  isActive?: boolean
  image?: string | null
  images?: { imageUrl: string; isDefault: boolean }[]
  updatedAt?: string
}

const STATUSES = [
  { value: 'all', label: 'All Products' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export function ProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('productNo')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'list', page, debouncedSearch, category, status, sortKey, sortOrder],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), limit: '25', search: debouncedSearch, sortBy: sortKey, sortOrder }
      const filter: Record<string, any> = {}
      if (category !== 'all') filter.productCategory = category
      if (status !== 'all') filter.isActive = status === 'active'
      if (Object.keys(filter).length) params.filter = JSON.stringify(filter)
      return api.list('products', params)
    },
  })

  const allProductsQuery = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => api.listAll('products', { limit: '1000' }),
  })

  const categoryPicklistQuery = useQuery({
    queryKey: ['picklists', 'products', 'productCategory'],
    queryFn: () => api.getPicklists({ module: 'products', field: 'productCategory' }).catch(() => ({ data: [] })),
  })

  const categories = useMemo(() => {
    const set = new Set<string>()
    ;(allProductsQuery.data?.data || []).forEach((p: Product) => p.productCategory && set.add(p.productCategory))
    ;(categoryPicklistQuery.data?.data || []).forEach((o: any) => o.label && set.add(o.label))
    return Array.from(set).sort()
  }, [allProductsQuery.data, categoryPicklistQuery.data])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete('products', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      addToast({ title: 'Deleted', description: 'Product moved to Recycle Bin', variant: 'success' })
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

  const handleExport = async () => {
    setExporting(true)
    const r = await api.exportModule('products', 'csv').catch(() => ({ ok: false, error: 'Export failed' }))
    setExporting(false)
    if (!r.ok) addToast({ title: 'Export failed', description: r.error, variant: 'destructive' })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const r = await api.importModule('products', file)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      addToast({ title: 'Import complete', description: `${r.created} product(s) imported, ${r.failed} failed`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Import failed', description: err.message, variant: 'destructive' })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (_v: any, r: Product) => {
        const img = r.images?.find(i => i.isDefault)?.imageUrl || r.images?.[0]?.imageUrl || r.image
        return img ? (
          <img src={img} alt="" className="h-10 w-10 rounded-md border object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
            <Boxes size={14} className="text-muted-foreground" />
          </span>
        )
      },
    },
    {
      key: 'productNo',
      label: 'Product No',
      sortable: true,
      render: (v: any) => <span className="font-mono text-xs text-muted-foreground">{v || '—'}</span>,
    },
    {
      key: 'productName',
      label: 'Product Name',
      sortable: true,
      render: (v: any, r: Product) => (
        <button
          onClick={() => navigate(`/products/${r.id}`)}
          className="text-left font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {v}
        </button>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (v: any) => (
        <span
          className={
            v
              ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          }
        >
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'productCategory',
      label: 'Category',
      sortable: true,
      render: (v: any) =>
        v ? (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            {v}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      sortable: true,
      render: (v: any) => <span>{v || <span className="text-muted-foreground">—</span>}</span>,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      sortable: true,
      className: 'text-right',
      render: (v: any) => <span className="tabular-nums">{v != null ? formatMoney(v) : '—'}</span>,
    },
    {
      key: 'qtyInStock',
      label: 'Qty In Stock',
      sortable: true,
      className: 'text-right',
      render: (v: any, r: Product) => {
        const low = Number(r.reorderLevel) > 0 && Number(v) <= Number(r.reorderLevel)
        return (
          <span className="tabular-nums">
            {v != null ? Number(v) : 0}
            {low && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-950 dark:text-red-300">
                Low
              </span>
            )}
          </span>
        )
      },
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      sortable: true,
      className: 'text-right',
      render: (v: any) => <span className="tabular-nums text-muted-foreground">{v != null ? Number(v) : '—'}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Boxes size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">Manage your product catalog, stock levels and pricing</p>
          </div>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus size={16} className="mr-1.5" /> New Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={v => { setCategory(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategory('all'); setStatus('all'); setPage(1) }}>
          <RefreshCw size={14} className="mr-1.5" /> Reset
        </Button>
        <div className="flex-1" />
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
          {importing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
          Import
        </Button>
        <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport}>
          {exporting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
          Export
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSort={(key, order) => { setSortKey(key); setSortOrder(order); setPage(1) }}
        sortKey={sortKey}
        sortOrder={sortOrder}
        loading={isLoading}
        onRowClick={(r: Product) => navigate(`/products/${r.id}`)}
        actions={(r: Product) => (
          <RowActions
            onView={() => navigate(`/products/${r.id}`)}
            onEdit={() => navigate(`/products/${r.id}/edit`)}
            onDelete={() => setDeleteTarget({ id: r.id, name: r.productName })}
          />
        )}
        emptyMessage="No products found. Create your first product to get started."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title="Delete Product"
        description={
          deleteTarget
            ? `Move "${deleteTarget.name}" to the Recycle Bin? Inactive products stay visible in the list.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
