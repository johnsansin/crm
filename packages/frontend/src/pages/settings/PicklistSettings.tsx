import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ListChecks, FormInput, LayoutGrid, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, Save, Eye, EyeOff } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  { key: 'accounts', label: 'Accounts' }, { key: 'contacts', label: 'Contacts' }, { key: 'leads', label: 'Leads' },
  { key: 'potentials', label: 'Potentials' }, { key: 'campaigns', label: 'Campaigns' }, { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' }, { key: 'vendors', label: 'Vendors' }, { key: 'quotes', label: 'Quotes' },
  { key: 'salesorders', label: 'Sales Orders' }, { key: 'purchaseorders', label: 'Purchase Orders' }, { key: 'invoices', label: 'Invoices' },
  { key: 'tickets', label: 'Tickets' }, { key: 'faq', label: 'FAQ' }, { key: 'documents', label: 'Documents' },
  { key: 'emails', label: 'Emails' }, { key: 'projects', label: 'Projects' }, { key: 'projecttasks', label: 'Project Tasks' },
  { key: 'projectmilestones', label: 'Project Milestones' }, { key: 'assets', label: 'Assets' }, { key: 'servicecontracts', label: 'Service Contracts' },
  { key: 'smsnotifier', label: 'SMS Notifier' }, { key: 'pricebooks', label: 'Price Books' }, { key: 'emailtemplates', label: 'Email Templates' },
]

const PICKLIST_FIELDS: Record<string, { field: string; label: string }[]> = {
  leads: [{ field: 'leadStatus', label: 'Lead Status' }, { field: 'leadSource', label: 'Lead Source' }, { field: 'industry', label: 'Industry' }, { field: 'rating', label: 'Rating' }, { field: 'interest', label: 'Interest' }],
  accounts: [{ field: 'industry', label: 'Industry' }, { field: 'accountType', label: 'Account Type' }, { field: 'rating', label: 'Rating' }, { field: 'ownership', label: 'Ownership' }],
  contacts: [{ field: 'leadSource', label: 'Lead Source' }, { field: 'salutation', label: 'Salutation' }],
  potentials: [{ field: 'sales_stage', label: 'Sales Stage' }, { field: 'leadSource', label: 'Lead Source' }, { field: 'potentialtype', label: 'Potential Type' }],
  campaigns: [{ field: 'campaignType', label: 'Campaign Type' }, { field: 'status', label: 'Status' }],
  tickets: [{ field: 'ticketStatus', label: 'Status' }, { field: 'ticketPriorities', label: 'Priority' }, { field: 'ticketCategories', label: 'Category' }, { field: 'severity', label: 'Severity' }],
  products: [{ field: 'productCategory', label: 'Category' }, { field: 'usageUnit', label: 'Usage Unit' }],
  services: [{ field: 'serviceCategory', label: 'Category' }, { field: 'usageUnit', label: 'Usage Unit' }],
  vendors: [{ field: 'category', label: 'Category' }],
  quotes: [{ field: 'quoteStage', label: 'Quote Stage' }, { field: 'taxType', label: 'Tax Type' }],
  salesorders: [{ field: 'soStatus', label: 'SO Status' }, { field: 'taxType', label: 'Tax Type' }],
  purchaseorders: [{ field: 'poStatus', label: 'PO Status' }, { field: 'taxType', label: 'Tax Type' }],
  invoices: [{ field: 'invoiceStatus', label: 'Invoice Status' }, { field: 'taxType', label: 'Tax Type' }],
  faq: [{ field: 'faqstatus', label: 'Status' }, { field: 'category', label: 'Category' }],
  documents: [{ field: 'fileType', label: 'File Type' }, { field: 'fileStatus', label: 'File Status' }],
  emails: [{ field: 'emailFlag', label: 'Email Flag' }],
  assets: [{ field: 'assetstatus', label: 'Status' }],
  projects: [{ field: 'projectstatus', label: 'Status' }, { field: 'projectpriority', label: 'Priority' }],
  projecttasks: [{ field: 'taskstatus', label: 'Status' }, { field: 'taskpriority', label: 'Priority' }],
  servicecontracts: [{ field: 'contractstatus', label: 'Status' }, { field: 'contracttype', label: 'Type' }],
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' }, { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' }, { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' }, { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' }, { value: 'picklist', label: 'Picklist' },
  { value: 'multiselect', label: 'Multi-select' },
]

