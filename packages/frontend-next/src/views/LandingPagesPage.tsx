'use client'

import { formatDate, formatDateTime, formatTime } from '@/lib/org-format'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Eye, FileText, Globe, BarChart3, ExternalLink, X } from 'lucide-react'

export function LandingPagesPage() {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState<string | null>(null)
  const [submissionsOpen, setSubmissionsOpen] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', title: '', subtitle: '', description: '', primaryColor: '#0B1F3A', thankYouMsg: '', redirectUrl: '', submitAction: 'thankYou' })
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: () => api.request<{ data: any[] }>('/landing-pages'),
  })

  const { data: statsData } = useQuery({
    queryKey: ['lp-stats', statsOpen],
    queryFn: () => statsOpen ? api.request<{ data: any }>(`/landing-pages/${statsOpen}/stats`) : Promise.resolve(null),
    enabled: !!statsOpen,
  })

  const { data: submissionsData } = useQuery({
    queryKey: ['lp-submissions', submissionsOpen],
    queryFn: () => submissionsOpen ? api.request<{ data: any[] }>(`/landing-pages/${submissionsOpen}/submissions`) : Promise.resolve({ data: [] }),
    enabled: !!submissionsOpen,
  })

  const pages = data?.data || []

  const openForm = (p?: any) => {
    if (p) {
      setEditingId(p.id)
      setForm({ name: p.name, slug: p.slug, title: p.title, subtitle: p.subtitle || '', description: p.description || '', primaryColor: p.primaryColor || '#0B1F3A', thankYouMsg: p.thankYouMsg || '', redirectUrl: p.redirectUrl || '', submitAction: p.submitAction || 'thankYou' })
    } else {
      setEditingId(null)
      setForm({ name: '', slug: '', title: '', subtitle: '', description: '', primaryColor: '#0B1F3A', thankYouMsg: '', redirectUrl: '', submitAction: 'thankYou' })
    }
    setFormOpen(true)
  }

  const saveForm = async () => {
    if (!form.name || !form.slug || !form.title) return addToast({ title: 'Error', description: 'Name, slug, title required', variant: 'destructive' })
    setSaving(true)
    try {
      if (editingId) {
        await api.request(`/landing-pages/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await api.request('/landing-pages', { method: 'POST', body: JSON.stringify(form) })
      }
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['landing-pages'] })
      addToast({ title: editingId ? 'Updated' : 'Created', variant: 'success' })
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const deletePage = async (id: string) => {
    try {
      await api.request(`/landing-pages/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['landing-pages'] })
      addToast({ title: 'Deleted', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const togglePublish = async (id: string) => {
    try {
      await api.request(`/landing-pages/${id}/publish`, { method: 'POST' })
      qc.invalidateQueries({ queryKey: ['landing-pages'] })
      addToast({ title: 'Publish status updated', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('Landing Pages')}</h1>
        <Button onClick={() => openForm()} className="gap-1.5"><Plus size={16} />{t('New Page')}</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Globe size={40} className="opacity-40" />
          <p className="text-sm">{t('No landing pages yet')}</p>
          <Button variant="outline" size="sm" onClick={() => openForm()}><Plus size={14} className="mr-1" />{t('Create page')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {p.isPublished ? t('Published') : t('Draft')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{p.title} &mdash; /{p.slug}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.viewCount} views &middot; {p.submitCount} submissions</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Stats')} onClick={() => setStatsOpen(p.id)}><BarChart3 size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Submissions')} onClick={() => setSubmissionsOpen(p.id)}><FileText size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Preview')} onClick={() => window.open(`/lp/${p.slug}`, '_blank')}><ExternalLink size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Edit')} onClick={() => openForm(p)}><Plus size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Publish/Unpublish')} onClick={() => togglePublish(p.id)}><Globe size={15} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title={t('Delete')} onClick={() => deletePage(p.id)}><Trash2 size={15} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit Page') : t('New Page')}</DialogTitle>
            <DialogDescription>{t('Create a landing page with form capture')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder={t('Page name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder={t('Slug (url path)')} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/g, '') })} />
            <Input placeholder={t('Title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder={t('Subtitle')} value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
            <textarea placeholder={t('Description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('Primary Color')}</label>
                <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-full rounded-md border border-input cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('Submit Action')}</label>
                <select value={form.submitAction} onChange={e => setForm({ ...form, submitAction: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="thankYou">{t('Thank You Message')}</option>
                  <option value="redirect">{t('Redirect')}</option>
                </select>
              </div>
            </div>
            {form.submitAction === 'redirect' && <Input placeholder={t('Redirect URL')} value={form.redirectUrl} onChange={e => setForm({ ...form, redirectUrl: e.target.value })} />}
            <Input placeholder={t('Thank you message')} value={form.thankYouMsg} onChange={e => setForm({ ...form, thankYouMsg: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={saveForm} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statsOpen} onOpenChange={o => { if (!o) setStatsOpen(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('Page Stats')}</DialogTitle></DialogHeader>
          {statsData?.data ? (
            <div className="grid grid-cols-2 gap-4 py-2">
              {[
                ['Views', statsData.data.viewCount],
                ['Submissions', statsData.data.submitCount],
                ['Published', statsData.data.isPublished ? t('Yes') : t('No')],
                ['Created', formatDate(statsData.data.createdAt)],
              ].map(([label, val]) => (
                <div key={String(label)} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{String(val)}</p>
                  <p className="text-xs text-muted-foreground">{t(String(label))}</p>
                </div>
              ))}
            </div>
          ) : <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" /></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!submissionsOpen} onOpenChange={o => { if (!o) setSubmissionsOpen(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('Submissions')}</DialogTitle></DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {(submissionsData?.data || []).map((s: any) => (
              <div key={s.id} className="p-3 rounded-lg bg-muted/40 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatDateTime(s.createdAt)}</span>
                  {s.leadId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Lead created</span>}
                  {s.contactId && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Contact created</span>}
                </div>
                <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(s.formData, null, 2)}</pre>
                {s.utmSource && <p className="text-xs text-muted-foreground mt-1">UTM: {s.utmSource} / {s.utmMedium} / {s.utmCampaign}</p>}
              </div>
            ))}
            {(!submissionsData?.data || submissionsData.data.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
