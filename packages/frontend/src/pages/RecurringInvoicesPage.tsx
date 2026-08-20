import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CalendarClock, Loader2, Play, Repeat2, Save } from 'lucide-react'
import { formatDate, formatMoney } from '@/lib/org-format'

const empty = { invoiceId: '', frequency: 'monthly', interval: 1, dayOfMonth: 1, startDate: '', endDate: '', nextRun: '', isActive: true }

export function RecurringInvoicesPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { addToast } = useToast(); const qc = useQueryClient()
  const isNew = id === 'new'; const [form, setForm] = useState<any>(empty)
  const { data: invoices } = useQuery({ queryKey: ['recurring-invoice-templates'], queryFn: () => api.listAll('invoices') })
  const { data: record, isLoading } = useQuery({ queryKey: ['recurring-invoice', id], queryFn: () => api.get('recurringinvoices', id!), enabled: !!id && !isNew })
  useEffect(() => { if (record) setForm({ ...record, startDate: record.startDate?.slice(0, 10) || '', endDate: record.endDate?.slice(0, 10) || '', nextRun: record.nextRun?.slice(0, 10) || '' }) }, [record])
  const template = useMemo(() => (invoices?.data || []).find((invoice: any) => invoice.id === form.invoiceId), [invoices, form.invoiceId])
  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, interval: Math.max(1, Number(form.interval)), dayOfMonth: form.frequency === 'monthly' ? Number(form.dayOfMonth) : null,
        startDate: form.startDate || null, endDate: form.endDate || null, nextRun: form.nextRun || form.startDate || new Date().toISOString() }
      return isNew ? api.create('recurringinvoices', payload) : api.update('recurringinvoices', id!, payload)
    },
    onSuccess: (saved: any) => { qc.invalidateQueries({ queryKey: ['recurringinvoices'] }); addToast({ title: isNew ? 'Recurring schedule created' : 'Schedule updated', variant: 'success' }); navigate(`/recurringinvoices/${saved.id || id}`) },
    onError: (e: Error) => addToast({ title: 'Unable to save schedule', description: e.message, variant: 'destructive' }),
  })
  const generate = useMutation({ mutationFn: () => api.generateRecurringInvoice(id!), onSuccess: (invoice: any) => { addToast({ title: 'Invoice generated', variant: 'success' }); if (invoice?.id) navigate(`/invoices/${invoice.id}`) }, onError: (e: Error) => addToast({ title: 'Generation failed', description: e.message, variant: 'destructive' }) })
  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary" /></div>
  return <div className="space-y-5 max-w-5xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => navigate('/recurringinvoices')}><ArrowLeft size={16} /></Button><div><h1 className="text-2xl font-bold">{isNew ? 'New Recurring Invoice' : 'Recurring Invoice Schedule'}</h1><p className="text-sm text-muted-foreground">Generate invoices automatically from an existing invoice template.</p></div></div><div className="flex gap-2">{!isNew && <Button variant="outline" onClick={() => generate.mutate()} disabled={generate.isPending}><Play size={15} className="mr-2" />Generate now</Button>}<Button onClick={() => save.mutate()} disabled={!form.invoiceId || save.isPending}>{save.isPending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" />}Save schedule</Button></div></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Repeat2 size={17} className="text-primary" />Schedule configuration</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="text-sm font-medium">Invoice template *</label><Select value={form.invoiceId} onValueChange={invoiceId => setForm((f:any) => ({...f, invoiceId}))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select an invoice" /></SelectTrigger><SelectContent>{(invoices?.data || []).map((inv:any) => <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNo || inv.subject} — {formatMoney(inv.grandTotal)}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-sm font-medium">Frequency</label><Select value={form.frequency} onValueChange={frequency => setForm((f:any) => ({...f, frequency}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['daily','weekly','monthly','quarterly','yearly'].map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-sm font-medium">Repeat every</label><Input className="mt-1" type="number" min={1} value={form.interval} onChange={e => setForm((f:any) => ({...f, interval:e.target.value}))} /></div>
        {form.frequency === 'monthly' && <div><label className="text-sm font-medium">Day of month</label><Input className="mt-1" type="number" min={1} max={28} value={form.dayOfMonth} onChange={e => setForm((f:any) => ({...f, dayOfMonth:e.target.value}))} /></div>}
        <div><label className="text-sm font-medium">First run</label><Input className="mt-1" type="date" value={form.nextRun || form.startDate} onChange={e => setForm((f:any) => ({...f, nextRun:e.target.value, startDate:f.startDate || e.target.value}))} /></div>
        <div><label className="text-sm font-medium">End date (optional)</label><Input className="mt-1" type="date" value={form.endDate} onChange={e => setForm((f:any) => ({...f, endDate:e.target.value}))} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive !== false} onChange={e => setForm((f:any) => ({...f, isActive:e.target.checked}))} />Active schedule</label>
      </CardContent></Card>
      <Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock size={17} className="text-primary" />Schedule summary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><p className="text-muted-foreground">Template</p><p className="font-semibold">{template?.invoiceNo || template?.subject || 'Not selected'}</p></div><div><p className="text-muted-foreground">Amount per invoice</p><p className="text-xl font-bold text-primary">{formatMoney(template?.grandTotal || 0)}</p></div><div><p className="text-muted-foreground">Next run</p><p className="font-medium">{form.nextRun ? formatDate(form.nextRun) : 'Choose a first run date'}</p></div><p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Each run copies the selected invoice, its customer, line items, taxes and payment terms into a new invoice.</p></CardContent></Card>
    </div>
  </div>
}