export function PicklistSettings() {
  const [tab, setTab] = useState('picklists')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="picklists" className="gap-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"><ListChecks size={15} /> Picklist Editor</TabsTrigger>
          <TabsTrigger value="fields" className="gap-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"><FormInput size={15} /> Custom Fields</TabsTrigger>
          <TabsTrigger value="modules" className="gap-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"><LayoutGrid size={15} /> Module Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="picklists"><PicklistEditor /></TabsContent>
        <TabsContent value="fields"><CustomFieldManager /></TabsContent>
        <TabsContent value="modules"><ModuleManager /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function PicklistEditor() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('leads')
  const [fieldName, setFieldName] = useState('leadStatus')
  const [customField, setCustomField] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const currentField = customField || fieldName

  const { data, isLoading } = useQuery({
    queryKey: ['picklists', moduleName, currentField],
    queryFn: () => api.getPicklists({ module: moduleName, field: currentField }),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createPicklistOption(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['picklists'] }); addToast({ title: 'Option added', variant: 'success' }); setNewLabel('') },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updatePicklistOption(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['picklists'] }); addToast({ title: 'Option updated', variant: 'success' }); setEditId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deletePicklistOption(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['picklists'] }); addToast({ title: 'Option removed', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.reorderPicklists(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['picklists'] }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const options = data?.data || []

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= options.length) return
    const ids = options.map((o: any) => o.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderMutation.mutate(ids)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Module</label>
            <select className={inputCls} value={moduleName} onChange={e => { setModuleName(e.target.value); setCustomField(''); setFieldName((PICKLIST_FIELDS[e.target.value] || [{ field: '' }])[0]?.field || '') }}>
              {MODULES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Field</label>
            <select className={inputCls} value={customField ? '__custom__' : fieldName} onChange={e => { if (e.target.value === '__custom__') setCustomField('cf_custom_picklist'); else { setCustomField(''); setFieldName(e.target.value) } }}>
              {(PICKLIST_FIELDS[moduleName] || []).map(f => <option key={f.field} value={f.field}>{f.label}</option>)}
              <option value="__custom__">Other field…</option>
            </select>
          </div>
          {customField && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Field name</label>
              <Input value={customField} onChange={e => setCustomField(e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Input placeholder="New option label" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="max-w-xs" />
            <Button size="sm" onClick={() => createMutation.mutate({ moduleName, fieldName: currentField, label: newLabel })} disabled={!newLabel.trim() || createMutation.isPending}>
              <Plus size={14} className="mr-1.5" /> Add Option
            </Button>
          </div>
          <DataTable
            columns={[{ key: 'label', label: 'Option' }]}
            data={options}
            loading={isLoading}
            emptyMessage="No options yet for this picklist."
            pageSize={10}
            actions={(o) => {
              const i = options.findIndex((x: any) => x.id === o.id)
              return (
                <>
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={13} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === options.length - 1} title="Move down"><ArrowDown size={13} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditId(o.id); setEditLabel(o.label) }}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(o.id)}><Trash2 size={13} className="text-destructive" /></Button>
                </>
              )
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Option</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ label: editLabel }) }} className="space-y-3">
            <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} required />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Remove Option"
        description="Are you sure you want to remove this picklist option?"
        confirmLabel="Remove"
      />
    </div>
  )
}

