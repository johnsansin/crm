import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, record: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
  onPageChange?: (page: number) => void
  onSort?: (key: string, order: 'asc' | 'desc') => void
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
  loading?: boolean
  onRowClick?: (record: T) => void
  actions?: (record: T) => React.ReactNode
  emptyMessage?: string
  pageSize?: number
  showPageSize?: boolean
}

const PAGE_SIZES = [10, 25, 50, 100]

export function DataTable<T extends Record<string, any>>({
  columns, data, pagination, onPageChange, onSort,
  sortKey, sortOrder, loading, onRowClick, actions, emptyMessage,
  pageSize = 25, showPageSize = true
}: DataTableProps<T>) {
  const [localPage, setLocalPage] = useState(1)
  const [localSize, setLocalSize] = useState(pageSize)

  const serverMode = !!pagination || !!onPageChange
  const size = pagination?.limit || localSize
  const page = pagination?.page || localPage

  const total = pagination?.total ?? data.length
  const totalPages = pagination?.totalPages || Math.max(1, Math.ceil(data.length / size))

  useEffect(() => { setLocalPage(1) }, [data.length, serverMode])

  const visibleData = useMemo(() => {
    if (serverMode || totalPages <= 1) return data
    const start = (localPage - 1) * size
    return data.slice(start, start + size)
  }, [data, localPage, size, serverMode, totalPages])

  const handleSort = (key: string) => {
    if (!onSort) return
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(key, newOrder)
  }

  const changePage = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages))
    if (onPageChange) onPageChange(clamped)
    else setLocalPage(clamped)
  }

  const changeSize = (newSize: number) => {
    setLocalSize(newSize)
    setLocalPage(1)
  }

  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, total)

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3.5 whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className={cn('inline-flex items-center gap-1', col.className === 'text-right' && 'flex-row-reverse')}>
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortOrder === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />)
                        : <ChevronsUpDown size={13} className="text-muted-foreground/50" />
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3.5 w-28">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-16">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : visibleData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-16 text-muted-foreground text-sm">
                  {emptyMessage || 'No records found'}
                </td>
              </tr>
            ) : (
              visibleData.map((record, i) => (
                <tr
                  key={record.id || i}
                  className={cn(
                    'border-b last:border-0 transition-colors',
                    i % 2 === 1 && 'bg-muted/20',
                    onRowClick ? 'cursor-pointer hover:bg-accent/50' : 'hover:bg-muted/40'
                  )}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm', col.className)}>
                      {col.render
                        ? col.render(record[col.key], record)
                        : formatCellValue(record[col.key], col.key)
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {actions(record)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{from}</span>–
            <span className="font-semibold text-foreground">{to}</span> of <span className="font-semibold text-foreground">{total}</span> records
          </span>
          <div className="flex items-center gap-2">
            {showPageSize && !serverMode && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Rows</span>
                <Select value={String(size)} onValueChange={v => changeSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => changePage(1)} title="First page">
                <ChevronsLeft size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => changePage(page - 1)} title="Previous">
                <ChevronLeft size={14} />
              </Button>
              <div className="flex items-center gap-1">
                {buildPageItems(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 min-w-7 px-2 text-xs"
                      disabled={p === page}
                      onClick={() => changePage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => changePage(page + 1)} title="Next">
                <ChevronRight size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => changePage(totalPages)} title="Last page">
                <ChevronsRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1])
  const list: (number | '…')[] = []
  let prev = 0
  for (const p of [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)) {
    if (p - prev > 1) list.push('…')
    list.push(p)
    prev = p
  }
  return list
}

const MONEY_KEYS = ['amount', 'grandTotal', 'subTotal', 'unitPrice', 'annualRevenue', 'expectedRevenue', 'budget', 'total', 'discount', 'adjustment', 'shipping', 'taxAmount', 'costPrice', 'listPrice', 'netPrice', 'lineTotal', 'targetBudget', 'actualBudget', 'commissionRate', 'commissionPercentage', 'annualSalary', 'target', 'actual', 'rate']

function formatCellValue(value: any, key: string): string {
  if (value == null || value === '') return '-'
  if (MONEY_KEYS.includes(key)) {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key.toLowerCase().includes('date')) {
    try { return new Date(value).toLocaleDateString() } catch { return value }
  }
  return String(value)
}
