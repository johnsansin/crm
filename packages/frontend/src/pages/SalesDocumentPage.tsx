import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, Trash2, Plus, FileDown, Mail, Search, Copy, Building2, Users, ShoppingCart, MessageSquare, FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, useOrgSettings } from '@/lib/org-format'
import { ProductSearchSelect } from '@/components/product-search-select'
import { ServiceSearchSelect } from '@/components/service-search-select'

type DocModule = 'salesorders' | 'invoices'

interface DocConfig {
  label: string
  listTitle: string
  noField: string
  noPrefix: string
  stageField: string
  stages: string[]
  detailFields: { name: string; type: 'text' | 'date' | 'select' | 'number' | 'lookup'; label?: string; span2?: boolean }[]
  showRecurring?: boolean
  showCarrier?: boolean
  showQuoteLink?: boolean
  showSalesOrderLink?: boolean
  listColumns: any[]
}

const CONFIGS: Record<DocModule, DocConfig> = {
  salesorders: {
    label: 'Sales Order',
    listTitle: 'Sales Orders',
    noField: 'salesOrderNo',
    noPrefix: 'SO-',
    stageField: 'soStatus',
    stages: ['--None--', 'Created', 'Approved', 'Delivered', 'Cancelled'],
    showRecurring: true,
    showCarrier: true,
    showQuoteLink: true,
    detailFields: [
      { name: 'subject', type: 'text', label: 'Subject' },
      { name: 'salesOrderNo', type: 'text', label: 'Sales Order No' },
      { name: 'validUntil', type: 'date', label: 'Valid Till / Due Date' },
      { name: 'soStatus', type: 'select', label: 'Status' },
      { name: 'carrier', type: 'text', label: 'Carrier' },
      { name: 'customerNo', type: 'text', label: 'Customer No' },
      { name: 'purchaseOrderNo', type: 'text', label: 'Purchase Order No' },
      { name: 'salesCommission', type: 'number', label: 'Sales Commission' },
      { name: 'exciseDuty', type: 'number', label: 'Excise Duty' },
      { name: 'taxType', type: 'select', label: 'Tax Type' },
      { name: 'accountId', type: 'lookup', label: 'Account' },
      { name: 'contactId', type: 'lookup', label: 'Contact' },
      { name: 'potentialId', type: 'lookup', label: 'Potential' },
      { name: 'quoteId', type: 'lookup', label: 'Quote Name' },
    ],
    listColumns: [
      { key: 'salesOrderNo', label: 'SO No', render: (v: any) => <span className="font-medium">{v || '-'}</span> },
      { key: 'subject', label: 'Subject' },
      { key: 'grandTotal', label: 'Amount', render: (v: any) => <span className="font-medium">${Number(v || 0).toFixed(2)}</span> },
      { key: 'soStatus', label: 'Status', render: (v: any) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : v === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
          {v || 'Created'}
        </span>
      )},
      { key: 'validUntil', label: 'Valid Till', render: (v: any) => <span className="text-muted-foreground">{v ? formatDate(v) : '-'}</span> },
      { key: 'createdAt', label: 'Created', render: (v: any) => <span className="text-muted-foreground">{formatDate(v)}</span> },
    ],
  },
  invoices: {
    label: 'Invoice',
    listTitle: 'Invoices',
    noField: 'invoiceNo',
    noPrefix: 'INV-',
    stageField: 'invoiceStatus',
    stages: ['--None--', 'Created', 'Sent', 'Partially Paid', 'Paid', 'Cancelled', 'Credit'],
    showSalesOrderLink: true,
    detailFields: [
      { name: 'subject', type: 'text', label: 'Subject' },
      { name: 'invoiceNo', type: 'text', label: 'Invoice No' },
      { name: 'invoiceDate', type: 'date', label: 'Invoice Date' },
      { name: 'dueDate', type: 'date', label: 'Due Date' },
      { name: 'invoiceStatus', type: 'select', label: 'Status' },
      { name: 'customerNo', type: 'text', label: 'Customer No' },
      { name: 'purchaseOrderNo', type: 'text', label: 'Purchase Order No' },
      { name: 'salesCommission', type: 'number', label: 'Sales Commission' },
      { name: 'exciseDuty', type: 'number', label: 'Excise Duty' },
      { name: 'taxType', type: 'select', label: 'Tax Type' },
      { name: 'accountId', type: 'lookup', label: 'Account' },
      { name: 'contactId', type: 'lookup', label: 'Contact' },
      { name: 'salesOrderId', type: 'lookup', label: 'Sales Order' },
      { name: 'quoteId', type: 'lookup', label: 'Quote Name' },
    ],
    listColumns: [
      { key: 'invoiceNo', label: 'Invoice No', render: (v: any) => <span className="font-medium">{v || '-'}</span> },
      { key: 'subject', label: 'Subject' },
      { key: 'invoiceStatus', label: 'Status', render: (v: any) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${v === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : v === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
          {v || 'Created'}
        </span>
      )},
      { key: 'invoiceDate', label: 'Invoice Date', render: (v: any) => <span className="text-muted-foreground">{v ? formatDate(v) : '-'}</span> },
      { key: 'grandTotal', label: 'Amount', render: (v: any) => <span className="font-medium">${Number(v || 0).toFixed(2)}</span> },
      { key: 'createdAt', label: 'Created', render: (v: any) => <span className="text-muted-foreground">{formatDate(v)}</span> },
    ],
  },
}

