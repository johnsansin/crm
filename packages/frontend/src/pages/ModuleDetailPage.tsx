import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import { useOrgSettings } from '@/lib/org-format'
import { ProjectSearchSelect } from '@/components/project-search-select'
import { UserRoleSelect, userDisplayName } from '@/components/user-role-select'
import { SearchSelect } from '@/components/search-select'
import { VendorSearchSelect } from '@/components/vendor-search-select'
import { AccountSearchSelect } from '@/components/account-search-select'
import { ContactSearchSelect } from '@/components/contact-search-select'
import { ProductSearchSelect } from '@/components/product-search-select'
import { DateField } from '@/components/ui/date-field'
import { ArrowLeft, Save, Loader2, Trash2, Pencil, ChevronRight, Asterisk, ImagePlus, Plus, Package, History, GitMerge } from 'lucide-react'
import { MergeRecordsDialog, MERGEABLE_MODULES } from '@/components/merge-records-dialog'
import { fieldConfigs } from '@/lib/module-fields'

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
  smsnotifier: 'SMS Notifier'
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


function formatDisplayValue(value: any, type: string, name?: string) {
  if (value == null || value === '') return '-'
  if (type === 'user-select' && name === 'assignedTo') return value
  if (type === 'checkbox') return value ? 'Yes' : 'No'
  return formatFieldValue(value, name || '')
}

export function ModuleDetailPage() {
  useOrgSettings()
  const { module, id } = useParams<{ module: string; id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const isNew = !id || id === 'new'
  const isEditMode = isNew || searchParams.get('edit') === 'true' || window.location.pathname.endsWith('/edit')
  const mod = module || (window.location.pathname.split('/').filter(Boolean)[0] || '')

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)

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

  const needsProducts = mod === 'tickets' || mod === 'assets'
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

  const DRAFT_KEY = `draft_${mod}`

  useEffect(() => {
    if (isNew) {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try { setFormData(JSON.parse(saved)); return } catch {}
      }
      const preseed: Record<string, any> = {}
      for (const f of fieldConfigs[mod] || []) {
        const qv = searchParams.get(f.name)
        if (qv) preseed[f.name] = qv
      }
      setFormData(preseed)
    } else if (record) {
      setFormData(formatRecordForForm(record))
    }
  }, [record, isNew])

  useEffect(() => {
    if (isNew && Object.keys(formData).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
    }
  }, [formData, isNew])

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
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const config = fieldConfigs[mod] || []
    const newErrors: Record<string, string> = {}
    for (const field of config) {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'This field is required'
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    const payload: Record<string, any> = {}
    for (const field of config) {
      const val = formData[field.name]
      if (field.type === 'date' && val) {
        payload[field.name] = new Date(val + 'T12:00:00').toISOString()
      } else if (field.type === 'checkbox') {
        payload[field.name] = !!val
      } else if ((field.type === 'number') && (val === '' || val == null)) {
        payload[field.name] = null
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

  const label = labelMap[mod] || mod
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
                  <ChevronRight size={12} /> Details
                </p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{record?.[fields[0]?.name] || label}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/${mod}/${id}?edit=true`)}>
                <Pencil size={16} className="mr-2" /> <span className="hidden sm:inline">Edit</span>
              </Button>
              {MERGEABLE_MODULES.includes(mod) && (
                <Button variant="outline" onClick={() => setMergeOpen(true)}>
                  <GitMerge size={16} className="mr-2" /> <span className="hidden sm:inline">Merge</span>
                </Button>
              )}
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 size={16} className="mr-2" /> <span className="hidden sm:inline">Delete</span>
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
                            {(field as any).label || getFieldLabel(field.name)}
                          </label>
                          {field.name === 'image' && record?.image ? (
                            <img src={record.image} alt={record.productName || record.firstName || 'Image'} className="mt-1.5 h-20 w-20 rounded-lg border object-cover" />
                          ) : (
                          <p className="text-sm mt-1.5 font-medium text-foreground">
                            {field.name === 'projectId'
                              ? (projects.find(p => p.id === record?.projectId)?.projectName || '-')
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
        {mod === 'potentials' && !isNew && <PotentialExtras potentialId={id!} />}
        {['accounts', 'contacts', 'campaigns', 'servicecontracts'].includes(mod) && !isNew && <RelatedRecords mod={mod} id={id!} />}
        {mod === 'projects' && !isNew && (
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
        )}
        <ConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Record"
          description={`Are you sure you want to delete this ${label}?`}
          confirmLabel="Delete"
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
                {isNew ? `Create New ${label}` : `Edit ${label}`}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below and save to {isNew ? 'create this' : 'update the'} record.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Asterisk size={13} className="text-destructive" /> Required fields
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-0">
            <FormTabs
              module={mod}
              fields={fields}
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              SELECT_OPTIONS={dynamicOptions}
              projects={projects}
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
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => { localStorage.removeItem(DRAFT_KEY); navigate(isNew ? `/${mod}` : `/${mod}/${id}`) }}>Cancel</Button>
          {!isNew && (
            <Button type="button" variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          )}
          <Button type="submit" disabled={saveMutation.isPending}>
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
        title="Delete Record"
        description={`Are you sure you want to delete this ${label}?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}

function FormTabs({ module, fields, formData, errors, handleChange, SELECT_OPTIONS: options, projects, users = [], roles = [], vendors = [], accounts = [], allContacts = [], products = [], currencies = [], uploadingImage = false, onUploadImage, onAddVendor, onOpenVendorFullForm, onOpenAccountFullForm, customFields = [] }: {
  module: string; fields: any[]; formData: any; errors: any; handleChange: any; SELECT_OPTIONS: any; projects: any[]; users?: any[]; roles?: any[]; vendors?: any[]; accounts?: any[]; allContacts?: any[]; products?: any[]; currencies?: any[]; uploadingImage?: boolean; onUploadImage?: (file: File) => void; onAddVendor?: () => void; onOpenVendorFullForm?: () => void; onOpenAccountFullForm?: () => void; customFields?: any[]
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
                    {field.label || getFieldLabel(field.name)}
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
                      <span className="text-sm text-muted-foreground">{field.label || getFieldLabel(field.name)}</span>
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

function PotentialExtras({ potentialId }: { potentialId: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: rec, isLoading } = useQuery({
    queryKey: ['potentials', potentialId],
    queryFn: () => api.get('potentials', potentialId!),
  })

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

  return (
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
                    {new Date(h.createdAt).toLocaleString()}
                    {h.changedByUser ? ` · by ${h.changedByUser.firstName} ${h.changedByUser.lastName}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
