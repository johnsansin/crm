import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Loader2, Download, Upload, FileJson, FileText } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services',
  'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'projects', 'projecttasks', 'projectmilestones', 'assets',
  'servicecontracts', 'smsnotifier',
]

function fmtSize(bytes: number) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(v: any) {
  if (!v) return '—'
  try { return new Date(v).toLocaleString() } catch { return '—' }
}

export function DataSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('accounts')

  const { data: backupsData } = useQuery({ queryKey: ['backups'], queryFn: () => api.listBackups() })

  const backupMutation = useMutation({
    mutationFn: () => api.createBackup(),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ['backups'] }); addToast({ title: 'Backup created', description: res.fileName, variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) => api.importModule(moduleName, file),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] })
      addToast({ title: `Import finished: ${res.created} created, ${res.failed} failed`, description: `${res.total} rows processed`, variant: res.failed > 0 ? 'default' : 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const exportModule = (format: 'csv' | 'json') => {
    api.exportModule(moduleName, format).then(res => {
      if (!res.ok) addToast({ title: 'Export failed', description: res.error, variant: 'destructive' })
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Database Backup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Create a full PostgreSQL dump of your database. Files are stored in the uploads/backups directory.</p>
          <Button onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending}>
            {backupMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Database size={16} className="mr-2" />}
            Create Backup Now
          </Button>
          <div className="border-t pt-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Existing Backups</div>
            <div className="space-y-1">
              {(backupsData?.data || []).map((b: any) => (
                <div key={b.fileName} className="flex items-center justify-between px-3 py-2 rounded bg-muted/30">
                  <div className="min-w-0">
                    <span className="text-sm block truncate">{b.fileName}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(b.modifiedAt)} · {fmtSize(b.size)}</span>
                  </div>
                  <a href={b.path} download>
                    <Button size="sm" variant="outline"><Download size={14} className="mr-1.5" /> Download</Button>
                  </a>
                </div>
              ))}
              {(!backupsData?.data || backupsData.data.length === 0) && (
                <p className="text-sm text-muted-foreground">No backups yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Import / Export Records</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Module</label>
            <select className={`${inputCls} max-w-sm`} value={moduleName} onChange={e => setModuleName(e.target.value)}>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportModule('csv')}>
              <FileText size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportModule('json')}>
              <FileJson size={14} className="mr-1.5" /> Export JSON
            </Button>
          </div>
          <div className="border-t pt-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Import CSV</div>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".csv,text/csv"
                className="max-w-sm"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) importMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              {importMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use the exported CSV as a template. Date columns use YYYY-MM-DD, numbers and booleans are parsed automatically. Unassigned records are assigned to you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
