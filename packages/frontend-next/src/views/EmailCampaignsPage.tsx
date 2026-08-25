'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Plus, Send, Trash2, BarChart3, Mail, TestTube, X } from 'lucide-react'

const statusColors: Record<string, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function EmailCampaignsPage() {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState<string | null>(null)
  const [recipientsOpen, setRecipientsOpen] = useState<string | null>(null)
  const [testOpen, setTestOpen] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [form, setForm] = useState({ campaignName: '', subject: '', body: '', fromEmail: '', fromName: '', replyTo: '', status: 'Draft' })
  const [saving, setSaving] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => api.request<{ data: any[] }>('/email-campaigns'),
  })

  const { data: statsData } = useQuery({
    queryKey: ['email-campaign-stats', statsOpen],
    queryFn: () => statsOpen ? api.request<{ data: any }>(`/email-campaigns/${statsOpen}/stats`) : Promise.resolve(null),
    enabled: !!statsOpen,
  })

  const { data: recipientsData } = useQuery({
    queryKey: ['email-campaign-recipients', recipientsOpen],
    queryFn: () => recipientsOpen ? api.request<{ data: any[] }>(`/email-campaigns/${recipientsOpen}/recipients`) : Promise.resolve({ data: [] }),
    enabled: !!recipientsOpen,
  })

  const campaigns = data?.data || []

  const openForm = (c?: any) => {
    if (c) {
      setEditingId(c.id)
      setForm({ campaignName: c.campaignName, subject: c.subject, body: c.body, fromEmail: c.fromEmail || '', fromName: c.fromName || '', replyTo: c.replyTo || '', status: c.status })
    } else {
      setEditingId(null)
      setForm({ campaignName: '', subject: '', body: '', fromEmail: '', fromName: '', replyTo: '', status: 'Draft' })
    }
    setFormOpen(true)
  }

  const saveForm = async () => {
    if (!form.campaignName || !form.subject || !form.body) return addToast({ title: 'Error', description: 'Name, subject, body required', variant: 'destructive' })
    setSaving(true)
    try {
      if (editingId) {
        await api.request(`/email-campaigns/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api.request('/email-campaigns', { method: 'POST', body: JSON.stringify(form) })
      }
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['email-campaigns'] })
      addToast({ title: editingId ? 'Updated' : 'Created', variant: 'success' })
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const deleteCampaign = async (id: string) => {
    try {
      await api.request(`/email-campaigns/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['email-campaigns'] })
      addToast({ title: 'Deleted', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const sendCampaign = async (id: string) => {
    try {
      const res: any = await api.request(`/email-campaigns/${id}/send`, { method: 'POST', body: '{}' })
      qc.invalidateQueries({ queryKey: ['email-campaigns'] })
      addToast({ title: `Sent to ${res.sentCount || 0} recipients`, variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const sendTest = async () => {
    if (!testOpen || !testEmail) return
    try {
      await api.request(`/email-campaigns/${testOpen}/test`, { method: 'POST', body: JSON.stringify({ email: testEmail }) })
      setTestOpen(null); setTestEmail('')
      addToast({ title: 'Test sent', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const addRecipient = async () => {
    if (!recipientsOpen || !recipientEmail) return
    try {
      await api.request(`/email-campaigns/${recipientsOpen}/recipients`, { method: 'POST', body: JSON.stringify({ recipients: [{ email: recipientEmail, name: recipientName }] }) })
      setRecipientEmail(''); setRecipientName('')
      qc.invalidateQueries({ queryKey: ['email-campaign-recipients', recipientsOpen] })
      addToast({ title: 'Recipient added', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('Email Campaigns')}</h1>
        <Button onClick={() => openForm()} className="gap-1.5"><Plus size={16} />{t('New Campaign')}</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Mail size={40} className="opacity-40" />
          <p className="text-sm">{t('No campaigns yet')}</p>
          <Button variant="outline" size="sm" onClick={() => openForm()}><Plus size={14} className="mr-1" />{t('Create campaign')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{c.campaignName}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || statusColors.Draft}`}>{c.status}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.recipientCount} recipients · {c.sentAt ? `Sent ${new Date(c.sentAt).toLocaleDateString()}` : 'Not sent'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Stats" onClick={() => setStatsOpen(c.id)}><BarChart3 size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Recipients" onClick={() => setRecipientsOpen(c.id)}><Mail size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Test" onClick={() => setTestOpen(c.id)}><TestTube size={15} /></Button>
                {c.status === 'Draft' && <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openForm(c)}><Plus size={15} /></Button>}
                {c.status === 'Draft' && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => deleteCampaign(c.id)}><Trash2 size={15} /></Button>}
                {c.status === 'Draft' && <Button size="sm" className="h-8 gap-1" onClick={() => sendCampaign(c.id)}><Send size={13} />Send</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit Campaign') : t('New Campaign')}</DialogTitle>
            <DialogDescription>{t('Create an email marketing campaign')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder={t('Campaign name')} value={form.campaignName} onChange={e => setForm({ ...form, campaignName: e.target.value })} />
            <Input placeholder={t('Subject')} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <textarea placeholder={t('Body')} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder={t('From email')} value={form.fromEmail} onChange={e => setForm({ ...form, fromEmail: e.target.value })} />
              <Input placeholder={t('From name')} value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} />
            </div>
            <Input placeholder={t('Reply-to')} value={form.replyTo} onChange={e => setForm({ ...form, replyTo: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={saveForm} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statsOpen} onOpenChange={o => { if (!o) setStatsOpen(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('Campaign Stats')}</DialogTitle></DialogHeader>
          {statsData?.data ? (
            <div className="grid grid-cols-2 gap-4 py-2">
              {[
                ['Total Recipients', statsData.data.stats.totalRecipients],
                ['Sent', statsData.data.stats.sentCount],
                ['Opened', statsData.data.stats.openedCount],
                ['Clicked', statsData.data.stats.clickedCount],
                ['Bounced', statsData.data.stats.bouncedCount],
                ['Unsubscribed', statsData.data.stats.unsubscribedCount],
              ].map(([label, val]) => (
                <div key={String(label)} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{val as number}</p>
                  <p className="text-xs text-muted-foreground">{t(String(label))}</p>
                </div>
              ))}
            </div>
          ) : <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" /></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!testOpen} onOpenChange={o => { if (!o) { setTestOpen(null); setTestEmail('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('Send Test Email')}</DialogTitle></DialogHeader>
          <Input placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => { setTestOpen(null); setTestEmail('') }}>{t('Cancel')}</Button>
            <Button onClick={sendTest} disabled={!testEmail}>{t('Send Test')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recipientsOpen} onOpenChange={o => { if (!o) setRecipientsOpen(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('Recipients')}</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input placeholder="email@example.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="flex-1" />
            <Input placeholder={t('Name')} value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-40" />
            <Button onClick={addRecipient} disabled={!recipientEmail} size="sm"><Plus size={14} /></Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 mt-2">
            {(recipientsData?.data || []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/40">
                <span>{r.name || r.email}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
              </div>
            ))}
            {(!recipientsData?.data || recipientsData.data.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No recipients added</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