function CustomFieldManager() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('leads')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ label: '', type: 'text', options: '', isRequired: false })

  const { data, isLoading } = useQuery({
    queryKey: ['custom-fields', moduleName],
    queryFn: () => api.getCustomFields(moduleName),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createCustomField(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custom-fields'] }); addToast({ title: 'Field created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateCustomField(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custom-fields'] }); addToast({ title: 'Field updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteCustomField(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custom-fields'] }); addToast({ title: 'Field deactivated', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => api.updateCustomField(id, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custom-fields'] }); addToast({ title: 'Field updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const fields = data?.data || []

  const submit = () => {
    const d: any = { moduleName, label: form.label, type: form.type, isRequired: form.isRequired }
    if (['picklist', 'multiselect'].includes(form.type)) {
      d.options = form.options.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (editId) updateMutation.mutate(d)
    else createMutation.mutate(d)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1.5">Module</label>
            <select className={inputCls} value={moduleName} onChange={e => setModuleName(e.target.value)}>
              {MODULES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <Button onClick={() => { setEditId(null); setForm({ label: '', type: 'text', options: '', isRequired: false }); setShowForm(true) }}>
            <Plus size={16} className="mr-2" /> New Field
          </Button>
        </CardContent>
      </Card>

      <DataTable
        columns={[
          { key: 'label', label: 'Label' },
          { key: 'fieldName', label: 'Field Name', render: (v) => <span className="font-mono text-xs text-muted-foreground">{v}</span> },
          { key: 'type', label: 'Type', render: (v) => <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{v}</span> },
          { key: 'isRequired', label: 'Required' },
        ]}
        data={fields.filter((f: any) => f.isActive)}
        loading={isLoading}
        emptyMessage="No custom fields for this module"
        pageSize={10}
        actions={(f) => (
          <>
            <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: f.id, isActive: false })} title="Deactivate"><EyeOff size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setEditId(f.id); setForm({ label: f.label, type: f.type, options: (f.options || []).join(', '), isRequired: f.isRequired }); setShowForm(true) }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      {fields.filter((f: any) => !f.isActive).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Deactivated fields</div>
            <div className="space-y-1">
              {fields.filter((f: any) => !f.isActive).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded bg-muted/30">
                  <span className="text-sm text-muted-foreground">{f.label} <span className="text-xs">({f.fieldName})</span></span>
                  <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: f.id, isActive: true })} title="Reactivate"><Eye size={13} /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Field' : 'New Custom Field'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Label *</label>
              <Input value={form.label} onChange={e => setForm((f: any) => ({ ...f, label: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Type *</label>
              <select className={inputCls} value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {['picklist', 'multiselect'].includes(form.type) && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Options (comma-separated)</label>
                <Input value={form.options} onChange={e => setForm((f: any) => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isRequired} onChange={e => setForm((f: any) => ({ ...f, isRequired: e.target.checked }))} />
              Required field
            </label>
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
        title="Deactivate Field"
        description="The field will be hidden from forms and lists. Existing values are kept."
        confirmLabel="Deactivate"
      />
    </div>
  )
}

function ModuleManager() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [editName, setEditName] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editSequence, setEditSequence] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['settings-modules'], queryFn: () => api.getSettingsModules() })

  const updateMutation = useMutation({
    mutationFn: ({ name, d }: any) => api.updateModule(name, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings-modules'] }); queryClient.invalidateQueries({ queryKey: ['modules'] }); addToast({ title: 'Module updated', variant: 'success' }); setEditName(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggle = (m: any) => updateMutation.mutate({ name: m.name, d: { isActive: !m.isActive } })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading modules...</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Enable or disable modules across the CRM. Disabled modules are hidden from the menu and their API returns 403.</p>
      <DataTable
        columns={[
          { key: 'label', label: 'Module', render: (v, m) => v || m.name },
          { key: 'parent', label: 'Parent', render: (v) => <span className="text-muted-foreground">{v || '—'}</span> },
          { key: 'sequence', label: 'Sequence' },
          { key: 'isEntity', label: 'Entity' },
          { key: 'isActive', label: 'Status', render: (_, m) => (
            <button
              onClick={() => toggle(m)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.isActive ? 'bg-emerald-500' : 'bg-muted'}`}
              title={m.isActive ? 'Active' : 'Inactive'}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${m.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          ) },
        ]}
        data={data?.data || []}
        loading={isLoading}
        pageSize={25}
        actions={(m) => (
          <Button variant="ghost" size="icon" onClick={() => { setEditName(m.name); setEditLabel(m.label || m.name); setEditSequence(String(m.sequence)) }}>
            <Pencil size={13} />
          </Button>
        )}
      />

      <Dialog open={!!editName} onOpenChange={(o) => { if (!o) setEditName(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Module</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ name: editName, d: { label: editLabel, sequence: parseInt(editSequence) || 0 } }) }} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Label</label>
              <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Sequence (0-based order)</label>
              <Input type="number" value={editSequence} onChange={e => setEditSequence(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditName(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
