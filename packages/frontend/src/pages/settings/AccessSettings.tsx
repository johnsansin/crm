import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Share2, UserCog, Plus, Pencil, Trash2, Loader2, CheckCircle2, Save } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  { key: 'accounts', label: 'Accounts' }, { key: 'contacts', label: 'Contacts' }, { key: 'leads', label: 'Leads' },
  { key: 'potentials', label: 'Potentials' }, { key: 'campaigns', label: 'Campaigns' }, { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' }, { key: 'vendors', label: 'Vendors' }, { key: 'pricebooks', label: 'Price Books' },
  { key: 'quotes', label: 'Quotes' }, { key: 'salesorders', label: 'Sales Orders' }, { key: 'purchaseorders', label: 'Purchase Orders' },
  { key: 'invoices', label: 'Invoices' }, { key: 'tickets', label: 'Tickets' }, { key: 'faq', label: 'FAQ' },
  { key: 'documents', label: 'Documents' }, { key: 'emails', label: 'Emails' }, { key: 'emailtemplates', label: 'Email Templates' },
  { key: 'projects', label: 'Projects' }, { key: 'projecttasks', label: 'Project Tasks' }, { key: 'projectmilestones', label: 'Project Milestones' },
  { key: 'assets', label: 'Assets' }, { key: 'servicecontracts', label: 'Service Contracts' }, { key: 'smsnotifier', label: 'SMS Notifier' },
]

const ACCESS_TYPES = [
  { value: 'PublicReadWriteDeleteImport', label: 'Public — full access (incl. import)' },
  { value: 'PublicReadWriteDelete', label: 'Public — view, create, edit, delete' },
  { value: 'PublicReadWrite', label: 'Public — view, create, edit' },
  { value: 'PublicRead', label: 'Public — view only' },
  { value: 'Private', label: 'Private — owner only (plus selected roles)' },
]

