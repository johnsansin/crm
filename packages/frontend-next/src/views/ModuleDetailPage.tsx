'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from '@/lib/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getFieldTabs, getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { useOrgSettings, formatMoney, formatDate, formatDateTime, formatTime } from '@/lib/org-format'
import { ProjectSearchSelect } from '@/components/project-search-select'
import { UserRoleSelect, userDisplayName } from '@/components/user-role-select'
import { SearchSelect } from '@/components/search-select'
import { VendorSearchSelect } from '@/components/vendor-search-select'
import { AccountSearchSelect } from '@/components/account-search-select'
import { ContactSearchSelect } from '@/components/contact-search-select'
import { ProductSearchSelect } from '@/components/product-search-select'
import { DateField } from '@/components/ui/date-field'
import { ArrowLeft, ArrowRight, Save, Loader2, Trash2, Pencil, ChevronRight, Asterisk, ImagePlus, Plus, Package, History, GitMerge, Star, Clock, AlertTriangle, CheckCircle2, Users, DollarSign, Shield, Calendar, UserCheck, Percent, Target, Zap, AlertCircle, Timer, CircleDollarSign, MapPin, Building2, Activity as ActivityIcon, FileText, Wrench, X, Sparkles, ExternalLink, User, Building } from 'lucide-react'
import { MergeRecordsDialog, MERGEABLE_MODULES } from '@/components/merge-records-dialog'
import { fieldConfigs } from '@/lib/module-fields'
import { t } from '@/lib/i18n'
import { RecordTags } from '@/components/record-tags'
import { useAuthStore } from '@/lib/auth'
import { appBasePath } from '@/lib/base-path'

const labelMap: Record<string, string> = {
  accounts: 'Account', contacts: 'Contact', leads: 'Lead',
  potentials: 'Opportunity', campaigns: 'Campaign',
  products: 'Product', services: 'Service', vendors: 'Vendor',
  pricebooks: 'Price Book', quotes: 'Quote',
  salesorders: 'Sales Order', purchaseorders: 'Purchase Order',
  invoices: 'Invoice', tickets: 'Ticket', faq: 'FAQ',
  documents: 'Document', emails: 'Email',
  emailtemplates: 'Email Template', projects: 'Project',
  projecttasks: 'Project Task', projectmilestones: 'Project Milestone',
  assets: 'Asset', servicecontracts: 'Service Contract',
  smsnotifier: 'SMS Notifier', receipts: 'Receipt', payments: 'Payment',
}

const TAB_DOT_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
const TAB_ACTIVE_COLORS = [
  'data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
  'data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400',
  'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400',
  'data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
  'data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400',
]

const SELECT_OPTIONS: Record<string, Record<string, string[]>> = {
  accounts: {
    rating: ['--None--','Hot','Warm','Cold','Acquired','Active','Inactive'],
    interest: ['--None--','Buying signals','Product details','Quotation negotiation','Requested Sample','Specification','Support','Other'],
    industry: ['--None--','Apparel','Banking','Biotechnology','Chemicals','Communications','Construction','Consulting','Education','Electronics','Energy','Engineering','Entertainment','Environmental','Finance','Food & Beverage','Government','Healthcare','Hospitality','Insurance','Machinery','Manufacturing','Media','Not For Profit','Other','Recreation','Retail','Shipping','Technology','Telecommunications','Transportation','Utilities'],
    accountType: ['--None--','Analyst','Competitor','Customer','Integrator','Investor','Partner','Press','Prospect','Reseller','Other'],
    ownership: ['--None--','Private','Public'],
    rating: ['--None--','Acquired','Active','Market Failed','Project Cancelled','Shutdown'],
  },
  contacts: {
    salutation: ['--None--','Mr.','Ms.','Mrs.','Dr.','Prof.'],
    leadSource: ['--None--','Cold Call','Existing Customer','Self Generated','Employee','Partner','Public Relations','Direct Mail','Conference','Trade Show','Web Site','Word of mouth','Other'],
  },
  leads: {
    leadStatus: ['--None--','Attempted to Contact','Cold','Contact in Future','Contacted','Hot','Junk Lead','Lost Lead','Not Contacted','Pre Qualified','Qualified','Warm'],
    leadSource: ['--None--','Cold Call','Existing Customer','Self Generated','Employee','Partner','Public Relations','Direct Mail','Conference','Trade Show','Web Site','Word of mouth','Other'],
    salutation: ['--None--','Mr.','Ms.','Mrs.','Dr.','Prof.'],
    rating: ['--None--','Hot','Warm','Cold','Acquired','Active','Inactive'],
    interest: ['--None--','Buying signals','Product details','Quotation negotiation','Requested Sample','Specification','Support','Other'],
    industry: ['--None--','Apparel','Banking','Biotechnology','Chemicals','Communications','Construction','Consulting','Education','Electronics','Energy','Engineering','Entertainment','Environmental','Finance','Food & Beverage','Government','Healthcare','Hospitality','Insurance','Machinery','Manufacturing','Media','Not For Profit','Other','Recreation','Retail','Shipping','Technology','Telecommunications','Transportation','Utilities'],
  },
  potentials: {
    stage: ['--None--','Prospecting','Qualification','Needs Analysis','Value Proposition','Id. Decision Makers','Perception Analysis','Proposal/Price Quote','Negotiation/Review','Closed Won','Closed Lost'],
    leadSource: ['--None--','Cold Call','Existing Customer','Self Generated','Employee','Partner','Public Relations','Direct Mail','Conference','Trade Show','Web Site','Word of mouth','Other'],
    type: ['--None--','Existing Business','New Business'],
    forecastCategory: ['--None--','Pipeline','Best Case','Commit','Closed','Omitted'],
  },
  campaigns: {
    campaignType: ['--None--','Conference','Webinar','Trade Show','Public Relations','Partners','Referral Program','Advertisement','Banner Ads','Direct Mail','Email','Telemarketing','Others'],
    status: ['--None--','Planning','Active','Inactive','Completed','Cancelled'],
  },
  tickets: {
    status: ['--None--','Open','In Progress','Wait For Response','Closed'],
    priority: ['--None--','Low','Normal','High','Urgent'],
    severity: ['--None--','Minor','Major','Feature','Critical'],
    category: ['--None--','Big Problem','Small Problem','Other Problem'],
  },
  projects: {
    status: ['--None--','Prospecting','Initiated','In Progress','Waiting for Feedback','On Hold','Completed','Delivered','Cancelled'],
    priority: ['--None--','Low','Normal','High','Urgent'],
    projectType: ['--None--','Internal','External','Research & Development','Training','Other'],
    budgetType: ['Fixed','Hourly','Retainer','Non-billable'],
    healthStatus: ['On Track','At Risk','Off Track'],
  },
  projecttasks: {
    status: ['--None--','Not Started','In Progress','Completed','Deferred','Waiting for Feedback'],
    priority: ['--None--','Low','Normal','High','Urgent'],
    projectTaskType: ['--None--','Development','Design','Testing','Documentation','Meeting','Administrative','Other'],
  },
  projectmilestones: {
    status: ['--None--','Not Started','In Progress','Completed','Deferred'],
    milestoneType: ['--None--','Internal','External','Milestone'],
  },
  invoices: {
    invoiceStatus: ['--None--','AutoCreated','Created','Approved','Sent','Credit Invoice','Paid'],
    taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'],
  },
  quotes: {
    quoteStage: ['--None--','Created','Delivered','Reviewed','Accepted','Rejected'],
    taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'],
    carrier: ['--None--','FedEx','UPS','USPS','DHL','BlueDart'],
  },
  salesorders: {
    soStatus: ['--None--','Created','Approved','Delivered','Cancelled'],
    taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'],
    carrier: ['--None--','FedEx','UPS','USPS','DHL','BlueDart'],
  },
  purchaseorders: {
    poStatus: ['--None--','Created','Approved','Delivered','Cancelled','Received Shipment'],
    taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'],
    carrier: ['--None--','FedEx','UPS','USPS','DHL','BlueDart'],
  },
  assets: { status: ['--None--','In Service','Out-of-service'] },
  servicecontracts: {
    contractType: ['--None--','Support','Service','Maintenance','SLA'],
    status: ['--None--','In Planning','In Progress','Active','On Hold','Completed','Cancelled'],
    priority: ['--None--','Low','Normal','High','Urgent'],
    trackingUnit: ['--None--','Hours','Days','Months','Years','Support Incidents'],
  },
  faq: { status: ['--None--','Draft','Reviewed','Published','Obsolete'], category: ['--None--','General'] },
  products: { productCategory: ['--None--','Hardware','Software','CRM Applications'], manufacturer: ['--None--','AltvetPet Inc.','LexPon Inc.','MetBeat Corp'], glAccount: ['--None--','2204 - Inventory','4100 - Sales','5100 - Cost of Goods Sold','300-Sales-Software','301-Sales-Hardware','305-Sales Other'], taxClass: ['--None--','SalesTax','Vat'], usageUnit: ['--None--','Box','Carton','Dozen','Each','Hours','Impressions','Lb','M','Pack','Pages','Pieces','Quantity','Reams','Sheet','Spiral Binder','Sq Ft'], commissionMethod: ['--None--','Fixed','Percentage'] },
  services: { serviceCategory: ['--None--','Consulting','Training','Support','Maintenance','Installation','Other'], usageUnit: ['--None--','Box','Carton','Dozen','Each','Hours','Impressions','Lb','M','Pack','Pages','Pieces','Quantity','Reams','Sheet','Spiral Binder','Sq Ft'], commissionMethod: ['--None--','Fixed','Percentage'] },
  vendors: { glAccount: ['--None--','300-Sales-Software','301-Sales-Hardware','302-Rental-Income','303-Interest-Income','304-Sales-Software-Support','305-Sales Other','306-Internet Sales','307-Service-Hardware Labor','308-Sales-Books'] },
  documents: { fileType: ['--None--','PDF','Document','Spreadsheet','Presentation','Image','Video','Audio','Archive','Other'], fileStatus: ['--None--','Active','Archived','Deleted'] },
  emails: { emailFlag: ['--None--','Sent','Received','Draft','Spam','Forwarded'] },
  smsnotifier: { status: ['--None--','Sent','Failed','Queued'] }
}


