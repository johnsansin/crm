import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowUp, ArrowDown, LayoutDashboard, Eye, EyeOff, MoveRight } from 'lucide-react'

export function MenuSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['settings-modules'], queryFn: () => api.getSettingsModules() })

  const saveMutation = useMutation({
    mutationFn: async (input: any | any[]) => {
      const rows = Array.isArray(input) ? input : [input]
      for (const row of rows) await api.updateModule(row.name, { label: row.label, parent: row.parent, sequence: row.sequence, icon: row.icon, isActive: row.isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-modules'] })
      queryClient.invalidateQueries({ queryKey: ['menu-modules'] })
      addToast({ title: 'Menu saved', variant: 'success' })
      window.dispatchEvent(new Event('crm-menu-updated'))
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggleActive = (row: any) => saveMutation.mutate({ ...row, isActive: !row.isActive })
  const move = (index: number, dir: -1 | 1) => {
    const items = [...(data?.data || [])]
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const [a] = items.splice(index, 1)
    items.splice(j, 0, a)
    saveMutation.mutate(items.map((row, i) => ({ ...row, sequence: i })))
  }
  const setParent = (row: any, parent: string) => saveMutation.mutate({ ...row, parent })
  const groups = ['Marketing', 'Sales', 'Inventory', 'Purchasing', 'Support', 'Projects', 'Tools']

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading menu…</p>

  const items = [...(data?.data || [])].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><LayoutDashboard size={15} /> Main Menu Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((row, index) => (
            <div key={row.name} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${row.isActive ? 'bg-card' : 'bg-muted/30 opacity-60'}`}>
              <span className="w-6 text-sm text-muted-foreground font-mono">{index + 1}</span>
              <span className="font-medium text-sm min-w-[120px] capitalize">{row.label || row.name}</span>
              {row.parent ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MoveRight size={12} /> <span className="capitalize">{row.parent}</span></span>
              ) : (
                <span className="text-xs text-muted-foreground">Top level</span>
              )}
              <select
                className="ml-auto h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={row.parent || ''}
                onChange={e => setParent(row, e.target.value)}
              >
                <option value="">Top level</option>
                {groups.map(group => <option key={group} value={group}>{group}</option>)}
              </select>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, -1)} title="Move up"><ArrowUp size={14} /></Button>
                <Button variant="ghost" size="icon" disabled={index === items.length - 1} onClick={() => move(index, 1)} title="Move down"><ArrowDown size={14} /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(row)} title={row.isActive ? 'Hide from menu' : 'Show in menu'}>
                  {row.isActive ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-muted-foreground" />}
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No modules found.</p>}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground px-1">
        Reorder the modules to change the sidebar menu. Set a parent module to group items under a sub-menu. Hidden modules are removed from the sidebar for all users in your organisation.
        {saveMutation.isPending && <Loader2 size={12} className="inline ml-2 animate-spin" />}
      </p>
    </div>
  )
}
