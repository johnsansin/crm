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
import { Workflow, Timer, FormInput, Plus, Pencil, Trash2, Loader2, Play, Copy } from 'lucide-react'
import { formatDateTime, useOrgSettings } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services',
  'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'documents', 'projects', 'projecttasks', 'projectmilestones',
  'assets', 'servicecontracts', 'smsnotifier',
]

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
              <option value="sendEmail">Send Email</option>
              <option value="updateField">Update Field</option>
              <option value="createRecord">Create Record</option>
              <option value="createNotification">Create Notification</option>
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
        </div>
      ))}
      {actions.length === 0 && <p className="text-xs text-muted-foreground">No actions yet.</p>}
    </div>
  )
}

export function AutomationSettings() {
  useOrgSettings()
  const [tab, setTab] = useState('workflows')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workflows" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><Workflow size={15} /> Workflows</TabsTrigger>
          <TabsTrigger value="cron" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><Timer size={15} /> Scheduled Tasks</TabsTrigger>
          <TabsTrigger value="webforms" className="gap-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"><FormInput size={15} /> Webforms</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows"><WorkflowList /></TabsContent>
        <TabsContent value="cron"><CronList /></TabsContent>
        <TabsContent value="webforms"><WebformList /></TabsContent>
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
  const [form, setForm] = useState<any>({ name: '', moduleName: 'leads', triggerType: 'onCreate', conditions: '', actions: [] })

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

  const submit = () => {
    let conditions: any = {}
    if (form.conditions.trim()) {
      try { conditions = JSON.parse(form.conditions) } catch { addToast({ title: 'Invalid conditions JSON', variant: 'destructive' }); return }
    }
    const d = { name: form.name, moduleName: form.moduleName, triggerType: form.triggerType, conditions, actions: form.actions }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  const edit = (w: any) => {
    setEditId(w.id)
    setForm({
      name: w.name, moduleName: w.moduleName, triggerType: w.triggerType,
      conditions: JSON.stringify(w.conditions || {}, null, 2), actions: (w.actions || []).map((a: any) => ({ ...a })),
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Run automated actions when records are created, updated, or deleted.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', moduleName: 'leads', triggerType: 'onCreate', conditions: '', actions: [] }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Workflow
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'moduleName', label: 'Module' },
          { key: 'triggerType', label: 'Trigger' },
          { key: 'actionCount', label: 'Actions', render: (_, w) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{w.actions?.length ?? 0}</span> },
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
          <>
            <Button variant="ghost" size="icon" onClick={() => edit(w)}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(w.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Workflow' : 'New Workflow'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <Input placeholder="Workflow name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
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
                  <option value="onCreate">On create</option>
                  <option value="onUpdate">On update</option>
                  <option value="onDelete">On delete</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Conditions (optional JSON)</label>
              <textarea placeholder='{"logic":"all","rules":[{"field":"leadStatus","op":"eq","value":"New"}]}' className={`${inputCls} h-20`} value={form.conditions} onChange={e => setForm((f: any) => ({ ...f, conditions: e.target.value }))} />
            </div>
            <ActionEditor actions={form.actions} setActions={(a) => setForm((f: any) => ({ ...f, actions: a }))} />
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
  const [form, setForm] = useState<any>({ name: '', moduleName: '', frequency: 'daily', actions: [] })

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
    const d = { name: form.name, moduleName: form.moduleName || null, frequency: form.frequency, actions: form.actions }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  const edit = (t: any) => {
    setEditId(t.id)
    setForm({ name: t.name, moduleName: t.moduleName || '', frequency: t.frequency, actions: (t.actions || []).map((a: any) => ({ ...a })) })
    setShowForm(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Run actions on a schedule. The background worker checks every 60 seconds.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', moduleName: '', frequency: 'daily', actions: [] }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Task
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'frequency', label: 'Frequency', render: (v) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{v}</span> },
          { key: 'nextRun', label: 'Next Run', render: (v) => v ? formatDateTime(v) : '—' },
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
