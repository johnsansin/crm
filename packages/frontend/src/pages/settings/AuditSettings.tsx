import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollText, History } from 'lucide-react'
import { formatDateTime, useOrgSettings } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600',
  UPDATE: 'bg-amber-500/10 text-amber-600',
  DELETE: 'bg-rose-500/10 text-rose-600',
  LOGIN: 'bg-blue-500/10 text-blue-600',
  LOGIN_FAILED: 'bg-rose-500/10 text-rose-600',
  IMPORT: 'bg-violet-500/10 text-violet-600',
  EXPORT: 'bg-violet-500/10 text-violet-600',
  BACKUP: 'bg-cyan-500/10 text-cyan-600',
}

function fmtDate(v: any) {
  if (!v) return '—'
  return formatDateTime(v) || '—'
}

export function AuditSettings() {
  useOrgSettings()
  const [tab, setTab] = useState('audit')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="audit" className="gap-2 data-[state=active]:border-slate-500 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-400"><ScrollText size={15} /> Audit Trail</TabsTrigger>
          <TabsTrigger value="logins" className="gap-2 data-[state=active]:border-slate-500 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-400"><History size={15} /> Login History</TabsTrigger>
        </TabsList>
        <TabsContent value="audit"><AuditTrail /></TabsContent>
        <TabsContent value="logins"><LoginHistory /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function AuditTrail() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, debounced, module, action],
    queryFn: () => api.getAudit({ page: String(page), limit: '25', search: debounced, module, action }),
  })

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-4 gap-2">
        <Input placeholder="Search values..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); window.setTimeout(() => setDebounced(e.target.value), 400) }} />
        <Input placeholder="Module" value={module} onChange={e => { setModule(e.target.value); setPage(1) }} />
        <select className={inputCls} value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
          <option value="">All actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="IMPORT">IMPORT</option>
          <option value="EXPORT">EXPORT</option>
          <option value="BACKUP">BACKUP</option>
        </select>
        <div />
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'createdAt', label: 'When', render: (v: any) => <span className="text-xs whitespace-nowrap">{fmtDate(v)}</span> },
              { key: 'actor', label: 'User', render: (_: any, log: any) => log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : (log.email || '—') },
              { key: 'moduleName', label: 'Module', render: (v: any) => <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-mono">{v}</span> },
              { key: 'action', label: 'Action', render: (v: any) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[v] || 'bg-muted text-muted-foreground'}`}>{v}</span> },
              { key: 'fieldName', label: 'Field', render: (v: any) => <span className="text-sm">{v || '—'}</span> },
              { key: 'details', label: 'Details', render: (_: any, log: any) => (
                <span className="text-xs text-muted-foreground max-w-xs block truncate">
                  {log.oldValue ? `From: ${log.oldValue} ` : ''}{log.newValue ? `To: ${log.newValue}` : ''}
                </span>
              )},
            ]}
            data={data?.data || []}
            pagination={data?.pagination}
            onPageChange={setPage}
            loading={isLoading}
            emptyMessage="No audit records found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function LoginHistory() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['login-history', page, debounced],
    queryFn: () => api.getLoginHistory({ page: String(page), limit: '25', search: debounced }),
  })

  return (
    <div className="space-y-3">
      <Input placeholder="Search email, user, IP..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); window.setTimeout(() => setDebounced(e.target.value), 400) }} className="max-w-md" />
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'createdAt', label: 'When', render: (v: any) => <span className="text-xs whitespace-nowrap">{fmtDate(v)}</span> },
              { key: 'user', label: 'User', render: (_: any, l: any) => l.user ? `${l.user.firstName} ${l.user.lastName}` : '—' },
              { key: 'email', label: 'Email' },
              { key: 'success', label: 'Status', render: (v: any) => (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${v ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-rose-500'}`} />{v ? 'Success' : 'Failed'}
                </span>
              )},
              { key: 'ip', label: 'IP', render: (_: any, l: any) => <span className="text-muted-foreground">{l.ipAddress || l.publicIp || '—'}</span> },
            ]}
            data={(data?.data || []).map((l: any) => ({ ...l, ip: l.ipAddress || l.publicIp }))}
            pagination={data?.pagination}
            onPageChange={setPage}
            loading={isLoading}
            emptyMessage="No login records found"
          />
        </CardContent>
      </Card>
    </div>
  )
}
