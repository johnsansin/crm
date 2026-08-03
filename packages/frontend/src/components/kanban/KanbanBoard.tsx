import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface KanbanColumn {
  key: string
  label: string
  color: string
}

const modules: Record<string, { columns: KanbanColumn[]; field: string }> = {
  potentials: {
    field: 'stage',
    columns: [
      { key: 'Prospecting', label: 'Prospecting', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
      { key: 'Qualification', label: 'Qualification', color: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700' },
      { key: 'Needs Analysis', label: 'Needs Analysis', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700' },
      { key: 'Value Proposition', label: 'Value Prop', color: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700' },
      { key: 'Negotiation', label: 'Negotiation', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
      { key: 'Closed Won', label: 'Closed Won', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
      { key: 'Closed Lost', label: 'Closed Lost', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
    ]
  },
  tickets: {
    field: 'status',
    columns: [
      { key: 'Open', label: 'Open', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
      { key: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
      { key: 'Waiting', label: 'Waiting', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
      { key: 'Resolved', label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
      { key: 'Closed', label: 'Closed', color: 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600' },
    ]
  },
  projects: {
    field: 'status',
    columns: [
      { key: 'Planning', label: 'Planning', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
      { key: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
      { key: 'On Hold', label: 'On Hold', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
      { key: 'Completed', label: 'Completed', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
      { key: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
    ]
  }
}

export function KanbanBoard({ module }: { module: string }) {
  const navigate = useNavigate()
  const config = modules[module]
  if (!config) return null

  const { data, isLoading } = useQuery({
    queryKey: [module, 'kanban'],
    queryFn: () => api.listAll(module),
  })

  const records = data?.data || []
  const columns = config.columns

  const getRecordsForColumn = (colKey: string) =>
    records.filter((r: any) => (r[config.field] || '') === colKey)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => {
          const items = getRecordsForColumn(col.key)
          return (
            <div key={col.key} className="flex-1 min-w-[260px] max-w-[320px]">
              <div className={`rounded-lg border p-3 ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs font-medium bg-background/80 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {isLoading ? (
                    <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
                  ) : items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">Empty</div>
                  ) : (
                    items.map((item: any) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
                        onClick={() => navigate(`/${module}/${item.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {item[Object.keys(item).find(k => k.endsWith('Name') || k.endsWith('name') || k === 'title' || k === 'subject') || 'id']}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.amount && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    ${Number(item.amount).toLocaleString()}
                                  </span>
                                )}
                                {item.priority && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    item.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                    item.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                  }`}>
                                    {item.priority}
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
