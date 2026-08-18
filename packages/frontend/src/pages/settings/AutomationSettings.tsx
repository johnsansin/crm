import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Workflow, Timer, FormInput, Plus, Pencil, Trash2, Loader2, Play, Copy,
  BarChart3, Clock, Zap, AlertTriangle, FileText, FlaskConical, ChevronDown, ChevronUp,
} from 'lucide-react'
import { formatDateTime, useOrgSettings } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services',
  'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'documents', 'projects', 'projecttasks', 'projectmilestones',
  'assets', 'servicecontracts', 'smsnotifier',
]

const TRIGGER_TYPES = [
  { value: 'onCreate', label: 'On Create' },
  { value: 'onUpdate', label: 'On Update' },
  { value: 'onDelete', label: 'On Delete' },
  { value: 'onAssign', label: 'On Assign' },
  { value: 'onStageChange', label: 'On Stage Change' },
  { value: 'onConditionMet', label: 'On Condition Met' },
]

const ACTION_TYPES = [
  { value: 'updateField', label: 'Update Field' },
  { value: 'createRecord', label: 'Create Record' },
  { value: 'sendEmail', label: 'Send Email' },
  { value: 'createNotification', label: 'Create Notification' },
  { value: 'updateRelatedField', label: 'Update Related Field' },
  { value: 'sendNotification', label: 'Send Notification' },
  { value: 'createActivity', label: 'Create Activity' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'changeOwner', label: 'Change Owner' },
]

function AutomationStatsBar() {
  const { data } = useQuery({ queryKey: ['automation-stats'], queryFn: () => api.getAutomationStats() })
  const stats = data?.data || {}

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5">
            <Zap size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.activeWorkflows ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active Workflows</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5">
            <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalExecutions ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Executions</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5">
            <Clock size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold">{stats.lastRunAt ? formatDateTime(stats.lastRunAt) : 'Never'}</p>
            <p className="text-xs text-muted-foreground">Last Run</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ActionEditor({ actions, setActions }: { actions: any[]; setActions: (a: any[]) => void }) {
  const update = (i: number, patch: any) => setActions(actions.map((a, idx) => idx === i ? { ...a, ...patch } : a))
  const add = () => setActions([...actions, { type: 'sendEmail', to: '', subject: '', body: '' }])
  const remove = (i: number) => setActions(actions.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase">Actions</div>
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus size={14} className="mr-1" /> Add Action</Button>
      </div>
      {actions.map((a, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select className={inputCls} value={a.type} onChange={e => update(i, { type: e.target.value })}>
              {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 size={14} className="text-destructive" /></Button>
          </div>
          {a.type === 'sendEmail' && (
            <>
              <Input placeholder="To (email or $email field)" value={a.to || ''} onChange={e => update(i, { to: e.target.value })} />
              <Input placeholder="Subject (supports {fieldName})" value={a.subject || ''} onChange={e => update(i, { subject: e.target.value })} />
              <textarea placeholder="Body (supports {fieldName})" className={`${inputCls} h-20`} value={a.body || ''} onChange={e => update(i, { body: e.target.value })} />
            </>
          )}
          {a.type === 'updateField' && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Field name" value={a.field || ''} onChange={e => update(i, { field: e.target.value })} />
              <Input placeholder="Value or $fieldRef" value={a.value || ''} onChange={e => update(i, { value: e.target.value })} />
            </div>
          )}
          {a.type === 'createRecord' && (
            <>
              <select className={inputCls} value={a.module || ''} onChange={e => update(i, { module: e.target.value })}>
                <option value="">Target module (defaults to source)</option>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea placeholder='{"fieldName": "value", "otherField": "$sourceField"}' className={`${inputCls} h-20`} value={a.data ? JSON.stringify(a.data) : ''} onChange={e => { try { update(i, { data: JSON.parse(e.target.value) }) } catch {} }} />
            </>
          )}
          {a.type === 'createNotification' && (
            <>
              <Input placeholder="Title" value={a.title || ''} onChange={e => update(i, { title: e.target.value })} />
              <Input placeholder="Message (supports {fieldName})" value={a.message || ''} onChange={e => update(i, { message: e.target.value })} />
              <Input placeholder="User ID (optional, or $assignedTo)" value={a.userId || ''} onChange={e => update(i, { userId: e.target.value })} />
            </>
          )}
          {a.type === 'updateRelatedField' && (
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Related module" value={a.relatedModule || ''} onChange={e => update(i, { relatedModule: e.target.value })} />
              <Input placeholder="Field name" value={a.field || ''} onChange={e => update(i, { field: e.target.value })} />
              <Input placeholder="Value or $ref" value={a.value || ''} onChange={e => update(i, { value: e.target.value })} />
            </div>
          )}
          {a.type === 'sendNotification' && (
            <>
              <Input placeholder="Title" value={a.title || ''} onChange={e => update(i, { title: e.target.value })} />
              <Input placeholder="Message" value={a.message || ''} onChange={e => update(i, { message: e.target.value })} />
              <Input placeholder="User IDs (comma separated)" value={a.userIds || ''} onChange={e => update(i, { userIds: e.target.value })} />
            </>
          )}
          {a.type === 'createActivity' && (
            <>
              <Input placeholder="Activity type (e.g. Task, Call)" value={a.activityType || ''} onChange={e => update(i, { activityType: e.target.value })} />
              <Input placeholder="Subject" value={a.subject || ''} onChange={e => update(i, { subject: e.target.value })} />
              <Input placeholder="Assigned to (user ID or $field)" value={a.assignedTo || ''} onChange={e => update(i, { assignedTo: e.target.value })} />
            </>
          )}
          {a.type === 'webhook' && (
            <>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <select className={inputCls} value={a.method || 'POST'} onChange={e => update(i, { method: e.target.value })}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
                <Input placeholder="Webhook URL" value={a.url || ''} onChange={e => update(i, { url: e.target.value })} />
              </div>
              <textarea placeholder='Headers JSON (optional)' className={`${inputCls} h-16`} value={a.headers ? JSON.stringify(a.headers) : ''} onChange={e => { try { update(i, { headers: JSON.parse(e.target.value) }) } catch {} }} />
            </>
          )}
          {a.type === 'changeOwner' && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Owner field (e.g. assignedTo)" value={a.ownerField || 'assignedTo'} onChange={e => update(i, { ownerField: e.target.value })} />
              <Input placeholder="New owner (user ID or $field)" value={a.value || ''} onChange={e => update(i, { value: e.target.value })} />
            </div>
          )}
        </div>
      ))}
      {actions.length === 0 && <p className="text-xs text-muted-foreground">No actions yet.</p>}
    </div>
  )
}

