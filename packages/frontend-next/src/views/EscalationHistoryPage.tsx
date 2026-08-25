'use client'

import { useState } from 'react'
import { useNavigate } from '@/lib/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ArrowLeft, Loader2, Save, ShieldAlert } from 'lucide-react'

export function EscalationHistoryPage() {
  const navigate = useNavigate(); const { addToast } = useToast()
  const [form, setForm] = useState({ ticketId: '', fromLevel: 1, toLevel: 2, reason: '' })
  const { data: tickets } = useQuery({ queryKey: ['escalation-tickets'], queryFn: () => api.listAll('tickets') })
  const save = useMutation({ mutationFn: () => api.create('escalationhistory', form), onSuccess: saved => { addToast({ title: 'Ticket escalated', variant: 'success' }); navigate(`/escalationhistory/${saved.id}`) }, onError: (e:Error) => addToast({ title: 'Escalation failed', description: e.message, variant: 'destructive' }) })
  return <div className="mx-auto max-w-4xl space-y-5"><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => navigate('/escalationhistory')}><ArrowLeft size={16} /></Button><div><h1 className="text-2xl font-bold">New Ticket Escalation</h1><p className="text-sm text-muted-foreground">Record an accountable escalation with a clear reason and severity transition.</p></div></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert size={18} className="text-amber-600" />Escalation details</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium">Support ticket *</label><Select value={form.ticketId} onValueChange={ticketId => setForm(f => ({...f,ticketId}))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select an open ticket" /></SelectTrigger><SelectContent>{(tickets?.data || []).filter((t:any) => !['Closed','Resolved'].includes(t.status)).map((ticket:any) => <SelectItem key={ticket.id} value={ticket.id}>{ticket.ticketNo ? `${ticket.ticketNo} — ` : ''}{ticket.title}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium">Current level</label><Input className="mt-1" type="number" min={0} max={10} value={form.fromLevel} onChange={e => setForm(f => ({...f,fromLevel:Number(e.target.value)}))} /></div><div><label className="text-sm font-medium">Escalate to level</label><Input className="mt-1" type="number" min={1} max={10} value={form.toLevel} onChange={e => setForm(f => ({...f,toLevel:Number(e.target.value)}))} /></div></div><div><label className="text-sm font-medium">Reason *</label><textarea className="mt-1 min-h-32 w-full rounded-lg border bg-background p-3 text-sm" maxLength={500} value={form.reason} onChange={e => setForm(f => ({...f,reason:e.target.value}))} placeholder="Explain why this ticket requires escalation and what action is expected." /><p className="text-right text-xs text-muted-foreground">{form.reason.length}/500</p></div><div className="flex justify-end"><Button onClick={() => save.mutate()} disabled={!form.ticketId || !form.reason.trim() || form.toLevel <= form.fromLevel || save.isPending}>{save.isPending ? <Loader2 className="mr-2 animate-spin" size={15}/> : <Save className="mr-2" size={15}/>}Create escalation</Button></div></CardContent></Card>
    <Card className="h-fit border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20"><CardContent className="p-5"><AlertTriangle className="mb-3 text-amber-600" /><h2 className="font-semibold">Escalation policy</h2><ul className="mt-2 space-y-2 text-xs text-muted-foreground"><li>• Select an active ticket from this organization.</li><li>• The new level must exceed the current level.</li><li>• Give a specific, auditable reason.</li><li>• The escalation is attributed to your user account.</li></ul></CardContent></Card></div></div>
}
