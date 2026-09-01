'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Clock3, Database, Download, HardDrive, Loader2, Mail, Save, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const inputCls = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_FORM = {
  enabled: false, frequency: 'daily', hour: 2, minute: 0, dayOfWeek: 0, dayOfMonth: 1,
  retentionCount: 14, emailEnabled: false, emailTo: '', nextRunAt: null,
  lastRunAt: null, lastStatus: null, lastMessage: null, lastFileName: null,
}

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function date(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not yet'
}

export function SystemBackupSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(DEFAULT_FORM)
  const query = useQuery({ queryKey: ['system-backups'], queryFn: api.getSystemBackups, retry: 1 })
  useEffect(() => { if (query.data?.config) setForm({ ...DEFAULT_FORM, ...query.data.config }) }, [query.data])
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['system-backups'] })
  const save = useMutation({
    mutationFn: () => api.updateSystemBackupConfig(form),
    onSuccess: data => { setForm(data.config); refresh(); addToast({ title: 'Backup schedule saved', description: data.message, variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Schedule not saved', description: e.message, variant: 'destructive' }),
  })
  const run = useMutation({
    mutationFn: api.runSystemBackup,
    onSuccess: data => { refresh(); addToast({ title: 'System backup completed', description: data.backup.emailError ? `Backup saved, but email failed: ${data.backup.emailError}` : data.backup.emailDelivered ? 'Full backup created and emailed successfully.' : 'Full system backup created successfully in private storage.', variant: data.backup.emailError ? 'destructive' : 'success' }) },
    onError: (e: Error) => { refresh(); addToast({ title: 'System backup failed', description: e.message, variant: 'destructive' }) },
  })
  const email = useMutation({
    mutationFn: (fileName: string) => api.emailSystemBackup(fileName, form.emailTo),
    onSuccess: data => addToast({ title: 'Backup email sent', description: data.message, variant: 'success' }),
    onError: (e: Error) => addToast({ title: 'Backup email failed', description: e.message, variant: 'destructive' }),
  })
  const set = (key: string, value: any) => setForm((old: any) => ({ ...old, [key]: value }))
  const backups = query.data?.data || []

  return <div className="space-y-4">
    {query.isLoading && <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Loading saved backup configuration…</div>}
    {query.isError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"><p className="text-sm text-destructive">Saved backup settings could not be loaded. You can retry without leaving this page.</p><Button size="sm" variant="outline" onClick={() => query.refetch()}>Retry</Button></div>}
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="border-emerald-200/70 dark:border-emerald-900"><CardContent className="p-4 flex gap-3"><ShieldCheck className="text-emerald-600 shrink-0" /><div><p className="font-semibold text-sm">Private & protected</p><p className="text-xs text-muted-foreground mt-1">Only Superadmins can create, download, or email system backups.</p></div></CardContent></Card>
      <Card><CardContent className="p-4 flex gap-3"><Clock3 className="text-blue-600 shrink-0" /><div><p className="font-semibold text-sm">Next backup</p><p className="text-xs text-muted-foreground mt-1">{form.enabled ? date(form.nextRunAt) : 'Scheduling disabled'}</p></div></CardContent></Card>
      <Card><CardContent className="p-4 flex gap-3"><CheckCircle2 className={form.lastStatus === 'failed' ? 'text-destructive shrink-0' : 'text-emerald-600 shrink-0'} /><div><p className="font-semibold text-sm">Last result</p><p className="text-xs text-muted-foreground mt-1">{form.lastStatus ? `${form.lastStatus} · ${date(form.lastRunAt)}` : 'No backup has run'}</p></div></CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock size={18} /> Backup schedule</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4"><div><p className="text-sm font-medium">Automatic backups</p><p className="text-xs text-muted-foreground mt-0.5">Run scheduled full-system backups (database, uploaded files & configuration).</p></div><Switch checked={form.enabled} onCheckedChange={v => set('enabled', v)} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">Frequency<select className={`${inputCls} mt-1.5`} value={form.frequency} onChange={e => set('frequency', e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
        {form.frequency === 'weekly' && <label className="text-sm font-medium">Day<select className={`${inputCls} mt-1.5`} value={form.dayOfWeek} onChange={e => set('dayOfWeek', Number(e.target.value))}>{DAYS.map((d, i) => <option value={i} key={d}>{d}</option>)}</select></label>}
        {form.frequency === 'monthly' && <label className="text-sm font-medium">Day of month<Input className="mt-1.5" type="number" min={1} max={28} value={form.dayOfMonth} onChange={e => set('dayOfMonth', Number(e.target.value))} /></label>}
        <label className="text-sm font-medium">Time (UTC)<div className="mt-1.5 flex gap-2"><Input aria-label="Hour" type="number" min={0} max={23} value={form.hour} onChange={e => set('hour', Number(e.target.value))} /><Input aria-label="Minute" type="number" min={0} max={59} value={form.minute} onChange={e => set('minute', Number(e.target.value))} /></div></label>
        <label className="text-sm font-medium">Keep latest backups<Input className="mt-1.5" type="number" min={1} max={365} value={form.retentionCount} onChange={e => set('retentionCount', Number(e.target.value))} /></label>
      </div>
      <div className="rounded-xl border p-4 space-y-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium flex items-center gap-2"><Mail size={15} /> Email each new backup</p><p className="text-xs text-muted-foreground mt-0.5">Requires working global SMTP settings.</p></div><Switch checked={form.emailEnabled} onCheckedChange={v => set('emailEnabled', v)} /></div><label className="text-sm font-medium block">Backup email<Input className="mt-1.5 max-w-xl" type="email" placeholder="backup@example.com" value={form.emailTo} onChange={e => set('emailTo', e.target.value)} /></label></div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2"><Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}>{run.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Database size={16} className="mr-2" />}Create backup now</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}Save schedule</Button></div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive size={18} /> Backup history</CardTitle></CardHeader><CardContent>
      {!backups.length ? <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No system backups yet.</div> : <div className="space-y-2">{backups.map((backup: any) => <div key={backup.fileName} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border bg-muted/10 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{backup.fileName}</p><p className="text-xs text-muted-foreground mt-0.5">{date(backup.modifiedAt)} · {size(backup.size)}</p></div><div className="grid grid-cols-2 sm:flex gap-2"><Button size="sm" variant="outline" onClick={() => api.downloadSystemBackup(backup.fileName)}><Download size={14} className="mr-1.5" />Download</Button><Button size="sm" variant="outline" disabled={!form.emailTo || email.isPending} onClick={() => email.mutate(backup.fileName)}><Mail size={14} className="mr-1.5" />Email</Button></div></div>)}</div>}
    </CardContent></Card>
  </div>
}