function WorkflowLogsDialog({ workflowId, onClose }: { workflowId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['workflow-logs', workflowId],
    queryFn: () => api.getWorkflowLogs(workflowId!),
    enabled: !!workflowId,
  })

  const logs = data?.data || []

  return (
    <Dialog open={!!workflowId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Execution Logs</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 size={18} className="mr-2 animate-spin" /> Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No execution logs found.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-100 dark:bg-slate-800/70">
                  {['Time', 'Module', 'Record', 'Trigger', 'Conditions', 'Actions', 'Duration', 'Error'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => {
                  const hasError = !!log.error
                  return (
                    <tr key={log.id || i} className={`border-b last:border-0 text-sm ${hasError ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50/40 dark:bg-emerald-950/10'}`}>
                      <td className="px-3 py-2 whitespace-nowrap">{log.createdAt ? formatDateTime(log.createdAt) : '—'}</td>
                      <td className="px-3 py-2">{log.module || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.recordId || '—'}</td>
                      <td className="px-3 py-2">{log.triggerType || '—'}</td>
                      <td className="px-3 py-2">{log.conditionsMet === true ? <span className="text-emerald-600 dark:text-emerald-400">Yes</span> : log.conditionsMet === false ? <span className="text-slate-400">No</span> : '—'}</td>
                      <td className="px-3 py-2">{log.actionsExecuted ?? '—'}</td>
                      <td className="px-3 py-2">{log.durationMs != null ? `${log.durationMs}ms` : '—'}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{log.error || <span className="text-emerald-600 dark:text-emerald-400 text-xs">OK</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AutomationReports({ workflows }: { workflows: any[] }) {
  const sortedByRuns = [...workflows].sort((a, b) => (b.runCount || 0) - (a.runCount || 0))
  const failed = workflows.filter(w => w.lastError)
  const recentByWorkflow = [...workflows]
    .filter(w => w.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime())

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap size={15} className="text-emerald-500" /> Most Used Workflows</h3>
          {sortedByRuns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No workflow data yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedByRuns.slice(0, 10).map((w, i) => (
                <div key={w.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium">{w.name}</span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium">{w.moduleName}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{w.runCount || 0}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-red-500" /> Failed Workflows</h3>
          {failed.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">All workflows are running without errors.</p>
          ) : (
            <div className="space-y-2">
              {failed.map(w => (
                <div key={w.id} className="flex items-start justify-between py-1.5 border-b last:border-0 gap-3">
                  <div>
                    <span className="text-sm font-medium">{w.name}</span>
                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{w.moduleName}</span>
                  </div>
                  <span className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate" title={w.lastError}>{w.lastError}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock size={15} className="text-blue-500" /> Recent Execution Trends</h3>
          {recentByWorkflow.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent executions.</p>
          ) : (
            <div className="space-y-2">
              {recentByWorkflow.slice(0, 10).map(w => (
                <div key={w.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{w.name}</span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs">{w.moduleName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{w.lastRunAt ? formatDateTime(w.lastRunAt) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AutomationSettings() {
  useOrgSettings()
  const [tab, setTab] = useState('workflows')

  const { data: wfData } = useQuery({ queryKey: ['workflows'], queryFn: () => api.getWorkflows() })
  const workflows = wfData?.data || []

  return (
    <div className="space-y-4">
      <AutomationStatsBar />
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workflows" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><Workflow size={15} /> Workflows</TabsTrigger>
          <TabsTrigger value="cron" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><Timer size={15} /> Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="webforms" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><FormInput size={15} /> Webforms</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><BarChart3 size={15} /> Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows"><WorkflowList /></TabsContent>
        <TabsContent value="cron"><CronList /></TabsContent>
        <TabsContent value="webforms"><WebformList /></TabsContent>
        <TabsContent value="reports"><AutomationReports workflows={workflows} /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function WorkflowList() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [logsId, setLogsId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [form, setForm] = useState<any>({ name: '', description: '', moduleName: 'leads', triggerType: 'onCreate', conditions: '', actions: [] })

  const { data, isLoading } = useQuery({ queryKey: ['workflows'], queryFn: () => api.getWorkflows() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createWorkflow(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); addToast({ title: 'Workflow created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateWorkflow(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); addToast({ title: 'Workflow updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteWorkflow(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); addToast({ title: 'Workflow deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.updateWorkflow(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); addToast({ title: 'Workflow updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const testMutation = useMutation({
    mutationFn: (id: string) => api.testWorkflow(id),
    onSuccess: (d) => { setTestResults(d); addToast({ title: 'Test completed', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Test failed', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    let conditions: any = {}
    if (form.conditions.trim()) {
      try { conditions = JSON.parse(form.conditions) } catch { addToast({ title: 'Invalid conditions JSON', variant: 'destructive' }); return }
    }
    const d = { name: form.name, description: form.description, moduleName: form.moduleName, triggerType: form.triggerType, conditions, actions: form.actions }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  const edit = (w: any) => {
    setEditId(w.id)
    setForm({
      name: w.name, description: w.description || '', moduleName: w.moduleName, triggerType: w.triggerType,
      conditions: JSON.stringify(w.conditions || {}, null, 2), actions: (w.actions || []).map((a: any) => ({ ...a })),
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Run automated actions when records are created, updated, or deleted.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', description: '', moduleName: 'leads', triggerType: 'onCreate', conditions: '', actions: [] }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Workflow
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'moduleName', label: 'Module' },
          { key: 'triggerType', label: 'Trigger' },
          { key: 'actionCount', label: 'Actions', render: (_, w) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{w.actions?.length ?? 0}</span> },
          { key: 'runCount', label: 'Runs', render: (v) => <span className="text-xs font-semibold tabular-nums">{v ?? 0}</span> },
          { key: 'lastRunAt', label: 'Last Run', render: (v) => v ? formatDateTime(v) : <span className="text-xs text-muted-foreground">—</span> },
          { key: 'lastError', label: 'Status', render: (v) => v
            ? <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400" title={v}>Error</span>
            : <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">OK</span> },
          { key: 'isActive', label: 'Active', render: (_, w) => (
            <button onClick={() => toggleMutation.mutate({ id: w.id, isActive: !w.isActive })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${w.isActive ? 'bg-emerald-500' : 'bg-muted'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${w.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          ) },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No workflows yet."
        pageSize={10}
        actions={(w) => (
          <div className="flex items-center">
            <Button variant="ghost" size="icon" title="Test workflow" onClick={() => { setTestResults(null); testMutation.mutate(w.id) }}>
              {testMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            </Button>
            <Button variant="ghost" size="icon" title="View logs" onClick={() => setLogsId(w.id)}><FileText size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => edit(w)}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </div>
        )}
      />

      {testResults && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5"><FlaskConical size={14} /> Test Results</h4>
              <Button variant="ghost" size="sm" onClick={() => setTestResults(null)}>Dismiss</Button>
            </div>
            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap">{JSON.stringify(testResults, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Workflow' : 'New Workflow'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <Input placeholder="Workflow name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description (optional)" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Module</label>
                <select className={inputCls} value={form.moduleName} onChange={e => setForm((f: any) => ({ ...f, moduleName: e.target.value }))}>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Trigger</label>
                <select className={inputCls} value={form.triggerType} onChange={e => setForm((f: any) => ({ ...f, triggerType: e.target.value }))}>
                  {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Conditions (optional JSON)</label>
              <textarea placeholder='{"logic":"all","rules":[{"field":"leadStatus","op":"eq","value":"New"}]}' className={`${inputCls} h-20`} value={form.conditions} onChange={e => setForm((f: any) => ({ ...f, conditions: e.target.value }))} />
            </div>
            <ActionEditor actions={form.actions} setActions={(a) => setForm((f: any) => ({ ...f, actions: a }))} />
            {editId && (() => {
              const w = (data?.data || []).find((x: any) => x.id === editId)
              if (!w) return null
              return (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 space-y-1 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                  <div>Runs: <span className="font-semibold text-foreground">{w.runCount ?? 0}</span></div>
                  {w.lastRunAt && <div>Last Run: <span className="text-foreground">{formatDateTime(w.lastRunAt)}</span></div>}
                  {w.lastError && <div className="text-red-600 dark:text-red-400">Error: {w.lastError}</div>}
                </div>
              )
            })()}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <WorkflowLogsDialog workflowId={logsId} onClose={() => setLogsId(null)} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Workflow"
        description="Are you sure you want to delete this workflow?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function CronList() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', description: '', moduleName: '', frequency: 'daily', actions: [] })

  const { data, isLoading } = useQuery({ queryKey: ['scheduled-tasks'], queryFn: () => api.getScheduledTasks() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createScheduledTask(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }); addToast({ title: 'Task created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateScheduledTask(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }); addToast({ title: 'Task updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteScheduledTask(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }); addToast({ title: 'Task deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.updateScheduledTask(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] }); addToast({ title: 'Task updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const runMutation = useMutation({
    mutationFn: (id: string) => api.runScheduledTask(id),
    onSuccess: () => addToast({ title: 'Task executed', variant: 'success' }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    const d = { name: form.name, description: form.description, moduleName: form.moduleName || null, frequency: form.frequency, actions: form.actions }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  const edit = (t: any) => {
    setEditId(t.id)
    setForm({ name: t.name, description: t.description || '', moduleName: t.moduleName || '', frequency: t.frequency, actions: (t.actions || []).map((a: any) => ({ ...a })) })
    setShowForm(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Run actions on a schedule. The background worker checks every 60 seconds.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', description: '', moduleName: '', frequency: 'daily', actions: [] }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Task
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'frequency', label: 'Frequency', render: (v) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{v}</span> },
          { key: 'nextRun', label: 'Next Run', render: (v) => v ? formatDateTime(v) : '—' },
          { key: 'runCount', label: 'Runs', render: (v) => <span className="text-xs font-semibold tabular-nums">{v ?? 0}</span> },
          { key: 'lastRunAt', label: 'Last Run', render: (v) => v ? formatDateTime(v) : <span className="text-xs text-muted-foreground">—</span> },
          { key: 'lastError', label: 'Status', render: (v) => v
            ? <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400" title={v}>Error</span>
            : <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">OK</span> },
          { key: 'isActive', label: 'Active', render: (_, t) => (
            <button onClick={() => toggleMutation.mutate({ id: t.id, isActive: !t.isActive })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.isActive ? 'bg-emerald-500' : 'bg-muted'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${t.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          ) },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No scheduled tasks yet."
        pageSize={10}
        actions={(t) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => runMutation.mutate(t.id)} title="Run now"><Play size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => edit(t)}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <Input placeholder="Task name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description (optional)" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">Module (optional)</label>
                <select className={inputCls} value={form.moduleName} onChange={e => setForm((f: any) => ({ ...f, moduleName: e.target.value }))}>
                  <option value="">None</option>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Frequency</label>
                <select className={inputCls} value={form.frequency} onChange={e => setForm((f: any) => ({ ...f, frequency: e.target.value }))}>
                  <option value="every5min">Every 5 minutes</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            {editId && (() => {
              const t = (data?.data || []).find((x: any) => x.id === editId)
              if (!t) return null
              return (
                <div className="rounded-md border border-slate-200 dark:border-slate-700 p-3 space-y-1 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                  <div>Runs: <span className="font-semibold text-foreground">{t.runCount ?? 0}</span></div>
                  {t.lastRunAt && <div>Last Run: <span className="text-foreground">{formatDateTime(t.lastRunAt)}</span></div>}
                  {t.lastError && <div className="text-red-600 dark:text-red-400">Error: {t.lastError}</div>}
                </div>
              )
            })()}
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Actions</div>
              <div className="space-y-2">
                {form.actions.map((a: any, i: number) => (
                  <div key={i} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select className={inputCls} value={a.type} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, type: e.target.value } : x); return { ...f, actions: acts } })}>
                        <option value="sendEmail">Send Email</option>
                        <option value="updateModuleRecords">Update Module Records</option>
                        <option value="createNotifications">Create Notifications</option>
                        <option value="webhook">Webhook</option>
                      </select>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f: any) => ({ ...f, actions: f.actions.filter((_: any, idx: number) => idx !== i) }))}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                    {a.type === 'sendEmail' && (
                      <>
                        <Input placeholder="To (comma separated or blank = all users)" value={a.to || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, to: e.target.value } : x); return { ...f, actions: acts } })} />
                        <Input placeholder="Subject" value={a.subject || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, subject: e.target.value } : x); return { ...f, actions: acts } })} />
                      </>
                    )}
                    {a.type === 'updateModuleRecords' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Where field" value={a.whereField || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, whereField: e.target.value } : x); return { ...f, actions: acts } })} />
                          <Input placeholder="Where value" value={a.whereValue || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, whereValue: e.target.value } : x); return { ...f, actions: acts } })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Field to update" value={a.field || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, field: e.target.value } : x); return { ...f, actions: acts } })} />
                          <Input placeholder="New value" value={a.value || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, value: e.target.value } : x); return { ...f, actions: acts } })} />
                        </div>
                      </>
                    )}
                    {a.type === 'createNotifications' && (
                      <>
                        <Input placeholder="Title" value={a.title || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, title: e.target.value } : x); return { ...f, actions: acts } })} />
                        <Input placeholder="Message" value={a.message || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, message: e.target.value } : x); return { ...f, actions: acts } })} />
                      </>
                    )}
                    {a.type === 'webhook' && (
                      <>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                          <select className={inputCls} value={a.method || 'POST'} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, method: e.target.value } : x); return { ...f, actions: acts } })}>
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                          </select>
                          <Input placeholder="Webhook URL" value={a.url || ''} onChange={e => setForm((f: any) => { const acts = f.actions.map((x: any, idx: number) => idx === i ? { ...x, url: e.target.value } : x); return { ...f, actions: acts } })} />
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setForm((f: any) => ({ ...f, actions: [...f.actions, { type: 'sendEmail', to: '', subject: '' }] }))}>
                  <Plus size={14} className="mr-1" /> Add Action
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Task"
        description="Are you sure you want to delete this scheduled task?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function WebformList() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', moduleName: 'leads', fields: [{ field: 'firstName', label: 'First Name', required: true }], successMessage: '', redirectUrl: '' })

  const { data, isLoading } = useQuery({ queryKey: ['webforms'], queryFn: () => api.getWebforms() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createWebform(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webforms'] }); addToast({ title: 'Webform created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateWebform(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webforms'] }); addToast({ title: 'Webform updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteWebform(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webforms'] }); addToast({ title: 'Webform deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const tokenMutation = useMutation({
    mutationFn: (id: string) => api.regenerateWebformToken(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webforms'] }); addToast({ title: 'Token regenerated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    const d = { name: form.name, moduleName: form.moduleName, fields: form.fields, successMessage: form.successMessage, redirectUrl: form.redirectUrl }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  const edit = (w: any) => {
    setEditId(w.id)
    setForm({ name: w.name, moduleName: w.moduleName, fields: (w.fields || []).map((f: any) => ({ ...f })), successMessage: w.successMessage || '', redirectUrl: w.redirectUrl || '' })
    setShowForm(true)
  }

  const setField = (i: number, patch: any) => setForm((f: any) => ({ ...f, fields: f.fields.map((x: any, idx: number) => idx === i ? { ...x, ...patch } : x) }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Embeddable public forms that create records. Submit URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/webforms/[token]/submit</code></p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', moduleName: 'leads', fields: [{ field: 'firstName', label: 'First Name', required: true }], successMessage: '', redirectUrl: '' }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Webform
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'moduleName', label: 'Module' },
          { key: 'fieldCount', label: 'Fields', render: (_, w) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{w.fields?.length ?? 0}</span> },
          { key: 'token', label: 'Token', render: (v) => <span className="font-mono text-xs">{v}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No webforms yet."
        pageSize={10}
        actions={(w) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => tokenMutation.mutate(w.id)} title="Regenerate token"><Copy size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => edit(w)}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Webform' : 'New Webform'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Webform name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
              <div>
                <label className="text-sm font-medium block mb-1.5">Target module</label>
                <select className={inputCls} value={form.moduleName} onChange={e => setForm((f: any) => ({ ...f, moduleName: e.target.value }))}>
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Fields</div>
              <div className="space-y-2">
                {form.fields.map((f: any, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                    <Input placeholder="Record field (e.g. email)" value={f.field} onChange={e => setField(i, { field: e.target.value })} />
                    <Input placeholder="Label shown to visitors" value={f.label} onChange={e => setField(i, { label: e.target.value })} />
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <input type="checkbox" checked={!!f.required} onChange={e => setField(i, { required: e.target.checked })} /> Required
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setForm((frm: any) => ({ ...frm, fields: frm.fields.filter((_: any, idx: number) => idx !== i) }))}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setForm((f: any) => ({ ...f, fields: [...f.fields, { field: '', label: '', required: false }] }))}>
                  <Plus size={14} className="mr-1" /> Add Field
                </Button>
              </div>
            </div>
            <Input placeholder="Success message (e.g. Thank you!)" value={form.successMessage} onChange={e => setForm((f: any) => ({ ...f, successMessage: e.target.value }))} />
            <Input placeholder="Redirect URL (optional)" value={form.redirectUrl} onChange={e => setForm((f: any) => ({ ...f, redirectUrl: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                {editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Webform"
        description="Are you sure you want to delete this webform?"
        confirmLabel="Delete"
      />
    </div>
  )
}
