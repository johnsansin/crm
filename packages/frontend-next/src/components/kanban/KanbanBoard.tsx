'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical, Loader2 } from 'lucide-react'
import { useNavigate } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { formatMoney, useOrgSettings } from '@/lib/org-format'

interface KanbanColumn {
  key: string
  label: string
  color: string
  dot: string
}

const modules: Record<string, { columns: KanbanColumn[]; field: string }> = {
  potentials: {
    field: 'stage',
    columns: [
      { key: 'Prospecting', label: 'Prospecting', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
      { key: 'Qualification', label: 'Qualification', color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
      { key: 'Needs Analysis', label: 'Needs Analysis', color: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
      { key: 'Value Proposition', label: 'Value Prop', color: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800', dot: 'bg-pink-500' },
      { key: 'Negotiation', label: 'Negotiation', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
      { key: 'Closed Won', label: 'Closed Won', color: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
      { key: 'Closed Lost', label: 'Closed Lost', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
    ]
  },
  tickets: {
    field: 'status',
    columns: [
      { key: 'Open', label: 'Open', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
      { key: 'In Progress', label: 'In Progress', color: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
      { key: 'Wait for Response', label: 'Waiting', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
      { key: 'Closed', label: 'Closed', color: 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
    ]
  },
  projects: {
    field: 'status',
    columns: [
      { key: 'Prospecting', label: 'Prospecting', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
      { key: 'Initiated', label: 'Initiated', color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
      { key: 'In Progress', label: 'In Progress', color: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
      { key: 'On Hold', label: 'On Hold', color: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
      { key: 'Completed', label: 'Completed', color: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
      { key: 'Delivered', label: 'Delivered', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
      { key: 'Cancelled', label: 'Cancelled', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
    ]
  }
}

function displayName(item: any): string {
  const key = Object.keys(item).find(k => /Name$/.test(k) || k === 'title' || k === 'subject')
  return key ? String(item[key]) : 'Untitled'
}

export function KanbanBoard({ module }: { module: string }) {
  useOrgSettings()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const config = modules[module]
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [module, 'kanban'],
    queryFn: () => api.listAll(module),
    enabled: !!config,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.update(module, id, { [config!.field]: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [module, 'kanban'] })
      queryClient.invalidateQueries({ queryKey: [module] })
      addToast({ title: 'Status updated', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  })

  if (!config) return null

  const records = data?.data || []
  const columns = config.columns

  const getRecordsForColumn = (colKey: string) =>
    records.filter((r: any) => (r[config.field] || '') === colKey)

  const handleDrop = (colKey: string) => {
    if (dragId) updateStatus.mutate({ id: dragId, status: colKey })
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => {
          const items = getRecordsForColumn(col.key)
          const isOver = overCol === col.key
          return (
            <div
              key={col.key}
              className="flex-1 min-w-[270px] max-w-[320px]"
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key) }}
              onDragLeave={() => setOverCol(c => (c === col.key ? null : c))}
              onDrop={(e) => { e.preventDefault(); handleDrop(col.key) }}
            >
              <div className={cn('rounded-lg border p-3 transition-shadow', col.color, isOver && 'ring-2 ring-primary shadow-lg')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', col.dot)} /> {col.label}
                  </h3>
                  <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[140px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center text-xs text-muted-foreground text-center py-6">
                      <Loader2 size={14} className="animate-spin mr-1.5" /> Loading...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">Drop here</div>
                  ) : (
                    items.map((item: any) => (
                      <Card
                        key={item.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); setDragId(item.id) }}
                        onDragEnd={() => { setDragId(null); setOverCol(null) }}
                        onClick={() => navigate(`/${module}/${item.id}`)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-0 shadow-sm',
                          dragId === item.id && 'opacity-50'
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{displayName(item)}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.amount && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {formatMoney(item.amount)}
                                  </span>
                                )}
                                {item.priority && (
                                  <span className={cn('text-xs px-1.5 py-0.5 rounded',
                                    item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                    item.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                  )}>
                                    {item.priority}
                                  </span>
                                )}
                                {item.progress != null && item.progress !== '' && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-background text-muted-foreground border">
                                    {item.progress}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <Button
                  variant="ghost" size="sm" className="w-full mt-2 text-xs"
                  onClick={() => navigate(`/${module}/new`)}
                >
                  <Plus size={12} className="mr-1" /> Add
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
