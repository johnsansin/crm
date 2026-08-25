'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Play, FileText, AlertTriangle, CheckCircle, XCircle, Webhook } from 'lucide-react'

const availableEvents = [
  'lead.created', 'lead.updated', 'lead.converted',
  'contact.created', 'contact.updated',
  'account.created', 'account.updated',
  'potential.created', 'potential.updated', 'potential.stage_changed',
  'quote.created', 'quote.sent',
  'invoice.created', 'invoice.paid',
  'ticket.created', 'ticket.updated',
  'campaign.started', 'campaign.completed',
  'form.submitted',
]

export function WebhooksPage() {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [logsOpen, setLogsOpen] = useState<string | null>(null)
  const [testOpen, setTestOpen] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[] })
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.request<{ data: any[] }>('/webhooks'),
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['webhook-logs', logsOpen],
    queryFn: () => logsOpen ? api.request<{ data: any[] }>(`/webhooks/${logsOpen}/logs`) : Promise.resolve({ data: [] }),
    enabled: !!logsOpen,
  })

  const endpoints = data?.data || []

  const openForm = (e?: any) => {
    if (e) {
      setEditingId(e.id)
      setForm({ name: e.name, url: e.url, events: (e.events as string[]) || [] })
    } else {
      setEditingId(null)
      setForm({ name: '', url: '', events: [] })
    }
    setFormOpen(true)
  }

  const saveForm = async () => {
    if (!form.name || !form.url) return addToast({ title: 'Error', description: 'Name and URL required', variant: 'destructive' })
    setSaving(true)
    try {
      if (editingId) {
        await api.request(`/webhooks/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api.request('/webhooks', { method: 'POST', body: JSON.stringify(form) })
      }
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      addToast({ title: editingId ? 'Updated' : 'Created', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const deleteEndpoint = async (id: string) => {
    try {
      await api.request(`/webhooks/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      addToast({ title: 'Deleted', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const testEndpoint = async (id: string) => {
    try {
      const res: any = await api.request(`/webhooks/${id}/test`, { method: 'POST' })
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      addToast({ title: res.success ? `Test OK (${res.responseStatus})` : `Test failed: ${res.error || res.responseStatus}`, variant: res.success ? 'success' : 'destructive' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('Webhooks')}</h1>
        <Button onClick={() => openForm()} className="gap-1.5"><Plus size={16} />{t('New Endpoint')}</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin" /></div>
      ) : endpoints.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Webhook size={40} className="opacity-40" />
          <p className="text-sm">{t('No webhook endpoints')}</p>
          <Button variant="outline" size="sm" onClick={() => openForm()}><Plus size={14} className="mr-1" />{t('Create endpoint')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep: any) => (
            <div key={ep.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{ep.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ep.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {ep.isActive ? t('Active') : t('Inactive')}
                  </span>
                  {ep.failureCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTriangle size={10} />{ep.failureCount} failures
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate font-mono">{ep.url}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(ep.events as string[] || []).length === 0 ? t('All events') : `${(ep.events as string[]).length} events`}
                  {ep.lastTriggeredAt && ` · Last triggered ${new Date(ep.lastTriggeredAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Logs')} onClick={() => setLogsOpen(ep.id)}><FileText size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Test')} onClick={() => testEndpoint(ep.id)}><Play size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Edit')} onClick={() => openForm(ep)}><Plus size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title={t('Delete')} onClick={() => deleteEndpoint(ep.id)}><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit Endpoint') : t('New Endpoint')}</DialogTitle>
            <DialogDescription>{t('Configure a webhook endpoint to receive events')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder={t('Name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder={t('URL')} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('Events (leave empty for all)')}</label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                {availableEvents.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="rounded" />
                    <span className="font-mono text-xs">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={saveForm} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={!!logsOpen} onOpenChange={o => { if (!o) setLogsOpen(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t('Execution Logs')}</DialogTitle></DialogHeader>
          {logsLoading ? (
            <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" /></div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {(logsData?.data || []).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 text-sm">
                  {log.success ? <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{log.event}</span>
                      {log.responseStatus && <span className="text-xs text-muted-foreground">HTTP {log.responseStatus}</span>}
                      {log.duration && <span className="text-xs text-muted-foreground">{log.duration}ms</span>}
                    </div>
                    {log.error && <p className="text-xs text-red-500 mt-0.5">{log.error}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!logsData?.data || logsData.data.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No logs yet</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