function InvoiceSelectField({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data } = useQuery({ queryKey: ['invoice-select-list'], queryFn: () => api.listAll('invoices') })
  const { data: accountsData } = useQuery({ queryKey: ['invoice-select-accounts'], queryFn: () => api.listAll('accounts') })
  const invoices: any[] = data?.data || []
  const accounts: any[] = accountsData?.data || []
  const getAccountName = (id: string) => accounts.find((a: any) => a.id === id)?.accountName || ''
  const enriched = invoices.map((inv: any) => ({ ...inv, _accountName: getAccountName(inv.accountId) }))
  const selected = enriched.find((i: any) => i.id === value)
  const balance = selected ? Number(selected.grandTotal || 0) - Number(selected.paidAmount || 0) : 0
  return (
    <div>
      <SearchSelect
        value={value}
        options={enriched.map((inv: any) => ({
          value: inv.id,
          label: `${inv.invoiceNo || 'No#'} — ${inv.subject || 'Invoice'}`,
          sub: `$${Number(inv.grandTotal || 0).toLocaleString()} | Balance: $${(Number(inv.grandTotal || 0) - Number(inv.paidAmount || 0)).toLocaleString()} | ${inv.invoiceStatus || 'Unknown'}${inv._accountName ? ' | ' + inv._accountName : ''}`,
        }))}
        onSelect={(v: string) => onChange(v)}
      />
      {selected && (
        <div className="mt-2 rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {selected.invoiceNo && <div><span className="text-muted-foreground">Invoice #:</span> <span className="font-medium">{selected.invoiceNo}</span></div>}
            {selected.subject && <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{selected.subject}</span></div>}
            {selected._accountName && <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{selected._accountName}</span></div>}
            <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selected.invoiceStatus || 'Unknown'}</span></div>
            <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">${Number(selected.grandTotal || 0).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-medium text-emerald-600">${Number(selected.paidAmount || 0).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Balance:</span> <span className={`font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>${balance.toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

function PurchaseOrderSelectField({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data } = useQuery({ queryKey: ['po-select-list'], queryFn: () => api.listAll('purchaseorders') })
  const { data: vendorsData } = useQuery({ queryKey: ['po-select-vendors'], queryFn: () => api.listAll('vendors') })
  const pos: any[] = data?.data || []
  const vendors: any[] = vendorsData?.data || []
  const getVendorName = (id: string) => vendors.find((v: any) => v.id === id)?.vendorName || ''
  const enriched = pos.map((po: any) => ({ ...po, _vendorName: getVendorName(po.vendorId) }))
  const selected = enriched.find((p: any) => p.id === value)
  const balance = selected ? Number(selected.grandTotal || 0) - Number(selected.paidAmount || 0) : 0
  return (
    <div>
      <SearchSelect
        value={value}
        options={enriched.map((po: any) => ({
          value: po.id,
          label: `${po.purchaseOrderNo || 'No#'} — ${po.subject || 'Purchase Order'}`,
          sub: `$${Number(po.grandTotal || 0).toLocaleString()} | Balance: $${(Number(po.grandTotal || 0) - Number(po.paidAmount || 0)).toLocaleString()} | ${po.poStatus || 'Unknown'}${po._vendorName ? ' | ' + po._vendorName : ''}`,
        }))}
        onSelect={(v: string) => onChange(v)}
      />
      {selected && (
        <div className="mt-2 rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {selected.purchaseOrderNo && <div><span className="text-muted-foreground">PO #:</span> <span className="font-medium">{selected.purchaseOrderNo}</span></div>}
            {selected.subject && <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{selected.subject}</span></div>}
            {selected._vendorName && <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{selected._vendorName}</span></div>}
            <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{selected.poStatus || 'Unknown'}</span></div>
            <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">${Number(selected.grandTotal || 0).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Paid:</span> <span className="font-medium text-emerald-600">${Number(selected.paidAmount || 0).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Balance:</span> <span className={`font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>${balance.toLocaleString()}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}


function formatDisplayValue(value: any, type: string, name?: string) {
  if (value == null || value === '') return '-'
  if (type === 'user-select' && name === 'assignedTo') return value
  if (type === 'checkbox') return value ? 'Yes' : 'No'
  return formatFieldValue(value, name || '')
}

export function ModuleDetailPage() {
  const { user } = useAuthStore()
  useOrgSettings()
  const { module, id } = useParams<{ module: string; id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const isNew = !id || id === 'new'
  const isEditMode = isNew || searchParams.get('edit') === 'true' || window.location.pathname.endsWith('/edit')
  const routePath = appBasePath && window.location.pathname.startsWith(appBasePath)
    ? window.location.pathname.slice(appBasePath.length)
    : window.location.pathname
  const mod = module || (routePath.split('/').filter(Boolean)[0] || '')

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [aiPrediction, setAiPrediction] = useState<any>(null)
  const [showAiPrediction, setShowAiPrediction] = useState(false)
  const [closeWonOpen, setCloseWonOpen] = useState(false)
  const [closeWonModules, setCloseWonModules] = useState({ createAccount: true, createContact: true })

  const { data: record, isLoading: loadingRecord } = useQuery({
    queryKey: [mod, id],
    queryFn: () => api.get(mod, id!),
    enabled: !isNew,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => api.listAll('projects'),
    enabled: mod === 'projectmilestones' || mod === 'projecttasks',
  })
  const projects = projectsData?.data || []
  const { data: milestoneOptionsData } = useQuery({
    queryKey: ['projectmilestones', 'task-options'],
    queryFn: () => api.listAll('projectmilestones'),
    enabled: mod === 'projecttasks',
  })
  const milestoneOptions = (milestoneOptionsData?.data || []).filter((item: any) => !formData.projectId || item.projectId === formData.projectId)
  const { data: taskOptionsData } = useQuery({
    queryKey: ['projecttasks', 'time-options'],
    queryFn: () => api.listAll('projecttasks'),
    enabled: mod === 'timeentries',
  })
  const taskOptions = (taskOptionsData?.data || []).filter((item: any) => !formData.projectId || item.projectId === formData.projectId)

  const { data: relatedTasks } = useQuery({
    queryKey: ['projects', id, 'tasks'],
    queryFn: () => api.listAll('projecttasks', { filter: JSON.stringify({ projectId: id }) }),
    enabled: mod === 'projects' && !isNew,
  })
  const { data: relatedMilestones } = useQuery({
    queryKey: ['projects', id, 'milestones'],
    queryFn: () => api.listAll('projectmilestones', { filter: JSON.stringify({ projectId: id }) }),
    enabled: mod === 'projects' && !isNew,
  })
  const relatedTaskList = relatedTasks?.data || []
  const relatedMilestoneList = relatedMilestones?.data || []
  const { data: relatedTimeEntries } = useQuery({
    queryKey: ['projects', id, 'timeentries'],
    queryFn: () => api.listAll('timeentries', { filter: JSON.stringify({ projectId: id }) }),
    enabled: mod === 'projects' && !isNew,
  })
  const relatedTimeList = relatedTimeEntries?.data || []

  const needsUsers = (fieldConfigs[mod] || []).some((f: any) => f.type === 'user-select')
  const { data: usersData } = useQuery({
    queryKey: ['module-users', mod],
    queryFn: () => api.request<any>(`/${mod}/users`),
    enabled: needsUsers,
  })
  const users = usersData?.data || []
  const roles = usersData?.roles || []

  const needsVendors = mod === 'products' || mod === 'purchaseorders'
  const { data: vendorsData } = useQuery({
    queryKey: ['module-vendors', mod],
    queryFn: () => api.listAll('vendors'),
    enabled: needsVendors,
  })
  const vendors = vendorsData?.data || []

  const needsAccounts = mod === 'contacts' || mod === 'tickets' || mod === 'assets' || mod === 'servicecontracts' || mod === 'projects'
  const { data: accountsData } = useQuery({
    queryKey: ['module-accounts', mod],
    queryFn: () => api.listAll('accounts'),
    enabled: needsAccounts,
  })
  const accounts = accountsData?.data || []

  const needsContacts = mod === 'contacts' || mod === 'tickets' || mod === 'assets' || mod === 'servicecontracts' || mod === 'projects' || mod === 'purchaseorders'
  const { data: contactsData } = useQuery({
    queryKey: ['module-contacts', mod],
    queryFn: () => api.listAll('contacts'),
    enabled: needsContacts,
  })
  const allContacts = contactsData?.data || []

  const needsProducts = (fieldConfigs[mod] || []).some((field: any) => field.type === 'product-select')
  const { data: productsData } = useQuery({
    queryKey: ['module-products', mod],
    queryFn: () => api.listAll('products'),
    enabled: needsProducts,
  })
  const products = productsData?.data || []

  const needsCurrencies = (fieldConfigs[mod] || []).some((f: any) => f.type === 'currency-select')
  const { data: currenciesData } = useQuery({
    queryKey: ['module-currencies', mod],
    queryFn: () => api.listAll('currencies'),
    enabled: needsCurrencies,
  })
  const currencies = (currenciesData?.data || [])

  const { data: campaignsData } = useQuery({
    queryKey: ['lead-form-campaigns'],
    queryFn: () => api.listAll('campaigns'),
    enabled: mod === 'leads',
  })
  const campaigns = (campaignsData?.data || []).filter((campaign: any) => campaign.isActive !== false)

  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [vendorForm, setVendorForm] = useState<Record<string, string>>({})
  const [savingVendor, setSavingVendor] = useState(false)
  const addVendorMutation = useMutation({
    mutationFn: (data: any) => api.create('vendors', data),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      addToast({ title: 'Vendor created', variant: 'success' })
      handleChange('vendorId', created.id || '')
      setVendorModalOpen(false)
      setVendorForm({})
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const [uploadingImage, setUploadingImage] = useState(false)

  const { data: customFieldsData } = useQuery({
    queryKey: ['custom-fields', mod],
    queryFn: () => api.getCustomFields(mod).catch(() => ({ data: [] })),
  })
  const customFields = (customFieldsData?.data || []).filter((f: any) => f.isActive)

  const { data: picklistData } = useQuery({
    queryKey: ['picklists-all', mod],
    queryFn: () => api.getAllPicklists(mod).catch(() => ({ data: {} })),
  })
  const dynamicOptions = useMemo(() => {
    const merged: Record<string, Record<string, string[]>> = {}
    for (const [k, v] of Object.entries(SELECT_OPTIONS)) merged[k] = { ...v }
    const modMap = (picklistData?.data || {}) as Record<string, Record<string, string[]>>
    const modOptions = modMap[mod]
    if (modOptions && typeof modOptions === 'object') {
      for (const [field, opts] of Object.entries(modOptions)) {
        if (Array.isArray(opts)) {
          merged[mod] = { ...(merged[mod] || {}), [field]: ['--None--', ...opts] }
        }
      }    }
    return merged
  }, [picklistData, mod])

  const { data: orgSettingsData } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })
  const stageProbability = (orgSettingsData?.stageProbability || {}) as Record<string, number>
  const organizationDefaultCurrency = orgSettingsData?.defaultCurrency || 'USD'

  useEffect(() => {
    if (!isNew || !organizationDefaultCurrency) return
    const hasCurrencyField = (fieldConfigs[mod] || []).some((field: any) => field.name === 'currency')
    if (!hasCurrencyField) return
    setFormData(current => current.currency ? current : { ...current, currency: organizationDefaultCurrency })
  }, [isNew, mod, organizationDefaultCurrency])

  function formatRecordForForm(data: any) {
    const result: Record<string, any> = {}
    const config = fieldConfigs[mod] || []
    for (const f of config) {
      if (f.type === 'date' && data[f.name]) {
        const d = new Date(data[f.name])
        result[f.name] = d.toISOString().slice(0, 10)
      } else {
        result[f.name] = data[f.name] ?? ''
      }
    }
    for (const cf of customFields) {
      result[cf.fieldName] = data.customFields?.[cf.fieldName] ?? ''
    }
    return result
  }

  const DRAFT_KEY = `crm:draft:${user?.companyId || 'company'}:${user?.id || 'user'}:${mod}:${isNew ? 'new' : id}`

  useEffect(() => {
    if (isNew) {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try {
          const restored = JSON.parse(saved)
          for (const f of fieldConfigs[mod] || []) {
            const qv = searchParams.get(f.name)
            if (qv) restored[f.name] = qv
          }
          setFormData(restored)
          return
        } catch {}
      }
      const preseed: Record<string, any> = {}
      for (const f of fieldConfigs[mod] || []) {
        const qv = searchParams.get(f.name)
        if (qv) preseed[f.name] = qv
      }
      if (mod === 'stageprobability') {
        preseed.probability = preseed.probability ?? 0
        preseed.sequence = preseed.sequence ?? 0
        preseed.color = preseed.color || '#2563eb'
        preseed.isActive = true
      }
      if (mod === 'quantitydiscounts') {
        preseed.minQty = preseed.minQty ?? 1
        preseed.isActive = true
      }
      setFormData(preseed)
    } else if (record) {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try { setFormData(JSON.parse(saved)); return } catch {}
      }
      setFormData(formatRecordForForm(record))
    }
  }, [record, isNew])

  useEffect(() => {
    if (Object.keys(formData).length > 0 && (isNew || record)) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
    }
  }, [formData, isNew, record, DRAFT_KEY])

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isNew ? api.create(mod, data) : api.update(mod, id!, data),
    onSuccess: () => {
      localStorage.removeItem(DRAFT_KEY)
      queryClient.invalidateQueries({ queryKey: [mod] })
      addToast({ title: isNew ? 'Created' : 'Updated', description: `${label} has been saved`, variant: 'success' })
      navigate(isNew ? `/${mod}` : `/${mod}/${id}`)
    },
    onError: (err: Error) => {
      let description = err.message
      const match = description.match(/Missing required field\(s\): (.+)/)
      if (match) {
        const fieldNames = match[1].split(',').map((f: string) => {
          const trimmed = f.trim()
          return getFieldLabel(trimmed)
        })
        description = `Please fill in required fields: ${fieldNames.join(', ')}`
      }
      addToast({ title: 'Validation Error', description, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(mod, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [mod] })
      addToast({ title: 'Deleted', description: `${label} has been deleted`, variant: 'success' })
      navigate(`/${mod}`)
    },    onError: (err: Error) => {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const aiPredictionMutation = useMutation({
    mutationFn: () => api.aiOppPrediction(id!),
    onSuccess: (data) => {
      setAiPrediction(data.data)
      setShowAiPrediction(true)
      addToast({ title: 'Prediction generated', variant: 'success' })
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const closeWonMutation = useMutation({
    mutationFn: () => api.closeAsWon(id!, closeWonModules),
    onSuccess: (data) => {
      setCloseWonOpen(false)
      queryClient.invalidateQueries({ queryKey: [mod, id] })
      const parts = ['Opportunity closed as Won!']
      if (data.account) parts.push(`Account "${data.account.accountName}" created`)
      if (data.contact) parts.push(`Contact "${data.contact.firstName} ${data.contact.lastName}" created`)
      addToast({ title: 'Closed as Won', description: parts.join('. '), variant: 'success' })
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const config = fieldConfigs[mod] || []
    const newErrors: Record<string, string> = {}
    const missingRequiredLabels: string[] = []
    for (const field of config) {
      if (field.required && (formData[field.name] === '' || formData[field.name] == null)) {
        newErrors[field.name] = 'This field is required'
        missingRequiredLabels.push(field.label ? t(field.label) : getFieldLabel(field.name))
      }
    }
    for (const field of customFields) {
      if (field.isRequired && (formData[field.fieldName] === '' || formData[field.fieldName] == null)) {
        newErrors[field.fieldName] = 'This field is required'
        missingRequiredLabels.push(field.label ? t(field.label) : getFieldLabel(field.fieldName))
      }
    }
    if (mod === 'stageprobability' && (Number(formData.probability) < 0 || Number(formData.probability) > 100)) {
      newErrors.probability = 'Probability must be between 0 and 100'
    }
    if (mod === 'quantitydiscounts') {
      const minQty = Number(formData.minQty)
      const maxQty = formData.maxQty === '' || formData.maxQty == null ? null : Number(formData.maxQty)
      const discount = Number(formData.discountPercent)
      if (!Number.isFinite(minQty) || minQty <= 0) newErrors.minQty = 'Minimum quantity must be greater than 0'
      if (maxQty != null && (!Number.isFinite(maxQty) || maxQty < minQty)) newErrors.maxQty = 'Maximum quantity must be at least the minimum quantity'
      if (!Number.isFinite(discount) || discount <= 0 || discount > 100) newErrors.discountPercent = 'Discount must be greater than 0 and no more than 100%'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      if (missingRequiredLabels.length > 0) {
        addToast({
          title: missingRequiredLabels.length === 1 ? 'Required field missing' : 'Required fields missing',
          description: `Please complete: ${missingRequiredLabels.join(', ')}`,
          variant: 'destructive',
        })
      } else {
        const invalidLabels = Object.keys(newErrors).map(name => getFieldLabel(name))
        addToast({ title: 'Please check the form', description: `Invalid field${invalidLabels.length === 1 ? '' : 's'}: ${invalidLabels.join(', ')}`, variant: 'destructive' })
      }
      return
    }
    const payload: Record<string, any> = {}
    for (const field of config) {
      const val = formData[field.name]
      if (field.type === 'date' && val) {
        payload[field.name] = new Date(val + 'T12:00:00').toISOString()
      } else if (field.type === 'datetime-local' && val) {
        payload[field.name] = new Date(val).toISOString()
      } else if (field.type === 'checkbox') {
        payload[field.name] = !!val
      } else if (field.type === 'number') {
        payload[field.name] = val === '' || val == null ? null : Number(val)
      } else {
        payload[field.name] = val ?? null
      }
    }
    for (const cf of customFields) {
      const val = formData[cf.fieldName]
      payload[cf.fieldName] = cf.type === 'checkbox' ? !!val : (val === '' || val == null ? null : val)
    }
    saveMutation.mutate(payload)
  }

  const handleChange = (name: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value }
      if (mod === 'potentials' && name === 'stage' && value && value !== '--None--') {
        const prob = stageProbability[value]
        if (prob != null && (next.probability === '' || next.probability == null)) {
          next.probability = prob
        }
      }
      return next
    })
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const label = t(labelMap[mod] || mod)
  const fields = fieldConfigs[mod] || [{ name: 'id', type: 'text' }]
  const tabs = useMemo(() => {
    const base = getFieldTabs(mod, fields)
    if (customFields.length) {
      return [...base, { label: 'Custom Fields', fieldConfigs: customFields.map((cf: any) => ({ name: cf.fieldName, type: cf.type, options: cf.options })) }]
    }
    return base
  }, [mod, customFields])
  const [activeTab, setActiveTab] = useState(tabs[0]?.label || 'Details')

  if (!isNew && loadingRecord) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isNew && !isEditMode) {
    return (
      <div className="space-y-5 w-full">
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="outline" size="icon" onClick={() => navigate(`/${mod}`)}>
                <ArrowLeft size={18} />
              </Button>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <button type="button" onClick={() => navigate(`/${mod}`)} className="transition-colors hover:text-foreground">
                    {label}
                  </button>{' '}
                  <ChevronRight size={12} /> {t('Details')}
                </p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{record?.[fields[0]?.name] || label}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/${mod}/${id}?edit=true`)}>
                <Pencil size={16} className="mr-2" /> <span className="hidden sm:inline">{t('Edit')}</span>
              </Button>
              {mod === 'potentials' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => aiPredictionMutation.mutate()}
                    disabled={aiPredictionMutation.isPending}
                    className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-violet-200 dark:border-violet-800"
                  >
                    {aiPredictionMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2 text-violet-500" />}
                    <span className="hidden sm:inline">AI Predict</span>
                  </Button>
                  {record?.stage !== 'Closed Won' && record?.stage !== 'Closed Lost' && (
                    <Button
                      onClick={() => setCloseWonOpen(true)}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      <span className="hidden sm:inline">Close as Won</span>
                    </Button>
                  )}
                </>
              )}
              {MERGEABLE_MODULES.includes(mod) && (
                <Button variant="outline" onClick={() => setMergeOpen(true)}>
                  <GitMerge size={16} className="mr-2" /> <span className="hidden sm:inline">{t('Merge')}</span>
                </Button>
              )}
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 size={16} className="mr-2" /> <span className="hidden sm:inline">{t('Delete')}</span>
              </Button>
            </div>
          </div>
        </div>
        <MergeRecordsDialog
          module={mod}
          currentId={id!}
          currentRecord={record}
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          onMerged={(targetId) => {
            queryClient.invalidateQueries({ queryKey: [mod] })
            navigate(`/${mod}/${targetId}`)
          }}
        />
        {showAiPrediction && aiPrediction && (
          <div className="rounded-xl border bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Target size={15} className="text-violet-500" /> AI Opportunity Prediction</h3>
              <button onClick={() => setShowAiPrediction(false)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">{aiPrediction.probability || 0}%</p>
                <p className={cn('text-xs font-medium mt-1', (aiPrediction.confidence === 'High' ? 'text-emerald-600' : aiPrediction.confidence === 'Medium' ? 'text-yellow-600' : 'text-red-600'))}>{aiPrediction.confidence || 'Low'} confidence</p>
              </div>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div className={cn('h-full rounded-full', (aiPrediction.probability || 0) >= 70 ? 'bg-emerald-500' : (aiPrediction.probability || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${aiPrediction.probability || 0}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(aiPrediction.factors || []).slice(0, 5).map((f: any, i: number) => (
                    <span key={i} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', f.score > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{f.name}</span>
                  ))}
                </div>
                {aiPrediction.recommendation && <p className="text-xs text-muted-foreground mt-2">{aiPrediction.recommendation}</p>}
              </div>
            </div>
          </div>
        )}
        <Dialog open={closeWonOpen} onOpenChange={setCloseWonOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Close as Won
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mark this opportunity as Closed Won and optionally create Account & Contact records from its data.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-base">{record?.potentialName}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {record?.amount != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Amount</p>
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">${Number(record.amount).toLocaleString()}</p>
                    </div>
                  )}
                  {record?.stage && (
                    <div>
                      <p className="text-muted-foreground text-xs">Stage</p>
                      <p className="font-medium">{record.stage}</p>
                    </div>
                  )}
                  {record?.closingDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Closing Date</p>
                      <p className="font-medium">{formatDate(record.closingDate)}</p>
                    </div>
                  )}
                  {record?.probability != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Probability</p>
                      <p className="font-medium">{record.probability}%</p>
                    </div>
                  )}
                  {record?.type && (
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p className="font-medium">{record.type}</p>
                    </div>
                  )}
                  {record?.leadSource && (
                    <div>
                      <p className="text-muted-foreground text-xs">Lead Source</p>
                      <p className="font-medium">{record.leadSource}</p>
                    </div>
                  )}
                </div>
                {record?.customFields?.email && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium">{record.customFields.email}</p>
                  </div>
                )}
                {record?.customFields?.phone && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{record.customFields.phone}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Create the following records?</p>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={closeWonModules.createAccount}
                  onChange={e => setCloseWonModules(m => ({ ...m, createAccount: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium">Create Account</p>
                  <p className="text-xs text-muted-foreground">Create an account as "{record?.potentialName}"</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={closeWonModules.createContact}
                  onChange={e => setCloseWonModules(m => ({ ...m, createContact: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-medium">Create Contact</p>
                  <p className="text-xs text-muted-foreground">Create a contact linked to the new account</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCloseWonOpen(false)}>Cancel</Button>
              <Button
                onClick={() => closeWonMutation.mutate()}
                disabled={closeWonMutation.isPending || (!closeWonModules.createAccount && !closeWonModules.createContact)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none"
              >
                {closeWonMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />}
                Close as Won
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Card>
          <CardContent className="p-0">
            <TabsRoot value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-4 border-b">
                <TabsList className="border-b-0">
                  {tabs.map((tab, i) => (
                    <TabsTrigger key={tab.label} value={tab.label} className={TAB_ACTIVE_COLORS[i % TAB_ACTIVE_COLORS.length]}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TAB_DOT_COLORS[i % TAB_DOT_COLORS.length]}`} />{tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {tabs.map(tab => (
                <TabsContent key={tab.label} value={tab.label} className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6">
                    {tab.fieldConfigs.map((field) => {
                      const isLong = field.type === 'textarea'
                      return (
                        <div key={field.name} className={isLong ? 'md:col-span-2 xl:col-span-3' : ''}>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {(field as any).label ? t((field as any).label) : getFieldLabel(field.name)}
                          </label>
                          {field.name === 'image' && record?.image ? (
                            <img src={record.image} alt={record.productName || record.firstName || 'Image'} className="mt-1.5 h-20 w-20 rounded-lg border object-cover" />
                          ) : (
                          <p className="text-sm mt-1.5 font-medium text-foreground">
                            {field.name === 'projectId'
                              ? (projects.find(p => p.id === record?.projectId)?.projectName || '-')
                              : field.name === 'milestoneId'
                                ? (milestoneOptions.find((item: any) => item.id === record?.milestoneId)?.title || '-')
                              : field.name === 'taskId'
                                ? (taskOptions.find((item: any) => item.id === record?.taskId)?.title || '-')
                              : field.name === 'accountId'
                                ? (accounts.find(a => a.id === record?.accountId)?.accountName || '-')
                                : field.name === 'reportsTo'
                                  ? ((() => {
                                      const c = allContacts.find((x: any) => x.id === record?.reportsTo)
                                      return c ? [c.firstName, c.lastName].filter(Boolean).join(' ') : '-'
                                    })())
                                  : field.name === 'contactId'
                                    ? ((() => {
                                        const c = allContacts.find((x: any) => x.id === record?.contactId)
                                        return c ? [c.firstName, c.lastName].filter(Boolean).join(' ') : '-'
                                      })())
                                  : field.name === 'productId'
                                    ? (products.find((p: any) => p.id === record?.productId)?.productName || '-')
                                  : field.name === 'invoiceId'
                                    ? formatDisplayValue(record?.invoiceId, field.type, field.name)
                                    : field.name === 'assignedTo'
                                ? ((() => {
                                    const assignedId = record?.assignedTo
                                    if (assignedId) {
                                      const u: any = users.find((x: any) => x.id === assignedId)
                                      if (u) return userDisplayName(u)
                                      const r: any = roles.find((x: any) => x.id === assignedId)
                                      if (r) return r.name
                                    }
                                    return record?.ownerName || '-'
                                  })())
                                : field.name === 'vendorId'
                                  ? (vendors.find((v: any) => v.id === record?.vendorId)?.vendorName || record?.vendorName || formatDisplayValue(record?.vendorId, field.type, field.name))
                                  : formatDisplayValue(field.name.startsWith('cf_') ? record?.customFields?.[field.name] : record?.[field.name], field.type, field.name)}
                          </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              ))}
            </TabsRoot>
          </CardContent>
        </Card>
        {!isNew && id && <RecordTags module={mod} recordId={id} />}
        {mod === 'leads' && !isNew && <LeadExtras record={record} />}
        {mod === 'potentials' && !isNew && <PotentialExtras potentialId={id!} />}
        {mod === 'tickets' && !isNew && <TicketExtras record={record} />}
        {mod === 'services' && !isNew && <ServiceExtras record={record} />}
        {mod === 'vendors' && !isNew && <VendorExtras record={record} />}
        {mod === 'pricebooks' && !isNew && <PriceBookExtras record={record} />}
        {mod === 'assets' && !isNew && <AssetExtras record={record} />}
        {mod === 'projects' && !isNew && <ProjectExtras record={record} relatedTaskList={relatedTaskList} relatedMilestoneList={relatedMilestoneList} relatedTimeList={relatedTimeList} users={users} navigate={navigate} id={id!} />}
        {mod === 'quotes' && !isNew && <QuoteExtras record={record} id={id!} />}
        {mod === 'invoices' && !isNew && <InvoiceExtras record={record} />}
        {['accounts', 'contacts', 'campaigns', 'servicecontracts'].includes(mod) && !isNew && <RelatedRecords mod={mod} id={id!} />}
        <ConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={() => deleteMutation.mutate()}
          title={t('Delete Record')}
          description={t('Are you sure you want to delete this {label}?', { label })}
          confirmLabel={t('Delete')}
          variant="destructive"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="icon" onClick={() => navigate(isNew ? `/${mod}` : `/${mod}/${id}`)}>
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <button type="button" onClick={() => navigate(`/${mod}`)} className="transition-colors hover:text-foreground">
                  {label}
                </button>{' '}
                <ChevronRight size={12} /> {isNew ? 'New Record' : 'Edit Record'}
              </p>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {mod === 'potentials' && formData.potentialName
                  ? formData.potentialName
                  : isNew ? `Create New ${label}` : `Edit ${label}`}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below and save to {isNew ? 'create this' : 'update the'} record.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Asterisk size={13} className="text-destructive" /> Required fields
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pb-24 sm:pb-0">
        {mod === 'potentials' ? (
          <OpportunityEditor
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            currencies={currencies}
            stageOptions={dynamicOptions.potentials?.stage || SELECT_OPTIONS.potentials.stage}
            leadSourceOptions={dynamicOptions.potentials?.leadSource || SELECT_OPTIONS.potentials.leadSource}
            typeOptions={dynamicOptions.potentials?.type || SELECT_OPTIONS.potentials.type}
            forecastOptions={dynamicOptions.potentials?.forecastCategory || SELECT_OPTIONS.potentials.forecastCategory}
            defaultCurrency={organizationDefaultCurrency}
          />
        ) : mod === 'leads' ? (
          <LeadEditor formData={formData} errors={errors} handleChange={handleChange} users={users} roles={roles} campaigns={campaigns} options={dynamicOptions.leads || SELECT_OPTIONS.leads} />
        ) : <Card>
          <CardContent className="p-0">
            <FormTabs
              module={mod}
              fields={fields}
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              SELECT_OPTIONS={dynamicOptions}
              projects={projects}
              milestoneOptions={milestoneOptions}
              taskOptions={taskOptions}
              users={users}
              roles={roles}
              vendors={vendors}
              accounts={accounts}
              allContacts={allContacts}
              products={products}
              currencies={currencies}
              uploadingImage={uploadingImage}
              onUploadImage={async (file: File) => {
                setUploadingImage(true)
                try {
                  const res = await api.uploadFile(file)
                  handleChange('image', res.path)
                } catch (e: any) {
                  addToast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
                } finally {
                  setUploadingImage(false)
                }
              }}
              onAddVendor={() => setVendorModalOpen(true)}
              onOpenVendorFullForm={() => navigate('/vendors/new')}
              onOpenAccountFullForm={() => navigate('/accounts/new')}
              customFields={customFields}
            />
          </CardContent>
        </Card>}

        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap justify-end gap-2 border-t bg-background/95 px-2.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(15,23,42,0.10)] backdrop-blur sm:sticky sm:z-30 sm:mx-0 sm:mt-4 sm:rounded-xl sm:border sm:px-4">
          <Button className="min-w-[7rem] flex-1 sm:flex-none" type="button" variant="outline" onClick={() => { localStorage.removeItem(DRAFT_KEY); navigate(isNew ? `/${mod}` : `/${mod}/${id}`) }}>Cancel</Button>
          {!isNew && (
            <Button className="min-w-[7rem] flex-1 sm:flex-none" type="button" variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          )}
          <Button className="min-w-[7rem] flex-1 sm:flex-none" type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save
          </Button>
        </div>
      </form>

      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Vendor Name *</label>
              <Input value={vendorForm.vendorName || ''} onChange={e => setVendorForm(f => ({ ...f, vendorName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
              <Input type="email" value={vendorForm.email || ''} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Phone</label>
              <Input value={vendorForm.phone || ''} onChange={e => setVendorForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Website</label>
              <Input value={vendorForm.website || ''} onChange={e => setVendorForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
              <Input value={vendorForm.category || ''} onChange={e => setVendorForm(f => ({ ...f, category: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!vendorForm.vendorName || savingVendor}
              onClick={() => {
                setSavingVendor(true)
                addVendorMutation.mutate(vendorForm, { onSettled: () => setSavingVendor(false) })
              }}
            >
              {savingVendor ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Plus size={15} className="mr-2" />}
              Create Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={() => deleteMutation.mutate()}
        title={t('Delete Record')}
        description={t('Are you sure you want to delete this {label}?', { label })}
        confirmLabel={t('Delete')}
        variant="destructive"
      />
    </div>
  )
}

const LEAD_LABEL_CLASS = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[.045em] text-muted-foreground'
const LEAD_INPUT_CLASS = 'h-10 rounded-lg bg-background shadow-none focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0'
const LEAD_REQUIRED_FIELDS = ['firstName', 'lastName', 'company', 'assignedTo']
const LeadEditorContext = createContext<{ formData: Record<string, any>; errors: Record<string, string>; options: Record<string, string[]>; handleChange: (name: string, value: any) => void } | null>(null)

function LeadNativeSelect({ name, value, options, onChange }: { name: string; value: string; options: string[]; onChange: (name: string, value: string) => void }) {
  return <select value={value} onChange={e => onChange(name, e.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"><option value="">— None —</option>{options.filter(v => !/^--/.test(v)).map(v => <option key={v}>{v}</option>)}</select>
}

function LeadField({ name, type = 'text', placeholder = '', value, error, required, onChange }: { name: string; type?: string; placeholder?: string; value: any; error?: string; required?: boolean; onChange: (name: string, value: string) => void }) {
  return <div><label className={LEAD_LABEL_CLASS}>{getFieldLabel(name)} {required && <span className="text-destructive">*</span>}</label><Input type={type} value={value ?? ''} onChange={e => onChange(name, e.target.value)} placeholder={placeholder} className={cn(LEAD_INPUT_CLASS, error && 'border-destructive')} />{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>
}

function LeadBoundField({ name, type = 'text', placeholder = '' }: { name: string; type?: string; placeholder?: string }) {
  const context = useContext(LeadEditorContext)!
  return <LeadField name={name} type={type} placeholder={placeholder} value={context.formData[name]} error={context.errors[name]} required={LEAD_REQUIRED_FIELDS.includes(name)} onChange={context.handleChange} />
}

function LeadBoundSelect({ name }: { name: string }) {
  const context = useContext(LeadEditorContext)!
  return <LeadNativeSelect name={name} value={context.formData[name] || ''} options={context.options[name] || []} onChange={context.handleChange} />
}

function LeadSection({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return <section className="border-b p-5 last:border-0 sm:p-6"><div className="mb-5 flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{number}</span><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div></section>
}

function LeadEditor({ formData, errors, handleChange, users, roles, campaigns, options }: { formData: Record<string, any>; errors: Record<string,string>; handleChange:(name:string,value:any)=>void; users:any[]; roles:any[]; campaigns:any[]; options:Record<string,string[]> }) {
  const labelClass = LEAD_LABEL_CLASS
  const required = LEAD_REQUIRED_FIELDS
  const complete = required.filter(key => String(formData[key] || '').trim()).length
  const percent = Math.round((complete / required.length) * 100)
  const contextValue = useMemo(() => ({ formData, errors, options, handleChange }), [formData, errors, options, handleChange])
  const Field = LeadBoundField
  const NativeSelect = LeadBoundSelect
  return <LeadEditorContext.Provider value={contextValue}><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <LeadSection number={1} title="Contact" description="The person your sales team will contact."><div><label className={labelClass}>Salutation</label><NativeSelect name="salutation"/></div><Field name="firstName" placeholder="e.g. Ali"/><Field name="lastName" placeholder="e.g. Hassan"/><Field name="email" type="email" placeholder="name@company.com"/><Field name="secondaryEmail" type="email"/><Field name="phone" placeholder="+92 300 0000000"/><Field name="mobile"/><Field name="fax"/><Field name="website" placeholder="https://"/></LeadSection>
      <LeadSection number={2} title="Company" description="Firmographic details used for qualification and reporting."><div className="sm:col-span-2"><Field name="company" placeholder="Company name"/></div><Field name="title" placeholder="Owner, purchasing manager…"/><div><label className={labelClass}>Industry</label><NativeSelect name="industry"/></div><Field name="noOfEmployees" type="number"/><Field name="annualRevenue" type="number"/><div><label className={labelClass}>Interest</label><NativeSelect name="interest"/></div></LeadSection>
      <LeadSection number={3} title="Lead details" description="Ownership, source, campaign, status, and qualification context."><div><label className={labelClass}>Lead source</label><NativeSelect name="leadSource"/></div><div><label className={labelClass}>Lead status</label><NativeSelect name="leadStatus"/></div><div><label className={labelClass}>Campaign</label><select value={formData.campaignId || ''} onChange={event => handleChange('campaignId', event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"><option value="">— No campaign —</option>{campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.campaignName}{campaign.status ? ` · ${campaign.status}` : ''}</option>)}</select></div><div><label className={labelClass}>Rating</label><NativeSelect name="rating"/></div><Field name="leadScore" type="number" placeholder="0–100"/><Field name="nextFollowUp" type="datetime-local"/><div className="sm:col-span-2 xl:col-span-3"><label className={labelClass}>Assigned to <span className="text-destructive">*</span></label><UserRoleSelect value={formData.assignedTo||''} users={users} roles={roles} onSelect={v=>handleChange('assignedTo',v)}/>{errors.assignedTo&&<p className="mt-1 text-xs text-destructive">{errors.assignedTo}</p>}</div></LeadSection>
      <LeadSection number={4} title="Address & notes" description="Location and context for the next person working this lead."><Field name="street"/><Field name="city"/><Field name="state"/><Field name="country"/><Field name="postalCode"/><Field name="poBox"/><div className="sm:col-span-2 xl:col-span-3"><label className={labelClass}>Description</label><textarea value={formData.description||''} onChange={e=>handleChange('description',e.target.value)} placeholder="Anything the next rep should know before contacting this lead…" className="min-h-28 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"/></div></LeadSection>
    </div>
    <aside className="space-y-4 lg:sticky lg:top-5"><div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Profile completeness</p><p className="mt-1 text-xs text-muted-foreground">Complete the essentials before saving.</p></div><span className="text-xl font-bold text-indigo-700">{percent}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${percent}%`}}/></div><div className="mt-4 space-y-2">{required.map(key=><div key={key} className="flex items-center gap-2 text-xs"><span className={cn('grid h-4 w-4 place-items-center rounded-full border text-[9px]',formData[key]?'border-emerald-600 bg-emerald-600 text-white':'text-transparent')}>✓</span><span className={formData[key]?'text-foreground':'text-muted-foreground'}>{getFieldLabel(key)}</span></div>)}</div></div><div className="rounded-2xl bg-indigo-50 p-4 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200"><p className="text-sm font-bold">Build momentum early</p><p className="mt-1 text-xs leading-5 opacity-75">After saving, open the lead workspace to schedule a follow-up, log activity, send email, or convert the record.</p></div></aside>
  </div></LeadEditorContext.Provider>
}

function OpportunitySection({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border p-5 last:border-b-0 sm:p-6">
      <div className="mb-5 flex gap-2.5">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-indigo-50 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{number}</span>
        <div><h2 className="text-sm font-bold tracking-tight">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

function OpportunityEditor({ formData, errors, handleChange, currencies, stageOptions, leadSourceOptions, typeOptions, forecastOptions, defaultCurrency }: {
  formData: Record<string, any>
  errors: Record<string, string>
  handleChange: (name: string, value: any) => void
  currencies: any[]
  stageOptions: string[]
  leadSourceOptions: string[]
  typeOptions: string[]
  forecastOptions: string[]
  defaultCurrency: string
}) {
  const [tab, setTab] = useState<'details' | 'description'>('details')
  const amount = Number(formData.amount) || 0
  const probability = Math.max(0, Math.min(100, Number(formData.probability) || 0))
  const weightedValue = amount * probability / 100
  const currency = formData.currency || defaultCurrency || 'USD'
  const activeStages = stageOptions.filter(stage => stage && stage !== '--None--' && stage !== 'Closed Lost')
  const selectedStageIndex = activeStages.indexOf(formData.stage)
  const closed = formData.stage === 'Closed Won' || formData.stage === 'Closed Lost'
  const completedStages = closed ? activeStages.length : Math.max(0, selectedStageIndex + 1)
  const closeDate = formData.closingDate ? new Date(`${String(formData.closingDate).slice(0, 10)}T12:00:00`) : null
  const daysToClose = closeDate && !Number.isNaN(closeDate.getTime())
    ? Math.ceil((closeDate.getTime() - Date.now()) / 86400000)
    : null
  const currencySymbol = new Intl.NumberFormat(undefined, { style: 'currency', currency }).formatToParts(0).find(part => part.type === 'currency')?.value || currency
  const inputClass = 'h-10 rounded-lg border-border bg-background shadow-none focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0'
  const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.045em] text-muted-foreground'

  const NativeSelect = ({ name, options }: { name: string; options: string[] }) => (
    <select
      value={formData[name] || ''}
      onChange={event => handleChange(name, event.target.value === '--None--' ? '' : event.target.value)}
      className={cn('h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10', errors[name] && 'border-destructive')}
    >
      {options.map(option => <option key={option} value={option === '--None--' ? '' : option}>{option}</option>)}
    </select>
  )

  const Section = OpportunitySection

  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl border bg-card p-1 shadow-sm">
        <button type="button" onClick={() => setTab('details')} className={cn('rounded-lg px-4 py-2 text-sm font-semibold transition', tab === 'details' ? 'bg-indigo-700 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted')}>Details</button>
        <button type="button" onClick={() => setTab('description')} className={cn('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition', tab === 'description' ? 'bg-indigo-700 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted')}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />Description</button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {tab === 'details' ? <>
            <Section number={1} title="Opportunity overview" description="What the deal is and where it came from.">
              <div className="sm:col-span-2 xl:col-span-3">
                <label className={labelClass}>Opportunity name <span className="text-destructive">*</span></label>
                <Input value={formData.potentialName || ''} onChange={e => handleChange('potentialName', e.target.value)} placeholder="e.g. Acme Corp — Annual license renewal" className={cn(inputClass, errors.potentialName && 'border-destructive')} />
                {errors.potentialName && <p className="mt-1 text-xs text-destructive">{errors.potentialName}</p>}
              </div>
              <div><label className={labelClass}>Type</label><NativeSelect name="type" options={typeOptions} /></div>
              <div><label className={labelClass}>Lead source</label><NativeSelect name="leadSource" options={leadSourceOptions} /></div>
              <div><label className={labelClass}>Forecast category</label><NativeSelect name="forecastCategory" options={forecastOptions} /></div>
            </Section>

            <Section number={2} title="Deal value" description="Amount, currency, and how likely it is to close.">
              <div><label className={labelClass}>Amount</label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">{currencySymbol}</span><Input type="number" min="0" step="0.01" value={formData.amount ?? ''} onChange={e => handleChange('amount', e.target.value)} className={cn(inputClass, 'pl-8 font-mono font-semibold')} /></div></div>
              <div><label className={labelClass}>Currency</label><NativeSelect name="currency" options={['--None--', ...currencies.map(c => c.code || c.name).filter(Boolean)]} /></div>
              <div><label className={labelClass}>Probability (%)</label><Input type="number" min="0" max="100" value={formData.probability ?? ''} onChange={e => handleChange('probability', e.target.value)} className={inputClass} /></div>
            </Section>

            <Section number={3} title="Timeline & stage" description="Where this deal sits in the pipeline and what's next.">
              <div><label className={labelClass}>Closing date <span className="text-destructive">*</span></label><DateField value={formData.closingDate || ''} onChange={value => handleChange('closingDate', value)} className={cn(inputClass, errors.closingDate && 'border-destructive')} /></div>
              <div><label className={labelClass}>Stage <span className="text-destructive">*</span></label><NativeSelect name="stage" options={stageOptions} /></div>
              <div className="sm:col-span-2 xl:col-span-3"><label className={labelClass}>Next step <span className="normal-case font-medium tracking-normal text-muted-foreground/70">optional</span></label><Input value={formData.nextStep || ''} onChange={e => handleChange('nextStep', e.target.value)} placeholder="e.g. Send signed contract for countersignature" className={inputClass} /></div>
            </Section>

            <Section number={4} title="Analysis & notes" description="Context for anyone reviewing this deal later.">
              <div className="sm:col-span-2 xl:col-span-3"><label className={labelClass}>Outcome analysis <span className="normal-case font-medium tracking-normal text-muted-foreground/70">optional</span></label><textarea value={formData.outcomeAnalysis || ''} onChange={e => handleChange('outcomeAnalysis', e.target.value)} placeholder="Why this deal is expected to win or lose..." className="min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10" /><p className="mt-1 text-[11px] text-muted-foreground">Visible to your team on the deal timeline.</p></div>
            </Section>
          </> : (
            <section className="p-5 sm:p-6">
              <div className="mb-5 flex gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15"><FileText size={12} /></span><div><h2 className="text-sm font-bold">Description</h2><p className="mt-0.5 text-xs text-muted-foreground">Add supporting context and background for this opportunity.</p></div></div>
              <label className={labelClass}>Opportunity description</label>
              <textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="Add deal context, customer requirements, risks, or other notes..." className="min-h-48 w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10" />
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-bold">Deal summary</h3><span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</span></div>
            <p className="font-mono text-3xl font-semibold tracking-tight">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(weightedValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Weighted value (amount × probability)</p>
            <div className="mt-5 flex justify-between text-xs font-semibold"><span className="text-muted-foreground">Win probability</span><span className="font-mono text-indigo-700 dark:text-indigo-300">{probability}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full border bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-indigo-700 to-violet-500 transition-all" style={{ width: `${probability}%` }} /></div>
            <div className="mt-5 flex items-center justify-between gap-3 text-xs font-semibold"><span className="text-muted-foreground">Pipeline stage</span><span className="max-w-[150px] truncate rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{formData.stage || 'Not selected'}</span></div>
            <div className="mt-3 flex gap-1">{activeStages.map((stage, index) => <span key={stage} className={cn('h-1.5 flex-1 rounded-full border bg-muted transition-colors', index < completedStages && 'border-emerald-500 bg-emerald-500')} />)}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">{completedStages} of {activeStages.length} stages complete</p>
            <div className="mt-5 divide-y border-t text-xs">
              <div className="flex justify-between py-3"><span className="text-muted-foreground">Days to close</span><span className="font-mono font-semibold">{daysToClose == null ? '—' : daysToClose < 0 ? `${Math.abs(daysToClose)} overdue` : daysToClose}</span></div>
              <div className="flex justify-between py-3"><span className="text-muted-foreground">Currency</span><span className="font-mono font-semibold">{formData.currency || 'None'}</span></div>
              <div className="flex justify-between py-3"><span className="text-muted-foreground">Amount</span><span className="font-mono font-semibold">{amount.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm"><h4 className="flex items-center gap-2 text-xs font-bold"><Star size={14} className="text-indigo-600" />Why weighted value matters</h4><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Forecast rollups use amount × probability, not the raw deal amount. Keeping probability accurate makes team forecasts more trustworthy.</p></div>
        </aside>
      </div>
    </div>
  )
}

function FormTabs({ module, fields, formData, errors, handleChange, SELECT_OPTIONS: options, projects, milestoneOptions = [], taskOptions = [], users = [], roles = [], vendors = [], accounts = [], allContacts = [], products = [], currencies = [], uploadingImage = false, onUploadImage, onAddVendor, onOpenVendorFullForm, onOpenAccountFullForm, customFields = [] }: {
  module: string; fields: any[]; formData: any; errors: any; handleChange: any; SELECT_OPTIONS: any; projects: any[]; milestoneOptions?: any[]; taskOptions?: any[]; users?: any[]; roles?: any[]; vendors?: any[]; accounts?: any[]; allContacts?: any[]; products?: any[]; currencies?: any[]; uploadingImage?: boolean; onUploadImage?: (file: File) => void; onAddVendor?: () => void; onOpenVendorFullForm?: () => void; onOpenAccountFullForm?: () => void; customFields?: any[]
}) {
  const tabs = [
    ...getFieldTabs(module, fields),
    ...(customFields.length ? [{ label: 'Custom Fields', fieldConfigs: customFields.map((cf: any) => ({ name: cf.fieldName, type: cf.type, required: cf.isRequired, label: cf.label, options: cf.options })) }] : []),
  ]
  const [activeTab, setActiveTab] = useState(tabs[0]?.label || 'Details')

  return (
    <TabsRoot value={activeTab} onValueChange={setActiveTab}>
      <div className="px-6 pt-4 border-b">
        <TabsList className="border-b-0">
          {tabs.map((tab, i) => (
            <TabsTrigger key={tab.label} value={tab.label} className={TAB_ACTIVE_COLORS[i % TAB_ACTIVE_COLORS.length]}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TAB_DOT_COLORS[i % TAB_DOT_COLORS.length]}`} />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map(tab => (
        <TabsContent key={tab.label} value={tab.label} className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            {tab.fieldConfigs.map((field: any) => {
              const isLong = field.type === 'textarea'
              const selOptions = options[module]?.[field.name]
              return (
                <div key={field.name} className={isLong ? 'md:col-span-2 xl:col-span-3' : ''}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                    {field.label ? t(field.label) : getFieldLabel(field.name)}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      value={formData[field.name] ?? ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                    />
                  ) : field.type === 'currency-select' ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={(v: string) => {
                        const code = v === '_none_' ? '' : v
                        handleChange(field.name, code)
                        const cur = currencies.find((c: any) => (c.code || c.name) === code)
                        const rate = cur && Number(cur.rate) > 0 ? Number(cur.rate) : 1
                        handleChange('conversionRate', rate)
                      }}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['--None--', ...currencies.map((c: any) => c.code || c.name)]).map((o: string) => (
                          <SelectItem key={o} value={o === '--None--' ? '_none_' : o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'select' && selOptions ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={v => handleChange(field.name, v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selOptions || ['--None--']).map((o: string) => (
                          <SelectItem key={o} value={o === '--None--' ? '_none_' : o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'picklist' && field.options?.length ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={v => handleChange(field.name, v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['--None--', ...(field.options || [])]).map((o: string) => (
                          <SelectItem key={o} value={o === '--None--' ? '_none_' : o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'user-select' ? (
                    <UserRoleSelect
                      value={formData[field.name] || ''}
                      users={users}
                      roles={roles}
                      onSelect={v => handleChange(field.name, v)}
                    />
                  ) : field.type === 'vendor-select' ? (
                    <VendorSearchSelect
                      value={formData[field.name] || ''}
                      vendors={vendors}
                      onSelect={v => handleChange(field.name, v)}
                      onAddNew={onAddVendor || (() => {})}
                      onOpenFullForm={onOpenVendorFullForm || (() => {})}
                    />
                  ) : field.type === 'account-select' ? (
                    <AccountSearchSelect
                      value={formData[field.name] || ''}
                      accounts={accounts}
                      onSelect={v => handleChange(field.name, v)}
                      onOpenFullForm={onOpenAccountFullForm || (() => {})}
                    />
                  ) : field.type === 'contact-select' ? (
                    <ContactSearchSelect
                      value={formData[field.name] || ''}
                      contacts={allContacts}
                      onSelect={v => handleChange(field.name, v)}
                    />
                   ) : field.type === 'product-select' ? (
                    <div>
                      <ProductSearchSelect
                        value={formData[field.name] || ''}
                        products={products}
                        onSelect={(id: string) => handleChange(field.name, id)}
                        placeholder="Search product..."
                      />
                      {formData[field.name] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {products.find((p: any) => p.id === formData[field.name])?.productName || 'Product selected'}
                        </p>
                      )}
                    </div>
                  ) : field.type === 'invoice-select' ? (
                     <InvoiceSelectField value={formData[field.name] || ''} onChange={(id: string) => handleChange(field.name, id)} />
                  ) : field.type === 'purchaseorder-select' ? (
                     <PurchaseOrderSelectField value={formData[field.name] || ''} onChange={(id: string) => handleChange(field.name, id)} />
                  ) : field.type === 'search-select' && selOptions ? (
                    <SearchSelect
                      value={formData[field.name] || ''}
                      options={selOptions}
                      onSelect={v => handleChange(field.name, v === '--None--' ? '' : v)}
                    />
                  ) : field.type === 'image' ? (
                    <div className="flex items-center gap-3">
                      {formData[field.name] ? (
                        <img
                          src={formData[field.name]}
                          alt="Product"
                          className="h-16 w-16 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                          <ImagePlus size={18} />
                        </div>
                      )}
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingImage}
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (file && onUploadImage) await onUploadImage(file)
                            e.target.value = ''
                          }}
                        />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted">
                          {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                          {formData[field.name] ? 'Change image' : 'Upload image'}
                        </span>
                      </label>
                      {formData[field.name] && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleChange(field.name, '')} className="h-9 px-2 text-xs">
                          Remove
                        </Button>
                      )}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={!!formData[field.name]}
                        onChange={e => handleChange(field.name, e.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">{field.label ? t(field.label) : getFieldLabel(field.name)}</span>
                    </div>
                  ) : field.type === 'multiselect' ? (
                    <Input
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      placeholder="Comma-separated values"
                      className="rounded-lg"
                    />
                  ) : field.type === 'date' ? (
                    <DateField
                      value={formData[field.name] || ''}
                      onChange={(v) => handleChange(field.name, v)}
                      className="rounded-lg"
                    />
                  ) : field.type === 'project-select' ? (
                    <div>
                      <ProjectSearchSelect
                        value={formData[field.name] || ''}
                        projects={projects}
                        onSelect={(id: string) => handleChange(field.name, id)}
                        placeholder="Search project..."
                      />
                      {formData[field.name] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {projects.find((p: any) => p.id === formData[field.name])?.projectName || 'Project selected'}
                        </p>
                      )}
                    </div>
                  ) : field.type === 'milestone-select' ? (
                    <select value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" disabled={!formData.projectId}>
                      <option value="">{formData.projectId ? 'No milestone' : 'Select a project first'}</option>
                      {milestoneOptions.map((milestone: any) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
                    </select>
                  ) : field.type === 'task-select' ? (
                    <select value={formData[field.name] || ''} onChange={e => handleChange(field.name, e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" disabled={!formData.projectId}>
                      <option value="">{formData.projectId ? 'No specific task' : 'Select a project first'}</option>
                      {taskOptions.map((task: any) => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                  ) : field.type === 'file' ? (
                    <Input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleChange('fileName', file.name)
                          handleChange('fileData', file)
                        }
                      }}
                      className="rounded-lg"
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.name] ?? ''}
                      onChange={e => handleChange(field.name, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                      className={cn(errors[field.name] ? 'border-destructive' : '', 'rounded-lg')}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>
      ))}
    </TabsRoot>
  )
}

function RelatedRecords({ mod, id }: { mod: string; id: string }) {
  const navigate = useNavigate()
  const defs: { module: string; filterKey: string; title: string; name: (r: any) => string; sub?: (r: any) => string; addPath: string }[] =
    mod === 'accounts'
      ? [
          { module: 'contacts', filterKey: 'accountId', title: 'Related Contacts', name: r => [r.firstName, r.lastName].filter(Boolean).join(' '), sub: r => [r.email, r.phone].filter(Boolean).join(' · '), addPath: '/contacts/new' },
          { module: 'potentials', filterKey: 'accountId', title: 'Related Opportunities', name: r => r.potentialName || r.id, sub: r => [r.amount != null ? `$${r.amount}` : '', r.stage].filter(Boolean).join(' · '), addPath: '/potentials/new' },
          { module: 'projects', filterKey: 'accountId', title: 'Related Projects', name: r => r.projectName || r.id, sub: r => r.status, addPath: '/projects/new' },
        ]
        : mod === 'contacts'
          ? [
              { module: 'potentials', filterKey: 'contactId', title: 'Related Opportunities', name: r => r.potentialName || r.id, sub: r => [r.amount != null ? `$${r.amount}` : '', r.stage].filter(Boolean).join(' · '), addPath: '/potentials/new' },
              { module: 'tickets', filterKey: 'contactId', title: 'Related Tickets', name: r => r.title || r.id, sub: r => [r.status, r.priority].filter(Boolean).join(' · '), addPath: '/tickets/new' },
            ]
          : mod === 'servicecontracts'
            ? [
                { module: 'tickets', filterKey: 'serviceContractId', title: 'Related Tickets', name: r => r.title || r.id, sub: r => [r.status, r.priority].filter(Boolean).join(' · '), addPath: '/tickets/new' },
                { module: 'assets', filterKey: 'serviceContractId', title: 'Related Assets', name: r => r.assetName || r.id, sub: r => [r.serialNo, r.status].filter(Boolean).join(' · '), addPath: '/assets/new' },
              ]
            : [
            { module: 'leads', filterKey: 'campaignId', title: 'Related Leads', name: r => [r.firstName, r.lastName].filter(Boolean).join(' '), sub: r => [r.company, r.leadStatus].filter(Boolean).join(' · '), addPath: '/leads/new' },
            { module: 'potentials', filterKey: 'campaignId', title: 'Related Opportunities', name: r => r.potentialName || r.id, sub: r => [r.amount != null ? `$${r.amount}` : '', r.stage].filter(Boolean).join(' · '), addPath: '/potentials/new' },
          ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {defs.map(d => (
        <RelatedRecordsCard key={d.module} {...d} recordId={id} />
      ))}
    </div>
  )
}

function RelatedRecordsCard({ module, filterKey, title, name, sub, addPath, recordId }: {
  module: string; filterKey: string; title: string; name: (r: any) => string; sub?: (r: any) => string; addPath: string; recordId: string
}) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: [module, 'related', recordId, filterKey],
    queryFn: () => api.listAll(module, { filter: JSON.stringify({ [filterKey]: recordId }) }),
  })
  const rows = data?.data || []

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={() => navigate(`${addPath}?${filterKey}=${recordId}`)} className="text-xs font-medium text-primary hover:underline">
            + Add
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No related records yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/${module}/${r.id}`)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
              >
                <span className="truncate font-medium">{name(r)}</span>
                {sub && (() => { const s = sub(r); return s ? <span className="truncate text-xs text-muted-foreground">{s}</span> : null })()}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LeadExtras({ record }: { record: any }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [convertOpen, setConvertOpen] = useState(false)
  const [convertModules, setConvertModules] = useState({ account: true, contact: true, potential: true })
  const [convertForm, setConvertForm] = useState<Record<string, any>>({})
  const [conversionInfo, setConversionInfo] = useState<any>(null)

  const isConverted = record?.isConverted
  const convertedAccountId = record?.convertedAccountId
  const convertedContactId = record?.convertedContactId
  const convertedPotentialId = record?.convertedPotentialId

  const handleOpenConvert = async () => {
    setConvertOpen(true)
    setConvertForm({})
    setConvertModules({ account: true, contact: true, potential: true })
    try {
      const info = await api.getLeadConversionInfo(record.id)
      setConversionInfo(info)
      setConvertForm({
        potentialName: info.potentialInfo?.potentialName || record.company || '',
        amount: info.potentialInfo?.amount || '',
        closingDate: info.potentialInfo?.closingDate ? new Date(info.potentialInfo.closingDate).toISOString().slice(0, 10) : '',
        stage: info.potentialInfo?.stage || '',
        probability: info.potentialInfo?.probability ?? '',
      })
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const convertMutation = useMutation({
    mutationFn: () => api.convertLead(record.id, {
      modules: convertModules,
      potentialInfo: {
        potentialName: convertForm.potentialName || record.company,
        amount: convertForm.amount !== '' ? Number(convertForm.amount) : undefined,
        closingDate: convertForm.closingDate || undefined,
        stage: convertForm.stage || undefined,
        probability: convertForm.probability !== '' ? Number(convertForm.probability) : undefined,
      },
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      addToast({ title: 'Lead Converted', description: 'Lead has been converted successfully', variant: 'success' })
      setConvertOpen(false)
      if (data.potential) navigate(`/potentials/${data.potential.id}`)
      else if (data.contact) navigate(`/contacts/${data.contact.id}`)
      else if (data.account) navigate(`/accounts/${data.account.id}`)
    },
    onError: (e: Error) => addToast({ title: 'Conversion failed', description: e.message, variant: 'destructive' }),
  })

  const stages = SELECT_OPTIONS.potentials?.stage?.filter(s => s !== '--None--') || []

  if (isConverted) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4">
            <CheckCircle2 size={15} className="text-emerald-500" /> Conversion Status
          </h3>
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-4">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} /> This lead has been converted
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {convertedAccountId && (
                <button
                  type="button"
                  onClick={() => navigate(`/accounts/${convertedAccountId}`)}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                >
                  <Building size={14} className="text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="font-medium truncate">View Account →</p>
                  </div>
                </button>
              )}
              {convertedContactId && (
                <button
                  type="button"
                  onClick={() => navigate(`/contacts/${convertedContactId}`)}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                >
                  <User size={14} className="text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium truncate">View Contact →</p>
                  </div>
                </button>
              )}
              {convertedPotentialId && (
                <button
                  type="button"
                  onClick={() => navigate(`/potentials/${convertedPotentialId}`)}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                >
                  <Target size={14} className="text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Opportunity</p>
                    <p className="font-medium truncate">View Opportunity →</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4">
            <ArrowRight size={15} className="text-primary" /> Lead Conversion
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Convert this lead into an Account, Contact, and/or Opportunity to continue the sales pipeline.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={handleOpenConvert} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <ArrowRight size={16} className="mr-2" /> Convert to Opportunity
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
                <User size={11} /> {record.firstName} {record.lastName}
              </span>
              {record.company && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
                  <Building size={11} /> {record.company}
                </span>
              )}
              {record.leadStatus && (
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 font-medium',
                  record.leadStatus === 'Hot' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  record.leadStatus === 'Warm' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {record.leadStatus}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight size={18} className="text-blue-500" /> Convert Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Create Records</label>
              <div className="flex flex-wrap gap-3">
                {(['account', 'contact', 'potential'] as const).map(key => (
                  <label key={key} className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors',
                    convertModules[key] ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                  )}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={convertModules[key]}
                      onChange={e => setConvertModules(m => ({ ...m, [key]: e.target.checked }))}
                    />
                    <span className="capitalize font-medium">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {convertModules.potential && (
              <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opportunity Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
                    <Input value={convertForm.potentialName || ''} onChange={e => setConvertForm(f => ({ ...f, potentialName: e.target.value }))} placeholder="Opportunity name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Amount ($)</label>
                    <Input type="number" value={convertForm.amount ?? ''} onChange={e => setConvertForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Closing Date</label>
                    <Input type="date" value={convertForm.closingDate || ''} onChange={e => setConvertForm(f => ({ ...f, closingDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Stage</label>
                    <Select value={convertForm.stage || '_none_'} onValueChange={v => setConvertForm(f => ({ ...f, stage: v === '_none_' ? '' : v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="--None--" /></SelectTrigger>
                      <SelectContent>
                        {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Probability (%)</label>
                    <Input type="number" min={0} max={100} value={convertForm.probability ?? ''} onChange={e => setConvertForm(f => ({ ...f, probability: e.target.value }))} placeholder="0" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending || (!convertModules.account && !convertModules.contact && !convertModules.potential)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {convertMutation.isPending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <ArrowRight size={15} className="mr-2" />}
              Convert Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PotentialExtras({ potentialId }: { potentialId: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: rec, isLoading } = useQuery({
    queryKey: ['potentials', potentialId],
    queryFn: () => api.get('potentials', potentialId!),
  })

  const { data: orgSettingsData } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })
  const stageProbability = (orgSettingsData?.stageProbability || {}) as Record<string, number>

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.listAll('products', { limit: '500' }),
  })
  const allProducts = productsData?.data || []

  const initialItems = (rec?.products || []).map((pp: any) => ({
    productId: pp.productId,
    productName: pp.product?.productName || pp.productId,
    qty: Number(pp.qty || 1),
    listPrice: pp.listPrice != null ? Number(pp.listPrice) : (pp.product?.unitPrice != null ? Number(pp.product.unitPrice) : 0),
  }))

  const [items, setItems] = useState<any[]>([])
  const [dirty, setDirty] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (rec) {
      setItems(initialItems)
      setDirty(false)
    }
  }, [rec])

  const saveMutation = useMutation({
    mutationFn: () => api.update('potentials', potentialId, {
      products: items.map(i => ({ productId: i.productId, qty: i.qty, listPrice: i.listPrice })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['potentials', potentialId] })
      setDirty(false)
      setEditing(false)
      addToast({ title: 'Products updated', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  const lineTotal = (i: any) => Number(i.qty || 0) * Number(i.listPrice || 0)
  const grandTotal = items.reduce((s, i) => s + lineTotal(i), 0)
  const stageHistory = rec?.stageHistory || []

  const addRow = () => {
    const first = allProducts.find((p: any) => !items.some(i => i.productId === p.id))
    setItems([...items, { productId: first?.id || '', productName: first?.productName || '', qty: 1, listPrice: first ? Number(first.unitPrice || 0) : 0 }])
    setDirty(true)
    setEditing(true)
  }

  const competitors = rec?.competitors || []
  const isLost = rec?.stage === 'Closed Lost'
  const lossReason = rec?.lossReason
  const nextFollowUp = rec?.nextFollowUp
  const contactRole = rec?.contactRole
  const decisionMaker = rec?.decisionMaker

  const isClosedWon = rec?.stage === 'Closed Won'
  const isClosedLost = rec?.stage === 'Closed Lost'

  const stages = SELECT_OPTIONS.potentials?.stage?.filter(s => s !== '--None--') || []
  const allStages = stages
  const currentStageIdx = allStages.indexOf(rec?.stage || '')

  const stageColorMap: Record<string, string> = {
    'Prospecting': 'bg-blue-500',
    'Qualification': 'bg-blue-600',
    'Needs Analysis': 'bg-indigo-500',
    'Value Proposition': 'bg-violet-500',
    'Id. Decision Makers': 'bg-violet-600',
    'Perception Analysis': 'bg-purple-500',
    'Proposal/Price Quote': 'bg-fuchsia-500',
    'Negotiation/Review': 'bg-amber-500',
    'Closed Won': 'bg-emerald-500',
    'Closed Lost': 'bg-red-500',
  }

  const stageBgMap: Record<string, string> = {
    'Prospecting': 'bg-blue-100 dark:bg-blue-900/20',
    'Qualification': 'bg-blue-100 dark:bg-blue-900/20',
    'Needs Analysis': 'bg-indigo-100 dark:bg-indigo-900/20',
    'Value Proposition': 'bg-violet-100 dark:bg-violet-900/20',
    'Id. Decision Makers': 'bg-violet-100 dark:bg-violet-900/20',
    'Perception Analysis': 'bg-purple-100 dark:bg-purple-900/20',
    'Proposal/Price Quote': 'bg-fuchsia-100 dark:bg-fuchsia-900/20',
    'Negotiation/Review': 'bg-amber-100 dark:bg-amber-900/20',
    'Closed Won': 'bg-emerald-100 dark:bg-emerald-900/20',
    'Closed Lost': 'bg-red-100 dark:bg-red-900/20',
  }

  return (
    <div className="space-y-4">
    {allStages.length > 0 && rec?.stage && !isClosedLost && (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Target size={15} className="text-primary" /> Pipeline Stage</h3>
            {rec?.amount != null && (
              <span className="text-sm font-semibold text-primary">{formatMoney(rec.amount)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {allStages.map((stage, idx) => {
              const isPast = idx < currentStageIdx
              const isCurrent = idx === currentStageIdx
              const isFuture = idx > currentStageIdx
              const isClosedStage = stage === 'Closed Won' || stage === 'Closed Lost'
              const dotColor = stageColorMap[stage] || 'bg-gray-400'
              const bgColor = stageBgMap[stage] || 'bg-gray-100'
              return (
                <div key={stage} className="flex items-center gap-1 shrink-0">
                  <div className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap',
                    isCurrent ? `${bgColor} ring-2 ring-offset-1 ring-primary/30` :
                    isPast ? `${bgColor} opacity-60` :
                    'bg-muted/40 text-muted-foreground'
                  )}>
                    <span className={cn('h-2 w-2 rounded-full shrink-0', isPast || isCurrent ? dotColor : 'bg-muted-foreground/30')} />
                    <span className="hidden lg:inline">{stage}</span>
                    <span className="lg:hidden">{idx + 1}</span>
                  </div>
                  {idx < allStages.length - 1 && !isClosedStage && (
                    <ChevronRight size={12} className="text-muted-foreground/30 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
          {rec?.probability != null && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                  <div className={cn('h-full rounded-full transition-all', isClosedWon ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${rec.probability}%` }} />
                </div>
              </div>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{rec.probability}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Package size={15} className="text-primary" /> Products &amp; Pricing</h3>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil size={13} className="mr-1.5" /> Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setItems(initialItems); setDirty(false); setEditing(false) }}>Cancel</Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                  Save
                </Button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products linked yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <span className="col-span-5">Product</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">List Price</span>
                <span className="col-span-2 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              {items.map((i, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  {editing ? (
                    <>
                      <select
                        className="col-span-5 h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={i.productId}
                        onChange={e => {
                          const p = allProducts.find((x: any) => x.id === e.target.value)
                          setItems(items.map((x, k) => k === idx ? { ...x, productId: e.target.value, productName: p?.productName || '', listPrice: p ? Number(p.unitPrice || 0) : x.listPrice } : x))
                          setDirty(true)
                        }}
                      >
                        <option value="">Select product…</option>
                        {allProducts.map((p: any) => <option key={p.id} value={p.id}>{p.productName}</option>)}
                      </select>
                      <Input type="number" min={1} className="col-span-2 h-9" value={i.qty} onChange={e => { setItems(items.map((x, k) => k === idx ? { ...x, qty: Number(e.target.value) || 0 } : x)); setDirty(true) }} />
                      <Input type="number" className="col-span-2 h-9" value={i.listPrice} onChange={e => { setItems(items.map((x, k) => k === idx ? { ...x, listPrice: Number(e.target.value) || 0 } : x)); setDirty(true) }} />
                    </>
                  ) : (
                    <>
                      <span className="col-span-5 text-sm truncate">{i.productName}</span>
                      <span className="col-span-2 text-sm">{i.qty}</span>
                      <span className="col-span-2 text-sm">{(i.listPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </>
                  )}
                  <span className="col-span-2 text-right text-sm font-medium">{lineTotal(i).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  {editing && (
                    <button type="button" className="col-span-1 text-muted-foreground hover:text-destructive" onClick={() => { setItems(items.filter((_, k) => k !== idx)); setDirty(true) }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 px-2">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-sm font-semibold">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
          {editing && (
            <Button variant="outline" size="sm" className="mt-3" onClick={addRow}><Plus size={13} className="mr-1.5" /> Add Product</Button>
          )}
          {!editing && items.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={addRow}><Plus size={13} className="mr-1.5" /> Link Product</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><History size={15} className="text-primary" /> Sales Stage History</h3>
          {stageHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
          ) : (
            <ol className="relative border-l-2 border-muted ml-2 space-y-4">
              {stageHistory.map((h: any, idx: number) => (
                <li key={h.id} className="ml-4">
                  <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-background ${idx === stageHistory.length - 1 ? 'bg-emerald-500' : 'bg-primary'}`} />
                  <p className="text-sm font-medium">{h.stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(h.createdAt)}
                    {h.changedByUser ? ` · by ${h.changedByUser.firstName} ${h.changedByUser.lastName}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {competitors.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Target size={15} className="text-rose-500" /> Competitors</h3>
            <div className="space-y-2">
              {competitors.map((c: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name || c.competitorName || 'Unknown'}</p>
                    {c.notes && <p className="text-xs text-muted-foreground truncate">{c.notes}</p>}
                  </div>
                  {c.threatLevel && (
                    <span className={cn(
                      'shrink-0 ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      c.threatLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      c.threatLevel === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}>
                      {c.threatLevel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLost && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><AlertTriangle size={15} className="text-amber-500" /> Loss Analysis</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loss Reason</label>
                <p className="text-sm font-medium mt-1">{lossReason || rec?.outcomeAnalysis || 'Not specified'}</p>
              </div>
              {rec?.stageHistory?.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Active Stage</label>
                  <p className="text-sm font-medium mt-1">{rec.stageHistory[rec.stageHistory.length - 2]?.stage || '-'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(nextFollowUp || contactRole || decisionMaker) && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Clock size={15} className="text-blue-500" /> Follow-up</h3>
            <div className="space-y-3">
              {nextFollowUp && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Follow-up</label>
                  <p className="text-sm font-medium mt-1">{formatDate(nextFollowUp)}</p>
                </div>
              )}
              {contactRole && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Role</label>
                  <p className="text-sm font-medium mt-1">{contactRole}</p>
                </div>
              )}
              {decisionMaker != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Decision Maker</span>
                  {decisionMaker ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">No</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  )
}

function TicketExtras({ record }: { record: any }) {
  if (!record) return null
  const slaDeadline = record.slaDeadline || record.slaDeadlineDate
  const escalationLevel = record.escalationLevel
  const satisfactionRating = record.satisfactionRating
  const autoAssigned = record.autoAssigned

  let slaColor = 'text-muted-foreground'
  let slaBg = 'bg-muted'
  let slaLabel = ''
  if (slaDeadline) {
    const now = new Date()
    const deadline = new Date(slaDeadline)
    const diffMs = deadline.getTime() - now.getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)
    if (diffHrs < 0) {
      slaColor = 'text-red-600 dark:text-red-400'
      slaBg = 'bg-red-100 dark:bg-red-900/30'
      slaLabel = 'Overdue'
    } else if (diffHrs < 2) {
      slaColor = 'text-amber-600 dark:text-amber-400'
      slaBg = 'bg-amber-100 dark:bg-amber-900/30'
      slaLabel = `${Math.round(diffHrs * 60)}m remaining`
    } else {
      slaColor = 'text-emerald-600 dark:text-emerald-400'
      slaBg = 'bg-emerald-100 dark:bg-emerald-900/30'
      slaLabel = `${Math.round(diffHrs)}h remaining`
    }
  }

  const hasExtras = slaDeadline || escalationLevel || satisfactionRating != null || autoAssigned != null
  if (!hasExtras) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><Shield size={15} className="text-primary" /> Ticket Support Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {slaDeadline && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA Deadline</label>
              <div className="mt-1.5">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', slaBg, slaColor)}>
                  <Timer size={13} /> {slaLabel}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(slaDeadline)}</p>
              </div>
            </div>
          )}
          {escalationLevel && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Escalation Level</label>
              <div className="mt-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  escalationLevel === 'Critical' || escalationLevel === '3' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  escalationLevel === 'High' || escalationLevel === '2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )}>
                  <AlertCircle size={12} /> Level {escalationLevel}
                </span>
              </div>
            </div>
          )}
          {satisfactionRating != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Satisfaction</label>
              <div className="mt-1.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16} className={s <= Number(satisfactionRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                ))}
                <span className="ml-1.5 text-xs text-muted-foreground">{satisfactionRating}/5</span>
              </div>
            </div>
          )}
          {autoAssigned != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto-Assigned</label>
              <div className="mt-1.5">
                {autoAssigned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Zap size={12} /> Auto-assigned
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Manual
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceExtras({ record }: { record: any }) {
  if (!record) return null
  const status = record.serviceStatus || record.status
  const slaResponseHours = record.slaResponseHours
  const slaResolutionHours = record.slaResolutionHours
  const billingCycle = record.billingCycle
  const setupFee = record.setupFee

  const hasExtras = status || slaResponseHours || slaResolutionHours || billingCycle || setupFee
  if (!hasExtras) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><Zap size={15} className="text-primary" /> Service Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {status && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="mt-1.5">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  status === 'Inactive' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  status === 'Discontinued' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {status}
                </span>
              </div>
            </div>
          )}
          {(slaResponseHours || slaResolutionHours) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA Targets</label>
              <div className="mt-1.5 space-y-1">
                {slaResponseHours && <p className="text-sm font-medium">Response: {slaResponseHours}h</p>}
                {slaResolutionHours && <p className="text-sm font-medium">Resolution: {slaResolutionHours}h</p>}
              </div>
            </div>
          )}
          {billingCycle && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Billing Cycle</label>
              <p className="text-sm font-medium mt-1.5">{billingCycle}</p>
            </div>
          )}
          {setupFee != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setup Fee</label>
              <p className="text-sm font-medium mt-1.5">{formatMoney(setupFee)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function VendorExtras({ record }: { record: any }) {
  if (!record) return null
  const rating = record.rating
  const contactPerson = record.contactPerson
  const contactEmail = record.contactEmail
  const contactPhone = record.contactPhone
  const paymentTerms = record.paymentTerms

  const hasExtras = rating || contactPerson || contactEmail || contactPhone || paymentTerms
  if (!hasExtras) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><Building2 size={15} className="text-primary" /> Vendor Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rating && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</label>
              <div className="mt-1.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16} className={s <= Number(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                ))}
                <span className="ml-1.5 text-xs text-muted-foreground">{rating}/5</span>
              </div>
            </div>
          )}
          {(contactPerson || contactEmail || contactPhone) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Person</label>
              <div className="mt-1.5 space-y-0.5">
                {contactPerson && <p className="text-sm font-medium">{contactPerson}</p>}
                {contactEmail && <p className="text-xs text-muted-foreground">{contactEmail}</p>}
                {contactPhone && <p className="text-xs text-muted-foreground">{contactPhone}</p>}
              </div>
            </div>
          )}
          {paymentTerms && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</label>
              <p className="text-sm font-medium mt-1.5">{paymentTerms}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PriceBookExtras({ record }: { record: any }) {
  if (!record) return null
  const currency = record.currency
  const conversionRate = record.conversionRate
  const validFrom = record.validFrom
  const validUntil = record.validUntil
  const discountAllowed = record.discountAllowed
  const maxDiscountPercent = record.maxDiscountPercent

  const hasExtras = currency || validFrom || validUntil || discountAllowed != null || maxDiscountPercent
  if (!hasExtras) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><CircleDollarSign size={15} className="text-primary" /> Pricing Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currency && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Currency</label>
              <div className="mt-1.5">
                <p className="text-sm font-medium">{currency}</p>
                {conversionRate && <p className="text-xs text-muted-foreground">Rate: {conversionRate}</p>}
              </div>
            </div>
          )}
          {(validFrom || validUntil) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Validity Period</label>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                <Calendar size={14} className="text-muted-foreground" />
                <span>{validFrom ? formatDate(validFrom) : '—'}</span>
                <span className="text-muted-foreground">→</span>
                <span>{validUntil ? formatDate(validUntil) : '—'}</span>
              </div>
            </div>
          )}
          {(discountAllowed != null || maxDiscountPercent) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount Settings</label>
              <div className="mt-1.5 space-y-1">
                {discountAllowed != null && (
                  <div className="flex items-center gap-1.5">
                    <Percent size={13} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{discountAllowed ? 'Discounts Allowed' : 'No Discounts'}</span>
                  </div>
                )}
                {maxDiscountPercent && <p className="text-xs text-muted-foreground">Max: {maxDiscountPercent}%</p>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AssetExtras({ record }: { record: any }) {
  if (!record) return null
  const purchaseDate = record.purchaseDate
  const purchasePrice = record.purchasePrice
  const warrantyType = record.warrantyType
  const warrantyEndDate = record.warrantyEndDate
  const lastMaintenanceDate = record.lastMaintenanceDate
  const nextMaintenanceDate = record.nextMaintenanceDate
  const location = record.location
  const department = record.department
  const depreciationMethod = record.depreciationMethod
  const depreciationValue = record.depreciationValue

  let warrantyColor = 'text-muted-foreground'
  let warrantyBg = 'bg-muted'
  let warrantyLabel = ''
  if (warrantyEndDate) {
    const now = new Date()
    const end = new Date(warrantyEndDate)
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) {
      warrantyColor = 'text-red-600 dark:text-red-400'
      warrantyBg = 'bg-red-100 dark:bg-red-900/30'
      warrantyLabel = 'Expired'
    } else if (diffDays < 30) {
      warrantyColor = 'text-amber-600 dark:text-amber-400'
      warrantyBg = 'bg-amber-100 dark:bg-amber-900/30'
      warrantyLabel = `${diffDays}d left`
    } else {
      warrantyColor = 'text-emerald-600 dark:text-emerald-400'
      warrantyBg = 'bg-emerald-100 dark:bg-emerald-900/30'
      warrantyLabel = `${Math.round(diffDays / 30)}mo left`
    }
  }

  const hasExtras = purchaseDate || purchasePrice || warrantyType || warrantyEndDate || lastMaintenanceDate || nextMaintenanceDate || location || department || depreciationMethod
  if (!hasExtras) return null

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><Wrench size={15} className="text-primary" /> Asset Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(purchaseDate || purchasePrice) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Info</label>
              <div className="mt-1.5 space-y-0.5">
                {purchaseDate && <p className="text-sm font-medium">{formatDate(purchaseDate)}</p>}
                {purchasePrice != null && <p className="text-sm font-medium">{formatMoney(purchasePrice)}</p>}
              </div>
            </div>
          )}
          {(warrantyType || warrantyEndDate) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warranty</label>
              <div className="mt-1.5 space-y-1">
                {warrantyType && <p className="text-sm font-medium">{warrantyType}</p>}
                {warrantyEndDate && (
                  <div>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', warrantyBg, warrantyColor)}>
                      {warrantyLabel}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">Until {formatDate(warrantyEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {(lastMaintenanceDate || nextMaintenanceDate) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Maintenance</label>
              <div className="mt-1.5 space-y-0.5">
                {lastMaintenanceDate && <p className="text-xs text-muted-foreground">Last: {formatDate(lastMaintenanceDate)}</p>}
                {nextMaintenanceDate && <p className="text-sm font-medium">Next: {formatDate(nextMaintenanceDate)}</p>}
              </div>
            </div>
          )}
          {(location || department) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</label>
              <div className="mt-1.5 flex items-start gap-1.5">
                <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  {location && <p className="text-sm font-medium">{location}</p>}
                  {department && <p className="text-xs text-muted-foreground">{department}</p>}
                </div>
              </div>
            </div>
          )}
          {(depreciationMethod || depreciationValue) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Depreciation</label>
              <div className="mt-1.5 space-y-0.5">
                {depreciationMethod && <p className="text-sm font-medium">{depreciationMethod}</p>}
                {depreciationValue != null && <p className="text-xs text-muted-foreground">{depreciationValue}%</p>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectExtras({ record, relatedTaskList, relatedMilestoneList, relatedTimeList, users, navigate, id }: { record: any; relatedTaskList: any[]; relatedMilestoneList: any[]; relatedTimeList: any[]; users: any[]; navigate: any; id: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [resourceForm, setResourceForm] = useState({ userId: '', role: '', allocationPercent: 100 })
  if (!record) return null
  const healthStatus = record.healthStatus
  const budgetType = record.budgetType
  const billingRate = record.billingRate
  const estimatedHours = record.estimatedHours
  const actualHours = record.actualHours
  const resources = record.resources || record.teamMembers || []

  let healthColor = 'bg-muted text-muted-foreground'
  if (healthStatus === 'On Track') healthColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  else if (healthStatus === 'At Risk') healthColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  else if (healthStatus === 'Off Track') healthColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  const addResource = async () => {
    if (!resourceForm.userId) return
    try {
      await api.request(`/projects/${id}/resources`, { method: 'POST', body: JSON.stringify(resourceForm) })
      setResourceForm({ userId: '', role: '', allocationPercent: 100 })
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      addToast({ title: 'Project resource added', variant: 'success' })
    } catch (error: any) { addToast({ title: 'Resource not added', description: error.message, variant: 'destructive' }) }
  }
  const removeResource = async (resourceId: string) => {
    try {
      await api.request(`/projects/${id}/resources/${resourceId}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      addToast({ title: 'Project resource removed', variant: 'success' })
    } catch (error: any) { addToast({ title: 'Resource not removed', description: error.message, variant: 'destructive' }) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><ActivityIcon size={15} className="text-primary" /> Project Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthStatus && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Health Status</label>
                <div className="mt-1.5">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', healthColor)}>
                    {healthStatus === 'On Track' && <CheckCircle2 size={12} className="mr-1" />}
                    {healthStatus === 'At Risk' && <AlertTriangle size={12} className="mr-1" />}
                    {healthStatus === 'Off Track' && <AlertCircle size={12} className="mr-1" />}
                    {healthStatus}
                  </span>
                </div>
              </div>
            )}
            {(budgetType || billingRate) && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget & Billing</label>
                <div className="mt-1.5 space-y-0.5">
                  {budgetType && <p className="text-sm font-medium">{budgetType}</p>}
                  {billingRate != null && <p className="text-xs text-muted-foreground">${billingRate}/hr</p>}
                </div>
              </div>
            )}
            {(estimatedHours || actualHours) && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</label>
                <div className="mt-1.5 space-y-1">
                  {estimatedHours && <p className="text-sm font-medium">Est: {estimatedHours}h</p>}
                  {actualHours != null && (
                    <p className={cn('text-sm font-medium', actualHours > estimatedHours ? 'text-red-600 dark:text-red-400' : '')}>
                      Actual: {actualHours}h
                    </p>
                  )}
                  {estimatedHours && actualHours != null && (
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full', actualHours > estimatedHours ? 'bg-red-500' : 'bg-emerald-500')}
                        style={{ width: `${Math.min(100, (actualHours / estimatedHours) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {resources.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resources ({resources.length})</label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {resources.slice(0, 5).map((r: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {typeof r === 'string' ? r : (r.name || r.firstName || `R${idx + 1}`)}
                    </span>
                  ))}
                  {resources.length > 5 && <span className="text-xs text-muted-foreground">+{resources.length - 5}</span>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold flex items-center gap-1.5"><Users size={15} className="text-primary" /> Project Resources</h3><p className="text-xs text-muted-foreground mt-1">Assign organization users and control their project allocation.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{resources.length} assigned</span></div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_110px_auto]">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={resourceForm.userId} onChange={e => setResourceForm({ ...resourceForm, userId: e.target.value })}><option value="">Select user…</option>{users.map((user: any) => <option key={user.id} value={user.id}>{userDisplayName(user)}</option>)}</select>
            <Input placeholder="Project role" value={resourceForm.role} onChange={e => setResourceForm({ ...resourceForm, role: e.target.value })} />
            <Input aria-label="Allocation percent" type="number" min={1} max={100} value={resourceForm.allocationPercent} onChange={e => setResourceForm({ ...resourceForm, allocationPercent: Number(e.target.value) })} />
            <Button onClick={addResource} disabled={!resourceForm.userId}><Plus size={14} className="mr-1.5" />Add</Button>
          </div>
          {!resources.length ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No resources assigned yet.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{resources.map((resource: any) => { const user = users.find((item: any) => item.id === resource.userId); return <div key={resource.id} className="flex items-center gap-3 rounded-xl border bg-muted/10 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{(userDisplayName(user || {}).charAt(0) || 'U').toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user ? userDisplayName(user) : 'Organization user'}</p><p className="text-xs text-muted-foreground">{resource.role || 'Team member'} · {resource.allocationPercent || 100}%</p></div><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeResource(resource.id)}><Trash2 size={14} /></Button></div> })}</div>}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Related Tasks</h3>
              <button type="button" onClick={() => navigate(`/projecttasks/new?projectId=${id}`)} className="text-xs font-medium text-primary hover:underline">
                + Add Task
              </button>
            </div>
            {relatedTaskList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedTaskList.map((t: any) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/projecttasks/${t.id}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                  >
                    <span className="truncate font-medium">{t.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {t.status && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t.status}</span>}
                      {t.progress != null && <span className="text-xs text-muted-foreground">{t.progress}%</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Related Milestones</h3>
              <button type="button" onClick={() => navigate(`/projectmilestones/new?projectId=${id}`)} className="text-xs font-medium text-primary hover:underline">
                + Add Milestone
              </button>
            </div>
            {relatedMilestoneList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedMilestoneList.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate(`/projectmilestones/${m.id}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                  >
                    <span className="truncate font-medium">{m.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {m.status && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{m.status}</span>}
                      {m.progress != null && <span className="text-xs text-muted-foreground">{m.progress}%</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card><CardContent className="p-5"><div className="flex items-center justify-between gap-2 mb-3"><div><h3 className="text-sm font-semibold flex items-center gap-1.5"><Clock size={15} className="text-primary" /> Time Tracking</h3><p className="text-xs text-muted-foreground mt-1">{relatedTimeList.reduce((sum, entry) => sum + Number(entry.hours || 0), 0).toFixed(2)} total hours logged</p></div><Button size="sm" variant="outline" onClick={() => navigate(`/timeentries/new?projectId=${id}`)}><Plus size={14} className="mr-1.5" />Log time</Button></div>{!relatedTimeList.length ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No time entries yet.</p> : <div className="space-y-2">{relatedTimeList.slice(0, 10).map((entry: any) => <button key={entry.id} onClick={() => navigate(`/timeentries/${entry.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-muted/30"><span className="min-w-0"><span className="block truncate text-sm font-medium">{entry.description || 'Time entry'}</span><span className="text-xs text-muted-foreground">{entry.date ? formatDate(entry.date) : ''}</span></span><span className="font-semibold text-primary">{Number(entry.hours || 0).toFixed(2)}h</span></button>)}</div>}</CardContent></Card>
    </div>
  )
}

function QuoteExtras({ record, id }: { record: any; id: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  if (!record) return null
  const approvalStatus = record.approvalStatus || record.quoteStage
  const rejectionReason = record.rejectionReason
  const quoteType = record.quoteType
  const paymentTerms = record.paymentTerms
  const deliveryTerms = record.deliveryTerms

  const approveMutation = useMutation({
    mutationFn: () => api.update('quotes', id, { approvalStatus: 'Approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      addToast({ title: 'Quote Approved', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const rejectMutation = useMutation({
    mutationFn: () => api.update('quotes', id, { approvalStatus: 'Rejected', rejectionReason: 'Rejected by manager' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      addToast({ title: 'Quote Rejected', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const hasExtras = approvalStatus || quoteType || paymentTerms || deliveryTerms
  if (!hasExtras) return null

  const stageColors: Record<string, string> = {
    Created: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Delivered: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Draft: 'bg-muted text-muted-foreground',
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><FileText size={15} className="text-primary" /> Quote Workflow</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvalStatus && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approval Status</label>
              <div className="mt-1.5">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', stageColors[approvalStatus] || 'bg-muted text-muted-foreground')}>
                  {approvalStatus === 'Accepted' || approvalStatus === 'Approved' ? <CheckCircle2 size={12} className="mr-1" /> : null}
                  {approvalStatus === 'Rejected' ? <X size={12} className="mr-1" /> : null}
                  {approvalStatus}
                </span>
              </div>
            </div>
          )}
          {rejectionReason && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejection Reason</label>
              <p className="text-sm font-medium mt-1.5 text-red-600 dark:text-red-400">{rejectionReason}</p>
            </div>
          )}
          {quoteType && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quote Type</label>
              <p className="text-sm font-medium mt-1.5">{quoteType}</p>
            </div>
          )}
          {paymentTerms && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</label>
              <p className="text-sm font-medium mt-1.5">{paymentTerms}</p>
            </div>
          )}
          {deliveryTerms && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivery Terms</label>
              <p className="text-sm font-medium mt-1.5">{deliveryTerms}</p>
            </div>
          )}
        </div>
        {approvalStatus && approvalStatus !== 'Approved' && approvalStatus !== 'Rejected' && approvalStatus !== 'Accepted' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button size="sm" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {approveMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <X size={14} className="mr-1.5" />}
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InvoiceExtras({ record }: { record: any }) {
  if (!record) return null
  const collectionStatus = record.collectionStatus
  const paymentTerms = record.paymentTerms
  const lateFee = record.lateFee
  const reminderStatus = record.reminderStatus
  const dueDate = record.dueDate

  let overdueColor = ''
  if (dueDate && record.invoiceStatus !== 'Paid') {
    const now = new Date()
    const due = new Date(dueDate)
    if (due < now) overdueColor = 'text-red-600 dark:text-red-400'
  }

  const hasExtras = collectionStatus || paymentTerms || lateFee != null || reminderStatus
  if (!hasExtras) return null

  const collectionColors: Record<string, string> = {
    Current: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Partially Paid': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      'Written Off': 'bg-muted text-muted-foreground',
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><DollarSign size={15} className="text-primary" /> Collection Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collectionStatus && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="mt-1.5">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', collectionColors[collectionStatus] || 'bg-muted text-muted-foreground')}>
                  {collectionStatus === 'Paid' && <CheckCircle2 size={12} className="mr-1" />}
                  {collectionStatus === 'Overdue' && <AlertCircle size={12} className="mr-1" />}
                  {collectionStatus}
                </span>
              </div>
            </div>
          )}
          {paymentTerms && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</label>
              <p className="text-sm font-medium mt-1.5">{paymentTerms}</p>
            </div>
          )}
          {lateFee != null && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Late Fee</label>
              <p className={cn('text-sm font-medium mt-1.5', overdueColor)}>
                {formatMoney(lateFee)}
              </p>
            </div>
          )}
          {reminderStatus && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reminder Status</label>
              <p className="text-sm font-medium mt-1.5">{reminderStatus}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
