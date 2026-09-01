'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate } from '@/lib/navigation'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/ui/date-field'
import { DataTable } from '@/components/ui/data-table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, Trash2, Plus, FileDown, Mail, Search, Copy, Building2, Users, ShoppingCart, MessageSquare, FileText, Receipt, CreditCard, Eye, MoreHorizontal, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, orgCurrency, useOrgSettings } from '@/lib/org-format'
import { ProductSearchSelect } from '@/components/product-search-select'
import { ServiceSearchSelect } from '@/components/service-search-select'
import { UserRoleSelect } from '@/components/user-role-select'

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
      { name: 'currency', type: 'select', label: 'Currency' },
      { name: 'conversionRate', type: 'number', label: 'Conversion Rate' },
      { name: 'taxType', type: 'select', label: 'Tax Type' },
      { name: 'accountId', type: 'lookup', label: 'Account' },
      { name: 'contactId', type: 'lookup', label: 'Contact' },
      { name: 'potentialId', type: 'lookup', label: 'Potential' },
      { name: 'quoteId', type: 'lookup', label: 'Quote Name' },
    ],
    listColumns: [
      { key: 'salesOrderNo', label: 'SO No', render: (v: any) => <span className="font-medium">{v || '-'}</span> },
      { key: 'subject', label: 'Subject' },
      { key: 'grandTotal', label: 'Amount', render: (v: any, row: any) => <span className="font-medium">{Number(v || 0).toFixed(2)} {row.currency || ''}</span> },
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
      { name: 'currency', type: 'select', label: 'Currency' },
      { name: 'conversionRate', type: 'number', label: 'Conversion Rate' },
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
      { key: 'grandTotal', label: 'Amount', render: (v: any, row: any) => <span className="font-medium">{Number(v || 0).toFixed(2)} {row.currency || ''}</span> },
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
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  useOrgSettings()
  const cfg = CONFIGS[module]
  const isNew = !id || id === 'new'
  const draftKey = `crm:draft:${user?.companyId || 'company'}:${user?.id || 'user'}:${module}:new`

  const [mode, setMode] = useState<'list' | 'form' | 'view'>(id === 'new' ? 'form' : id ? 'view' : 'list')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [listStatus, setListStatus] = useState('All')
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
  const [roles, setRoles] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  const [related, setRelated] = useState<any>({ invoices: [], comments: [] })
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [attachPdf, setAttachPdf] = useState(true)

  const [payments, setPayments] = useState<any[]>([])
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [balanceInfo, setBalanceInfo] = useState<any>(null)
  const [payForm, setPayForm] = useState({ amount: '', paymentDate: '', method: 'Cash', reference: '', notes: '' })
  const [recordingPayment, setRecordingPayment] = useState(false)

  const [defaultTerms, setDefaultTerms] = useState('')

  function handleCurrencyChange(code: string) {
    const cur = currencies.find(c => (c.code || c.name) === code)
    const rate = cur && Number(cur.rate) > 0 ? Number(cur.rate) : 1
    updateForm('currency', code)
    updateForm('conversionRate', rate)
  }

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
      api.request<any>(`/${module}/users`).then(r => { setTeam(r.data || []); setRoles(r.roles || []) }).catch(() => {}),
      api.list('quotes', { limit: '200' }).then(r => setQuotes(r.data || [])).catch(() => {}),
      api.list('salesorders', { limit: '200' }).then(r => setSalesOrders(r.data || [])).catch(() => {}),
      api.listAll('currencies').then(r => setCurrencies(r.data || r || [])).catch(() => {}),
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
    f.currency = ''; f.conversionRate = 1
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
      f.currency = r.currency || ''
      f.conversionRate = Number(r.conversionRate) || 1
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
      if (module === 'invoices') {
        api.getInvoicePayments(recordId).then(res => { setPayments(res.data || []); setPaymentTotal(res.total || 0) }).catch(() => {})
        api.getInvoiceBalance(recordId).then(res => setBalanceInfo(res)).catch(() => {})
      }
    } catch (e: any) { addToast({ title: 'Could not load record', description: e?.message || 'Refresh the page and try again.', variant: 'destructive' }) }
    setLoading(false)
  }

  async function handleRecordPayment() {
    const amount = Number(payForm.amount)
    if (!amount || amount <= 0) return
    setRecordingPayment(true)
    try {
      const res = await api.addInvoicePayment(id!, {
        amount,
        paymentDate: payForm.paymentDate || undefined,
        method: payForm.method || 'Other',
        reference: payForm.reference || undefined,
        notes: payForm.notes || undefined,
      })
      addToast({ title: 'Payment recorded', description: `Invoice status: ${res.invoiceStatus}`, variant: 'success' })
      setPayForm({ amount: '', paymentDate: '', method: 'Cash', reference: '', notes: '' })
      const [p, b] = await Promise.all([api.getInvoicePayments(id!), api.getInvoiceBalance(id!)])
      setPayments(p.data || [])
      setPaymentTotal(p.total || 0)
      setBalanceInfo(b)
      setForm((prev: any) => ({ ...prev, invoiceStatus: res.invoiceStatus, paidAmount: res.totalPaid }))
    } catch (e: any) {
      addToast({ title: 'Error', description: e.message || 'Failed to record payment', variant: 'destructive' })
    }
    setRecordingPayment(false)
  }

  useEffect(() => {
    if (id && id !== 'new') loadRecord(id)
    else if (id === 'new') {
      setMode('form')
      const saved = localStorage.getItem(draftKey)
      if (saved) try { const draft = JSON.parse(saved); setForm(draft.form); setLineItems(draft.lineItems); return } catch {}
      setForm((prev: any) => {
        if (Object.keys(prev).length) return prev
        const f = emptyForm()
        f[cfg.noField] = cfg.noPrefix + Date.now()
        f.currency = orgCurrency()
        return f
      })
    }
  }, [id])

  useEffect(() => { if (isNew && mode === 'form' && Object.keys(form).length) localStorage.setItem(draftKey, JSON.stringify({ form, lineItems })) }, [form, lineItems, isNew, mode, draftKey])

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
        localStorage.removeItem(draftKey)
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
    } catch (e: any) { addToast({ title: `Could not delete ${cfg.label.toLowerCase()}`, description: e?.message || 'It may be referenced by another record.', variant: 'destructive' }) }
  }

  async function handleConvertInvoice() {
    if (!confirm('Convert this Sales Order to an Invoice?')) return
    try {
      const inv = await api.request(`/${module}/${id}/convert-invoice`, { method: 'POST' })
      addToast({ title: 'Invoice Created', description: `Invoice ${inv.invoiceNo || ''} created` })
      loadRecord(id!)
    } catch (e: any) { addToast({ title: 'Could not convert record', description: e?.message || 'Check that all required customer and line-item information is complete.', variant: 'destructive' }) }
  }

  async function handleAddComment() {
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const created = await api.request(`/${module}/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
      setRelated((prev: any) => ({ ...prev, comments: [created, ...prev.comments] }))
      setComment('')
      addToast({ title: 'Comment added' })
    } catch (e: any) { addToast({ title: 'Could not add comment', description: e?.message || 'Enter a comment and try again.', variant: 'destructive' }) }
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
      await api.request(`/${module}/${id}/email`, { method: 'POST', body: JSON.stringify({ to, attachPdf }) })
      addToast({ title: 'Sent', description: `Email logged to console for ${to}` })
    } catch (e: any) { addToast({ title: 'Could not send email', description: e?.message || 'Check the recipient and outgoing mail settings, then try again.', variant: 'destructive' }) }
  }

  async function handlePdf() {
    try { await api.openAuthenticatedFile(`/${module}/${id}/pdf`) }
    catch (e: any) { addToast({ title: 'PDF preview failed', description: e.message, variant: 'destructive' }) }
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
      const options = fld.name === 'taxType' ? TAX_TYPES : fld.name === 'currency' ? currencies.map((c: any) => c.code || c.name) : cfg.stages
      const onSelect = fld.name === 'currency' ? handleCurrencyChange : (v: string) => updateForm(fld.name, v)
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Select value={form[fld.name] || ''} onValueChange={onSelect}>
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
          <DateField className="h-9 text-sm" value={form[fld.name] || ''} onChange={v => updateForm(fld.name, v)} />
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
                <UserRoleSelect
                  value={form.assignedTo || ''}
                  users={team}
                  roles={roles}
                  onSelect={(v) => updateForm('assignedTo', v)}
                />
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
                    <DateField className="h-9 text-sm" value={form.startPeriod || ''} onChange={v => updateForm('startPeriod', v)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">End Period</label>
                    <DateField className="h-9 text-sm" value={form.endPeriod || ''} onChange={v => updateForm('endPeriod', v)} />
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
                <div className="flex justify-between py-2 border-t text-lg font-bold">{'Grand Total:'}<span>{grandTotal.toFixed(2)} {form.currency || ''}</span></div>
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
            <label className="inline-flex h-9 items-center gap-1.5 rounded-md border px-2 text-xs font-medium"><input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} /> Attach PDF</label>
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
              <div className="flex justify-between border-t pt-2 text-lg font-bold">Grand Total<span>{Number(r.grandTotal || 0).toFixed(2)} {r.currency || ''}</span></div>
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
              <p><span className="text-muted-foreground">Currency:</span> {r.currency || 'N/A'}{r.conversionRate && Number(r.conversionRate) !== 1 ? ` (rate ${r.conversionRate})` : ''}</p>
              <p><span className="text-muted-foreground">Tax Type:</span> {r.taxType || 'N/A'}</p>
              {module === 'salesorders' && r.recurringFrequency && <p><span className="text-muted-foreground">Recurring:</span> {r.recurringFrequency}</p>}
              {r.customerNo && <p><span className="text-muted-foreground">Customer No:</span> {r.customerNo}</p>}
              {r.purchaseOrderNo && <p><span className="text-muted-foreground">PO No:</span> {r.purchaseOrderNo}</p>}
              <p><span className="text-muted-foreground">Assigned To:</span> {(() => { const u = team.find((x: any) => x.id === r.assignedTo); if (u) return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.userName; const rl = roles.find((x: any) => x.id === r.assignedTo); if (rl) return rl.name; return r.assignedTo ? (r.ownerName || 'N/A') : 'N/A' })()}</p>
            </div>
            {r.notes && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Notes</h4><p className="text-muted-foreground">{r.notes}</p></div>}
            {r.terms && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Terms</h4><p className="text-muted-foreground">{r.terms}</p></div>}
            {r.description && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Description</h4><p className="text-muted-foreground">{r.description}</p></div>}
          </div>
        </div>

        {module === 'invoices' && (
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><CreditCard size={16} />Payments</h3>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold">${Number(r.grandTotal || 0).toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-emerald-600">${paymentTotal.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Balance:</span> <span className={`font-semibold ${(balanceInfo?.balance ?? 0) > 0.005 ? 'text-amber-600' : 'text-emerald-600'}`}>${(balanceInfo?.balance ?? 0).toFixed(2)}</span></div>
            </div>
            {payments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Method</th>
                      <th className="p-2 text-left">Reference</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-2">{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                        <td className="p-2">{p.method}</td>
                        <td className="p-2 text-muted-foreground">{p.reference || '—'}</td>
                        <td className="p-2 text-right font-medium">{Number(p.amount).toFixed(2)}</td>
                        <td className="p-2 text-muted-foreground">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Record Payment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <Input type="number" min={0} step="0.01" placeholder="Amount" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className="h-9" />
                <DateField value={payForm.paymentDate} onChange={v => setPayForm(f => ({ ...f, paymentDate: v }))} className="h-9" />
                <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'PayPal', 'Other'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Input placeholder="Reference" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} className="h-9" />
                <Button size="sm" onClick={handleRecordPayment} disabled={recordingPayment || !payForm.amount || Number(payForm.amount) <= 0}>
                  {recordingPayment ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Record'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {module === 'salesorders' && (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingCart size={16} />Related Invoices</h3>            {related.invoices.length === 0 ? (
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

  if (false && module === 'salesorders') {
    const statusCounts = records.reduce((result: Record<string, number>, record: any) => {
      const status = record.soStatus || 'Created'
      result[status] = (result[status] || 0) + 1
      return result
    }, {})
    const shown = listStatus === 'All' ? records : records.filter(record => (record.soStatus || 'Created') === listStatus)
    const totalValue = shown.reduce((sum, record) => sum + (Number(record.grandTotal) || 0), 0)
    const allValue = records.reduce((sum, record) => sum + (Number(record.grandTotal) || 0), 0)
    const open = records.filter(record => !['Delivered', 'Cancelled', 'Invoiced'].includes(record.soStatus || 'Created'))
    const openValue = open.reduce((sum, record) => sum + (Number(record.grandTotal) || 0), 0)
    const missingDates = records.filter(record => !record.validUntil).length
    const awaitingInvoice = records.filter(record => ['Approved', 'Confirmed'].includes(record.soStatus)).length
    const currency = records.find(record => record.currency)?.currency || orgCurrency()
    const total = pagination?.total ?? records.length
    const currentPage = pagination?.page || page
    const totalPages = Math.max(1, pagination?.totalPages || 1)
    const limit = pagination?.limit || 25
    const from = total ? (currentPage - 1) * limit + 1 : 0
    const to = Math.min(currentPage * limit, total)
    const accountName = (record: any) => accounts.find(account => account.id === record.accountId)?.accountName || record.accountName || 'Direct order'
    const stampClass = (status: string) => status === 'Approved' || status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : status === 'Delivered' || status === 'Invoiced' ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' : status === 'Cancelled' ? 'border border-dashed bg-transparent text-muted-foreground' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-3">
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-end gap-4 border-b px-4 py-3 sm:px-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Sales orders</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">Orders confirmed from quotes, ready to fulfil and invoice.</p>
            </div>
            <div className="ml-auto hidden items-end gap-6 md:flex">
              <div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Open value</p><p className="mt-0.5 text-base font-semibold"><span className="mr-1 font-mono text-[9px] text-muted-foreground">{currency}</span>{openValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Awaiting invoice</p><p className="mt-0.5 text-base font-semibold">{awaitingInvoice} <span className="text-[10px] font-normal text-muted-foreground">orders</span></p></div>
            </div>
            <Button onClick={() => navigate('/salesorders/new')} className="h-9 rounded-md bg-[#6e1f2e] px-3 text-xs text-white shadow-sm hover:bg-[#571825]"><Plus size={14} className="mr-1.5" />New sales order</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
            <div className="relative min-w-[220px] max-w-sm flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSearch()} placeholder="Filter by SO number, subject or account" className="h-9 rounded-md bg-muted/30 pl-9 text-sm shadow-none" /></div>
            <div className="flex gap-1 overflow-x-auto">{['All', 'Created', 'Approved', 'Delivered', 'Cancelled'].map(status => <button key={status} type="button" onClick={() => setListStatus(status)} className={cn('whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground', listStatus === status && 'border-foreground bg-foreground text-background')} >{status}<span className="ml-1 font-mono text-[9px] opacity-60">{status === 'All' ? records.length : statusCounts[status] || 0}</span></button>)}</div>
            <button type="button" onClick={handleSearch} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground hover:text-foreground"><SlidersHorizontal size={14} />Filter</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr className="border-b bg-muted/25 text-left font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground"><th className="px-3 py-2.5">SO no.</th><th className="px-3 py-2.5">Subject</th><th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Valid till</th><th className="px-3 py-2.5">Created</th><th className="w-20 px-3 py-2.5" /></tr></thead>
              <tbody>{loading ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground"><Loader2 size={16} className="mr-2 inline animate-spin" />Loading sales orders…</td></tr> : shown.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No sales orders match this filter.</td></tr> : shown.map(record => {
                const status = record.soStatus || 'Created'
                return <tr key={record.id} onClick={() => navigate(`/salesorders/${record.id}`)} className="group cursor-pointer border-b last:border-0 hover:bg-muted/25"><td className="px-3 py-2.5 font-mono text-xs font-medium group-hover:text-[#6e1f2e]">{record.salesOrderNo || '—'}</td><td className="px-3 py-2.5"><p className="text-[13px] font-medium leading-tight">{record.subject || 'Untitled order'}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{accountName(record)}</p></td><td className="px-3 py-2.5 text-right text-sm font-semibold"><span className="mr-1 font-mono text-[9px] font-normal text-muted-foreground">{record.currency || currency}</span>{Number(record.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-3 py-2.5"><span className={cn('inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[9px] uppercase tracking-wide', stampClass(status))}><span className="h-1 w-1 rounded-full bg-current" />{status}</span></td><td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{record.validUntil ? formatDate(record.validUntil) : <span className="rounded bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Set date</span>}</td><td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{record.createdAt ? formatDate(record.createdAt) : '—'}</td><td onClick={event => event.stopPropagation()} className="px-3 py-2.5"><div className="flex justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><button title="View" onClick={() => navigate(`/salesorders/${record.id}`)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><Eye size={14} /></button><button title="More" className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal size={14} /></button></div></td></tr>
              })}</tbody>
              {!loading && shown.length > 0 && <tfoot><tr className="border-t bg-muted/20"><td colSpan={2} className="px-3 py-2.5 text-xs text-muted-foreground">Total, {shown.length} orders</td><td className="px-3 py-2.5 text-right text-sm font-semibold"><span className="mr-1 font-mono text-[9px] text-muted-foreground">{currency}</span>{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td colSpan={4} /></tr></tfoot>}
            </table>
          </div>
          {total > 0 && <div className="flex items-center border-t px-3 py-2 text-[11px] text-muted-foreground"><span>Showing {from}–{to} of {total} orders</span><div className="ml-auto flex gap-1"><button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="grid h-7 w-7 place-items-center rounded disabled:opacity-30 hover:bg-muted"><ChevronLeft size={14} /></button><span className="grid h-7 min-w-7 place-items-center rounded bg-foreground px-2 text-background">{currentPage}</span><button disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="grid h-7 w-7 place-items-center rounded disabled:opacity-30 hover:bg-muted"><ChevronRight size={14} /></button></div></div>}
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-lg border bg-card px-4 py-3"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Order value</p><p className="text-[10px] text-muted-foreground">Current page</p></div><div className="mt-2 flex items-baseline justify-between"><span className="text-xs text-muted-foreground">Total booked</span><span className="text-xl font-semibold"><small className="mr-1 font-mono text-[9px] text-muted-foreground">{currency}</small>{allValue.toLocaleString()}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-[#6e1f2e]" style={{ width: `${allValue ? Math.min(100, openValue / allValue * 100) : 0}%` }} /></div></section>
          <section className="rounded-lg border bg-card px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Needs attention</p><div className="mt-2 flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" /><div><p className="text-xs font-medium">{missingDates} {missingDates === 1 ? 'order has' : 'orders have'} no valid-till date</p><p className="text-[11px] text-muted-foreground">Add dates to enable expiry and follow-up reminders.</p></div></div></section>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">{cfg.listTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage {cfg.listTitle.toLowerCase()}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/${module}/new`)}><Plus className="mr-1.5 h-4 w-4" />New {cfg.label}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`Search by ${cfg.noField === 'invoiceNo' ? 'invoice no' : 'SO no'} or subject...`} value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="h-9 pl-9" />
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