const EMPTY_LINE = { productId: '', serviceId: '', itemName: '', qty: 1, listPrice: 0, unitPrice: 0, discount: 0, discountPercent: 0, tax: 0, taxPercent: 0, netPrice: 0, lineTotal: 0, description: '', kind: 'product' }
const TAX_TYPES = ['--None--', 'Individual', 'Group', 'VAT', 'GST', 'Sales Tax']
const RECURRING_FREQUENCIES = ['--None--', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']

const ITEM_LABEL = 'block text-[11px] font-semibold text-slate-900 dark:text-slate-100 mb-1'
const ITEM_INPUT = 'h-8 text-xs'
const ITEM_VALUE = 'h-8 flex items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100'

const TAB_DOT_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500']
const TAB_ACTIVE_COLORS = [
  'data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
  'data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400',
  'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400',
  'data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
]

function calcItem(item: any) {
  const qty = Number(item.qty) || 0
  const unitPrice = Number(item.unitPrice) || 0
  const discountPercent = Number(item.discountPercent) || 0
  const manualDiscount = Number(item.discount) || 0
  const discount = discountPercent > 0 ? (unitPrice * discountPercent / 100) : manualDiscount
  const taxPercent = Number(item.taxPercent) || 0
  const netPrice = unitPrice - discount
  const lineTotal = netPrice * qty
  const tax = lineTotal * taxPercent / 100
  return { ...item, qty, unitPrice, discountPercent, discount, netPrice: Math.max(0, netPrice), lineTotal: Math.max(0, lineTotal), tax: Math.max(0, tax) }
}

export function SalesDocumentPage({ module }: { module: DocModule }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  useOrgSettings()
  const cfg = CONFIGS[module]
  const isNew = !id || id === 'new'

  const [mode, setMode] = useState<'list' | 'form' | 'view'>(id === 'new' ? 'form' : id ? 'view' : 'list')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')

  const [form, setForm] = useState<any>({})
  const [lineItems, setLineItems] = useState<any[]>([{ ...EMPTY_LINE, lineTotal: 0 }])

  const [accounts, setAccounts] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [potentials, setPotentials] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])

  const [related, setRelated] = useState<any>({ invoices: [], comments: [] })
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  const [defaultTerms, setDefaultTerms] = useState('')

  useEffect(() => {
    api.getOrgSettings().then((s: any) => {
      const t = s?.terms?.[module === 'salesorders' ? 'salesOrder' : 'invoice'] || ''
      setDefaultTerms(t)
      if (id === 'new') setForm((prev: any) => (Object.keys(prev).length ? { ...prev, terms: prev.terms || t } : prev))
    }).catch(() => {})
  }, [module, id])

  useEffect(() => {
    Promise.all([
      api.list('accounts').then(r => setAccounts(r.data || [])).catch(() => {}),
      api.list('contacts').then(r => setContacts(r.data || [])).catch(() => {}),
      api.list('potentials').then(r => setPotentials(r.data || [])).catch(() => {}),
      api.list('products').then(r => setProducts(r.data || [])).catch(() => {}),
      api.list('services').then(r => setServices(r.data || [])).catch(() => {}),
      api.request<any>(`/${module}/users`).then(r => setTeam(r.data || [])).catch(() => {}),
      api.list('quotes', { limit: '200' }).then(r => setQuotes(r.data || [])).catch(() => {}),
      api.list('salesorders', { limit: '200' }).then(r => setSalesOrders(r.data || [])).catch(() => {}),
    ])
  }, [module])

  async function loadList() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      if (search) params.set('search', search)
      const res = await api.request<any>(`/${module}?` + params.toString())
      setRecords(res.data || [])
      setPagination(res.pagination)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (mode === 'list' || (!id && mode !== 'form')) loadList() }, [page, mode])

  function emptyForm() {
    const f: any = {}
    for (const fld of cfg.detailFields) {
      if (fld.type === 'number') f[fld.name] = 0
      else f[fld.name] = ''
    }
    f.total = 0; f.subTotal = 0; f.discount = 0; f.discountPercent = 0; f.adjustment = 0
    f.shipping = 0; f.shippingHandling = 0; f.taxAmount = 0; f.grandTotal = 0
    if (cfg.showRecurring) {
      f.enableRecurring = false; f.recurringFrequency = ''; f.startPeriod = ''; f.endPeriod = ''
    }
    if (module === 'invoices') f.notes = ''
    f.terms = defaultTerms; f.description = ''
    f.assignedTo = ''
    ;(['billingStreet','billingCity','billingState','billingCountry','billingPostalCode','billingPoBox',
      'shippingStreet','shippingCity','shippingState','shippingCountry','shippingPostalCode','shippingPoBox']).forEach(k => f[k] = '')
    return f
  }

  async function loadRecord(recordId: string) {
    setLoading(true)
    try {
      const r = await api.request<any>(`/${module}/${recordId}`)
      const f = emptyForm()
      for (const fld of cfg.detailFields) {
        if (fld.type === 'date' && r[fld.name]) f[fld.name] = String(r[fld.name]).split('T')[0]
        else f[fld.name] = r[fld.name] ?? ''
      }
      ;(['total','subTotal','discount','discountPercent','adjustment','shipping','shippingHandling','taxAmount','grandTotal']).forEach(k => { f[k] = r[k] || 0 })
      if (cfg.showRecurring) {
        f.enableRecurring = !!r.enableRecurring
        f.recurringFrequency = r.recurringFrequency || ''
        f.startPeriod = r.startPeriod ? String(r.startPeriod).split('T')[0] : ''
        f.endPeriod = r.endPeriod ? String(r.endPeriod).split('T')[0] : ''
      }
      if (module === 'invoices') f.notes = r.notes || ''
      f.terms = r.terms || ''
      f.description = r.description || ''
      f.assignedTo = r.assignedTo || ''
      ;(['billingStreet','billingCity','billingState','billingCountry','billingPostalCode','billingPoBox',
        'shippingStreet','shippingCity','shippingState','shippingCountry','shippingPostalCode','shippingPoBox']).forEach(k => f[k] = r[k] || '')
      setForm(f)
      setLineItems((r.lineItems || []).map((i: any) => ({
        productId: i.productId || '', serviceId: i.serviceId || '', itemName: i.itemName || '',
        qty: Number(i.qty || 1), listPrice: Number(i.listPrice || 0), unitPrice: Number(i.unitPrice || 0),
        discount: Number(i.discount || 0), discountPercent: Number(i.discountPercent || 0),
        tax: Number(i.tax || 0), taxPercent: Number(i.taxPercent || 0),
        netPrice: Number(i.netPrice || 0), lineTotal: Number(i.lineTotal || 0), description: i.description || '',
        kind: i.serviceId ? 'service' : 'product',
      })))
      setRelated({ invoices: r.invoices || [], comments: r.comments || [] })
      setMode('view')
    } catch { addToast({ title: 'Error', description: 'Failed to load record', variant: 'destructive' }) }
    setLoading(false)
  }

  useEffect(() => {
    if (id && id !== 'new') loadRecord(id)
    else if (id === 'new') {
      setMode('form')
      setForm((prev: any) => {
        if (Object.keys(prev).length) return prev
        const f = emptyForm()
        f[cfg.noField] = cfg.noPrefix + Date.now()
        return f
      })
    }
  }, [id])

  function updateForm(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function updateLineItem(idx: number, field: string, value: any) {
    setLineItems((prev: any[]) => {
      const next = prev.map((item, i) => {
        if (i !== idx) return item
        if (field === 'discountPercent' && (value === 0 || value === '')) return { ...item, discountPercent: 0, discount: 0 }
        return { ...item, [field]: value }
      })
      const computed = next.map(i => calcItem(i))
      const totals = recomputeTotals(computed, form)
      setForm((f: any) => ({ ...f, subTotal: totals.subTotal, taxAmount: totals.tax, grandTotal: totals.grand }))
      return computed
    })
  }

  function recomputeTotals(items: any[], f: any) {
    const subTotal = items.reduce((s, i) => s + i.lineTotal, 0)
    const tax = items.reduce((s, i) => s + i.tax, 0)
    const grand = subTotal + tax + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0)
    return { subTotal, tax, grand }
  }

  function handleTotalsField(field: string, value: number) {
    updateForm(field, value)
    setForm((f: any) => {
      const g = recomputeTotals(lineItems, { ...f, [field]: value })
      return { ...f, [field]: value, grandTotal: g.grand }
    })
  }

  function addLineItem() { setLineItems((prev: any[]) => [...prev, { ...EMPTY_LINE, kind: 'product' }]) }

  function addServiceLineItem() { setLineItems((prev: any[]) => [...prev, { ...EMPTY_LINE, kind: 'service' }]) }

  function removeLineItem(idx: number) {
    setLineItems((prev: any[]) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) next.push({ ...EMPTY_LINE })
      const computed = next.map(i => calcItem(i))
      const totals = recomputeTotals(computed, form)
      setForm((f: any) => ({ ...f, subTotal: totals.subTotal, taxAmount: totals.tax, grandTotal: totals.grand }))
      return computed
    })
  }

  function handleProductSelect(idx: number, productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setLineItems((prev: any[]) => {
        const next = [...prev]
        next[idx] = calcItem({
          ...next[idx],
          productId, serviceId: '', kind: 'product',
          itemName: product.productName || product.productCode || '',
          listPrice: Number(product.unitPrice || product.listPrice || 0),
          unitPrice: Number(product.unitPrice || product.listPrice || 0),
        })
        const computed = next.map(i => calcItem(i))
        const totals = recomputeTotals(computed, form)
        setForm((f: any) => ({ ...f, subTotal: totals.subTotal, taxAmount: totals.tax, grandTotal: totals.grand }))
        return computed
      })
    }
  }

  function handleServiceSelect(idx: number, serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setLineItems((prev: any[]) => {
        const next = [...prev]
        next[idx] = calcItem({
          ...next[idx],
          productId: '', serviceId, kind: 'service',
          itemName: service.serviceName || service.serviceNo || '',
          listPrice: Number(service.unitPrice || 0),
          unitPrice: Number(service.unitPrice || 0),
        })
        const computed = next.map(i => calcItem(i))
        const totals = recomputeTotals(computed, form)
        setForm((f: any) => ({ ...f, subTotal: totals.subTotal, taxAmount: totals.tax, grandTotal: totals.grand }))
        return computed
      })
    }
  }

  function toggleItemKind(idx: number, kind: 'product' | 'service') {
    setLineItems((prev: any[]) => {
      const next = [...prev]
      next[idx] = { ...next[idx], kind, productId: '', serviceId: '' }
      const computed = next.map(i => calcItem(i))
      const totals = recomputeTotals(computed, form)
      setForm((f: any) => ({ ...f, subTotal: totals.subTotal, taxAmount: totals.tax, grandTotal: totals.grand }))
      return computed
    })
  }

  async function handleSave() {
    if (!form.subject?.trim()) {
      addToast({ title: 'Subject required', description: 'Please enter a subject', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = JSON.stringify({ ...form, lineItems: lineItems.map((i: any) => ({ ...i, id: undefined, kind: undefined })) })
      if (isNew) {
        await api.request(`/${module}`, { method: 'POST', body: payload })
        addToast({ title: 'Created', description: `${cfg.label} created successfully`, variant: 'success' })
      } else {
        await api.request(`/${module}/${id}`, { method: 'PUT', body: payload })
        addToast({ title: 'Saved', description: `${cfg.label} updated successfully`, variant: 'success' })
      }
      navigate(`/${module}`)
    } catch (e: any) {
      addToast({ title: 'Error', description: e?.message || `Failed to save ${cfg.label.toLowerCase()}`, variant: 'destructive' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete this ${cfg.label.toLowerCase()}?`)) return
    try {
      await api.request(`/${module}/${id}`, { method: 'DELETE' })
      addToast({ title: 'Deleted', description: `${cfg.label} deleted` })
      navigate(`/${module}`)
    } catch { addToast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }) }
  }

  async function handleConvertInvoice() {
    if (!confirm('Convert this Sales Order to an Invoice?')) return
    try {
      const inv = await api.request(`/${module}/${id}/convert-invoice`, { method: 'POST' })
      addToast({ title: 'Invoice Created', description: `Invoice ${inv.invoiceNo || ''} created` })
      loadRecord(id!)
    } catch { addToast({ title: 'Error', description: 'Failed to convert', variant: 'destructive' }) }
  }

  async function handleAddComment() {
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const created = await api.request(`/${module}/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
      setRelated((prev: any) => ({ ...prev, comments: [created, ...prev.comments] }))
      setComment('')
      addToast({ title: 'Comment added' })
    } catch { addToast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' }) }
    setAddingComment(false)
  }

  function copyAddress(from: 'billing' | 'shipping', to: 'billing' | 'shipping') {
    const suffix = from.charAt(0).toUpperCase() + from.slice(1)
    const keys = ['street', 'city', 'state', 'country', 'postalCode', 'poBox'] as const
    const patch: any = {}
    keys.forEach(k => { patch[`${to}${k.charAt(0).toUpperCase() + k.slice(1)}`] = form[`${from}${k.charAt(0).toUpperCase() + k.slice(1)}`] || '' })
    setForm((prev: any) => ({ ...prev, ...patch }))
  }

  function pullAddressFrom(source: 'account' | 'contact') {
    const record = source === 'account' ? accounts.find(a => a.id === form.accountId) : contacts.find(c => c.id === form.contactId)
    if (!record) { addToast({ title: 'Info', description: source === 'account' ? 'Select an account first' : 'Select a contact first' }); return }
    const patch: any = {}
    if (source === 'account') {
      ;(['street', 'city', 'state', 'country', 'postalCode', 'poBox'] as const).forEach(k => {
        patch[`billing${k.charAt(0).toUpperCase() + k.slice(1)}`] = record[`billing${k.charAt(0).toUpperCase() + k.slice(1)}`] || ''
        patch[`shipping${k.charAt(0).toUpperCase() + k.slice(1)}`] = record[`shipping${k.charAt(0).toUpperCase() + k.slice(1)}`] || ''
      })
    } else {
      ;(['street', 'city', 'state', 'country', 'postalCode'] as const).forEach(k => {
        const v = record[`mailing${k.charAt(0).toUpperCase() + k.slice(1)}`] || ''
        patch[`billing${k.charAt(0).toUpperCase() + k.slice(1)}`] = v
        patch[`shipping${k.charAt(0).toUpperCase() + k.slice(1)}`] = v
      })
      patch['billingPoBox'] = record.mailingPoBox || ''
      patch['shippingPoBox'] = record.mailingPoBox || ''
    }
    setForm((prev: any) => ({ ...prev, ...patch }))
    addToast({ title: 'Address copied', description: `Copied from ${source === 'account' ? 'account' : 'contact'}` })
  }

  async function handleEmail() {
    const to = prompt('Send to email:')
    if (!to) return
    try {
      await api.request(`/${module}/${id}/email`, { method: 'POST', body: JSON.stringify({ to }) })
      addToast({ title: 'Sent', description: `Email logged to console for ${to}` })
    } catch { addToast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' }) }
  }

  function handlePdf() {
    const token = localStorage.getItem('token')
    window.open(`/api/${module}/${id}/pdf?token=${encodeURIComponent(token || '')}`, '_blank')
  }

  const lookupOptions = (field: string) => {
    if (field === 'accountId') return { list: accounts, label: (r: any) => r.accountName, key: 'id' }
    if (field === 'contactId') return { list: contacts, label: (r: any) => [r.firstName, r.lastName].filter(Boolean).join(' '), key: 'id' }
    if (field === 'potentialId') return { list: potentials, label: (r: any) => r.potentialName, key: 'id' }
    if (field === 'quoteId') return { list: quotes, label: (r: any) => r.quoteNo || r.subject, key: 'id' }
    if (field === 'salesOrderId') return { list: salesOrders, label: (r: any) => r.salesOrderNo || r.subject, key: 'id' }
    return null
  }

  const renderField = (fld: any) => {
    const label = fld.label || fld.name
    if (fld.type === 'select') {
      const options = fld.name === 'taxType' ? TAX_TYPES : cfg.stages
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Select value={form[fld.name] || ''} onValueChange={(v) => updateForm(fld.name, v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="--None--" /></SelectTrigger>
            <SelectContent>
              {options.map(o => <SelectItem key={o} value={o === '--None--' ? '' : o}>{o === '--None--' ? '--None--' : o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (fld.type === 'lookup') {
      const lu = lookupOptions(fld.name)
      if (!lu) return null
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Select value={form[fld.name] || ''} onValueChange={(v) => updateForm(fld.name, v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="--None--" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">--None--</SelectItem>
              {lu.list.map((r: any) => (
                <SelectItem key={r[lu.key]} value={r[lu.key]}>{lu.label(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (fld.type === 'date') {
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Input type="date" className="h-9 text-sm" value={form[fld.name] || ''} onChange={e => updateForm(fld.name, e.target.value)} />
        </div>
      )
    }
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
        <Input
          type={fld.type === 'number' ? 'number' : 'text'}
          step={fld.type === 'number' ? '0.01' : undefined}
          className="h-9 text-sm"
          value={form[fld.name] ?? ''}
          onChange={e => updateForm(fld.name, fld.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
        />
      </div>
    )
  }

  const grandTotal = useMemo(() => {
    const st = lineItems.reduce((s, i) => s + i.lineTotal, 0)
    const tx = lineItems.reduce((s, i) => s + i.tax, 0)
    return st + tx + Number(form.shipping || 0) + Number(form.shippingHandling || 0) + Number(form.adjustment || 0) - Number(form.discount || 0)
  }, [lineItems, form.shipping, form.shippingHandling, form.adjustment, form.discount])

  if (loading && id && id !== 'new' && mode !== 'list') {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
  }

  if (mode === 'form') {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/${module}`)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold">{isNew ? `New ${cfg.label}` : `Edit ${cfg.label}`}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/${module}`)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-1 h-4 w-4" /> : <Save className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <TabsRoot value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {[
              ['details', 'Details', 0],
              ['items', 'Line Items', 1],
              ['address', 'Address', 2],
              ['terms', 'Terms', 3],
            ].map(([val, lab, i]) => (
              <TabsTrigger key={val as string} value={val as string} className={TAB_ACTIVE_COLORS[i as number]}>
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TAB_DOT_COLORS[i as number]}`} />{lab as string}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cfg.detailFields.map(f => <Fragment key={f.name}>{renderField(f)}</Fragment>)}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned To</label>
                <Select value={form.assignedTo || ''} onValueChange={(v) => updateForm('assignedTo', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select User" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {team.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {cfg.showRecurring && (
              <div className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3">Recurring</h3>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!form.enableRecurring} onChange={e => updateForm('enableRecurring', e.target.checked)} className="h-4 w-4" />
                    Enable Recurring
                  </label>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Recurring Frequency</label>
                    <Select value={form.recurringFrequency || ''} onValueChange={(v) => updateForm('recurringFrequency', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="--None--" /></SelectTrigger>
                      <SelectContent>
                        {RECURRING_FREQUENCIES.map(o => <SelectItem key={o} value={o === '--None--' ? '' : o}>{o === '--None--' ? '--None--' : o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Period</label>
                    <Input type="date" className="h-9 text-sm" value={form.startPeriod || ''} onChange={e => updateForm('startPeriod', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">End Period</label>
                    <Input type="date" className="h-9 text-sm" value={form.endPeriod || ''} onChange={e => updateForm('endPeriod', e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Each line item is split across two rows so all fields stay readable.</p>

            {lineItems.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-800 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Item #{idx + 1}</span>
                  <button onClick={() => removeLineItem(idx)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 dark:hover:bg-red-900/40" title="Remove item">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">Product / Service</span>
                      <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 text-[11px] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleItemKind(idx, 'product')}
                          className={cn('px-2 py-0.5', item.kind === 'product' ? 'bg-violet-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                        >Product</button>
                        <button
                          type="button"
                          onClick={() => toggleItemKind(idx, 'service')}
                          className={cn('px-2 py-0.5', item.kind === 'service' ? 'bg-violet-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                        >Service</button>
                      </div>
                    </div>
                    {item.kind === 'service'
                      ? <ServiceSearchSelect value={item.serviceId} services={services} onSelect={(v) => handleServiceSelect(idx, v)} inputClassName={ITEM_INPUT} />
                      : <ProductSearchSelect value={item.productId} products={products} onSelect={(v) => handleProductSelect(idx, v)} inputClassName={ITEM_INPUT} />}
                  </div>
                  <div className="md:col-span-3">
                    <label className={ITEM_LABEL}>Item Name</label>
                    <Input className={ITEM_INPUT} value={item.itemName} onChange={e => updateLineItem(idx, 'itemName', e.target.value)} placeholder="Item name" />
                  </div>
                  <div className="md:col-span-4">
                    <label className={ITEM_LABEL}>Description</label>
                    <Input className={ITEM_INPUT} value={item.description || ''} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                  <div>
                    <label className={ITEM_LABEL}>Qty</label>
                    <Input type="number" min="0" step="1" className={ITEM_INPUT} value={item.qty} onChange={e => updateLineItem(idx, 'qty', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Rate</label>
                    <Input type="number" step="0.01" className={ITEM_INPUT} value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Disc %</label>
                    <Input type="number" step="0.01" min="0" max="100" className={ITEM_INPUT} value={item.discountPercent} onChange={e => updateLineItem(idx, 'discountPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Disc</label>
                    <Input type="number" step="0.01" min="0" className={ITEM_INPUT} value={item.discount} onChange={e => updateLineItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Tax %</label>
                    <Input type="number" step="0.01" min="0" max="100" className={ITEM_INPUT} value={item.taxPercent} onChange={e => updateLineItem(idx, 'taxPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Tax</label>
                    <div className={ITEM_VALUE}>{item.tax.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Net Price</label>
                    <div className={ITEM_VALUE}>{item.netPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className={ITEM_LABEL}>Total</label>
                    <div className={cn(ITEM_VALUE, 'font-semibold text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-800')}>{item.lineTotal.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}

            {lineItems.length === 0 && (
              <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-6 text-center">No line items yet. Click "Add Item" or "Add Service" to start.</div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="mr-1 h-4 w-4" />Add Item</Button>
              <Button variant="outline" size="sm" onClick={addServiceLineItem}><Plus className="mr-1 h-4 w-4" />Add Service</Button>
            </div>

            <div className="flex justify-end">
              <div className="w-72 space-y-1 text-sm">
                <div className="flex justify-between py-1"><span>Sub Total:</span><span className="font-medium">{lineItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)}</span></div>
                <div className="flex justify-between py-1">
                  <span>Discount:</span>
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.discount} onChange={e => handleTotalsField('discount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex justify-between py-1"><span>Tax:</span><span className="font-medium">{lineItems.reduce((s, i) => s + i.tax, 0).toFixed(2)}</span></div>
                <div className="flex justify-between py-1">
                  <span>Shipping:</span>
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.shipping} onChange={e => handleTotalsField('shipping', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex justify-between py-1">
                  <span>Adjustment:</span>
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.adjustment} onChange={e => handleTotalsField('adjustment', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex justify-between py-2 border-t text-lg font-bold">{'Grand Total:'}<span>{grandTotal.toFixed(2)}</span></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => copyAddress('billing', 'shipping')}><Copy className="mr-1 h-3.5 w-3.5" />Copy Billing → Shipping</Button>
              <Button variant="outline" size="sm" onClick={() => copyAddress('shipping', 'billing')}><Copy className="mr-1 h-3.5 w-3.5" />Copy Shipping → Billing</Button>
              <Button variant="outline" size="sm" onClick={() => pullAddressFrom('account')}><Building2 className="mr-1 h-3.5 w-3.5" />From Account</Button>
              <Button variant="outline" size="sm" onClick={() => pullAddressFrom('contact')}><Users className="mr-1 h-3.5 w-3.5" />From Contact</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Billing Address</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Street</label>
                  <textarea className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.billingStreet || ''} onChange={e => updateForm('billingStreet', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                    <Input className="h-9 text-sm" value={form.billingCity || ''} onChange={e => updateForm('billingCity', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                    <Input className="h-9 text-sm" value={form.billingState || ''} onChange={e => updateForm('billingState', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Postal Code</label>
                    <Input className="h-9 text-sm" value={form.billingPostalCode || ''} onChange={e => updateForm('billingPostalCode', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                    <Input className="h-9 text-sm" value={form.billingCountry || ''} onChange={e => updateForm('billingCountry', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">PO Box</label>
                  <Input className="h-9 text-sm" value={form.billingPoBox || ''} onChange={e => updateForm('billingPoBox', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Shipping Address</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Street</label>
                  <textarea className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.shippingStreet || ''} onChange={e => updateForm('shippingStreet', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                    <Input className="h-9 text-sm" value={form.shippingCity || ''} onChange={e => updateForm('shippingCity', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                    <Input className="h-9 text-sm" value={form.shippingState || ''} onChange={e => updateForm('shippingState', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Postal Code</label>
                    <Input className="h-9 text-sm" value={form.shippingPostalCode || ''} onChange={e => updateForm('shippingPostalCode', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                    <Input className="h-9 text-sm" value={form.shippingCountry || ''} onChange={e => updateForm('shippingCountry', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">PO Box</label>
                  <Input className="h-9 text-sm" value={form.shippingPoBox || ''} onChange={e => updateForm('shippingPoBox', e.target.value)} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="mt-4 space-y-4">
            {module === 'invoices' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1.5">Terms & Conditions</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.terms || ''} onChange={e => updateForm('terms', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Description</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.description || ''} onChange={e => updateForm('description', e.target.value)} />
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
    )
  }

  if (mode === 'view' && id) {
    const r = form
    const accName = accounts.find(a => a.id === r.accountId)?.accountName
    const conName = contacts.find(c => c.id === r.contactId) ? [contacts.find(c => c.id === r.contactId)?.firstName, contacts.find(c => c.id === r.contactId)?.lastName].filter(Boolean).join(' ') : null
    const quoteNo = quotes.find(q => q.id === r.quoteId)?.quoteNo || quotes.find(q => q.id === r.quoteId)?.subject
    const soNo = salesOrders.find(s => s.id === r.salesOrderId)?.salesOrderNo || salesOrders.find(s => s.id === r.salesOrderId)?.subject
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/${module}`)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{r.subject || cfg.label}</h1>
              <p className="text-sm text-muted-foreground">{r[cfg.noField]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${r[cfg.stageField] === 'Paid' || r[cfg.stageField] === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : r[cfg.stageField] === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
              {r[cfg.stageField] || 'Created'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setMode('form')}><FileText className="mr-1 h-4 w-4" />Edit</Button>
            <Button variant="outline" size="sm" onClick={handlePdf}><FileDown className="mr-1 h-4 w-4" />PDF</Button>
            <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="mr-1 h-4 w-4" />Email</Button>
            {module === 'salesorders' && (
              <Button variant="outline" size="sm" onClick={handleConvertInvoice}><Receipt className="mr-1 h-4 w-4" />Invoice</Button>
            )}
            <Button variant="outline" size="sm" className="text-red-500" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold mb-3">Line Items</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Disc</th>
                    <th className="p-2 text-right">Tax</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-2 text-right">{Number(item.discount || 0).toFixed(2)}</td>
                      <td className="p-2 text-right">{Number(item.tax || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">{Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sub Total</span><span>{Number(r.subTotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{Number(r.discount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{Number(r.taxAmount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{Number(r.shipping || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adjustment</span><span>{Number(r.adjustment || 0).toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">Grand Total<span>{Number(r.grandTotal || 0).toFixed(2)}</span></div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-sm space-y-1">
              <h4 className="font-semibold mb-2">Details</h4>
              {accName && <p><span className="text-muted-foreground">Account:</span> {accName}</p>}
              {conName && <p><span className="text-muted-foreground">Contact:</span> {conName}</p>}
              {module === 'salesorders' && quoteNo && <p><span className="text-muted-foreground">Quote:</span> {quoteNo}</p>}
              {module === 'invoices' && soNo && <p><span className="text-muted-foreground">Sales Order:</span> {soNo}</p>}
              {module === 'invoices' && r.invoiceDate && <p><span className="text-muted-foreground">Invoice Date:</span> {formatDate(r.invoiceDate)}</p>}
              {module === 'invoices' && r.dueDate && <p><span className="text-muted-foreground">Due Date:</span> {formatDate(r.dueDate)}</p>}
              {module === 'salesorders' && r.validUntil && <p><span className="text-muted-foreground">Valid Till:</span> {formatDate(r.validUntil)}</p>}
              <p><span className="text-muted-foreground">Status:</span> {r[cfg.stageField] || 'N/A'}</p>
              <p><span className="text-muted-foreground">Tax Type:</span> {r.taxType || 'N/A'}</p>
              {module === 'salesorders' && r.recurringFrequency && <p><span className="text-muted-foreground">Recurring:</span> {r.recurringFrequency}</p>}
              {r.customerNo && <p><span className="text-muted-foreground">Customer No:</span> {r.customerNo}</p>}
              {r.purchaseOrderNo && <p><span className="text-muted-foreground">PO No:</span> {r.purchaseOrderNo}</p>}
              <p><span className="text-muted-foreground">Assigned To:</span> {team.find(u => u.id === r.assignedTo) ? [team.find((u: any) => u.id === r.assignedTo)?.firstName, team.find((u: any) => u.id === r.assignedTo)?.lastName].filter(Boolean).join(' ') : 'N/A'}</p>
            </div>
            {r.notes && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Notes</h4><p className="text-muted-foreground">{r.notes}</p></div>}
            {r.terms && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Terms</h4><p className="text-muted-foreground">{r.terms}</p></div>}
            {r.description && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Description</h4><p className="text-muted-foreground">{r.description}</p></div>}
          </div>
        </div>

        {module === 'salesorders' && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingCart size={16} />Related Invoices</h3>
            {related.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices from this sales order.</p>
            ) : (
              <div className="space-y-2">
                {related.invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium">{inv.invoiceNo || inv.subject}</p>
                      <p className="text-xs text-muted-foreground">{inv.invoiceStatus || 'Created'} · {formatDate(inv.createdAt)}</p>
                    </div>
                    <span className="font-semibold">${Number(inv.grandTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare size={16} />Comments</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="h-9"
            />
            <Button variant="outline" size="sm" onClick={handleAddComment} disabled={addingComment || !comment.trim()}>
              {addingComment ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Post'}
            </Button>
          </div>
          {related.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {related.comments.map((c: any) => (
                <div key={c.id} className="border rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{c.userName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleSearch = () => { setPage(1); loadList() }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cfg.listTitle}</h1>
          <p className="text-sm text-muted-foreground">Manage {cfg.listTitle.toLowerCase()}</p>
        </div>
        <Button onClick={() => navigate(`/${module}/new`)}><Plus className="mr-1 h-4 w-4" />New {cfg.label}</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`Search by ${cfg.noField === 'invoiceNo' ? 'invoice no' : 'SO no'} or subject...`} value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
      </div>

      <DataTable
        columns={cfg.listColumns}
        data={records}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/${module}/${r.id}`)}
        emptyMessage={`No ${cfg.listTitle.toLowerCase()} found`}
      />
    </div>
  )
}
