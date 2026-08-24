import { useState, useMemo, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, publicUrl } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { useAuthStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DateField, DateTimeField } from '@/components/ui/date-field'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { RowActions } from '@/components/ui/row-actions'
import { DetailDialog } from '@/components/ui/detail-dialog'
import { UserRoleSelect } from '@/components/user-role-select'
import { getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { formatDate, formatDateTime, formatMoney, formatNumber, useOrgSettings } from '@/lib/org-format'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Star, Pencil, Mail, RefreshCcw, Loader2, Plus, Trash2, Check, X, Clock,
  Paperclip, MessageSquare, Phone, Globe, AlertCircle, FileText, TrendingUp, ChevronRight,
  CalendarDays, Send, Users, Activity as ActivityIcon, CheckCircle2, Search,
  History, LayoutGrid, List, Package, Megaphone, Wrench, Sparkles, Target, Bell, MapPin, type LucideIcon,
} from 'lucide-react'

const inputCls = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
const textareaCls = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const TABS = ['Summary', 'Details', 'Updates', 'Activities', 'Emails', 'Documents', 'Products', 'Campaigns', 'Services', 'PBX Manager', 'Comments']
const TAB_ICONS: Record<string, LucideIcon> = {
  Summary: LayoutGrid,
  Details: List,
  Updates: History,
  Activities: CalendarDays,
  Emails: Mail,
  Documents: FileText,
  Products: Package,
  Campaigns: Megaphone,
  Services: Wrench,
  'PBX Manager': Phone,
  Comments: MessageSquare,
}
const TAB_ACTIVE_COLORS = [
  'data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
  'data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400',
  'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400',
  'data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
  'data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400',
  'data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400',
  'data-[state=active]:border-teal-500 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400',
  'data-[state=active]:border-fuchsia-500 data-[state=active]:text-fuchsia-600 dark:data-[state=active]:text-fuchsia-400',
  'data-[state=active]:border-lime-500 data-[state=active]:text-lime-600 dark:data-[state=active]:text-lime-400',
  'data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400',
  'data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400',
]

const DETAIL_FIELDS = [
  'leadNo', 'salutation', 'firstName', 'lastName', 'company', 'title', 'email', 'secondaryEmail',
  'phone', 'mobile', 'fax', 'website', 'leadSource', 'leadStatus', 'industry', 'annualRevenue',
  'noOfEmployees', 'rating', 'interest', 'emailOptOut', 'street', 'city', 'state', 'country',
  'postalCode', 'poBox', 'description',
]

const DETAIL_GROUPS: { title: string; icon: LucideIcon; fields: string[] }[] = [
  { title: 'Lead Information', icon: Users, fields: ['leadNo', 'salutation', 'firstName', 'lastName', 'company', 'title', 'leadSource', 'leadStatus'] },
  { title: 'Contact Information', icon: Phone, fields: ['email', 'secondaryEmail', 'phone', 'mobile', 'fax', 'website'] },
  { title: 'Company Information', icon: TrendingUp, fields: ['industry', 'annualRevenue', 'noOfEmployees', 'rating', 'interest', 'emailOptOut'] },
  { title: 'Address Information', icon: Globe, fields: ['street', 'city', 'state', 'country', 'postalCode', 'poBox'] },
  { title: 'Description Information', icon: FileText, fields: ['description'] },
  { title: 'Assignment & System Information', icon: History, fields: ['assignedTo', 'createdBy', 'createdAt', 'updatedAt'] },
]

const ACTIVITY_TYPES = ['Event', 'Task', 'Call', 'Meeting', 'Other']
const TASK_STATUS = ['Not Started', 'In Progress', 'Completed', 'Pending Input', 'Deferred']
const EVENT_STATUS = ['Planned', 'Held', 'Not Held']
const PRIORITIES = ['High', 'Medium', 'Low']
const STAGES = ['-- None --', 'Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost']

const LEAD_SOURCES = ['-- None --', 'Cold Call', 'Existing Customer', 'Self Generated', 'Employee', 'Partner', 'Public Relations', 'Direct Mail', 'Conference', 'Trade Show', 'Website', 'Word of Mouth', 'Email', 'Campaign', 'Other']
const LEAD_STATUSES = ['-- None --', 'New', 'Contacted', 'Working', 'Qualified', 'Unqualified', 'Converted', 'Junk', 'Lost']
const INDUSTRIES = ['-- None --', 'Apparel', 'Banking', 'Biotechnology', 'Chemicals', 'Communications', 'Construction', 'Consulting', 'Education', 'Electronics', 'Energy', 'Engineering', 'Entertainment', 'Environmental', 'Finance', 'Food & Beverage', 'Government', 'Healthcare', 'Hospitality', 'Insurance', 'Machinery', 'Manufacturing', 'Media', 'Not for Profit', 'Other', 'Recreation', 'Retail', 'Shipping', 'Technology', 'Telecommunications', 'Transportation', 'Utilities']
const RATINGS = ['-- None --', 'Acquired', 'Active', 'Failed', 'Inactive', 'Open']
const INTERESTS = ['-- None --', 'Buying signals', 'Product details', 'Quotation negotiation', 'Requested Sample', 'Specification', 'Support']

const SUMMARY_INFO_FIELDS: { name: string; label: string; type: string; options?: string[] }[] = [
  { name: 'leadNo', label: 'Lead No.', type: 'text' },
  { name: 'salutation', label: 'Salutation', type: 'select', options: ['-- None --', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'] },
  { name: 'firstName', label: 'First Name', type: 'text' },
  { name: 'lastName', label: 'Last Name', type: 'text' },
  { name: 'company', label: 'Company', type: 'text' },
  { name: 'title', label: 'Title', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'secondaryEmail', label: 'Secondary Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'mobile', label: 'Mobile', type: 'text' },
  { name: 'fax', label: 'Fax', type: 'text' },
  { name: 'website', label: 'Website', type: 'text' },
  { name: 'leadSource', label: 'Lead Source', type: 'select', options: LEAD_SOURCES },
  { name: 'leadStatus', label: 'Lead Status', type: 'select', options: LEAD_STATUSES },
  { name: 'industry', label: 'Industry', type: 'select', options: INDUSTRIES },
  { name: 'annualRevenue', label: 'Annual Revenue', type: 'number' },
  { name: 'noOfEmployees', label: 'No. of Employees', type: 'number' },
  { name: 'rating', label: 'Rating', type: 'select', options: RATINGS },
  { name: 'interest', label: 'Interest', type: 'select', options: INTERESTS },
  { name: 'emailOptOut', label: 'Email Opt Out', type: 'checkbox' },
  { name: 'street', label: 'Street', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'postalCode', label: 'Postal Code', type: 'text' },
  { name: 'poBox', label: 'PO Box', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
]

function pad(n: number) { return String(n).padStart(2, '0') }
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtDate(v: any): string {
  if (!v) return '-'
  return formatDateTime(v) || String(v)
}
function fmtDateOnly(v: any): string {
  if (!v) return '-'
  return formatDate(v) || String(v)
}

function fmtDisplay(value: any, name: string): string {
  if (value == null || value === '') return '--'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (name === 'annualRevenue') return formatMoney(value)
  if (name === 'noOfEmployees') return formatNumber(value, 0)
  return String(value)
}

function FieldRow({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <p className="text-sm mt-1 break-words">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value == null || value === '' ? '-' : value}</p>
    </div>
  )
}

function DetailGroup({ title, icon: Icon, open, onToggle, children }: { title: string; icon: LucideIcon; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-card overflow-hidden dark:border-slate-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 bg-slate-50 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900"
      >
        <span className="flex items-center gap-2"><Icon size={15} className="text-primary" /> {title}</span>
        <ChevronRight size={15} className={cn('text-muted-foreground transition-transform', open && 'rotate-90')} />
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 p-4">
          {children}
        </div>
      )}
    </div>
  )
}

function emptyActivity() {
  const now = new Date()
  const end = new Date(now); end.setHours(now.getHours() + 1)
  return { subject: '', activityType: 'Task', status: 'Planned', priority: 'Medium', location: '', startAt: toLocalInput(now), endAt: toLocalInput(end), dueAt: '', description: '', assignedTo: '' }
}

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === 'Call' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : type === 'Meeting' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{type}</span>
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">-</span>
  const cls =
    status === 'Completed' || status === 'Held' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status === 'In Progress' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
      : status === 'Planned' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cls)}>{status}</span>
}

