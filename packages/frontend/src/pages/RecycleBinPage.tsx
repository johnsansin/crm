import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2, RotateCcw, Loader2, FolderOpen, User } from 'lucide-react'
import { getFieldLabel } from '@/lib/field-utils'

export function RecycleBinPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ moduleName: string; id: string; mode: 'restore' | 'purge' } | null>(null)

  const { data: modules, isLoading } = useQuery({ queryKey: ['trash-modules'], queryFn: () => api.getTrashModules() })
  const selected = activeModule || modules?.data?.[0]?.moduleName || null

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['trash-records', selected],
    queryFn: () => api.getTrashRecords(selected),
    enabled: !!selected,
  })

  const restoreMutation = useMutation({
    mutationFn: ({ moduleName, id }: any) => api.restoreTrash(moduleName, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-modules'] }); queryClient.invalidateQueries({ queryKey: ['trash-records'] }); addToast({ title: 'Restored', description: 'Record restored to its module', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const purgeMutation = useMutation({
    mutationFn: ({ moduleName, id }: any) => api.purgeTrash(moduleName, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trash-modules'] }); queryClient.invalidateQueries({ queryKey: ['trash-records'] }); addToast({ title: 'Purged', description: 'Record permanently deleted', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.mode === 'restore') restoreMutation.mutate(confirm)
    else purgeMutation.mutate(confirm)
    setConfirm(null)
  }

  const totalTrashed = (modules?.data || []).reduce((s, m) => s + m.count, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Trash2 className="text-primary" /> Recycle Bin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deleted records are soft-deleted and can be restored here (recycle bin). {totalTrashed > 0 && `${totalTrashed} record(s) total.`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-1.5">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            (modules?.data || []).map((m: any) => (
              <button
                key={m.moduleName}
                onClick={() => setActiveModule(m.moduleName)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${selected === m.moduleName ? 'border-primary bg-primary/5 font-medium' : 'hover:bg-muted/50'}`}
              >
                <span className="capitalize">{m.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{m.count}</span>
              </button>
            ))
          )}
          {!isLoading && modules?.data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2"><FolderOpen size={32} className="text-muted-foreground/50" /> Recycle bin is empty</p>
          )}
        </div>

        <div className="lg:col-span-3">
          {selected && (
            <DataTable
              key={selected}
              columns={[
                { key: 'id', label: 'Summary', render: (_, r) => <NameCell record={r} /> },
                { key: 'deletedBy', label: 'Deleted By', render: (v, r) => {
                  if (v) return <span className="flex items-center gap-1.5 text-sm"><User size={13} className="text-muted-foreground" /> {v}</span>
                  return <span className="text-muted-foreground">—</span>
                }},
                { key: 'deletedAt', label: 'Deleted', render: (v) => <span className="text-muted-foreground whitespace-nowrap">{v ? new Date(v).toLocaleString() : '—'}</span> },
              ]}
              data={records?.data || []}
              loading={loadingRecords}
              emptyMessage="Nothing in this module's recycle bin."
              pageSize={10}
              actions={(r) => (
                <>
                  <Button size="sm" variant="outline" onClick={() => setConfirm({ moduleName: selected, id: r.id, mode: 'restore' })}><RotateCcw size={13} className="mr-1" /> Restore</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ moduleName: selected, id: r.id, mode: 'purge' })}><Trash2 size={13} className="text-destructive" /></Button>
                </>
              )}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={() => setConfirm(null)}
        onConfirm={runConfirm}
        title={confirm?.mode === 'restore' ? 'Restore record?' : 'Permanently delete?'}
        description={confirm?.mode === 'restore' ? 'The record will be moved back to its module.' : 'This action cannot be undone. The record will be permanently removed.'}
        confirmLabel={confirm?.mode === 'restore' ? 'Restore' : 'Delete forever'}
      />
    </div>
  )
}

function NameCell({ record }: { record: any }) {
  const preferred = ['name', 'title', 'subject', 'accountName', 'contactName', 'potentialName', 'productName', 'firstName', 'lastName', 'templateName', 'userName', 'contractName', 'vendorName', 'campaignName', 'serviceName']
  for (const key of preferred) {
    const v = record[key]
    if (v != null && String(v).trim()) {
      return <span className="font-medium capitalize">{String(v).trim()}</span>
    }
  }
  if (record.firstName || record.lastName) return <span className="font-medium">{record.firstName} {record.lastName}</span>
  const keys = Object.keys(record).filter((k) => !['id', 'companyId', 'isActive', 'createdAt', 'updatedAt'].includes(k) && record[k] != null)
  const sample = keys.slice(0, 3).map((k) => `${getFieldLabel(k)}: ${String(record[k]).slice(0, 40)}`).join(' · ')
  return <span className="text-sm text-muted-foreground">{sample || `#${record.id.slice(0, 8)}`}</span>
}
