import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { KeyRound, Lock, Plus, Trash2, Loader2, Link2, Copy, RefreshCw, LayoutTemplate, ListTree, BellRing } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function IntegrationSettings() {
  const [tab, setTab] = useState('api')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="api" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><KeyRound size={15} /> REST API & Keys</TabsTrigger>
          <TabsTrigger value="portal" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><Lock size={15} /> Customer Portal</TabsTrigger>
          <TabsTrigger value="google" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><Link2 size={15} /> Google Sync</TabsTrigger>
          <TabsTrigger value="deps" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><ListTree size={15} /> Picklist Dependencies</TabsTrigger>
          <TabsTrigger value="layout" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><LayoutTemplate size={15} /> Layout Editor</TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><BellRing size={15} /> Payment Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="api"><ApiKeysTab /></TabsContent>
        <TabsContent value="portal"><PortalTab /></TabsContent>
        <TabsContent value="google"><GoogleTab /></TabsContent>
        <TabsContent value="deps"><DependenciesTab /></TabsContent>
        <TabsContent value="layout"><LayoutTab /></TabsContent>
        <TabsContent value="reminders"><RemindersTab /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function ApiKeysTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [created, setCreated] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ name: '', scopes: ['read', 'write'], expiresAt: '' })

  const { data, isLoading } = useQuery({ queryKey: ['apikeys'], queryFn: () => api.getApiKeys() })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createApiKey(d),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['apikeys'] }); setCreated(r.data); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteApiKey(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['apikeys'] }); addToast({ title: 'API key revoked', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        REST WebService API — login at <code className="text-xs bg-muted px-1 rounded">POST /api/rest/login</code> with username/password to get a <code className="text-xs bg-muted px-1 rounded">sessionName</code>, then query modules at <code className="text-xs bg-muted px-1 rounded">/api/rest/&lt;module&gt;</code>. API keys allow scoped machine access.
      </p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Keys are hashed server-side and shown only once.</p>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={15} className="mr-1.5" /> Generate Key</Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'keyPrefix', label: 'Key', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}.••••••••</code> },
          { key: 'scopes', label: 'Scopes', render: (v) => <span className="text-muted-foreground">{(v || []).join(', ')}</span> },
          { key: 'expiresAt', label: 'Expires', render: (v) => <span className="text-muted-foreground">{v ? new Date(v).toLocaleDateString() : 'Never'}</span> },
          { key: 'lastUsedAt', label: 'Last Used', render: (v) => <span className="text-muted-foreground">{v ? new Date(v).toLocaleString() : 'Never'}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No API keys yet."
        pageSize={10}
        actions={(k) => <Button variant="ghost" size="icon" onClick={() => setDeleteId(k.id)}><Trash2 size={13} className="text-destructive" /></Button>}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate API Key</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Key name (e.g. Integration X)" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
            <label className="text-sm font-medium block mb-1.5">Scopes</label>
            <div className="flex gap-4">
              {['read', 'write', 'delete'].map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={form.scopes.includes(s)} onChange={(e) => setForm((f: any) => ({ ...f, scopes: e.target.checked ? [...f.scopes, s] : f.scopes.filter((x: string) => x !== s) }))} />
                  {s}
                </label>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Expires at (optional)</label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f: any) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>{createMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!created} onOpenChange={() => setCreated(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copy your API key</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Store this key now — it will not be shown again.</p>
          <div className="flex gap-2">
            <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs break-all">{created?.key}</code>
            <Button size="icon" onClick={() => { navigator.clipboard?.writeText(created.key); addToast({ title: 'Copied', variant: 'success' }) }}><Copy size={14} /></Button>
          </div>
          <div className="flex justify-end"><Button onClick={() => setCreated(null)}>Done</Button></div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate()} title="Revoke API key?" description="Clients using this key will lose access immediately." confirmLabel="Revoke" />
    </div>
  )
}

function PortalTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [contactId, setContactId] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const { data: contacts } = useQuery({ queryKey: ['contacts', 'portal'], queryFn: () => api.list('contacts', { limit: '200' }) })
  const { data: portalUsers } = useQuery({ queryKey: ['portal-users'], queryFn: () => api.list('portalusers', { limit: '200' }).catch(() => ({ data: [] })) })

  const registerMutation = useMutation({
    mutationFn: (d: any) => api.registerPortal(d.contactId, d.accessCode),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['portal-users'] }); addToast({ title: 'Portal enabled', description: `Access code: ${r.accessCode}`, variant: 'success' }); setContactId(''); setAccessCode('') },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const unregisterMutation = useMutation({
    mutationFn: (contactId: string) => api.unregisterPortal(contactId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-users'] }); addToast({ title: 'Portal access revoked', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Customers log in at <code className="text-xs bg-muted px-1 rounded">POST /api/portal/login</code> with their contact email and access code, then view their invoices and manage tickets.
      </p>
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Enable portal for a contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className={inputCls} value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">Select contact…</option>
            {(contacts?.data || []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.email || ''}</option>
            ))}
          </select>
          <Input placeholder="Access code (optional — auto-generated)" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} />
          <Button onClick={() => registerMutation.mutate({ contactId, accessCode })} disabled={!contactId || registerMutation.isPending}>
            {registerMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Enable Portal
          </Button>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'userId', label: 'Contact', render: (v) => {
            const c = (contacts?.data || []).find((x: any) => x.id === v)
            return <span className="font-medium">{c ? `${c.firstName} ${c.lastName}` : v}</span>
          } },
          { key: 'accessCode', label: 'Access Code', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v || '—'}</code> },
          { key: 'lastLoginAt', label: 'Last Login', render: (v) => <span className="text-muted-foreground">{v ? new Date(v).toLocaleString() : 'Never'}</span> },
          { key: 'isActive', label: 'Active', render: (v) => <span className={`text-xs font-medium ${v ? 'text-emerald-600' : 'text-muted-foreground'}`}>{v ? 'Yes' : 'No'}</span> },
        ]}
        data={(portalUsers?.data || []).filter((p: any) => p.isActive)}
        loading={false}
        emptyMessage="No portal users yet."
        pageSize={10}
        actions={(p) => <Button variant="ghost" size="sm" onClick={() => unregisterMutation.mutate(p.userId)}><Trash2 size={13} className="text-destructive" /></Button>}
      />
    </div>
  )
}

function GoogleTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>({ email: '', accessToken: '', refreshToken: '', syncCalendar: true, syncContacts: false })
  const { data: accounts, isLoading } = useQuery({ queryKey: ['google-accounts'], queryFn: () => api.getGoogleAccounts() })
  const { data: authUrl } = useQuery({ queryKey: ['google-auth'], queryFn: () => api.getGoogleAuthUrl() })

  const connectMutation = useMutation({
    mutationFn: (d: any) => api.connectGoogle(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['google-accounts'] }); addToast({ title: 'Google account connected', variant: 'success' }); setForm({ email: '', accessToken: '', refreshToken: '', syncCalendar: true, syncContacts: false }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const syncMutation = useMutation({
    mutationFn: ({ id, mode }: any) => api.syncGoogle(id, mode),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['google-accounts'] }); addToast({ title: 'Sync complete', description: `${r.synced || 0} records matched`, variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => api.disconnectGoogle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['google-accounts'] }); addToast({ title: 'Disconnected', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {authUrl?.data?.clientIdConfigured
          ? <>Start OAuth at the URL below, then paste the authorization code.</>
          : <>No Google client id configured. You can still register accounts with access/refresh tokens (used by sync jobs).</>}
      </p>
      {authUrl?.data?.authUrl && (
        <Button size="sm" variant="outline" onClick={() => window.open(authUrl.data.authUrl, '_blank')}><Link2 size={14} className="mr-1.5" /> Open Google OAuth</Button>
      )}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Connect account</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Google account email" value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Access token (optional)" value={form.accessToken} onChange={(e) => setForm((f: any) => ({ ...f, accessToken: e.target.value }))} />
          <Input placeholder="Refresh token (optional)" value={form.refreshToken} onChange={(e) => setForm((f: any) => ({ ...f, refreshToken: e.target.value }))} />
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={form.syncCalendar} onChange={(e) => setForm((f: any) => ({ ...f, syncCalendar: e.target.checked }))} /> Calendar</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={form.syncContacts} onChange={(e) => setForm((f: any) => ({ ...f, syncContacts: e.target.checked }))} /> Contacts</label>
          </div>
        </div>
        <Button onClick={() => connectMutation.mutate(form)} disabled={!form.email || connectMutation.isPending}>{connectMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Connect</Button>
      </div>
      <DataTable
        columns={[
          { key: 'email', label: 'Account', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'syncCalendar', label: 'Calendar', render: (v) => <span className="text-xs">{v ? 'On' : 'Off'}</span> },
          { key: 'syncContacts', label: 'Contacts', render: (v) => <span className="text-xs">{v ? 'On' : 'Off'}</span> },
          { key: 'lastSyncedAt', label: 'Last Synced', render: (v) => <span className="text-muted-foreground">{v ? new Date(v).toLocaleString() : 'Never'}</span> },
        ]}
        data={accounts?.data || []}
        loading={isLoading}
        emptyMessage="No connected Google accounts."
        pageSize={10}
        actions={(a) => (
          <>
            <Button size="sm" variant="outline" onClick={() => syncMutation.mutate({ id: a.id, mode: 'all' })}>{syncMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync</Button>
            <Button variant="ghost" size="icon" onClick={() => disconnectMutation.mutate(a.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />
    </div>
  )
}

const DEP_MODULES = ['leads', 'accounts', 'contacts', 'potentials', 'tickets', 'projects']

function DependenciesTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('leads')
  const [parentField, setParentField] = useState('')
  const [childField, setChildField] = useState('')
  const [mappingText, setMappingText] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['picklist-deps', moduleName], queryFn: () => api.getPicklistDependencies(moduleName) })
  const { data: picklists } = useQuery({ queryKey: ['picklists', 'all'], queryFn: () => api.getAllPicklists(moduleName) })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createPicklistDependency(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['picklist-deps'] }); addToast({ title: 'Dependency saved', variant: 'success' }); setParentField(''); setChildField(''); setMappingText('') },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePicklistDependency(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['picklist-deps'] }); addToast({ title: 'Dependency removed', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const picklistNames = Object.keys(picklists?.data || {})

  const parseMappings = () => {
    const result: any[] = []
    for (const line of mappingText.split('\n')) {
      const [parent, ...rest] = line.split('=>')
      if (!parent) continue
      const children = (rest.join('=>') || '').split(',').map((s) => s.trim()).filter(Boolean)
      if (parent.trim()) result.push({ parent: parent.trim(), children })
    }
    return result
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        When a parent picklist value is chosen, the child picklist is limited to mapped values (vtiger picklist dependency). Format each line as: <code className="text-xs bg-muted px-1 rounded">Parent Value {'=>'} Child A, Child B</code>
      </p>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Module</label>
            <select className={inputCls} value={moduleName} onChange={(e) => setModuleName(e.target.value)}>
              {DEP_MODULES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Parent field</label>
            <select className={inputCls} value={parentField} onChange={(e) => setParentField(e.target.value)}>
              <option value="">Select…</option>
              {picklistNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Child field</label>
            <select className={inputCls} value={childField} onChange={(e) => setChildField(e.target.value)}>
              <option value="">Select…</option>
              {picklistNames.filter((p) => p !== parentField).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <textarea className={`${inputCls} h-28 font-mono text-xs`} placeholder={'Value => Option 1, Option 2\nValue2 => Option A, Option B'} value={mappingText} onChange={(e) => setMappingText(e.target.value)} />
        <Button onClick={() => createMutation.mutate({ moduleName, parentField, childField, mappings: parseMappings() })} disabled={!parentField || !childField || createMutation.isPending}>
          {createMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Save Dependency
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'parentField', label: 'Parent Field', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'childField', label: 'Child Field', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'mappings', label: 'Mappings', render: (v) => <span className="text-muted-foreground">{Array.isArray(v) ? `${v.length} parent values` : '—'}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No picklist dependencies defined."
        pageSize={10}
        actions={(d) => <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 size={13} className="text-destructive" /></Button>}
      />
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate()} title="Remove dependency?" description="Child picklists will revert to full value lists." confirmLabel="Remove" />
    </div>
  )
}

const LAYOUT_MODULES = ['accounts', 'contacts', 'leads', 'potentials', 'tickets', 'products', 'projects']

function LayoutTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('accounts')
  const [tabName, setTabName] = useState('details')
  const [orderText, setOrderText] = useState('')
  const [hidden, setHidden] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['layout', moduleName, tabName], queryFn: () => api.getModuleLayout(moduleName) })
  const layout = (data?.data || []).find((l: any) => l.tabName === tabName)

  const saveMutation = useMutation({
    mutationFn: (d: any) => api.saveModuleLayout(moduleName, tabName, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['layout'] }); addToast({ title: 'Layout saved', description: 'Applies to all records in this module', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const load = () => {
    setOrderText((layout?.fieldOrder || []).join('\n'))
    const vis = layout?.fieldVisibility || {}
    setHidden(Object.entries(vis).filter(([, v]) => v === false).map(([k]) => k).join('\n'))
  }

  if (!isLoading && layout && !orderText) load()

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Reorder fields (one per line, top first) and list fields to hide (one per line). Customizes the detail view per module (vtiger layout editor).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Module</label>
          <select className={inputCls} value={moduleName} onChange={(e) => { setModuleName(e.target.value); setOrderText(''); setHidden('') }}>
            {LAYOUT_MODULES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Tab</label>
          <select className={inputCls} value={tabName} onChange={(e) => { setTabName(e.target.value); setOrderText(''); setHidden('') }}>
            {['details', 'moreinfo', 'address'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Field order (one per line)</label>
          <textarea className={`${inputCls} h-40 font-mono text-xs`} value={orderText} onChange={(e) => setOrderText(e.target.value)} placeholder={'accountName\nphone\nemail\nwebsite'} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Hidden fields (one per line)</label>
          <textarea className={`${inputCls} h-40 font-mono text-xs`} value={hidden} onChange={(e) => setHidden(e.target.value)} placeholder={'fax\ntickerSymbol'} />
        </div>
      </div>
      <Button
        onClick={() => {
          const fieldOrder = orderText.split('\n').map((s) => s.trim()).filter(Boolean)
          const visibility: Record<string, boolean> = {}
          const hiddenFields = hidden.split('\n').map((s) => s.trim()).filter(Boolean)
          hiddenFields.forEach((f) => { visibility[f] = false })
          saveMutation.mutate({ fieldOrder, fieldVisibility: visibility })
        }}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Save Layout
      </Button>
    </div>
  )
}

function RemindersTab() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({ queryKey: ['org-settings'], queryFn: () => api.getOrgSettings() })
  const reminders = settings?.settings?.paymentReminders || { enabled: false, daysBefore: 3, template: '' }
  const [form, setForm] = useState<any>(null)
  const current = form ?? reminders

  const saveMutation = useMutation({
    mutationFn: (d: any) => api.updateOrgSettings({ paymentReminders: d }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['org-settings'] }); addToast({ title: 'Reminder settings saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3 max-w-xl">
      <p className="text-sm text-muted-foreground">Automatically email customers whose invoices are due within the configured window. Runs every minute alongside the scheduler.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!current.enabled} onChange={(e) => setForm((f: any) => ({ ...(f || reminders), enabled: e.target.checked }))} />
        Enable payment reminder emails
      </label>
      <div>
        <label className="text-sm font-medium block mb-1.5">Remind before due date (days)</label>
        <Input type="number" min={1} value={current.daysBefore ?? 3} onChange={(e) => setForm((f: any) => ({ ...(f || reminders), daysBefore: Number(e.target.value) }))} />
      </div>
      <Button onClick={() => saveMutation.mutate(current)} disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Save</Button>
    </div>
  )
}