function InlineField({
  label, name, value, type = 'text', options, onSave, saving,
}: {
  label: string; name: string; value: any; type?: string; options?: string[]; onSave: (name: string, value: any) => void; saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<any>('')

  const allOptions = useMemo(() => {
    const base = options || []
    if (value != null && value !== '' && !base.includes(value)) return [...base, value]
    return base
  }, [options, value])

  const start = () => { setDraft(value ?? ''); setEditing(true) }
  const cancel = () => setEditing(false)
  const save = () => {
    let v = draft
    if (type === 'number') v = v === '' ? null : Number(v)
    if (type === 'checkbox') v = !!v
    if (v === '' || v === '-- None --') v = null
    onSave(name, v)
    setEditing(false)
  }

  return (
    <div className="group relative grid min-h-11 grid-cols-[minmax(92px,40%)_1fr] items-center gap-3 border-b border-border/60 px-2 py-1.5 transition-colors last:border-b-0 hover:bg-muted/50">
      <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        {!editing && (
          <Pencil size={12} className="h-3.5 w-3.5 shrink-0 cursor-pointer text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" onClick={start} />
        )}
      </label>
      {editing ? (
        <div className="flex min-w-0 items-center gap-1.5">
          {type === 'select' ? (
            <Select value={draft ?? ''} onValueChange={setDraft}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : type === 'checkbox' ? (
            <div className="flex h-8 flex-1 items-center gap-2 rounded-md border bg-background px-3">
              <Switch checked={!!draft} onCheckedChange={setDraft} />
              <span className="text-xs text-muted-foreground">{draft ? 'Yes' : 'No'}</span>
            </div>
          ) : type === 'textarea' ? (
            <textarea
              className="min-h-20 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft ?? ''}
              autoFocus
              onChange={e => setDraft(e.target.value)}
            />
          ) : (
            <Input
              className="h-8 text-sm"
              type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
              value={draft ?? ''}
              autoFocus
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            />
          )}
          <button type="button" onClick={save} disabled={saving}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-50"
            title="Save">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          </button>
          <button type="button" onClick={cancel}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:text-foreground"
            title="Cancel">
            <X size={15} />
          </button>
        </div>
      ) : (
        <p className="min-w-0 cursor-pointer break-words text-sm font-medium hover:text-primary" onClick={start} title={`Edit ${label}`}>
          {fmtDisplay(value, name)}
        </p>
      )}
    </div>
  )
}

function PbxManagerPanel({ lead }: { lead: any }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [customNumber, setCustomNumber] = useState('')
  const [calling, setCalling] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['calllogs', 'lead', lead?.id],
    queryFn: () => api.list('calllogs', { limit: '50', filter: JSON.stringify({ relatedToId: lead?.id, relatedToModule: 'leads' }) }).catch(() => ({ data: [] })),
  })

  const placeCall = async (toNumber: string) => {
    if (!toNumber) return
    setCalling(true)
    try {
      const res = await api.clickToCall({ toNumber, relatedToModule: 'leads', relatedToId: lead?.id })
      queryClient.invalidateQueries({ queryKey: ['calllogs'] })
      if (res.dialed) addToast({ title: 'Call initiated', description: `Dialing ${toNumber}…`, variant: 'success' })
      else addToast({ title: 'Could not place call', description: res.message || 'PBX not configured. Enable it in Settings → Integrations → PBX.', variant: 'destructive' })
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setCalling(false)
    }
  }

  const callTargets = [lead?.phone, lead?.mobile].filter(Boolean) as string[]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground"><Phone size={15} /> Click-to-Call</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Places the call through the org PBX server and logs it automatically. Configure the server in Settings → Integrations → PBX / Phone.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {callTargets.length === 0 && <span className="text-xs text-muted-foreground">No phone number on this lead.</span>}
          {callTargets.map((n) => (
            <Button key={n} size="sm" variant="outline" onClick={() => placeCall(n)} disabled={calling}>
              <Phone size={13} className="mr-1.5 text-emerald-500" /> {n}
            </Button>
          ))}
          <Input className="h-9 w-44" placeholder="Custom number…" value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') placeCall(customNumber) }} />
          <Button size="sm" onClick={() => placeCall(customNumber)} disabled={calling || !customNumber}>
            {calling ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Phone size={13} className="mr-1.5" />} Call
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Recent Call Logs</h3>
        <DataTable
          columns={[
            { key: 'direction', label: 'Direction', render: (v) => <span className={`text-xs font-medium ${v === 'outbound' ? 'text-blue-600' : 'text-emerald-600'}`}>{v}</span> },
            { key: 'fromNumber', label: 'From', render: (v) => <span className="text-sm">{v || '—'}</span> },
            { key: 'toNumber', label: 'To', render: (v) => <span className="text-sm">{v || '—'}</span> },
            { key: 'status', label: 'Status', render: (v) => <span className="text-xs font-medium text-muted-foreground">{v || '—'}</span> },
            { key: 'duration', label: 'Duration (s)', render: (v) => <span className="text-sm">{v ?? '—'}</span> },
            { key: 'callTime', label: 'Time', render: (v) => <span className="text-sm text-muted-foreground">{v ? formatDateTime(v) : '—'}</span> },
          ]}
          data={data?.data || []}
          loading={isLoading}
          emptyMessage="No calls logged for this lead yet."
          pageSize={10}
        />
      </div>
    </div>
  )
}