export function AccessSettings() {
  const [tab, setTab] = useState('sharing')
  return (
    <div className="space-y-4">
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sharing" className="gap-2 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"><Share2 size={15} /> Sharing Access</TabsTrigger>
          <TabsTrigger value="profiles" className="gap-2 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400"><UserCog size={15} /> Permission Profiles</TabsTrigger>
        </TabsList>
        <TabsContent value="sharing"><SharingSettings /></TabsContent>
        <TabsContent value="profiles"><ProfileSettings /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function SharingSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [loaded, setLoaded] = useState(false)

  const { data: rulesData, isLoading } = useQuery({ queryKey: ['sharing-rules'], queryFn: () => api.getSharingRules() })
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: () => api.listAll('roles').catch(() => ({ data: [] })) })

  const saveMutation = useMutation({
    mutationFn: ({ moduleName, data }: any) => api.updateSharingRule(moduleName, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sharing-rules'] }); addToast({ title: 'Sharing rule saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const rules = rulesData?.data || []
  useEffect(() => {
    if (rulesData && !loaded) {
      const map: Record<string, any> = {}
      rules.forEach((r: any) => { map[r.moduleName] = r })
      setDraft(map)
      setLoaded(true)
    }
  }, [rulesData, loaded])

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading sharing rules...</p>

  const setAccess = (moduleName: string, accessType: string) =>
    setDraft(d => ({ ...d, [moduleName]: { ...(d[moduleName] || {}), accessType } }))

  const toggleRole = (moduleName: string, roleId: string) => {
    const current = (draft[moduleName]?.roleIds || []) as string[]
    const next = current.includes(roleId) ? current.filter(r => r !== roleId) : [...current, roleId]
    setDraft(d => ({ ...d, [moduleName]: { ...(d[moduleName] || {}), roleIds: next } }))
  }

  const save = (moduleName: string) => {
    const rule = draft[moduleName] || { accessType: 'PublicReadWriteDelete' }
    saveMutation.mutate({ moduleName, data: { accessType: rule.accessType || 'PublicReadWriteDelete', roleIds: rule.roleIds || [] } })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Control which records each role can access. Rules apply to non-admin users.</p>
      <div className="space-y-2">
        {MODULES.map(m => {
          const rule = draft[m.key] || { accessType: 'PublicReadWriteDelete', roleIds: [] }
          const isPrivate = rule.accessType === 'Private'
          return (
            <Card key={m.key}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="md:w-40 shrink-0 font-medium text-sm">{m.label}</div>
                  <select className={`${inputCls} md:flex-1`} value={rule.accessType || 'PublicReadWriteDelete'} onChange={e => setAccess(m.key, e.target.value)}>
                    {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                  <Button size="sm" onClick={() => save(m.key)} disabled={saveMutation.isPending}>
                    <Save size={14} className="mr-1.5" /> Save
                  </Button>
                </div>
                {isPrivate && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Also share with roles</div>
                    <div className="flex flex-wrap gap-3">
                      {(rolesData?.data || []).map((r: any) => (
                        <label key={r.id} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" checked={(rule.roleIds || []).includes(r.id)} onChange={() => toggleRole(m.key, r.id)} />
                          {r.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [applyId, setApplyId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', description: '', roleIds: [], permissions: {} })

  const { data, isLoading } = useQuery({ queryKey: ['profiles'], queryFn: () => api.getProfiles() })
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: () => api.listAll('roles').catch(() => ({ data: [] })) })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createProfile(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); addToast({ title: 'Profile created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateProfile(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); addToast({ title: 'Profile updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProfile(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); addToast({ title: 'Profile deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
  const applyMutation = useMutation({
    mutationFn: () => api.applyProfile(applyId!),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ['role-permissions'] }); addToast({ title: `Applied to ${res.appliedRoles || 0} roles`, variant: 'success' }); setApplyId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggleRole = (id: string) => setForm((f: any) => ({ ...f, roleIds: f.roleIds.includes(id) ? f.roleIds.filter((r: string) => r !== id) : [...f.roleIds, id] }))
  const togglePerm = (moduleName: string, action: string) =>
    setForm((f: any) => {
      const cur = f.permissions[moduleName] || {}
      return { ...f, permissions: { ...f.permissions, [moduleName]: { ...cur, [action]: !cur[action] } } }
    })

  const togglePermColumn = (action: string) =>
    setForm((f: any) => {
      const allOn = MODULES.every(m => !!(f.permissions[m.key] || {})[action])
      const permissions: Record<string, any> = { ...f.permissions }
      for (const m of MODULES) {
        const cur = permissions[m.key] || {}
        permissions[m.key] = { ...cur, [action]: !allOn }
      }
      return { ...f, permissions }
    })

  const submit = () => {
    if (editId) updateMutation.mutate(form)
    else createMutation.mutate(form)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading profiles...</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Save reusable permission sets and apply them to roles.</p>
        <Button size="sm" onClick={() => { setEditId(null); setForm({ name: '', description: '', roleIds: [], permissions: {} }); setShowForm(true) }}>
          <Plus size={15} className="mr-1.5" /> New Profile
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data?.data || []).map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span>{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-muted-foreground text-xs min-h-[2.5rem]">{p.description || 'No description'}</p>
              <p className="text-xs text-muted-foreground">{Array.isArray(p.roleIds) ? p.roleIds.length : 0} role(s) · {Object.keys(p.permissions || {}).length} module permission set(s)</p>
              <div className="flex gap-1.5 pt-2">
                <Button size="sm" variant="outline" onClick={() => setApplyId(p.id)} disabled={applyMutation.isPending}>
                  <CheckCircle2 size={13} className="mr-1" /> Apply
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', roleIds: p.roleIds || [], permissions: p.permissions || {} }); setShowForm(true) }}>
                  <Pencil size={13} className="mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!data?.data || data.data.length === 0) && <p className="text-sm text-muted-foreground col-span-full">No permission profiles yet.</p>}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Profile' : 'New Profile'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); submit() }} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Profile name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Apply to roles</div>
              <div className="flex flex-wrap gap-3">
                {(rolesData?.data || []).map((r: any) => (
                  <label key={r.id} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={form.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Module permissions</div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-2 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Module</th>
                      {['view', 'create', 'edit', 'delete', 'import', 'export'].map(a => {
                        const allOn = MODULES.every(m => !!(form.permissions[m.key] || {})[a])
                        const someOn = MODULES.some(m => !!(form.permissions[m.key] || {})[a])
                        return (
                          <th key={a} className="text-center px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => togglePermColumn(a)}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                              title={allOn ? `Disable ${a} for all modules` : `Enable ${a} for all modules`}
                            >
                              <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${allOn ? 'bg-emerald-500' : someOn ? 'bg-emerald-300' : 'bg-muted'}`}>
                                <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${allOn ? 'translate-x-[15px]' : 'translate-x-0.5'}`} />
                              </span>
                              {a}
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((m, i) => {
                      const p = form.permissions[m.key] || {}
                      return (
                        <tr key={m.key} className={`border-b last:border-0 hover:bg-muted/40 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                          <td className="px-2 py-2 font-medium">{m.label}</td>
                          {['view', 'create', 'edit', 'delete', 'import', 'export'].map(a => (
                            <td key={a} className="text-center px-2 py-2">
                              <button
                                type="button"
                                onClick={() => togglePerm(m.key, a)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p[a] ? 'bg-emerald-500' : 'bg-muted'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${p[a] ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                              </button>
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
        title="Delete Profile"
        description="Are you sure you want to delete this permission profile?"
        confirmLabel="Delete"
      />
    </div>
  )
}

