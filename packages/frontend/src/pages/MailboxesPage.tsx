import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { DataTable } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Inbox, RefreshCw, Plus, Pencil, Trash2, Loader2, MailOpen, Send, Ticket } from 'lucide-react'
import { formatDateTime } from '@/lib/org-format'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function MailboxesPage() {
  const [tab, setTab] = useState('mailboxes')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Inbox className="text-primary" /> Mailboxes & Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Connect IMAP mailboxes, sync emails and convert inbound mail into tickets (vtiger email module + email-to-ticket).</p>
        </div>
      </div>
      <TabsRoot value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mailboxes" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><Inbox size={15} /> Mailboxes</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-600"><MailOpen size={15} /> Synced Emails</TabsTrigger>
        </TabsList>
        <TabsContent value="mailboxes"><MailboxesTab onSelect={() => setTab('inbox')} /></TabsContent>
        <TabsContent value="inbox"><InboxTab /></TabsContent>
      </TabsRoot>
    </div>
  )
}

function MailboxesTab({ onSelect }: { onSelect: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [ruleBox, setRuleBox] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ name: '', host: '', port: 993, secure: true, user: '', pass: '', folder: 'INBOX' })

  const { data, isLoading } = useQuery({ queryKey: ['mailboxes'], queryFn: () => api.list('mailboxes', { limit: '100' }) })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editing ? api.update('mailboxes', editing.id, d) : api.create('mailboxes', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mailboxes'] }); addToast({ title: editing ? 'Mailbox updated' : 'Mailbox added', variant: 'success' }); setShowForm(false); setEditing(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('mailboxes', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mailboxes'] }); addToast({ title: 'Mailbox deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.syncMailbox(id),
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: ['mailboxes'] })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      addToast({ title: 'Sync complete', description: `${r.fetched || 0} emails fetched, ${r.ticketsCreated || 0} tickets created`, variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Sync failed', description: e.message, variant: 'destructive' }),
  })

  const submit = () => {
    if (!form.name || !form.host || !form.user) return
    saveMutation.mutate({ ...form, port: Number(form.port || 993) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Incoming emails are stored in the Emails module. Emails matching an active rule become tickets automatically.</p>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', host: '', port: 993, secure: true, user: '', pass: '', folder: 'INBOX' }); setShowForm(true) }}><Plus size={15} className="mr-1.5" /> Add Mailbox</Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'host', label: 'Host', render: (v) => <span className="text-muted-foreground">{v}</span> },
          { key: 'user', label: 'User', render: (v) => <span className="text-muted-foreground">{v}</span> },
          { key: 'lastSyncAt', label: 'Last Sync', render: (v) => <span className="text-muted-foreground">{v ? formatDateTime(v) : 'Never'}</span> },
        ]}
        data={data?.data || []}
        loading={isLoading}
        emptyMessage="No mailboxes configured."
        pageSize={10}
        actions={(m) => (
          <>
            <Button size="sm" variant="outline" onClick={() => syncMutation.mutate(m.id)} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync
            </Button>
            <Button variant="ghost" size="icon" title="Email to ticket rule" onClick={() => setRuleBox(m)}><Ticket size={14} /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setForm({ name: m.name, host: m.host, port: m.port, secure: m.secure !== false, user: m.user, pass: m.pass || '', folder: m.folder || 'INBOX' }); setShowForm(true) }}><Pencil size={13} /></Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}><Trash2 size={13} className="text-destructive" /></Button>
          </>
        )}
      />

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditing(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Mailbox' : 'Add Mailbox'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-3">
            <Input placeholder="Name (e.g. Support Inbox)" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="IMAP Host (e.g. imap.gmail.com)" value={form.host} onChange={(e) => setForm((f: any) => ({ ...f, host: e.target.value }))} required />
              <Input type="number" placeholder="Port" value={form.port} onChange={(e) => setForm((f: any) => ({ ...f, port: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Username / Email" value={form.user} onChange={(e) => setForm((f: any) => ({ ...f, user: e.target.value }))} required />
              <PasswordInput placeholder="Password / App password" value={form.pass} onChange={(e) => setForm((f: any) => ({ ...f, pass: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Folder (default INBOX)" value={form.folder} onChange={(e) => setForm((f: any) => ({ ...f, folder: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm px-1">
                <input type="checkbox" checked={form.secure} onChange={(e) => setForm((f: any) => ({ ...f, secure: e.target.checked }))} />
                SSL/TLS
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}{editing ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ruleBox} onOpenChange={() => setRuleBox(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Email-to-Ticket Rule</DialogTitle></DialogHeader>
          <RuleForm mailboxId={ruleBox?.id} onClose={() => setRuleBox(null)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate()} title="Delete Mailbox" description="This mailbox will no longer be synced." confirmLabel="Delete" />
    </div>
  )
}

function RuleForm({ mailboxId, onClose }: { mailboxId: string; onClose: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['mailbox-rule', mailboxId], queryFn: () => api.getMailboxRule(mailboxId), enabled: !!mailboxId })
  const [form, setForm] = useState<any | null>(null)

  const initial = data?.data
  const current = form ?? initial ?? { defaultStatus: 'Open', defaultPriority: 'Normal', defaultAssignedTo: null, createContactIfMissing: false, isActive: true }

  const saveMutation = useMutation({
    mutationFn: (d: any) => api.saveMailboxRule(mailboxId, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mailbox-rule', mailboxId] }); addToast({ title: 'Rule saved', variant: 'success' }); onClose() },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1.5">Default Ticket Status</label>
          <Input value={current.defaultStatus || ''} onChange={(e) => setForm((f: any) => ({ ...(f || current), defaultStatus: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Default Priority</label>
          <Input value={current.defaultPriority || ''} onChange={(e) => setForm((f: any) => ({ ...(f || current), defaultPriority: e.target.value }))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!current.createContactIfMissing} onChange={(e) => setForm((f: any) => ({ ...(f || current), createContactIfMissing: e.target.checked }))} />
        Create contact automatically if sender is unknown
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={current.isActive !== false} onChange={(e) => setForm((f: any) => ({ ...(f || current), isActive: e.target.checked }))} />
        Rule active
      </label>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate(current)} disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}Save Rule</Button>
      </div>
    </div>
  )
}

function InboxTab() {
  const { data, isLoading } = useQuery({ queryKey: ['emails', 'inbox'], queryFn: () => api.list('emails', { limit: '100', filter: JSON.stringify({ mailboxId: { not: null } }) }) })
  const emails = (data?.data || []).filter((e: any) => e.mailboxId)
  return (
    <DataTable
      columns={[
        { key: 'fromEmail', label: 'From', render: (v) => <span className="font-medium">{v || '—'}</span> },
        { key: 'subject', label: 'Subject', render: (v) => <span className="max-w-xs truncate block">{v}</span> },
        { key: 'emailFlag', label: 'Flag', render: (v) => <span className="text-muted-foreground capitalize">{v || '—'}</span> },
        { key: 'dateSent', label: 'Received', render: (v) => <span className="text-muted-foreground whitespace-nowrap">{v ? formatDateTime(v) : '—'}</span> },
      ]}
      data={emails}
      loading={isLoading}
      emptyMessage="No synced emails yet. Add a mailbox and click Sync."
      pageSize={10}
    />
  )
}