export function LeadDetailPage() {
  useOrgSettings()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const currentUser = useAuthStore(s => s.user)

  const [activeTab, setActiveTab] = useState('Summary')
  const [activityOpen, setActivityOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<any | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [docOpen, setDocOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentPrivate, setCommentPrivate] = useState(false)
  const [viewRow, setViewRow] = useState<{ type: 'activity' | 'email' | 'document' | 'comment' | 'product' | 'service'; row: any } | null>(null)
  const [productSelectOpen, setProductSelectOpen] = useState(false)
  const [productSelectSearch, setProductSelectSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { qty: number; listPrice: number }>>({})
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [serviceSelectOpen, setServiceSelectOpen] = useState(false)
  const [serviceSelectSearch, setServiceSelectSearch] = useState('')
  const [selectedServices, setSelectedServices] = useState<Record<string, { qty: number; listPrice: number }>>({})
  const [editingService, setEditingService] = useState<any | null>(null)
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)
  const [campaignSelectOpen, setCampaignSelectOpen] = useState(false)
  const [campaignSearch, setCampaignSearch] = useState('')
  const [docSelectOpen, setDocSelectOpen] = useState(false)
  const [docSearch, setDocSearch] = useState('')
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [deleteDocLinkId, setDeleteDocLinkId] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<'Events' | 'Tasks'>('Events')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [aiScore, setAiScore] = useState<any>(null)
  const [showAiScore, setShowAiScore] = useState(false)

  const { data: lead, isLoading } = useQuery({
    queryKey: ['leads', id],
    queryFn: () => api.get('leads', id!),
    enabled: !!id,
  })

  const { data: leadPicklistData } = useQuery({
    queryKey: ['picklists-all', 'leads'],
    queryFn: () => api.getAllPicklists('leads').catch(() => ({ data: {} })),
  })
  const summaryInfoFields = useMemo(() => {
    const picklists = (leadPicklistData?.data || {}) as Record<string, Record<string, string[]>>
    const configured = picklists.leads || {}
    return SUMMARY_INFO_FIELDS.map(field => {
      const values = configured[field.name]
      return Array.isArray(values) && values.length
        ? { ...field, options: ['-- None --', ...values] }
        : field
    })
  }, [leadPicklistData])

  const { data: followersData } = useQuery({
    queryKey: ['followers', id],
    queryFn: () => api.record('leads', id!).followers(),
    enabled: !!id,
  })
  const isFollowing = followersData?.isFollowing ?? false
  const followerCount = followersData?.data?.length ?? 0

  const { data: campaign } = useQuery({
    queryKey: ['campaigns', lead?.campaignId],
    queryFn: () => api.get('campaigns', lead.campaignId),
    enabled: !!lead?.campaignId,
  })

  const { data: updatesData } = useQuery({
    queryKey: ['record-updates', id],
    queryFn: () => api.record('leads', id!).updates(100),
    enabled: !!id && activeTab === 'Updates',
  })

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['record-activities', id],
    queryFn: () => api.record('leads', id!).activities(),
    enabled: !!id && (activeTab === 'Activities' || activeTab === 'Summary'),
  })

  const { data: usersData } = useQuery({
    queryKey: ['leads', 'users'],
    queryFn: () => api.request<any>(`/leads/users`),
    enabled: !!id,
  })
  const users = usersData?.data || []

  const { data: emailsData } = useQuery({
    queryKey: ['record-emails', id],
    queryFn: () => api.record('leads', id!).emails(),
    enabled: !!id && activeTab === 'Emails',
  })

  const { data: docsData } = useQuery({
    queryKey: ['record-documents', id],
    queryFn: () => api.record('leads', id!).documents(),
    enabled: !!id && activeTab === 'Documents',
  })

  const { data: productsData } = useQuery({
    queryKey: ['record-related', 'products'],
    queryFn: () => api.record('leads', id!).related('products'),
    enabled: !!id && activeTab === 'Products',
  })

  const { data: allProductsData } = useQuery({
    queryKey: ['products', 'catalog', productSelectSearch],
    queryFn: () => api.list('products', { limit: '200', search: productSelectSearch }),
    enabled: !!id && productSelectOpen,
  })

  const { data: allServicesData } = useQuery({
    queryKey: ['services', 'catalog', serviceSelectSearch],
    queryFn: () => api.list('services', { limit: '200', search: serviceSelectSearch }),
    enabled: !!id && serviceSelectOpen,
  })

  const { data: allCampaignsData } = useQuery({
    queryKey: ['campaigns', 'catalog', campaignSearch],
    queryFn: () => api.list('campaigns', { limit: '200', search: campaignSearch }),
    enabled: !!id && campaignSelectOpen,
  })

  const { data: allDocsData } = useQuery({
    queryKey: ['documents', 'library', docSearch],
    queryFn: () => api.list('documents', { limit: '200', search: docSearch }),
    enabled: !!id && docSelectOpen,
  })

  const { data: campaignsData } = useQuery({
    queryKey: ['record-related', 'campaigns'],
    queryFn: () => api.record('leads', id!).related('campaigns'),
    enabled: !!id && activeTab === 'Campaigns',
  })

  const { data: servicesData } = useQuery({
    queryKey: ['record-related', 'services'],
    queryFn: () => api.record('leads', id!).related('services'),
    enabled: !!id && activeTab === 'Services',
  })

  const { data: commentsData } = useQuery({
    queryKey: ['record-comments', id],
    queryFn: () => api.record('leads', id!).comments(),
    enabled: !!id && (activeTab === 'Comments' || activeTab === 'Summary'),
  })

  const { data: convInfo } = useQuery({
    queryKey: ['lead-conversion-info', id],
    queryFn: () => api.getLeadConversionInfo(id!),
    enabled: !!id && convertOpen && !lead?.isConverted,
  })

  const [convForm, setConvForm] = useState<any>(null)
  useMemo(() => {
    if (convInfo) setConvForm(convInfo.potentialInfo)
    return null
  }, [convInfo])

  const [convModules, setConvModules] = useState({ account: true, contact: true, potential: true })
  const convAnySelected = convModules.account || convModules.contact || convModules.potential

  const { data: convSettings } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })
  const stageProbability = (convSettings?.stageProbability || {}) as Record<string, number>

  const [actForm, setActForm] = useState<any>(emptyActivity())
  const [emailForm, setEmailForm] = useState<any>({ to: '', cc: '', bcc: '', subject: '', body: '' })
  const [docForm, setDocForm] = useState<any>({ title: '', noteContent: '', file: null as File | null })

  const invalidate = (...keys: string[]) => {
    for (const k of keys) queryClient.invalidateQueries({ queryKey: [k] })
  }

  const toastErr = (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' })

  const inlineSaveMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: any }) => api.update('leads', id!, { [name]: value }),
    onSuccess: () => {
      invalidate('leads')
      addToast({ title: 'Saved', variant: 'success' })
    },
    onError: toastErr,
  })

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? api.record('leads', id!).unfollow() : api.record('leads', id!).follow()),
    onSuccess: () => {
      invalidate('followers')
      addToast({ title: isFollowing ? 'Unfollowed' : 'Following', variant: 'success' })
    },
    onError: toastErr,
  })

  const commentMutation = useMutation({
    mutationFn: () => api.record('leads', id!).createComment({ comment: commentText, isPrivate: commentPrivate }),
    onSuccess: () => {
      setCommentText('')
      setCommentPrivate(false)
      invalidate('record-comments', 'record-updates')
      addToast({ title: 'Comment added', variant: 'success' })
    },
    onError: toastErr,
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (cid: string) => api.deleteComment(cid),
    onSuccess: () => {
      invalidate('record-comments')
      addToast({ title: 'Comment deleted', variant: 'success' })
    },
    onError: toastErr,
  })

  const activityMutation = useMutation({
    mutationFn: (data: any) =>
      editingActivity ? api.updateRecordActivity(editingActivity.id, data) : api.record('leads', id!).createActivity(data),
    onSuccess: () => {
      setActivityOpen(false)
      setEditingActivity(null)
      invalidate('record-activities', 'record-updates')
      addToast({ title: editingActivity ? 'Activity updated' : 'Activity created', variant: 'success' })
    },
    onError: toastErr,
  })

  const deleteActivityMutation = useMutation({
    mutationFn: (aid: string) => api.deleteRecordActivity(aid),
    onSuccess: () => {
      invalidate('record-activities')
      addToast({ title: 'Activity deleted', variant: 'success' })
    },
    onError: toastErr,
  })

  const emailMutation = useMutation({
    mutationFn: () => api.record('leads', id!).createEmail({
      subject: emailForm.subject,
      toEmails: emailForm.to,
      ccEmails: emailForm.cc || null,
      bccEmails: emailForm.bcc || null,
      body: emailForm.body,
    }),
    onSuccess: () => {
      setEmailOpen(false)
      setEmailForm({ to: '', cc: '', bcc: '', subject: '', body: '' })
      invalidate('record-emails', 'record-updates')
      addToast({ title: 'Email sent', variant: 'success' })
    },
    onError: toastErr,
  })

  const docMutation = useMutation({
    mutationFn: async () => {
      let upload: { fileName: string; path: string } | null = null
      if (docForm.file) upload = await api.uploadFile(docForm.file)
      return api.record('leads', id!).createDocument({
        title: docForm.title,
        fileName: docForm.file?.name || upload?.fileName || null,
        filePath: upload?.path || null,
        fileType: docForm.file?.type || null,
        fileSize: docForm.file?.size || null,
        noteContent: docForm.noteContent || null,
      })
    },
    onSuccess: () => {
      setDocOpen(false)
      setDocForm({ title: '', noteContent: '', file: null })
      invalidate('record-documents', 'record-updates')
      addToast({ title: 'Document added', variant: 'success' })
    },
    onError: toastErr,
  })

  const unlinkDocMutation = useMutation({
    mutationFn: (did: string) => api.record('leads', id!).unlinkDocument(did),
    onSuccess: () => {
      setDeleteDocLinkId(null)
      invalidate('record-documents')
      addToast({ title: 'Document unlinked', variant: 'success' })
    },
    onError: toastErr,
  })

  const linkProductsMutation = useMutation({
    mutationFn: () => api.record('leads', id!).linkProducts(
      Object.entries(selectedProducts).map(([productId, v]) => ({ productId, qty: v.qty, listPrice: v.listPrice }))
    ),
    onSuccess: () => {
      setProductSelectOpen(false)
      setSelectedProducts({})
      setProductSelectSearch('')
      invalidate('record-related', 'record-updates')
      addToast({ title: 'Products linked', variant: 'success' })
    },
    onError: toastErr,
  })

  const updateLinkedProductMutation = useMutation({
    mutationFn: (data: { qty: number; listPrice: number }) => api.record('leads', id!).updateLinkedProduct(editingProduct.id, data),
    onSuccess: () => {
      setEditingProduct(null)
      invalidate('record-related')
      addToast({ title: 'Product updated', variant: 'success' })
    },
    onError: toastErr,
  })

  const unlinkProductMutation = useMutation({
    mutationFn: (pid: string) => api.record('leads', id!).unlinkProduct(pid),
    onSuccess: () => {
      setDeleteProductId(null)
      invalidate('record-related')
      addToast({ title: 'Product unlinked', variant: 'success' })
    },
    onError: toastErr,
  })

  const toggleProductSelection = (p: any) => {
    setSelectedProducts(prev => {
      const next = { ...prev }
      if (next[p.id]) delete next[p.id]
      else next[p.id] = { qty: 1, listPrice: p.unitPrice != null ? Number(p.unitPrice) : 0 }
      return next
    })
  }

  const setProductSelection = (pid: string, patch: { qty?: number; listPrice?: number }) => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], ...patch } }))
  }

  const removeProductSelection = (pid: string) => {
    setSelectedProducts(prev => {
      const next = { ...prev }
      delete next[pid]
      return next
    })
  }

  const toggleServiceSelection = (s: any) => {
    setSelectedServices(prev => {
      const next = { ...prev }
      if (next[s.id]) delete next[s.id]
      else next[s.id] = { qty: 1, listPrice: s.unitPrice != null ? Number(s.unitPrice) : 0 }
      return next
    })
  }

  const setServiceSelection = (sid: string, patch: { qty?: number; listPrice?: number }) => {
    setSelectedServices(prev => ({ ...prev, [sid]: { ...prev[sid], ...patch } }))
  }

  const removeServiceSelection = (sid: string) => {
    setSelectedServices(prev => {
      const next = { ...prev }
      delete next[sid]
      return next
    })
  }

  const linkServicesMutation = useMutation({
    mutationFn: () => api.record('leads', id!).linkServices(
      Object.entries(selectedServices).map(([serviceId, v]) => ({ serviceId, qty: v.qty, listPrice: v.listPrice }))
    ),
    onSuccess: () => {
      setServiceSelectOpen(false)
      setSelectedServices({})
      setServiceSelectSearch('')
      invalidate('record-related', 'record-updates')
      addToast({ title: 'Services linked', variant: 'success' })
    },
    onError: toastErr,
  })

  const updateLinkedServiceMutation = useMutation({
    mutationFn: (data: { qty: number; listPrice: number }) => api.record('leads', id!).updateLinkedService(editingService.id, data),
    onSuccess: () => {
      setEditingService(null)
      invalidate('record-related')
      addToast({ title: 'Service updated', variant: 'success' })
    },
    onError: toastErr,
  })

  const unlinkServiceMutation = useMutation({
    mutationFn: (sid: string) => api.record('leads', id!).unlinkService(sid),
    onSuccess: () => {
      setDeleteServiceId(null)
      invalidate('record-related')
      addToast({ title: 'Service unlinked', variant: 'success' })
    },
    onError: toastErr,
  })

  const setCampaignMutation = useMutation({
    mutationFn: (campaignId: string | null) => api.record('leads', id!).setCampaign(campaignId),
    onSuccess: () => {
      setCampaignSelectOpen(false)
      invalidate('leads', 'record-related')
      addToast({ title: 'Campaign updated', variant: 'success' })
    },
    onError: toastErr,
  })

  const linkDocsMutation = useMutation({
    mutationFn: () => api.record('leads', id!).linkDocuments([...selectedDocIds]),
    onSuccess: () => {
      setDocSelectOpen(false)
      setSelectedDocIds(new Set())
      setDocSearch('')
      invalidate('record-documents', 'record-updates')
      addToast({ title: 'Documents linked', variant: 'success' })
    },
    onError: toastErr,
  })

  const aiLeadScoreMutation = useMutation({
    mutationFn: () => api.aiLeadScore(id!),
    onSuccess: (data) => {
      setAiScore(data.data)
      setShowAiScore(true)
      addToast({ title: 'Lead scored', variant: 'success' })
    },
    onError: toastErr,
  })

  const toggleDocSelection = (did: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev)
      if (next.has(did)) next.delete(did)
      else next.add(did)
      return next
    })
  }

  const convertMutation = useMutation({
    mutationFn: () =>
      api.convertLead(id!, {
        assignedTo: lead?.assignedTo || null,
        modules: convModules,
        potentialInfo: {
          potentialName: convForm?.potentialName,
          amount: convForm?.amount || null,
          closingDate: convForm?.closingDate || null,
          stage: convForm?.stage === '-- None --' ? null : convForm?.stage,
          probability: convForm?.probability || null,
          nextStep: convForm?.nextStep || null,
        },
      }),
    onSuccess: (data) => {
      setConvertOpen(false)
      invalidate('leads', 'followers')
      addToast({
        title: 'Lead converted',
        description: data.account ? `Created ${data.account.accountName}` : 'Converted successfully',
        variant: 'success',
      })
    },
    onError: toastErr,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertCircle className="text-muted-foreground" size={32} />
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>Back to Leads</Button>
      </div>
    )
  }

  const fullName = [lead.salutation, lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Untitled Lead'
  const initials = ((lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')).toUpperCase() || '?'
  const recentActivities = (activitiesData?.data || []).slice(0, 5)
  const recentComments = (commentsData?.data || []).slice(0, 5)
  const daysInPipeline = lead.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000)) : 0
  const leadScore = Math.max(0, Math.min(10, Number(lead.leadScore ?? lead.score ?? lead.rating) || 0))

  const openActivityDialog = (a: any | null) => {
    if (a) {
      setEditingActivity(a)
      setActForm({
        subject: a.subject || '',
        activityType: a.activityType || 'Task',
        status: a.status || 'Planned',
        priority: a.priority || 'Medium',
        location: a.location || '',
        startAt: a.startAt ? toLocalInput(new Date(a.startAt)) : '',
        endAt: a.endAt ? toLocalInput(new Date(a.endAt)) : '',
        dueAt: a.dueAt ? toLocalInput(new Date(a.dueAt)) : '',
        description: a.description || '',
        assignedTo: a.assignedTo || currentUser?.id || '',
      })
    } else {
      setEditingActivity(null)
      setActForm(emptyActivity())
    }
    setActivityOpen(true)
  }

  const activityStatuses = actForm.activityType === 'Task' ? TASK_STATUS : EVENT_STATUS

  const activityColumns = [
    { key: 'activityType', label: 'Type', sortable: true, render: (_: any, a: any) => <TypeBadge type={a.activityType} /> },
    {
      key: 'subject', label: 'Subject', sortable: true,
      render: (_: any, a: any) => (
        <div>
          <div className="font-medium">{a.subject}</div>
          {a.description && <div className="max-w-[240px] truncate text-xs text-muted-foreground">{a.description}</div>}
        </div>
      ),
    },
    { key: 'status', label: 'Status', sortable: true, render: (_: any, a: any) => <StatusBadge status={a.status} /> },
    { key: 'priority', label: 'Priority', sortable: true, render: (_: any, a: any) => <span className="text-muted-foreground">{a.priority || '-'}</span> },
    { key: 'startAt', label: 'Date', sortable: true, render: (_: any, a: any) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(a.startAt || a.dueAt)}</span> },
    { key: 'ownerName', label: 'Owner', sortable: true, render: (_: any, a: any) => <span className="text-muted-foreground">{a.ownerName || '-'}</span> },
  ]

  const emailColumns = [
    {
      key: 'subject', label: 'Subject', sortable: true,
      render: (_: any, e: any) => (
        <div>
          <div className="flex items-center gap-2 font-medium">
            <Send size={13} className="shrink-0 text-muted-foreground" /> {e.subject || '(no subject)'}
          </div>
          {e.body && (
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: e.body.replace(/<[^>]*>/g, ' ').slice(0, 120) }} />
          )}
        </div>
      ),
    },
    { key: 'toEmails', label: 'To', sortable: true, render: (_: any, e: any) => <span className="text-muted-foreground">{e.toEmails || '-'}</span> },
    { key: 'createdAt', label: 'Date', sortable: true, render: (_: any, e: any) => <span className="whitespace-nowrap text-muted-foreground">{fmtDate(e.createdAt)}</span> },
  ]

  const documentColumns = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (_: any, d: any) => (
        <div>
          <div className="flex items-center gap-2 font-medium">
            <FileText size={14} className="shrink-0 text-blue-500" /> {d.title}
          </div>
          {d.noteContent && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{d.noteContent}</div>}
        </div>
      ),
    },
    {
      key: 'fileName', label: 'File', sortable: true,
      render: (_: any, d: any) => (
        d.filePath ? (
          <a className="inline-flex items-center gap-1 text-primary underline underline-offset-2" href={publicUrl(d.filePath.startsWith('/') ? d.filePath : `/uploads/${d.filePath}`)} target="_blank" rel="noreferrer">
            <Paperclip size={12} /> {d.fileName || 'Open'}
          </a>
        ) : (d.fileName || '-')
      ),
    },
    { key: 'fileType', label: 'Type', sortable: true, render: (_: any, d: any) => <span className="text-muted-foreground">{d.fileType || '-'}</span> },
    {
      key: 'fileStatus', label: 'Status', sortable: true,
      render: (_: any, d: any) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{d.fileStatus || 'Active'}</span>
      ),
    },
    { key: 'userName', label: 'Owner', sortable: true, render: (_: any, d: any) => <span className="text-muted-foreground">{d.userName || '-'}</span> },
    { key: 'createdAt', label: 'Added', sortable: true, render: (_: any, d: any) => <span className="whitespace-nowrap text-muted-foreground">{fmtDateOnly(d.createdAt)}</span> },
  ]

  const productColumns = [
    { key: 'productName', label: 'Product', sortable: true, render: (_: any, p: any) => <span className="font-medium">{p.productName}</span> },
    { key: 'productCategory', label: 'Category', sortable: true, render: (_: any, p: any) => <span className="text-muted-foreground">{p.productCategory || '-'}</span> },
    { key: 'qty', label: 'Qty', sortable: true, render: (_: any, p: any) => (p.qty ?? 1) },
    { key: 'unitPrice', label: 'Unit Price', sortable: true, render: (_: any, p: any) => (p.unitPrice != null ? formatMoney(p.unitPrice) : '-') },
    { key: 'listPrice', label: 'Selling Price', sortable: true, render: (_: any, p: any) => (p.listPrice != null ? formatMoney(p.listPrice) : '-') },
    { key: 'lineTotal', label: 'Total', render: (_: any, p: any) => <span className="font-semibold">{formatMoney(Number(p.qty ?? 1) * Number(p.listPrice ?? p.unitPrice ?? 0))}</span> },
  ]

  const campaignColumns = [
    { key: 'campaignName', label: 'Campaign', sortable: true, render: (_: any, c: any) => <span className="font-medium">{c.campaignName}</span> },
    { key: 'campaignType', label: 'Type', sortable: true, render: (_: any, c: any) => <span className="text-muted-foreground">{c.campaignType || '-'}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (_: any, c: any) => (c.status || '-') },
    { key: 'startDate', label: 'Start Date', sortable: true, render: (_: any, c: any) => <span className="text-muted-foreground">{c.startDate ? fmtDateOnly(c.startDate) : '-'}</span> },
    { key: 'expectedRevenue', label: 'Expected Revenue', sortable: true, render: (_: any, c: any) => (c.expectedRevenue != null ? `$${Number(c.expectedRevenue).toLocaleString()}` : '-') },
  ]

  const serviceColumns = [
    { key: 'serviceName', label: 'Service', sortable: true, render: (_: any, s: any) => <span className="font-medium">{s.serviceName}</span> },
    { key: 'serviceCategory', label: 'Category', sortable: true, render: (_: any, s: any) => <span className="text-muted-foreground">{s.serviceCategory || '-'}</span> },
    { key: 'qty', label: 'Qty', sortable: true, render: (_: any, s: any) => (s.qty ?? 1) },
    { key: 'listPrice', label: 'List Price', sortable: true, render: (_: any, s: any) => (s.listPrice != null ? `$${Number(s.listPrice).toLocaleString()}` : '-') },
    { key: 'unitPrice', label: 'Unit Price', sortable: true, render: (_: any, s: any) => (s.unitPrice != null ? `$${Number(s.unitPrice).toLocaleString()}` : '-') },
  ]

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate flex items-center gap-2">
              {fullName}
              {lead.isConverted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5">
                  <CheckCircle2 size={12} /> Converted
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {lead.company || 'No company'} {lead.leadNo ? `· ${lead.leadNo}` : ''}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <Button
            variant={isFollowing ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending}
          >
            {isFollowing ? <Check size={15} /> : <Star size={15} />}
            {isFollowing ? `Following${followerCount > 1 ? ` (${followerCount})` : ''}` : 'Follow'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aiLeadScoreMutation.mutate()}
            disabled={aiLeadScoreMutation.isPending}
            className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200 dark:border-violet-800 hover:from-violet-100 hover:to-indigo-100"
          >
            {aiLeadScoreMutation.isPending ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Sparkles size={15} className="mr-1 text-violet-500" />}
            Score Lead
          </Button>
          <Button size="sm" onClick={() => navigate(`/leads/${id}/edit`)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setEmailForm((f: any) => ({ ...f, to: lead.email || '' }))
            setEmailOpen(true)
          }}>
            <Mail size={15} /> Send Email
          </Button>
          {!lead.isConverted && (
            <Button variant="secondary" size="sm" onClick={() => setConvertOpen(true)}>
              <RefreshCcw size={15} /> Convert Lead
            </Button>
          )}
        </div>
      </div>

      {lead.isConverted && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>This lead was converted.</span>
          {lead.convertedAccountId && (
            <Button variant="link" size="sm" className="px-1" onClick={() => navigate(`/accounts/${lead.convertedAccountId}`)}>View Account</Button>
          )}
          {lead.convertedContactId && (
            <Button variant="link" size="sm" className="px-1" onClick={() => navigate(`/contacts/${lead.convertedContactId}`)}>View Contact</Button>
          )}
          {lead.convertedPotentialId && (
            <Button variant="link" size="sm" className="px-1" onClick={() => navigate(`/potentials/${lead.convertedPotentialId}`)}>View Opportunity</Button>
          )}
        </div>
      )}

      {showAiScore && aiScore && (
        <div className="rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Target size={15} className="text-violet-500" /> AI Lead Score</h3>
            <button onClick={() => setShowAiScore(false)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">{aiScore.score}</p>
              <p className={cn('text-xs font-medium mt-1', aiScore.score <= 30 ? 'text-red-600' : aiScore.score <= 70 ? 'text-yellow-600' : 'text-emerald-600')}>{aiScore.label}</p>
            </div>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <div className={cn('h-full rounded-full transition-all', aiScore.score <= 30 ? 'bg-red-500' : aiScore.score <= 70 ? 'bg-yellow-500' : 'bg-emerald-500')} style={{ width: `${aiScore.score}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(aiScore.factors || []).slice(0, 4).map((f: any, i: number) => (
                  <span key={i} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', f.value > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{f.name}</span>
                ))}
              </div>
              {aiScore.recommendation && <p className="text-xs text-muted-foreground mt-2">{aiScore.recommendation}</p>}
            </div>
          </div>
        </div>
      )}

      {!lead.isConverted && (
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950 px-5 py-4 text-white shadow-lg sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-300"><Bell size={18}/></span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-indigo-200">Next best action</p><p className="mt-1 text-sm text-slate-100">{recentActivities[0] ? <>Review <b>{recentActivities[0].subject}</b> and schedule the next touchpoint while this lead is active.</> : <>No activity is logged yet. Start with a call, email, or follow-up task.</>}</p></div>
          <div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={()=>setActivityOpen(true)}>Schedule follow-up</Button><Button size="sm" className="bg-white font-semibold text-slate-950 hover:bg-slate-100" onClick={()=>setActivityOpen(true)}>Log activity</Button></div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[308px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-5">
          <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-xl font-bold text-white shadow-lg shadow-indigo-500/20">{initials}</div>
            <h2 className="mt-3 text-base font-bold">{fullName}</h2><p className="mt-1 text-xs text-muted-foreground">{lead.company || 'No company'}{lead.industry ? ` · ${lead.industry}` : ''}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">{lead.leadStatus&&<span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{lead.leadStatus}</span>}{lead.leadSource&&<span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{lead.leadSource}</span>}</div>
            <div className="mt-5 flex items-center gap-4 border-t border-b py-4 text-left"><div className="relative h-16 w-16 shrink-0"><svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" className="text-muted" strokeWidth="7"/><circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" className="text-indigo-600" strokeWidth="7" strokeLinecap="round" strokeDasharray="169.6" strokeDashoffset={169.6-(169.6*leadScore/10)}/></svg><span className="absolute inset-0 grid place-items-center text-sm font-bold">{leadScore ? leadScore.toFixed(1) : '—'}</span></div><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Lead score</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{leadScore >= 7 ? 'Strong fit — prioritize this lead.' : leadScore >= 4 ? 'Mid-tier fit — keep nurturing.' : 'Score this lead to assess fit.'}</p></div></div>
            <div className="pt-4 text-left"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Contact</p><div className="mt-3 space-y-3 text-xs">{lead.email?<a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-indigo-600"><Mail size={14}/><span className="truncate">{lead.email}</span></a>:<p className="flex items-center gap-2 text-muted-foreground"><Mail size={14}/>Email not provided</p>}{lead.phone||lead.mobile?<a href={`tel:${lead.phone||lead.mobile}`} className="flex items-center gap-2 hover:text-indigo-600"><Phone size={14}/>{lead.phone||lead.mobile}</a>:<p className="flex items-center gap-2 text-muted-foreground"><Phone size={14}/>Phone not provided</p>}<p className="flex items-center gap-2 text-muted-foreground"><MapPin size={14}/>{[lead.city,lead.country].filter(Boolean).join(', ')||'Location not set'}</p></div></div>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Pipeline stage</p><div className="mt-4 space-y-0">{['New lead','Follow up','Qualified','Converted'].map((stage,index)=>{const status=String(lead.leadStatus||'').toLowerCase();const active=lead.isConverted?3:/qualif/.test(status)?2:/follow|contact|warm|hot/.test(status)?1:0;return <div key={stage} className="relative flex gap-3 pb-5 last:pb-0"><span className={cn('relative z-10 grid h-5 w-5 place-items-center rounded-full border-2 text-[9px]',index<active?'border-indigo-600 bg-indigo-600 text-white':index===active?'border-indigo-600 bg-background ring-4 ring-indigo-50':'border-border bg-muted')}>{index<active?'✓':''}</span>{index<3&&<span className={cn('absolute left-[9px] top-5 h-full w-0.5',index<active?'bg-indigo-600':'bg-border')}/>}<span className={cn('pt-0.5 text-xs font-semibold',index<=active?'text-foreground':'text-muted-foreground')}>{stage}</span></div>})}</div></div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Owner & source</p><div className="mt-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">{String(lead.ownerName||currentUser?.name||'AU').split(/\s+/).map((v:string)=>v[0]).join('').slice(0,2).toUpperCase()}</span><div><p className="text-sm font-semibold">{lead.ownerName||currentUser?.name||'Admin User'}</p><p className="text-xs text-muted-foreground">Lead owner</p></div></div></div>
        </aside>

      <Card className="min-w-0 overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <TabsRoot value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto border-b px-2 pt-3 sm:px-6 sm:pt-4">
              <TabsList className="border-b-0 min-w-max">
                {TABS.map((tab, i) => {
                  const Icon = TAB_ICONS[tab]
                  return (
                    <TabsTrigger key={tab} value={tab} className={TAB_ACTIVE_COLORS[i % TAB_ACTIVE_COLORS.length]}>
                      {Icon && <Icon size={14} className="mr-1.5" />}{tab}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Summary */}
            <TabsContent value="Summary" className="px-3 py-4 sm:px-6 sm:py-6">
              {/* Header card */}
              <div className="hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30 sm:h-20 sm:w-20 sm:text-2xl">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Lead summary</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {lead.title ? `${lead.title} · ` : ''}{lead.company || 'No company'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.leadStatus && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{lead.leadStatus}</span>
                    )}
                    {lead.leadSource && (
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{lead.leadSource}</span>
                    )}
                    {lead.industry && (
                      <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">{lead.industry}</span>
                    )}
                  </div>
                </div>
                <div className="grid w-full gap-2 text-sm sm:w-auto sm:min-w-[240px]">
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-foreground transition-colors hover:bg-muted">
                      <Mail size={14} className="text-blue-500" /> <span className="max-w-[220px] truncate">{lead.email}</span>
                    </a>
                  )}
                  {(lead.phone || lead.mobile) && (
                    <a href={`tel:${lead.phone || lead.mobile}`} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-foreground transition-colors hover:bg-muted">
                      <Phone size={14} className="text-emerald-500" /> {lead.phone || lead.mobile}
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-foreground transition-colors hover:bg-muted">
                      <Globe size={14} className="text-violet-500" /> <span className="max-w-[220px] truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {!lead.email && !lead.phone && !lead.mobile && !lead.website && (
                    <span className="text-xs text-muted-foreground">No contact details</span>
                  )}
                </div>
                </div>
                <div className="grid grid-cols-2 divide-x border-t bg-slate-50/80 dark:bg-slate-900/60 sm:grid-cols-4">
                  <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lead No.</p><p className="mt-0.5 truncate text-sm font-semibold">{lead.leadNo || '—'}</p></div>
                  <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p><p className="mt-0.5 truncate text-sm font-semibold text-blue-600 dark:text-blue-400">{lead.leadStatus || 'Not set'}</p></div>
                  <div className="border-t px-4 py-3 sm:border-t-0"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source</p><p className="mt-0.5 truncate text-sm font-semibold">{lead.leadSource || '—'}</p></div>
                  <div className="border-t px-4 py-3 sm:border-t-0"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating</p><p className="mt-0.5 truncate text-sm font-semibold">{lead.rating || '—'}</p></div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-xl bg-muted/60 p-4"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Days in pipeline</p><p className="mt-2 text-xl font-bold">{daysInPipeline}</p><p className="mt-1 text-[11px] text-muted-foreground">since this lead was created</p></div>
                <div className="rounded-xl bg-muted/60 p-4"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Touchpoints</p><p className="mt-2 text-xl font-bold">{activitiesData?.data?.length || 0}</p><p className="mt-1 text-[11px] text-muted-foreground">logged activities</p></div>
                <div className="rounded-xl bg-muted/60 p-4"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Comments</p><p className="mt-2 text-xl font-bold">{commentsData?.data?.length || 0}</p><p className="mt-1 text-[11px] text-muted-foreground">internal team notes</p></div>
                <div className="rounded-xl bg-muted/60 p-4"><p className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Lead score</p><p className="mt-2 text-xl font-bold">{leadScore ? leadScore.toFixed(1) : '—'}</p><p className="mt-1 text-[11px] text-muted-foreground">qualification strength</p></div>
              </div>

              {/* Information (inline editable) */}
              <h3 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                <Users size={15} className="text-muted-foreground" /> Information
                <span className="hidden text-xs font-normal text-muted-foreground sm:inline">— hover a field and click the pencil to edit</span>
              </h3>
              <div className="grid grid-cols-1 gap-x-6 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                {summaryInfoFields.map(f => (
                  <InlineField
                    key={f.name}
                    label={f.label}
                    name={f.name}
                    value={lead[f.name]}
                    type={f.type}
                    options={f.options}
                    onSave={(name, value) => inlineSaveMutation.mutate({ name, value })}
                    saving={inlineSaveMutation.isPending}
                  />
                ))}
              </div>

              {/* Recent activities + comments */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                    <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-blue-500" /> Recent Activities</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setActiveTab('Activities')}>View all <ChevronRight size={13} /></Button>
                  </h3>
                  {recentActivities.length ? (
                    <ul className="space-y-3">
                      {recentActivities.map(a => (
                        <li key={a.id} className="flex items-start gap-3">
                          <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full',
                            a.activityType === 'Call' ? 'bg-emerald-500' : a.activityType === 'Meeting' ? 'bg-purple-500' : 'bg-blue-500')} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{a.subject}</span>
                              <TypeBadge type={a.activityType} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <Clock size={11} className="inline mr-1" />{fmtDate(a.startAt || a.dueAt)}
                            </p>
                          </div>
                          <StatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No activities yet.</p>
                  )}
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                    <span className="inline-flex items-center gap-2"><MessageSquare size={15} className="text-violet-500" /> Recent Comments</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setActiveTab('Comments')}>View all <ChevronRight size={13} /></Button>
                  </h3>
                  {recentComments.length ? (
                    <ul className="space-y-3">
                      {recentComments.map(c => (
                        <li key={c.id} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users size={11} />
                            <span className="font-semibold text-foreground">{c.userName || 'User'}</span>
                            <span>·</span>
                            <span>{fmtDate(c.createdAt)}</span>
                            {c.isPrivate && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Private</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.comment}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Details */}
            <TabsContent value="Details" className="px-3 py-4 sm:px-6 sm:py-6">
              <div className="space-y-3">
                {DETAIL_GROUPS.map(g => (
                  <DetailGroup
                    key={g.title}
                    title={g.title}
                    icon={g.icon}
                    open={!collapsedSections[g.title]}
                    onToggle={() => setCollapsedSections(prev => ({ ...prev, [g.title]: !prev[g.title] }))}
                  >
                    {g.fields.map(f => {
                      const value = f === 'assignedTo' ? (lead.ownerName || lead.assignedTo)
                        : f === 'createdBy' ? (lead.createdByName || lead.createdBy)
                        : lead[f]
                      return <FieldRow key={f} label={getFieldLabel(f)} value={formatFieldValue(value, f)} />
                    })}
                  </DetailGroup>
                ))}
              </div>
            </TabsContent>

            {/* Updates */}
            <TabsContent value="Updates" className="px-6 py-6">
              {updatesData?.data?.length ? (
                <ul className="relative border-l border-border space-y-6 pl-6">
                  {updatesData.data.map((u: any) => (
                    <li key={u.id} className="relative">
                      <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-background" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{u.userName || 'System'}</span>
                        <span>{u.action}</span>
                        <span>·</span>
                        <span>{fmtDate(u.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{u.newValue || u.oldValue || '-'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              )}
            </TabsContent>

            {/* Activities */}
            <TabsContent value="Activities" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Activities</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => { setEditingActivity(null); setActForm({ ...emptyActivity(), activityType: 'Event', status: 'Planned' }); setActivityOpen(true) }}>
                    <Plus size={14} /> Add Event
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditingActivity(null); setActForm({ ...emptyActivity(), activityType: 'Task', status: 'Not Started' }); setActivityOpen(true) }}>
                    <Plus size={14} /> Add Task
                  </Button>
                </div>
              </div>
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                {(['Events', 'Tasks'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActivityFilter(f)}
                    className={cn('rounded-md px-4 py-1.5 text-xs font-semibold transition-colors', activityFilter === f ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200')}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <DataTable
                columns={activityColumns}
                data={(activitiesData?.data || []).filter((a: any) => activityFilter === 'Events' ? a.activityType !== 'Task' : a.activityType === 'Task') as any[]}
                loading={activitiesLoading}
                emptyMessage={activityFilter === 'Events' ? 'No events scheduled for this lead. Click "Add Event" to schedule one.' : 'No tasks scheduled for this lead. Click "Add Task" to create one.'}
                hidePagination
                actions={(a: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'activity', row: a })}
                    onEdit={() => openActivityDialog(a)}
                    onDelete={() => setDeleteActivityId(a.id)}
                  />
                )}
              />
            </TabsContent>

            {/* Emails */}
            <TabsContent value="Emails" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Emails</h3>
                <Button size="sm" onClick={() => { setEmailForm((f: any) => ({ ...f, to: lead.email || '' })); setEmailOpen(true) }}>
                  <Mail size={14} /> Compose
                </Button>
              </div>
              <DataTable
                columns={emailColumns}
                data={(emailsData?.data || []) as any[]}
                emptyMessage="No emails found for this lead."
                hidePagination
                actions={(e: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'email', row: e })}
                    onEdit={() => { setEmailForm((f: any) => ({ ...f, to: e.toEmails || lead.email || '', subject: e.subject || '' })); setEmailOpen(true) }}
                  />
                )}
              />
            </TabsContent>

            {/* Documents */}
            <TabsContent value="Documents" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Documents</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setDocSearch(''); setSelectedDocIds(new Set()); setDocSelectOpen(true) }}>
                    <Paperclip size={14} /> Select Document
                  </Button>
                  <Button size="sm" onClick={() => setDocOpen(true)}>
                    <Plus size={14} /> Add Document
                  </Button>
                </div>
              </div>
              <DataTable
                columns={documentColumns}
                data={(docsData?.data || []) as any[]}
                emptyMessage="No documents attached to this lead."
                hidePagination
                actions={(d: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'document', row: d })}
                    onDelete={() => setDeleteDocLinkId(d.id)}
                  />
                )}
              />
            </TabsContent>

            {/* Products */}
            <TabsContent value="Products" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Products</h3>
                <Button size="sm" onClick={() => { setProductSelectSearch(''); setSelectedProducts({}); setProductSelectOpen(true) }}>
                  <Plus size={14} /> Select Product
                </Button>
              </div>
              <DataTable
                columns={productColumns}
                data={(productsData?.data || []) as any[]}
                emptyMessage="No products linked to this lead yet. Click 'Select Product' to add products."
                hidePagination
                actions={(p: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'product', row: p })}
                    onEdit={() => setEditingProduct(p)}
                    onDelete={() => setDeleteProductId(p.id)}
                  />
                )}
              />
            </TabsContent>

            {/* Campaigns */}
            <TabsContent value="Campaigns" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Campaigns</h3>
                <Button size="sm" onClick={() => { setCampaignSearch(''); setCampaignSelectOpen(true) }}>
                  <Plus size={14} /> Select Campaign
                </Button>
              </div>
              <DataTable
                columns={campaignColumns}
                data={(campaignsData?.data || []) as any[]}
                emptyMessage="No campaign associated with this lead."
                hidePagination
                onRowClick={(c: any) => navigate(`/campaigns/${c.id}`)}
                actions={(c: any) => (
                  <RowActions
                    onView={() => navigate(`/campaigns/${c.id}`)}
                    onEdit={() => { setCampaignSearch(''); setCampaignSelectOpen(true) }}
                    onDelete={() => setCampaignMutation.mutate(null)}
                  />
                )}
              />
            </TabsContent>

            {/* Services */}
            <TabsContent value="Services" className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Services</h3>
                <Button size="sm" onClick={() => { setServiceSelectSearch(''); setSelectedServices({}); setServiceSelectOpen(true) }}>
                  <Plus size={14} /> Select Service
                </Button>
              </div>
              <DataTable
                columns={serviceColumns}
                data={(servicesData?.data || []) as any[]}
                emptyMessage="No services linked to this lead yet. Click 'Select Service' to add services."
                hidePagination
                actions={(s: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'service', row: s })}
                    onEdit={() => setEditingService(s)}
                    onDelete={() => setDeleteServiceId(s.id)}
                  />
                )}
              />
            </TabsContent>

            {/* PBX Manager */}
            <TabsContent value="PBX Manager" className="px-6 py-6">
              <PbxManagerPanel lead={lead} />
            </TabsContent>

            {/* Comments */}
            <TabsContent value="Comments" className="px-6 py-6">
              <div className="rounded-lg border bg-card p-4 mb-6">
                <textarea
                  className={textareaCls}
                  rows={3}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={commentPrivate} onChange={e => setCommentPrivate(e.target.checked)} className="h-4 w-4 rounded border-input" />
                    Private (only visible to owner & admins)
                  </label>
                  <Button size="sm" disabled={!commentText.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                    {commentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Add Comment
                  </Button>
                </div>
              </div>
              <DataTable
                columns={[
                  {
                    key: 'comment', label: 'Comment', sortable: true,
                    render: (_: any, c: any) => (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[10px] font-bold text-white">
                            {((c.userName || '?').trim()[0] || '?').toUpperCase()}
                          </span>
                          <span className="font-semibold text-foreground">{c.userName || 'User'}</span>
                          <span>·</span>
                          <span>{fmtDate(c.createdAt)}</span>
                          {c.isPrivate && (
                            <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-medium">Private</span>
                          )}
                        </div>
                        <p className="text-sm mt-1.5 whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    ),
                  },
                ]}
                data={(commentsData?.data || []) as any[]}
                emptyMessage="No comments yet. Start the conversation above."
                hidePagination
                actions={(c: any) => (
                  <RowActions
                    onView={() => setViewRow({ type: 'comment', row: c })}
                    onDelete={() => setDeleteCommentId(c.id)}
                  />
                )}
              />
            </TabsContent>
          </TabsRoot>
        </CardContent>
      </Card>
      </div>

      {/* Activity dialog (vTiger-style: separate Event and Task forms) */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? (actForm.activityType === 'Task' ? 'Edit Task' : 'Edit Event') : (actForm.activityType === 'Task' ? 'Add Task' : 'Add Event')}</DialogTitle>
            <DialogDescription>
              {actForm.activityType === 'Task'
                ? 'Tasks are to-do items with a due date that must be completed by the assigned user.'
                : 'Events are time-blocked items (calls, meetings) scheduled on the calendar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Subject *</label>
              <Input value={actForm.subject} onChange={e => setActForm({ ...actForm, subject: e.target.value })} placeholder={actForm.activityType === 'Task' ? 'Task subject' : 'Event subject'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
                <Select value={actForm.status} onValueChange={v => setActForm({ ...actForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{activityStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Assigned To</label>
                <UserRoleSelect value={actForm.assignedTo || ''} users={users} onSelect={v => setActForm({ ...actForm, assignedTo: v })} placeholder="Search users or groups..." />
              </div>
            </div>
            {actForm.activityType === 'Task' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Priority</label>
                    <Select value={actForm.priority} onValueChange={v => setActForm({ ...actForm, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Due Date *</label>
                    <DateTimeField value={actForm.dueAt} onChange={v => setActForm({ ...actForm, dueAt: v })} className="[color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Location</label>
                  <Input value={actForm.location} onChange={e => setActForm({ ...actForm, location: e.target.value })} placeholder="e.g. Office, Phone" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Start Date *</label>
                    <DateTimeField value={actForm.startAt} onChange={v => setActForm({ ...actForm, startAt: v })} className="[color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">End Date *</label>
                    <DateTimeField value={actForm.endAt} onChange={v => setActForm({ ...actForm, endAt: v })} className="[color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
              <textarea className={textareaCls} rows={3} value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActivityOpen(false)}>Cancel</Button>
            <Button
              disabled={!actForm.subject.trim() || activityMutation.isPending}
              onClick={() => activityMutation.mutate({
                subject: actForm.subject,
                activityType: actForm.activityType,
                status: actForm.status,
                priority: actForm.priority,
                location: actForm.location || null,
                assignedTo: actForm.assignedTo || null,
                startAt: actForm.startAt ? new Date(actForm.startAt).toISOString() : null,
                endAt: actForm.endAt ? new Date(actForm.endAt).toISOString() : null,
                dueAt: actForm.dueAt ? new Date(actForm.dueAt).toISOString() : null,
                description: actForm.description || null,
              })}
            >
              {activityMutation.isPending && <Loader2 size={15} className="animate-spin" />}
              {editingActivity ? 'Save Changes' : (actForm.activityType === 'Task' ? 'Create Task' : 'Create Event')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>Compose an email for {fullName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">To *</label>
              <Input value={emailForm.to} onChange={e => setEmailForm({ ...emailForm, to: e.target.value })} placeholder="recipient@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">CC</label>
                <Input value={emailForm.cc} onChange={e => setEmailForm({ ...emailForm, cc: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">BCC</label>
                <Input value={emailForm.bcc} onChange={e => setEmailForm({ ...emailForm, bcc: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Subject *</label>
              <Input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })} placeholder="Subject" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Body</label>
              <textarea className={textareaCls} rows={6} value={emailForm.body} onChange={e => setEmailForm({ ...emailForm, body: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button
              disabled={!emailForm.subject.trim() || !emailForm.to.trim() || emailMutation.isPending}
              onClick={() => emailMutation.mutate()}
            >
              {emailMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Attach a document or note to this lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Title *</label>
              <Input value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} placeholder="Document title" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">File</label>
              <Input type="file" onChange={e => setDocForm({ ...docForm, file: e.target.files?.[0] || null })} />
              <p className="text-xs text-muted-foreground mt-1">Optional — attach a file or just add a note.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Note</label>
              <textarea className={textareaCls} rows={4} value={docForm.noteContent} onChange={e => setDocForm({ ...docForm, noteContent: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDocOpen(false)}>Cancel</Button>
            <Button
              disabled={!docForm.title.trim() || docMutation.isPending}
              onClick={() => docMutation.mutate()}
            >
              {docMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />} Add Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert Lead</DialogTitle>
            <DialogDescription>
              This will create records from "{fullName}" ({lead.company}) according to your conversion mapping.
            </DialogDescription>
          </DialogHeader>
          {convInfo ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Will be created:</p>
                {convModules.account && <p>• Account: {convInfo.potentialInfo.potentialName || lead.company}</p>}
                {convModules.contact && <p>• Contact: {fullName}</p>}
                {convModules.potential && <p>• Opportunity: {convForm?.potentialName || lead.company}</p>}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {([
                  { key: 'account' as const, label: 'Account', hint: 'Convert to an Account' },
                  { key: 'contact' as const, label: 'Contact', hint: 'Convert to a Contact' },
                  { key: 'potential' as const, label: 'Opportunity', hint: 'Convert to an Opportunity' },
                ]).map(opt => (
                  <div key={opt.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.hint}</p>
                    </div>
                    <Switch checked={convModules[opt.key]} onCheckedChange={v => setConvModules(m => ({ ...m, [opt.key]: v }))} />
                  </div>
                ))}
              </div>
              {!convAnySelected && <p className="text-xs text-destructive">Select at least one record type to create.</p>}
              {convModules.potential && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Opportunity Name *</label>
                    <Input value={convForm?.potentialName || ''} onChange={e => setConvForm({ ...convForm, potentialName: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Amount</label>
                      <Input type="number" value={convForm?.amount ?? ''} onChange={e => setConvForm({ ...convForm, amount: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Closing Date</label>
                      <DateField value={convForm?.closingDate ? String(convForm.closingDate).slice(0, 10) : ''} onChange={v => setConvForm({ ...convForm, closingDate: v })} className="[color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Stage</label>
                      <Select
                        value={convForm?.stage || '-- None --'}
                        onValueChange={v => {
                          const stage = v === '-- None --' ? null : v
                          const prob = stage && stageProbability[stage] != null ? stageProbability[stage] : convForm?.probability
                          setConvForm({ ...convForm, stage: v, probability: convForm?.probability == null || convForm?.probability === '' ? prob : convForm?.probability })
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Probability (%)</label>
                      <Input type="number" min={0} max={100} value={convForm?.probability ?? ''} onChange={e => setConvForm({ ...convForm, probability: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Next Step</label>
                    <Input value={convForm?.nextStep || ''} onChange={e => setConvForm({ ...convForm, nextStep: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button
              disabled={!convAnySelected || (convModules.potential && !convForm?.potentialName?.trim()) || convertMutation.isPending}
              onClick={() => convertMutation.mutate()}
            >
              {convertMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />} Convert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <DetailDialog
        open={!!viewRow}
        onOpenChange={(o) => { if (!o) setViewRow(null) }}
        title={
          viewRow?.type === 'activity' ? 'Activity Details'
            : viewRow?.type === 'email' ? 'Email Details'
            : viewRow?.type === 'document' ? 'Document Details'
            : viewRow?.type === 'product' ? 'Product Details'
            : viewRow?.type === 'service' ? 'Service Details'
            : 'Comment Details'
        }
        rows={viewRow ? buildViewRows(viewRow, fullName) : []}
      />

      {/* Delete dialogs */}
      <ConfirmDialog
        open={!!deleteActivityId}
        onOpenChange={(o) => { if (!o) setDeleteActivityId(null) }}
        onConfirm={() => { if (deleteActivityId) deleteActivityMutation.mutate(deleteActivityId) }}
        title="Delete Activity"
        description="Are you sure you want to delete this activity?"
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={!!deleteDocLinkId}
        onOpenChange={(o) => { if (!o) setDeleteDocLinkId(null) }}
        onConfirm={() => { if (deleteDocLinkId) unlinkDocMutation.mutate(deleteDocLinkId) }}
        title="Unlink Document"
        description="Are you sure you want to remove this document from the lead?"
        confirmLabel="Unlink"
      />
      <ConfirmDialog
        open={!!deleteCommentId}
        onOpenChange={(o) => { if (!o) setDeleteCommentId(null) }}
        onConfirm={() => { if (deleteCommentId) deleteCommentMutation.mutate(deleteCommentId) }}
        title="Delete Comment"
        description="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
      />

      {/* Product selection dialog (vTiger style) */}
      <Dialog open={productSelectOpen} onOpenChange={(o) => { if (!o) setProductSelectOpen(false) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package size={16} /> Select Products</DialogTitle>
            <DialogDescription>Search the product catalog and pick products to link to this lead.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={productSelectSearch}
              onChange={e => setProductSelectSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {(allProductsData?.data || []).map((p: any) => {
                  const checked = !!selectedProducts[p.id]
                  return (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer" onClick={() => toggleProductSelection(p)}>
                      <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleProductSelection(p)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">{p.productName}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{p.productCategory || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right">{p.unitPrice != null ? formatMoney(p.unitPrice) : '-'}</td>
                    </tr>
                  )
                })}
                {!allProductsData?.data?.length && (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">{productSelectSearch ? 'No products match your search.' : 'No products found in the catalog.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {Object.keys(selectedProducts).length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quantity, selling price & total</p>
              <div className="space-y-2">
                {Object.entries(selectedProducts).map(([pid, v]) => {
                  const p = (allProductsData?.data || []).find((x: any) => x.id === pid)
                  return (
                    <div key={pid} className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_2rem] items-center gap-2 text-sm max-sm:grid-cols-[minmax(0,1fr)_4.5rem_2rem]">
                      <span className="min-w-0 flex-1 truncate font-medium">{p?.productName || pid}</span>
                      <Input aria-label="Quantity" type="number" min={1} step="0.01" value={v.qty} onChange={e => setProductSelection(pid, { qty: Math.max(1, Number(e.target.value) || 1) })} className="h-8 w-full" placeholder="Qty" />
                      <Input aria-label="Selling price" type="number" min={0} step="0.01" value={v.listPrice} onChange={e => setProductSelection(pid, { listPrice: Math.max(0, Number(e.target.value) || 0) })} className="h-8 w-full max-sm:col-start-1 max-sm:row-start-2" placeholder="Price" />
                      <span className="text-right font-semibold tabular-nums max-sm:col-start-2 max-sm:row-start-2">{formatMoney(v.qty * v.listPrice)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => removeProductSelection(pid)} title="Remove">
                        <X size={14} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProductSelectOpen(false)}>Cancel</Button>
            <Button disabled={Object.keys(selectedProducts).length === 0 || linkProductsMutation.isPending} onClick={() => linkProductsMutation.mutate()}>
              {linkProductsMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Link Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit linked product dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(o) => { if (!o) setEditingProduct(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={16} /> Edit Linked Product</DialogTitle>
            <DialogDescription>Adjust the quantity and list price for {editingProduct?.productName}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Qty</label>
              <Input type="number" min={1} value={editingProduct?.qty ?? 1} onChange={e => setEditingProduct({ ...editingProduct, qty: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">List Price</label>
              <Input type="number" min={0} step="0.01" value={editingProduct?.listPrice ?? editingProduct?.unitPrice ?? 0} onChange={e => setEditingProduct({ ...editingProduct, listPrice: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button disabled={updateLinkedProductMutation.isPending} onClick={() => updateLinkedProductMutation.mutate({ qty: editingProduct?.qty ?? 1, listPrice: editingProduct?.listPrice ?? editingProduct?.unitPrice ?? 0 })}>
              {updateLinkedProductMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProductId}
        onOpenChange={(o) => { if (!o) setDeleteProductId(null) }}
        onConfirm={() => { if (deleteProductId) unlinkProductMutation.mutate(deleteProductId) }}
        title="Unlink Product"
        description="Are you sure you want to remove this product from the lead?"
        confirmLabel="Unlink"
      />

      {/* Service selection dialog */}
      <Dialog open={serviceSelectOpen} onOpenChange={(o) => { if (!o) setServiceSelectOpen(false) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wrench size={16} /> Select Services</DialogTitle>
            <DialogDescription>Search the service catalog and pick services to link to this lead.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={serviceSelectSearch}
              onChange={e => setServiceSelectSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {(allServicesData?.data || []).map((s: any) => {
                  const checked = !!selectedServices[s.id]
                  return (
                    <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer" onClick={() => toggleServiceSelection(s)}>
                      <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleServiceSelection(s)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">{s.serviceName}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{s.serviceCategory || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right">{s.unitPrice != null ? `$${Number(s.unitPrice).toLocaleString()}` : '-'}</td>
                    </tr>
                  )
                })}
                {!allServicesData?.data?.length && (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">{serviceSelectSearch ? 'No services match your search.' : 'No services found in the catalog.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {Object.keys(selectedServices).length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quantity & List Price</p>
              <div className="space-y-2">
                {Object.entries(selectedServices).map(([sid, v]) => {
                  const s = (allServicesData?.data || []).find((x: any) => x.id === sid)
                  return (
                    <div key={sid} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium">{s?.serviceName || sid}</span>
                      <Input type="number" min={1} value={v.qty} onChange={e => setServiceSelection(sid, { qty: Math.max(1, Number(e.target.value) || 1) })} className="h-8 w-20" placeholder="Qty" />
                      <Input type="number" min={0} step="0.01" value={v.listPrice} onChange={e => setServiceSelection(sid, { listPrice: Number(e.target.value) || 0 })} className="h-8 w-28" placeholder="List Price" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => removeServiceSelection(sid)} title="Remove">
                        <X size={14} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setServiceSelectOpen(false)}>Cancel</Button>
            <Button disabled={Object.keys(selectedServices).length === 0 || linkServicesMutation.isPending} onClick={() => linkServicesMutation.mutate()}>
              {linkServicesMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Link Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit linked service dialog */}
      <Dialog open={!!editingService} onOpenChange={(o) => { if (!o) setEditingService(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={16} /> Edit Linked Service</DialogTitle>
            <DialogDescription>Adjust the quantity and list price for {editingService?.serviceName}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Qty</label>
              <Input type="number" min={1} value={editingService?.qty ?? 1} onChange={e => setEditingService({ ...editingService, qty: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">List Price</label>
              <Input type="number" min={0} step="0.01" value={editingService?.listPrice ?? editingService?.unitPrice ?? 0} onChange={e => setEditingService({ ...editingService, listPrice: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
            <Button disabled={updateLinkedServiceMutation.isPending} onClick={() => updateLinkedServiceMutation.mutate({ qty: editingService?.qty ?? 1, listPrice: editingService?.listPrice ?? editingService?.unitPrice ?? 0 })}>
              {updateLinkedServiceMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={(o) => { if (!o) setDeleteServiceId(null) }}
        onConfirm={() => { if (deleteServiceId) unlinkServiceMutation.mutate(deleteServiceId) }}
        title="Unlink Service"
        description="Are you sure you want to remove this service from the lead?"
        confirmLabel="Unlink"
      />

      {/* Campaign selection dialog */}
      <Dialog open={campaignSelectOpen} onOpenChange={(o) => { if (!o) setCampaignSelectOpen(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Megaphone size={16} /> Select Campaign</DialogTitle>
            <DialogDescription>Choose a campaign to associate with this lead.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={campaignSearch}
              onChange={e => setCampaignSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <th className="px-3 py-2">Campaign</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(allCampaignsData?.data || []).map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer" onClick={() => setCampaignMutation.mutate(c.id)}>
                    <td className="px-3 py-2 text-sm font-medium">{c.campaignName}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{c.campaignType || '-'}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{c.status || '-'}</td>
                  </tr>
                ))}
                {!allCampaignsData?.data?.length && (
                  <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-muted-foreground">{campaignSearch ? 'No campaigns match your search.' : 'No campaigns found.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setCampaignSelectOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document selection dialog */}
      <Dialog open={docSelectOpen} onOpenChange={(o) => { if (!o) setDocSelectOpen(false) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText size={16} /> Select Documents</DialogTitle>
            <DialogDescription>Pick documents from the library to attach to this lead.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(allDocsData?.data || []).filter((d: any) => !(d.parentModule === 'leads' && d.parentId === id)).map((d: any) => {
                  const checked = selectedDocIds.has(d.id)
                  return (
                    <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer" onClick={() => toggleDocSelection(d.id)}>
                      <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleDocSelection(d.id)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">{d.title}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{d.fileType || '-'}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{d.fileStatus || 'Active'}</td>
                    </tr>
                  )
                })}
                {(allDocsData?.data || []).filter((d: any) => !(d.parentModule === 'leads' && d.parentId === id)).length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">{docSearch ? 'No documents match your search.' : 'No documents in the library.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDocSelectOpen(false)}>Cancel</Button>
            <Button disabled={selectedDocIds.size === 0 || linkDocsMutation.isPending} onClick={() => linkDocsMutation.mutate()}>
              {linkDocsMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Link Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function buildViewRows(v: { type: 'activity' | 'email' | 'document' | 'comment' | 'product' | 'service'; row: any }, fullName: string) {
  if (v.type === 'activity') {
    const a = v.row
    return [
      { label: 'Subject', value: a.subject || '-' },
      { label: 'Type', value: a.activityType || '-' },
      { label: 'Status', value: a.status || '-' },
      { label: 'Priority', value: a.priority || '-' },
      { label: 'Location', value: a.location || '-' },
      { label: 'Start', value: fmtDate(a.startAt) },
      { label: 'End', value: fmtDate(a.endAt) },
      { label: 'Due', value: fmtDate(a.dueAt) },
      { label: 'Owner', value: a.ownerName || '-' },
      { label: 'Description', value: a.description || '-', full: true },
    ]
  }
  if (v.type === 'email') {
    const e = v.row
    return [
      { label: 'Subject', value: e.subject || '(no subject)' },
      { label: 'From', value: e.fromEmail || '-' },
      { label: 'To', value: e.toEmails || '-' },
      { label: 'CC', value: e.ccEmails || '-' },
      { label: 'BCC', value: e.bccEmails || '-' },
      { label: 'Date', value: fmtDate(e.createdAt) },
      { label: 'Body', value: e.body ? <div className="max-h-56 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: e.body }} /> : '-', full: true },
    ]
  }
  if (v.type === 'document') {
    const d = v.row
    return [
      { label: 'Title', value: d.title || '-' },
      { label: 'File', value: d.filePath ? <a className="text-primary underline underline-offset-2" href={publicUrl(d.filePath.startsWith('/') ? d.filePath : `/uploads/${d.filePath}`)} target="_blank" rel="noreferrer"><Paperclip size={12} className="inline mr-1" />{d.fileName || 'Open'}</a> : (d.fileName || '-') },
      { label: 'Type', value: d.fileType || '-' },
      { label: 'Status', value: d.fileStatus || 'Active' },
      { label: 'Owner', value: d.userName || '-' },
      { label: 'Added', value: fmtDateOnly(d.createdAt) },
      { label: 'Note', value: d.noteContent || '-', full: true },
    ]
  }
  if (v.type === 'product') {
    const p = v.row
    return [
      { label: 'Product', value: p.productName || '-' },
      { label: 'Category', value: p.productCategory || '-' },
      { label: 'Qty', value: p.qty ?? 1 },
      { label: 'List Price', value: p.listPrice != null ? `$${Number(p.listPrice).toLocaleString()}` : '-' },
      { label: 'Unit Price', value: p.unitPrice != null ? `$${Number(p.unitPrice).toLocaleString()}` : '-' },
      { label: 'Product No', value: p.productNo || '-' },
      { label: 'Manufacturer', value: p.manufacturer || '-' },
      { label: 'Stock', value: p.qtyInStock ?? '-' },
      { label: 'Description', value: p.description || '-', full: true },
    ]
  }
  if (v.type === 'service') {
    const s = v.row
    return [
      { label: 'Service', value: s.serviceName || '-' },
      { label: 'Category', value: s.serviceCategory || '-' },
      { label: 'Qty', value: s.qty ?? 1 },
      { label: 'List Price', value: s.listPrice != null ? `$${Number(s.listPrice).toLocaleString()}` : '-' },
      { label: 'Unit Price', value: s.unitPrice != null ? `$${Number(s.unitPrice).toLocaleString()}` : '-' },
      { label: 'Service No', value: s.serviceNo || '-' },
      { label: 'Usage Unit', value: s.usageUnit || '-' },
      { label: 'Description', value: s.description || '-', full: true },
    ]
  }
  const c = v.row
  return [
    { label: 'Author', value: c.userName || 'User' },
    { label: 'Date', value: fmtDate(c.createdAt) },
    { label: 'Visibility', value: c.isPrivate ? 'Private' : 'Public' },
    { label: 'Comment', value: c.comment || '-', full: true },
  ]
}
