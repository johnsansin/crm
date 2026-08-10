import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader2, Send, PlugZap, Mail, Pencil, X } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const DEFAULT_SMTP = { host: '', port: 587, secure: false, user: '', pass: '', fromEmail: '', fromName: '' }

export function EmailSettings() {
  const { user } = useAuthStore()
  const isSuper = !!user?.isSuperAdmin
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testSubject, setTestSubject] = useState('')

  const queryKey = isSuper ? ['global-settings'] : ['org-settings']
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => (isSuper ? api.getGlobalSettings() : api.getOrgSettings()),
    retry: 1,
  })

  useEffect(() => {
    if (data) setForm((f: any) => f ?? { ...DEFAULT_SMTP, ...(data?.smtp || {}) })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (smtp: any) => (isSuper ? api.updateGlobalSettings({ smtp }) : api.updateOrgSettings({ smtp })),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); setEditing(false); addToast({ title: 'SMTP settings saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const testMutation = useMutation({
    mutationFn: (cfg: any) => api.testSmtp(cfg),
    onSuccess: () => addToast({ title: 'SMTP connection verified', variant: 'success' }),
    onError: (e: Error) => addToast({ title: 'SMTP test failed', description: e.message, variant: 'destructive' }),
  })

  const sendMutation = useMutation({
    mutationFn: () => api.sendEmail({ to: testTo, subject: testSubject, html: '<p>This is a test email from BizForce CRM.</p>' }),
    onSuccess: (res: any) => addToast({
      title: res.delivered ? 'Test email delivered' : 'Email not delivered',
      description: res.delivered ? '' : (res.error ? `SMTP send failed: ${res.error}` : 'No SMTP configured — email was logged instead'),
      variant: res.delivered ? 'success' : 'destructive',
    }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading && !form) return <p className="text-sm text-muted-foreground">Loading settings...</p>
  if (isError && !form) return <p className="text-sm text-destructive">Failed to load SMTP settings. Please check your connection and try again.</p>
  if (!form) return <p className="text-sm text-muted-foreground">No SMTP configuration available.</p>

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground max-w-2xl">
          {isSuper
            ? 'Global outgoing mail server used as the default for all organizations. When an organization has no SMTP of its own, emails are sent through this server.'
            : 'Outgoing email server used for password resets, workflow email actions, and sent emails. When SMTP is not configured, emails are logged to the Emails module instead.'}
        </p>
        {editing ? (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X size={15} className="mr-1.5" /> Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil size={15} className="mr-1.5" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">SMTP Server</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Host</label>
            <Input placeholder="smtp.example.com" value={form.host || ''} onChange={e => set('host', e.target.value)} disabled={!editing} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Port</label>
            <Input type="number" value={form.port ?? 587} onChange={e => set('port', parseInt(e.target.value) || 587)} disabled={!editing} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Username</label>
            <Input value={form.user || ''} onChange={e => set('user', e.target.value)} disabled={!editing} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <PasswordInput value={editing ? (form.pass || '') : (form.pass ? '••••••••' : '')} onChange={e => set('pass', e.target.value)} disabled={!editing} placeholder={editing ? '' : 'No password set'} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">From Email</label>
            <Input type="email" placeholder="noreply@example.com" value={form.fromEmail || ''} onChange={e => set('fromEmail', e.target.value)} disabled={!editing} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">From Name</label>
            <Input value={form.fromName || ''} onChange={e => set('fromName', e.target.value)} disabled={!editing} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={!!form.secure} onChange={e => set('secure', e.target.checked)} disabled={!editing} />
            Use TLS/SSL (for port 465)
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => testMutation.mutate(form)} disabled={testMutation.isPending}>
          {testMutation.isPending ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <PlugZap size={15} className="mr-1.5" />}
          Test Connection
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Send Test Email</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">To</label>
            <Input type="email" placeholder="you@example.com" value={testTo} onChange={e => setTestTo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Subject</label>
            <Input placeholder="Test email from BizForce" value={testSubject} onChange={e => setTestSubject(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button size="sm" onClick={() => sendMutation.mutate()} disabled={!testTo || sendMutation.isPending}>
              {sendMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Mail size={13} /> Emails sent from the CRM are stored in the Emails module for the record.
      </div>
    </div>
  )
}
