import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader2, Send, PlugZap, Mail } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function EmailSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [testTo, setTestTo] = useState('')
  const [testSubject, setTestSubject] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['org-settings'], queryFn: () => api.getOrgSettings() })
  if (data && !form) setForm(data?.smtp)

  const saveMutation = useMutation({
    mutationFn: (smtp: any) => api.updateOrgSettings({ smtp }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['org-settings'] }); addToast({ title: 'SMTP settings saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const testMutation = useMutation({
    mutationFn: (cfg: any) => api.testSmtp(cfg),
    onSuccess: () => addToast({ title: 'SMTP connection verified', variant: 'success' }),
    onError: (e: Error) => addToast({ title: 'SMTP test failed', description: e.message, variant: 'destructive' }),
  })

  const sendMutation = useMutation({
    mutationFn: () => api.sendEmail({ to: testTo, subject: testSubject, html: '<p>This is a test email from BizForce CRM.</p>' }),
    onSuccess: (res: any) => addToast({ title: res.delivered ? 'Test email delivered' : 'Test email recorded', description: res.delivered ? '' : 'No SMTP configured — email was logged instead', variant: res.delivered ? 'success' : 'default' }),
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading settings...</p>

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Outgoing email server used for password resets, workflow email actions, and sent emails. When SMTP is not configured, emails are logged to the Emails module instead.
      </p>

      <Card>
        <CardHeader><CardTitle className="text-sm">SMTP Server</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Host</label>
            <Input placeholder="smtp.example.com" value={form.host || ''} onChange={e => set('host', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Port</label>
            <Input type="number" value={form.port ?? 587} onChange={e => set('port', parseInt(e.target.value) || 587)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Username</label>
            <Input value={form.user || ''} onChange={e => set('user', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <Input type="password" value={form.pass || ''} onChange={e => set('pass', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">From Email</label>
            <Input type="email" placeholder="noreply@example.com" value={form.fromEmail || ''} onChange={e => set('fromEmail', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">From Name</label>
            <Input value={form.fromName || ''} onChange={e => set('fromName', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={!!form.secure} onChange={e => set('secure', e.target.checked)} />
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
