'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatWidgetSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>({ name: '', color: '#0B1F3A', welcomeMsg: '', offlineMsg: '', position: 'bottom-right', isActive: true })
  const [loaded, setLoaded] = useState(false)

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['chat-widget-config'],
    queryFn: () => api.request<{ data: any }>('/chat-widget/admin/config'),
  })

  useEffect(() => {
    if (cfg?.data && !loaded) {
      setForm({
        name: cfg.data.name || '',
        color: cfg.data.color || '#0B1F3A',
        welcomeMsg: cfg.data.welcomeMsg || '',
        offlineMsg: cfg.data.offlineMsg || '',
        position: cfg.data.position || 'bottom-right',
        isActive: cfg.data.isActive !== false,
      })
      setLoaded(true)
    }
  }, [cfg, loaded])

  const save = useMutation({
    mutationFn: () => api.request('/chat-widget/admin/config', { method: 'PUT', body: JSON.stringify(form) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-widget-config'] })
      addToast({ title: 'Chat widget configuration saved', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const positions = [
    { key: 'bottom-right', label: 'Bottom right' },
    { key: 'bottom-left', label: 'Bottom left' },
    { key: 'bottom-center', label: 'Bottom center' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Website chat widget</h3>
            <p className="text-xs text-muted-foreground">
              Configure the chat launcher that visitors see on your website. Returns a live config endpoint your frontend can load.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 animate-spin" />Loading...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Widget name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Live Chat" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Accent color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-md border bg-transparent" />
                  <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Welcome message</label>
                <textarea
                  value={form.welcomeMsg}
                  onChange={e => setForm({ ...form, welcomeMsg: e.target.value })}
                  rows={2}
                  placeholder="Hi! How can we help you today?"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Offline message</label>
                <textarea
                  value={form.offlineMsg}
                  onChange={e => setForm({ ...form, offlineMsg: e.target.value })}
                  rows={2}
                  placeholder="We're away right now — leave a message and we'll get back to you."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Position</label>
                <select
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                >
                  {positions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" />
                  Widget enabled
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
              {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              Save configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Preview</h3>
        <div className="relative mx-auto h-64 w-full max-w-[280px] overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-900">
          <div className="p-3 text-[11px] text-muted-foreground">Your website</div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="absolute -bottom-2 max-w-[220px] rounded-2xl rounded-bl-none border bg-white p-3 shadow-xl dark:bg-slate-800">
              <p className="text-xs text-foreground">{form.welcomeMsg || 'Hi! How can we help you today?'}</p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg" style={{ backgroundColor: form.color || '#0B1F3A' }}>
            <MessageCircle size={20} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <span className={cn('mr-1 inline-block h-2 w-2 rounded-full', form.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
          {form.isActive ? 'Active — visitors can start chat sessions' : 'Inactive — launcher is hidden'}
        </p>
      </div>
    </div>
  )
}
