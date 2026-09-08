'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatDate, formatDateTime } from '@/lib/org-format'
import { Mail, Plus, Trash2, Play, Pause, Copy, BarChart3, Users, Send, Reply, AlertTriangle, Loader2, Sparkles, Search } from 'lucide-react'

const statusTone: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  PAUSED: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  ARCHIVED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const emptyStep = (stepNumber: number) => ({ stepNumber, subject: '', body: '', delayValue: stepNumber === 1 ? 0 : 7, delayUnit: 'DAYS', condition: 'NO_REPLY', isActive: true })
const emptyForm = () => ({ name: '', description: '', fromEmail: '', replyTo: '', timezone: 'UTC', status: 'DRAFT', steps: [emptyStep(1)] })
const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Karachi', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney']
const LEAD_STATUSES = ['all', 'New', 'Contacted', 'Working', 'Qualified', 'Unqualified', 'Converted', 'Junk', 'Lost']
const EMAIL_STATUSES = ['all', 'NOT_CONTACTED', 'EMAIL_QUEUED', 'EMAIL_SENT', 'EMAIL_DELIVERED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'AWAITING_REPLY', 'REPLIED', 'BOUNCED', 'DELIVERY_FAILED', 'UNSUBSCRIBED', 'SEQUENCE_ACTIVE', 'SEQUENCE_PAUSED', 'SEQUENCE_COMPLETED', 'SEQUENCE_STOPPED']
const ENROLLMENT_FILTERS = [
  ['all', 'All leads'],
  ['eligible', 'Eligible'],
  ['available', 'Not active in this sequence'],
  ['ACTIVE', 'Active in sequence'],
  ['PAUSED', 'Paused'],
  ['STOPPED', 'Removed/stopped'],
  ['COMPLETED', 'Completed'],
  ['FAILED', 'Failed'],
  ['missing_email', 'Missing email'],
]

export function EmailSequencesPage() {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState<string | null>(null)
  const [leadSearch, setLeadSearch] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState('all')
  const [emailStatusFilter, setEmailStatusFilter] = useState('all')
  const [enrollmentFilter, setEnrollmentFilter] = useState('eligible')
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [enrollSummary, setEnrollSummary] = useState<any>(null)
  const [leadSortKey, setLeadSortKey] = useState('name')
  const [leadSortOrder, setLeadSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [removeLeadTarget, setRemoveLeadTarget] = useState<any | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['email-sequences'], queryFn: () => api.request<{ data: any[] }>('/email-automation/sequences') })
  const { data: dash } = useQuery({ queryKey: ['email-automation-dashboard'], queryFn: () => api.request<{ data: any }>('/email-automation/dashboard') })
  const { data: templatesData } = useQuery({ queryKey: ['emailtemplates', 'sequence-builder'], queryFn: () => api.listAll('emailtemplates', { limit: '200' }).catch(() => ({ data: [] })) })
  const { data: mailboxesData } = useQuery({ queryKey: ['mailboxes', 'sequence-builder'], queryFn: () => api.listAll('mailboxes', { limit: '200' }).catch(() => ({ data: [] })) })
  const { data: pickerData, isLoading: pickerLoading } = useQuery({
    queryKey: ['email-sequence-leads', enrollOpen, leadSearch, leadStatusFilter, emailStatusFilter, enrollmentFilter],
    queryFn: () => api.request<{ data: any[] }>(`/email-automation/sequences/${enrollOpen}/leads?${new URLSearchParams({ search: leadSearch, leadStatus: leadStatusFilter, emailStatus: emailStatusFilter, enrollmentStatus: enrollmentFilter, limit: '150' }).toString()}`),
    enabled: !!enrollOpen,
  })
  const sequences = data?.data || []
  const templates = templatesData?.data || []
  const mailboxes = mailboxesData?.data || []
  const pickerLeads = pickerData?.data || []
  const sortedPickerLeads = useMemo(() => {
    const valueFor = (lead: any) => {
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || ''
      if (leadSortKey === 'name') return name
      if (leadSortKey === 'company') return lead.company || ''
      if (leadSortKey === 'email') return lead.email || ''
      if (leadSortKey === 'leadStatus') return lead.leadStatus || ''
      if (leadSortKey === 'emailStatus') return lead.emailStatus || 'NOT_CONTACTED'
      if (leadSortKey === 'sequence') return lead.enrollment?.status || ''
      return ''
    }
    return [...pickerLeads].sort((a: any, b: any) => {
      const av = String(valueFor(a)).toLowerCase()
      const bv = String(valueFor(b)).toLowerCase()
      return leadSortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [pickerLeads, leadSortKey, leadSortOrder])
  const selectableLeads = sortedPickerLeads.filter((lead: any) => !['ACTIVE', 'PAUSED'].includes(lead.enrollment?.status))
  const allSelectableSelected = selectableLeads.length > 0 && selectableLeads.every((lead: any) => selectedLeadIds.has(lead.id))

  const totals = useMemo(() => [
    ['Active Leads', dash?.data?.activeLeads || 0, Users],
    ['Sent Today', dash?.data?.emailsSentToday || 0, Send],
    ['Replies Today', dash?.data?.repliesToday || 0, Reply],
    ['Pending Follow-ups', dash?.data?.pendingFollowUps || 0, Mail],
    ['Bounces', dash?.data?.bounces || 0, AlertTriangle],
    ['Failed Emails', dash?.data?.failedEmails || 0, AlertTriangle],
    ['Sequences Running', dash?.data?.sequencesRunning || 0, BarChart3],
  ], [dash])

  const openForm = (sequence?: any) => {
    if (sequence) {
      setEditingId(sequence.id)
      setForm({
        name: sequence.name || '',
        description: sequence.description || '',
        fromEmail: sequence.fromEmail || '',
        replyTo: sequence.replyTo || '',
        timezone: sequence.timezone || 'UTC',
        status: sequence.status || 'DRAFT',
        steps: (sequence.steps || []).map((step: any) => ({ stepNumber: step.stepNumber, subject: step.subject, body: step.body, delayValue: step.delayValue, delayUnit: step.delayUnit, condition: step.condition || 'NO_REPLY', isActive: step.isActive !== false })),
      })
    } else {
      setEditingId(null)
      setForm(emptyForm())
    }
    setFormOpen(true)
  }

  const saveForm = async () => {
    if (!form.name.trim()) return addToast({ title: 'Sequence name is required', variant: 'destructive' })
    if (form.steps.some((step: any) => !step.subject.trim() || !step.body.trim())) return addToast({ title: 'Every step needs a subject and body', variant: 'destructive' })
    setSaving(true)
    const payload = { ...form, steps: form.steps.map((step: any, i: number) => ({ ...step, stepNumber: i + 1, delayValue: Number(step.delayValue) || 0 })) }
    try {
      if (editingId) await api.request(`/email-automation/sequences/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      else await api.request('/email-automation/sequences', { method: 'POST', body: JSON.stringify(payload) })
      setFormOpen(false)
      qc.invalidateQueries({ queryKey: ['email-sequences'] })
      qc.invalidateQueries({ queryKey: ['email-automation-dashboard'] })
      addToast({ title: editingId ? 'Sequence updated' : 'Sequence created', variant: 'success' })
    } catch (error: any) {
      addToast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const setStep = (index: number, patch: any) => {
    setForm((current: any) => ({ ...current, steps: current.steps.map((step: any, i: number) => i === index ? { ...step, ...patch } : step) }))
  }

  const applyTemplate = (index: number, templateId: string) => {
    const template = templates.find((item: any) => item.id === templateId)
    if (!template) return
    setStep(index, { subject: template.subject || '', body: template.body || '' })
  }

  const addStep = () => setForm((current: any) => ({ ...current, steps: [...current.steps, emptyStep(current.steps.length + 1)] }))
  const removeStep = (index: number) => setForm((current: any) => ({ ...current, steps: current.steps.filter((_s: any, i: number) => i !== index).map((step: any, i: number) => ({ ...step, stepNumber: i + 1 })) }))

  const setSequenceStatus = async (id: string, action: 'activate' | 'pause') => {
    try {
      await api.request(`/email-automation/sequences/${id}/${action}`, { method: 'POST', body: '{}' })
      qc.invalidateQueries({ queryKey: ['email-sequences'] })
      qc.invalidateQueries({ queryKey: ['email-automation-dashboard'] })
    } catch (error: any) {
      addToast({ title: 'Status update failed', description: error.message, variant: 'destructive' })
    }
  }

  const deleteSequence = async (id: string) => {
    try {
      await api.request(`/email-automation/sequences/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['email-sequences'] })
      addToast({ title: 'Sequence archived', variant: 'success' })
    } catch (error: any) {
      addToast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  }

  const duplicateSequence = async (sequence: any) => {
    const payload = { ...sequence, name: `${sequence.name} Copy`, status: 'DRAFT', steps: (sequence.steps || []).map(({ stepNumber, subject, body, delayValue, delayUnit, condition, isActive }: any) => ({ stepNumber, subject, body, delayValue, delayUnit, condition, isActive })) }
    await api.request('/email-automation/sequences', { method: 'POST', body: JSON.stringify(payload) })
    qc.invalidateQueries({ queryKey: ['email-sequences'] })
  }

  const enroll = async () => {
    if (!enrollOpen) return
    const ids = [...selectedLeadIds]
    try {
      const result: any = await api.request(`/email-automation/sequences/${enrollOpen}/enroll`, { method: 'POST', body: JSON.stringify({ leadIds: ids }) })
      setEnrollSummary(result.data)
      setSelectedLeadIds(new Set())
      qc.invalidateQueries({ queryKey: ['email-sequences'] })
      qc.invalidateQueries({ queryKey: ['email-automation-dashboard'] })
      qc.invalidateQueries({ queryKey: ['email-sequence-leads'] })
      addToast({ title: `Enrolled ${result.data.enrolled} leads`, variant: result.data.enrolled ? 'success' : 'default' })
    } catch (error: any) {
      addToast({ title: 'Enrollment failed', description: error.message, variant: 'destructive' })
    }
  }

  const toggleLead = (id: string) => {
    setSelectedLeadIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisibleLeads = () => {
    setSelectedLeadIds(current => {
      if (allSelectableSelected) {
        const next = new Set(current)
        selectableLeads.forEach((lead: any) => next.delete(lead.id))
        return next
      }
      return new Set([...current, ...selectableLeads.map((lead: any) => lead.id)])
    })
  }

  const setLeadSort = (key: string) => {
    if (leadSortKey === key) setLeadSortOrder(current => current === 'asc' ? 'desc' : 'asc')
    else {
      setLeadSortKey(key)
      setLeadSortOrder('asc')
    }
  }

  const sortHeader = (key: string, label: string) => (
    <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setLeadSort(key)}>
      {label}{leadSortKey === key && <span>{leadSortOrder === 'asc' ? '^' : 'v'}</span>}
    </button>
  )

  const setEnrollmentAction = async (lead: any, action: 'pause' | 'resume' | 'stop') => {
    if (!lead.enrollment) return
    try {
      await api.request(`/email-automation/leads/${lead.id}/sequences/${lead.enrollment.id}/${action}`, { method: 'POST', body: '{}' })
      qc.invalidateQueries({ queryKey: ['email-sequence-leads'] })
      qc.invalidateQueries({ queryKey: ['email-sequences'] })
      addToast({ title: action === 'stop' ? 'Lead removed from active sequence' : `Sequence ${action}d`, variant: 'success' })
    } catch (error: any) {
      addToast({ title: 'Lead update failed', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Email Sequences</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create recursive outreach, track delivery and replies, and stop follow-ups automatically.</p>
        </div>
        <Button onClick={() => openForm()} className="gap-1.5"><Plus size={16}/>Create Sequence</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {totals.map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><Icon size={17} className="text-blue-600"/></div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead><tr className="border-b bg-muted/60 text-left text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground"><th className="px-4 py-3">Sequence</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Steps</th><th className="px-3 py-3">Leads</th><th className="px-3 py-3">Sent</th><th className="px-3 py-3">Delivered</th><th className="px-3 py-3">Replies</th><th className="px-3 py-3">Reply Rate</th><th className="px-3 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {sequences.map((sequence: any) => (
                  <tr key={sequence.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-semibold">{sequence.name}</p><p className="text-xs text-muted-foreground">{sequence.description || sequence.fromEmail || 'No description'}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[sequence.status] || statusTone.DRAFT}`}>{sequence.status}</span></td>
                    <td className="px-3 py-3">{sequence.steps?.length || 0}</td>
                    <td className="px-3 py-3">{sequence.stats?.totalLeads || 0}</td>
                    <td className="px-3 py-3">{sequence.stats?.emailsSent || 0}</td>
                    <td className="px-3 py-3">{sequence.stats?.delivered || 0}</td>
                    <td className="px-3 py-3">{sequence.stats?.replies || 0}</td>
                    <td className="px-3 py-3">{sequence.stats?.replyRate || 0}%</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{sequence.updatedAt ? formatDate(sequence.updatedAt) : '-'}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openForm(sequence)}><Mail size={15}/></Button><Button size="icon" variant="ghost" className="h-8 w-8" title="Duplicate" onClick={() => duplicateSequence(sequence)}><Copy size={15}/></Button><Button size="icon" variant="ghost" className="h-8 w-8" title="Manage leads" onClick={() => { setEnrollOpen(sequence.id); setLeadSearch(''); setLeadStatusFilter('all'); setEmailStatusFilter('all'); setEnrollmentFilter('eligible'); setSelectedLeadIds(new Set()); setEnrollSummary(null) }}><Users size={15}/></Button>{sequence.status === 'ACTIVE' ? <Button size="icon" variant="ghost" className="h-8 w-8" title="Pause" onClick={() => setSequenceStatus(sequence.id, 'pause')}><Pause size={15}/></Button> : <Button size="icon" variant="ghost" className="h-8 w-8" title="Activate" onClick={() => setSequenceStatus(sequence.id, 'activate')}><Play size={15}/></Button>}<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Archive" onClick={() => setDeleteTarget(sequence)}><Trash2 size={15}/></Button></div></td>
                  </tr>
                ))}
                {!sequences.length && <tr><td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">No email sequences yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Email Sequence' : 'Create Email Sequence'}</DialogTitle><DialogDescription>Configure an initial email and unlimited follow-ups. Merge variables use double braces, such as {'{{first_name}}'} and {'{{company_name}}'}.</DialogDescription></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Sequence name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={TIMEZONES.includes(form.timezone) ? form.timezone : 'CUSTOM'} onChange={e => setForm({ ...form, timezone: e.target.value === 'CUSTOM' ? '' : e.target.value })}>{TIMEZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}<option value="CUSTOM">Custom timezone</option></select>
            {!TIMEZONES.includes(form.timezone) && <Input placeholder="Custom timezone, e.g. Asia/Karachi" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}/>}
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.fromEmail || ''} onChange={e => setForm({ ...form, fromEmail: e.target.value })}><option value="">Default sending account</option>{mailboxes.map((mailbox: any) => <option key={mailbox.id} value={mailbox.user || mailbox.email || mailbox.name}>{mailbox.name || mailbox.user || mailbox.email}</option>)}</select>
            <Input placeholder="Reply-to" value={form.replyTo} onChange={e => setForm({ ...form, replyTo: e.target.value })}/>
            <textarea className="md:col-span-2 min-h-20 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Email Steps</h3><Button size="sm" variant="outline" onClick={addStep}><Plus size={14} className="mr-1"/>Add step</Button></div>
            {form.steps.map((step: any, index: number) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center justify-between"><p className="font-semibold">Step {index + 1}</p>{form.steps.length > 1 && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeStep(index)}><Trash2 size={14}/></Button>}</div>
                <select className="mb-3 h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="" onChange={e => applyTemplate(index, e.target.value)}><option value="">Use email template</option>{templates.map((template: any) => <option key={template.id} value={template.id}>{template.templateName || template.subject}</option>)}</select>
                <div className="grid gap-3 md:grid-cols-[1fr_120px_130px]">
                  <Input placeholder="Subject" value={step.subject} onChange={e => setStep(index, { subject: e.target.value })}/>
                  <Input type="number" min={0} value={step.delayValue} onChange={e => setStep(index, { delayValue: Number(e.target.value) })}/>
                  <select className="h-10 rounded-md border bg-background px-3 text-sm" value={step.delayUnit} onChange={e => setStep(index, { delayUnit: e.target.value })}><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option><option value="WEEKS">Weeks</option></select>
                </div>
                <textarea className="mt-3 min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Email body" value={step.body} onChange={e => setStep(index, { body: e.target.value })}/>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-2"><Button variant="outline" className="gap-1.5" onClick={() => addToast({ title: 'AI draft', description: 'AI generation is available from the AI Assistant module; generated text must be reviewed before activation.' })}><Sparkles size={15}/>Generate with AI</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={saveForm} disabled={saving}>{saving && <Loader2 size={15} className="mr-1 animate-spin"/>}Save</Button></div></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!enrollOpen} onOpenChange={open => { if (!open) setEnrollOpen(null) }}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>Manage Sequence Leads</DialogTitle><DialogDescription>Search and filter leads, then add eligible leads or pause, resume, and remove active sequence enrollments.</DialogDescription></DialogHeader>
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_170px_190px_190px]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <Input className="pl-9" placeholder="Search name, company, email, or phone" value={leadSearch} onChange={e => setLeadSearch(e.target.value)}/>
            </div>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)}>{LEAD_STATUSES.map(status => <option key={status} value={status}>{status === 'all' ? 'All lead statuses' : status}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={emailStatusFilter} onChange={e => setEmailStatusFilter(e.target.value)}>{EMAIL_STATUSES.map(status => <option key={status} value={status}>{status === 'all' ? 'All email statuses' : status.replace(/_/g, ' ')}</option>)}</select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={enrollmentFilter} onChange={e => setEnrollmentFilter(e.target.value)}>{ENROLLMENT_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="font-semibold">{selectedLeadIds.size} selected</span>
            <span className="text-muted-foreground">Showing {sortedPickerLeads.length} leads</span>
            <span className="flex-1"/>
            <Button size="sm" variant="outline" onClick={() => setSelectedLeadIds(new Set(selectableLeads.map((lead: any) => lead.id)))}>Select available</Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedLeadIds(new Set())}>Clear</Button>
            <Button size="sm" onClick={enroll} disabled={selectedLeadIds.size === 0}>Add Selected</Button>
          </div>
          {enrollSummary && <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">{Object.entries(enrollSummary).map(([key, value]) => <div key={key} className="rounded-md bg-muted/60 p-2"><p className="text-xs text-muted-foreground">{key}</p><p className="font-semibold">{String(value)}</p></div>)}</div>}
          <div className="mt-3 overflow-hidden rounded-lg border">
            <div className="max-h-[430px] overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="sticky top-0 bg-muted text-left text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground"><tr><th className="w-10 px-3 py-2"><input type="checkbox" checked={allSelectableSelected} disabled={!selectableLeads.length} onChange={toggleAllVisibleLeads}/></th><th className="px-3 py-2">{sortHeader('name', 'Lead Name')}</th><th className="px-3 py-2">{sortHeader('company', 'Company')}</th><th className="px-3 py-2">{sortHeader('email', 'Email')}</th><th className="px-3 py-2">{sortHeader('leadStatus', 'Lead Status')}</th><th className="px-3 py-2">{sortHeader('emailStatus', 'Email Status')}</th><th className="px-3 py-2">{sortHeader('sequence', 'Sequence State')}</th><th className="px-3 py-2 text-right">Action</th></tr></thead>
                <tbody>
                  {pickerLoading && <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto animate-spin"/></td></tr>}
                  {!pickerLoading && sortedPickerLeads.map((lead: any) => {
                    const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Untitled lead'
                    const active = ['ACTIVE', 'PAUSED'].includes(lead.enrollment?.status)
                    const canSelect = !active
                    const removable = !!lead.enrollment && lead.enrollment.status !== 'COMPLETED'
                    return (
                      <tr key={lead.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2"><input type="checkbox" disabled={!canSelect} checked={selectedLeadIds.has(lead.id)} onChange={() => toggleLead(lead.id)}/></td>
                        <td className="px-3 py-2"><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">{lead.phone || '-'}</p></td>
                        <td className="px-3 py-2 text-muted-foreground">{lead.company || '-'}</td>
                        <td className="px-3 py-2"><span className={lead.email ? 'text-foreground' : 'text-red-600'}>{lead.email || 'Missing email'}</span>{lead.emailOptOut && <p className="text-xs text-red-600">Opted out</p>}</td>
                        <td className="px-3 py-2">{lead.leadStatus || 'New'}</td>
                        <td className="px-3 py-2">{(lead.emailStatus || 'NOT_CONTACTED').replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? statusTone[lead.enrollment.status] || statusTone.ACTIVE : 'bg-slate-100 text-slate-600'}`}>{lead.enrollment?.status || 'Not added'}</span>{lead.enrollment?.stopReason && <p className="mt-1 text-xs text-muted-foreground">{lead.enrollment.stopReason}</p>}</td>
                        <td className="px-3 py-2"><div className="flex justify-end gap-1">{lead.enrollment?.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => setEnrollmentAction(lead, 'pause')}>Pause</Button>}{lead.enrollment?.status === 'PAUSED' && <Button size="sm" variant="outline" onClick={() => setEnrollmentAction(lead, 'resume')}>Resume</Button>}{removable && <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRemoveLeadTarget(lead)}>Remove</Button>}</div></td>
                      </tr>
                    )
                  })}
                  {!pickerLoading && sortedPickerLeads.length === 0 && <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No leads match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end"><Button variant="outline" onClick={() => setEnrollOpen(null)}>Close</Button></div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? deleteSequence(deleteTarget.id) : undefined}
        title="Archive Sequence?"
        description="This sequence will be moved to Recycle Bin. Active sending will stop for this sequence."
        confirmLabel="Archive"
        variant="destructive"
      />
      <ConfirmDialog
        open={!!removeLeadTarget}
        onOpenChange={() => setRemoveLeadTarget(null)}
        onConfirm={() => removeLeadTarget ? setEnrollmentAction(removeLeadTarget, 'stop') : undefined}
        title="Remove Lead From Sequence?"
        description="This lead will be stopped in this sequence and no further automatic follow-ups will be sent."
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  )
}
