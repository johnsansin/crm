'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Plus, Send, Trash2, MessageSquare, FileText } from 'lucide-react'
import { useAuthStore } from '@/lib/auth'

export function SmsPage() {
  const { addToast } = useToast()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'send' | 'templates' | 'logs' | 'provider'>('send')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tplForm, setTplForm] = useState({ name: '', body: '', module: '' })
  const [saving, setSaving] = useState(false)

  const [toNumber, setToNumber] = useState('')
  const [message, setMessage] = useState('')
  const [bulkNumbers, setBulkNumbers] = useState('')
  const [selectedTpl, setSelectedTpl] = useState('')
  const [sending, setSending] = useState(false)
  const [smsConfig, setSmsConfig] = useState({ provider: 'twilio', accountSid: '', authToken: '', fromNumber: '', configured: false })

  const configQuery = useQuery({
    queryKey: ['sms-config'],
    queryFn: () => api.request<{ data: any }>('/sms/config'),
  })
  useEffect(() => {
    if (configQuery.data?.data) setSmsConfig(old => ({ ...old, ...configQuery.data!.data, authToken: '' }))
  }, [configQuery.data])

  const { data: tplData, isLoading: tplLoading } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: () => api.request<{ data: any[] }>('/sms/templates'),
  })

  const { data: logData, isLoading: logLoading } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: () => api.request<{ data: any[] }>('/sms/logs'),
  })

  const templates = tplData?.data || []
  const logs = logData?.data || []

  const openForm = (t?: any) => {
    if (t) {
      setEditingId(t.id)
      setTplForm({ name: t.name, body: t.body, module: t.module || '' })
    } else {
      setEditingId(null)
      setTplForm({ name: '', body: '', module: '' })
    }
    setFormOpen(true)
  }

  const saveTemplate = async () => {
    if (!tplForm.name || !tplForm.body) return addToast({ title: 'Error', description: 'Name and body required', variant: 'destructive' })
    setSaving(true)
    try {
      if (editingId) {
        await api.request(`/sms/templates/${editingId}`, { method: 'PUT', body: JSON.stringify(tplForm) })
      } else {
        await api.request('/sms/templates', { method: 'POST', body: JSON.stringify(tplForm) })
      }
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['sms-templates'] })
      addToast({ title: editingId ? 'Updated' : 'Created', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await api.request(`/sms/templates/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['sms-templates'] })
      addToast({ title: 'Deleted', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const sendSingle = async () => {
    if (!toNumber || !message) return addToast({ title: 'Error', description: 'To number and message required', variant: 'destructive' })
    setSending(true)
    try {
      const result: any = await api.request('/sms/send', { method: 'POST', body: JSON.stringify({ toNumber, message }) })
      setToNumber(''); setMessage(''); setSelectedTpl('')
      qc.invalidateQueries({ queryKey: ['sms-logs'] })
      addToast({ title: 'SMS sent', description: result.delivery?.providerId ? `Provider ID: ${result.delivery.providerId}` : undefined, variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSending(false) }
  }

  const sendBulk = async () => {
    const numbers = bulkNumbers.split('\n').map(s => s.trim()).filter(Boolean)
    if (!numbers.length || !message) return addToast({ title: 'Error', description: 'Numbers and message required', variant: 'destructive' })
    setSending(true)
    try {
      const res: any = await api.request('/sms/bulk', { method: 'POST', body: JSON.stringify({ toNumbers: numbers, message }) })
      setBulkNumbers(''); setMessage('')
      qc.invalidateQueries({ queryKey: ['sms-logs'] })
      addToast({ title: `Sent ${res.sentCount || 0} SMS`, description: res.failedCount ? `${res.failedCount} failed` : undefined, variant: res.failedCount ? 'destructive' : 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSending(false) }
  }

  const saveProvider = async () => {
    setSaving(true)
    try {
      const result: any = await api.request('/sms/config', { method: 'PUT', body: JSON.stringify(smsConfig) })
      setSmsConfig(old => ({ ...old, ...result.data, authToken: '' }))
      qc.invalidateQueries({ queryKey: ['sms-config'] })
      addToast({ title: 'SMS provider saved', description: result.message, variant: 'success' })
    } catch (e: any) { addToast({ title: 'SMS configuration failed', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const testProvider = async () => {
    setSaving(true)
    try {
      const result: any = await api.request('/sms/config/test', { method: 'POST', body: JSON.stringify(smsConfig) })
      addToast({ title: 'Twilio connection verified', description: result.message, variant: 'success' })
    } catch (e: any) { addToast({ title: 'Twilio test failed', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const applyTemplate = (id: string) => {
    setSelectedTpl(id)
    const tpl = templates.find((t: any) => t.id === id)
    if (tpl) setMessage(tpl.body)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('SMS')}</h1>

      <div className="flex gap-1 border-b border-border">
        {(['send', 'templates', 'logs', ...(user?.isAdmin ? ['provider' as const] : [])] as const).map(key => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {key === 'send' ? t('Send SMS') : key === 'templates' ? t('Templates') : key === 'logs' ? t('History') : 'Provider API'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('Template')}</label>
            <select value={selectedTpl} onChange={e => applyTemplate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">-- {t('No template')} --</option>
              {templates.map((tpl: any) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('To Number')}</label>
            <Input placeholder="+1234567890" value={toNumber} onChange={e => setToNumber(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('Message')}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" placeholder={t('Type your message...')} />
          </div>
          <div className="flex gap-2">
            <Button onClick={sendSingle} disabled={!toNumber || !message || sending || !smsConfig.configured} className="gap-1.5">{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('Send')}</Button>
          </div>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-2">{t('Bulk Send')}</h3>
            <textarea value={bulkNumbers} onChange={e => setBulkNumbers(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" placeholder={t('One phone number per line')} />
            <Button onClick={sendBulk} disabled={!bulkNumbers.trim() || !message || sending || !smsConfig.configured} variant="outline" className="mt-2 gap-1.5"><Send size={14} />{t('Send Bulk')}</Button>
            {!smsConfig.configured && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">An organization administrator must configure the Twilio API before SMS can be sent.</p>}
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-4">
          <Button onClick={() => openForm()} className="gap-1.5"><Plus size={14} />{t('New Template')}</Button>
          {tplLoading ? (
            <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin" /></div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><FileText size={32} className="mx-auto opacity-40 mb-2" /><p className="text-sm">{t('No templates')}</p></div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl: any) => (
                <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tpl.body}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(tpl)}><Plus size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(tpl.id)}><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-2">
          {logLoading ? (
            <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><MessageSquare size={32} className="mx-auto opacity-40 mb-2" /><p className="text-sm">{t('No SMS history')}</p></div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm">
                <MessageSquare size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p><span className="font-medium">{log.toNumber}</span> <span className="text-muted-foreground">· {log.message?.slice(0, 60)}{log.message?.length > 60 ? '...' : ''}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${log.status === 'Sent' ? 'bg-emerald-100 text-emerald-700' : log.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{log.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'provider' && (
        <div className="max-w-2xl rounded-2xl border bg-card p-5 sm:p-6 space-y-5">
          <div><h2 className="font-semibold">Twilio SMS API</h2><p className="text-sm text-muted-foreground mt-1">Credentials are stored for this organization only. The auth token is never returned to the browser.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">Account SID<Input className="mt-1.5" placeholder="AC…" value={smsConfig.accountSid} onChange={e => setSmsConfig({ ...smsConfig, accountSid: e.target.value })} /></label>
            <label className="text-sm font-medium">Auth token<Input className="mt-1.5" type="password" placeholder={smsConfig.configured ? 'Leave blank to keep current token' : 'Twilio auth token'} value={smsConfig.authToken} onChange={e => setSmsConfig({ ...smsConfig, authToken: e.target.value })} /></label>
            <label className="text-sm font-medium">Twilio number<Input className="mt-1.5" placeholder="+14155552671" value={smsConfig.fromNumber} onChange={e => setSmsConfig({ ...smsConfig, fromNumber: e.target.value })} /></label>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end"><Button variant="outline" onClick={testProvider} disabled={saving}>Test connection</Button><Button onClick={saveProvider} disabled={saving}>{saving && <Loader2 size={14} className="mr-2 animate-spin" />}Verify & save</Button></div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit Template') : t('New Template')}</DialogTitle>
            <DialogDescription>{t('Create an SMS template')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder={t('Template name')} value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })} />
            <textarea placeholder={t('Message body')} value={tplForm.body} onChange={e => setTplForm({ ...tplForm, body: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            <Input placeholder={t('Module (optional)')} value={tplForm.module} onChange={e => setTplForm({ ...tplForm, module: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={saveTemplate} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
