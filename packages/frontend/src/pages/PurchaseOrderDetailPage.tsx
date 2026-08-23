import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, Trash2, Plus, FileDown, Mail, Copy, Building2, Users, ShoppingCart, MessageSquare, FileText, Search, Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, orgCurrency, useOrgSettings } from '@/lib/org-format'
import { ProductSearchSelect } from '@/components/product-search-select'
import { ServiceSearchSelect } from '@/components/service-search-select'
import { UserRoleSelect } from '@/components/user-role-select'
import { VendorSearchSelect } from '@/components/vendor-search-select'
import { ContactSearchSelect } from '@/components/contact-search-select'

const PO_STAGES = ['--None--', 'Created', 'Approved', 'Delivered', 'Cancelled', 'Received Shipment']
const CARRIER_OPTIONS = ['--None--', 'FedEx', 'UPS', 'USPS', 'DHL', 'BlueDart']
const TAX_TYPES = ['--None--', 'Individual', 'Group', 'VAT', 'GST', 'Sales Tax']

const EMPTY_LINE = { productId: '', serviceId: '', itemName: '', qty: 1, listPrice: 0, unitPrice: 0, discount: 0, discountPercent: 0, tax: 0, taxPercent: 0, netPrice: 0, lineTotal: 0, description: '', kind: 'product' }

const ITEM_LABEL = 'block text-[11px] font-semibold text-slate-900 dark:text-slate-100 mb-1'
const ITEM_INPUT = 'h-8 text-xs'
const ITEM_VALUE = 'h-8 flex items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100'

const TAB_DOT_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
const TAB_ACTIVE_COLORS = [
  'data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
  'data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400',
  'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400',
  'data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
  'data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400',
]

const DETAIL_FIELDS = [
  { name: 'subject', type: 'text' as const, label: 'Subject' },
  { name: 'purchaseOrderNo', type: 'text' as const, label: 'PO No' },
  { name: 'validUntil', type: 'date' as const, label: 'Valid Until' },
  { name: 'poStatus', type: 'select' as const, label: 'Status' },
  { name: 'carrier', type: 'select' as const, label: 'Carrier' },
  { name: 'taxType', type: 'select' as const, label: 'Tax Type' },
  { name: 'currency', type: 'select' as const, label: 'Currency' },
  { name: 'conversionRate', type: 'number' as const, label: 'Conversion Rate' },
  { name: 'salesCommission', type: 'number' as const, label: 'Commission' },
  { name: 'exciseDuty', type: 'number' as const, label: 'Excise Duty' },
  { name: 'vendorId', type: 'lookup' as const, label: 'Vendor' },
  { name: 'contactId', type: 'lookup' as const, label: 'Contact' },
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

export function PurchaseOrderDetailPage() {
  const { user } = useAuthStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  useOrgSettings()
  const isNew = !id || id === 'new'
  const draftKey = `crm:draft:${user?.companyId || 'company'}:${user?.id || 'user'}:purchaseorders:new`
  const [mode, setMode] = useState<'list' | 'form' | 'view'>(id === 'new' ? 'form' : id ? 'view' : 'list')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [deleteTarget, setDeleteTarget] = useState(false)

  const [listRecords, setListRecords] = useState<any[]>([])
  const [listSearch, setListSearch] = useState('')
  const [listLoading, setListLoading] = useState(true)

  const [form, setForm] = useState<any>({})
  const [lineItems, setLineItems] = useState<any[]>([{ ...EMPTY_LINE, lineTotal: 0 }])

  const [vendors, setVendors] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  const [defaultTerms, setDefaultTerms] = useState('')
  const [attachPdf, setAttachPdf] = useState(true)

  function handleCurrencyChange(code: string) {
    const cur = currencies.find(c => (c.code || c.name) === code)
    const rate = cur && Number(cur.rate) > 0 ? Number(cur.rate) : 1
    updateForm('currency', code)
    updateForm('conversionRate', rate)
  }

  useEffect(() => {
    api.getOrgSettings().then((s: any) => {
      const t = s?.terms?.purchaseOrder || ''
      setDefaultTerms(t)
      if (id === 'new') setForm((prev: any) => (Object.keys(prev).length ? { ...prev, terms: prev.terms || t } : prev))
    }).catch(() => {})
  }, [id])

  useEffect(() => {
    Promise.all([
      api.listAll('vendors').then(r => setVendors(r.data || [])).catch(() => {}),
      api.listAll('contacts').then(r => setContacts(r.data || [])).catch(() => {}),
      api.listAll('products').then(r => setProducts(r.data || [])).catch(() => {}),
      api.listAll('services').then(r => setServices(r.data || [])).catch(() => {}),
      api.request<any>('/purchaseorders/users').then(r => { setTeam(r.data || []); setRoles(r.roles || []) }).catch(() => {}),
      api.listAll('currencies').then(r => setCurrencies(r.data || r || [])).catch(() => {}),
    ])
  }, [])

  function emptyForm() {
    const f: any = {}
    for (const fld of DETAIL_FIELDS) {
      if (fld.type === 'number') f[fld.name] = 0
      else f[fld.name] = ''
    }
    f.total = 0; f.subTotal = 0; f.discount = 0; f.discountPercent = 0; f.adjustment = 0
    f.shipping = 0; f.shippingHandling = 0; f.taxAmount = 0; f.grandTotal = 0
    f.currency = ''; f.conversionRate = 1
    f.terms = defaultTerms; f.description = ''
    f.assignedTo = ''
    ;(['billingStreet','billingCity','billingState','billingCountry','billingPostalCode','billingPoBox',
      'shippingStreet','shippingCity','shippingState','shippingCountry','shippingPostalCode','shippingPoBox']).forEach(k => f[k] = '')
    return f
  }

  async function loadRecord(recordId: string) {
    setLoading(true)
    try {
      const r = await api.request<any>(`/purchaseorders/${recordId}`)
      const f = emptyForm()
      for (const fld of DETAIL_FIELDS) {
        if (fld.type === 'date' && r[fld.name]) f[fld.name] = String(r[fld.name]).split('T')[0]
        else f[fld.name] = r[fld.name] ?? ''
      }
      ;(['total','subTotal','discount','discountPercent','adjustment','shipping','shippingHandling','taxAmount','grandTotal']).forEach(k => { f[k] = r[k] || 0 })
      f.currency = r.currency || ''
      f.conversionRate = Number(r.conversionRate) || 1
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
      setMode('view')
    } catch { addToast({ title: 'Error', description: 'Failed to load purchase order', variant: 'destructive' }) }
    setLoading(false)
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
        f.purchaseOrderNo = 'PO-' + Date.now()
        f.currency = orgCurrency()
        return f
      })
    }
  }, [id])

  useEffect(() => { if (isNew && mode === 'form' && Object.keys(form).length) localStorage.setItem(draftKey, JSON.stringify({ form, lineItems })) }, [form, lineItems, isNew, mode])

  useEffect(() => {
    if (mode === 'list') {
      setListLoading(true)
      api.listAll('purchaseorders').then(r => {
        setListRecords(r.data || [])
      }).catch(() => {}).finally(() => setListLoading(false))
    }
  }, [mode])

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
          itemName: product.productName || '',
          listPrice: Number(product.unitPrice || 0),
          unitPrice: Number(product.unitPrice || 0),
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
          itemName: service.serviceName || '',
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
        await api.request('/purchaseorders', { method: 'POST', body: payload })
        localStorage.removeItem(draftKey)
        addToast({ title: 'Created', description: 'Purchase Order created successfully', variant: 'success' })
      } else {
        await api.request(`/purchaseorders/${id}`, { method: 'PUT', body: payload })
        addToast({ title: 'Saved', description: 'Purchase Order updated successfully', variant: 'success' })
      }
      navigate('/purchaseorders')
    } catch (e: any) {
      addToast({ title: 'Error', description: e?.message || 'Failed to save purchase order', variant: 'destructive' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!id) return
    try {
      await api.request(`/purchaseorders/${id}`, { method: 'DELETE' })
      addToast({ title: 'Deleted', description: 'Purchase Order deleted', variant: 'success' })
      navigate('/purchaseorders')
    } catch { addToast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }) }
    setDeleteTarget(false)
  }

  async function handlePdf() {
    try { await api.openAuthenticatedFile(`/purchaseorders/${id}/pdf`) }
    catch (e: any) { addToast({ title: 'PDF preview failed', description: e.message, variant: 'destructive' }) }
  }

  async function handleEmail() {
    const to = prompt('Send to email:')
    if (!to) return
    try {
      await api.request(`/purchaseorders/${id}/email`, { method: 'POST', body: JSON.stringify({ to, attachPdf }) })
      addToast({ title: 'Sent', description: `Email sent to ${to}`, variant: 'success' })
    } catch { addToast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' }) }
  }

  function copyAddress(from: 'billing' | 'shipping', to: 'billing' | 'shipping') {
    const keys = ['street', 'city', 'state', 'country', 'postalCode', 'poBox'] as const
    const patch: any = {}
    keys.forEach(k => { patch[`${to}${k.charAt(0).toUpperCase() + k.slice(1)}`] = form[`${from}${k.charAt(0).toUpperCase() + k.slice(1)}`] || '' })
    setForm((prev: any) => ({ ...prev, ...patch }))
  }

  function renderField(fld: any) {
    const label = fld.label || fld.name
    if (fld.type === 'select') {
      const options = fld.name === 'poStatus' ? PO_STAGES : fld.name === 'carrier' ? CARRIER_OPTIONS : fld.name === 'taxType' ? TAX_TYPES : fld.name === 'currency' ? currencies.map((c: any) => c.code || c.name) : []
      const onSelect = fld.name === 'currency' ? handleCurrencyChange : (v: string) => updateForm(fld.name, v)
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Select value={form[fld.name] || ''} onValueChange={onSelect}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="--None--" /></SelectTrigger>
            <SelectContent>
              {options.map((o: string) => <SelectItem key={o} value={o === '--None--' ? '' : o}>{o === '--None--' ? '--None--' : o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (fld.type === 'lookup') {
      let list: any[] = []
      let labelFn: (r: any) => string = (r: any) => r.id
      if (fld.name === 'vendorId') { list = vendors; labelFn = (r: any) => r.vendorName || r.id }
      if (fld.name === 'contactId') { list = contacts; labelFn = (r: any) => [r.firstName, r.lastName].filter(Boolean).join(' ') || r.id }
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
          <Select value={form[fld.name] || ''} onValueChange={(v) => updateForm(fld.name, v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="--None--" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">--None--</SelectItem>
              {list.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{labelFn(r)}</SelectItem>
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
            <button onClick={() => navigate('/purchaseorders')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold">{isNew ? 'New Purchase Order' : 'Edit Purchase Order'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/purchaseorders')}>Cancel</Button>
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
              {DETAIL_FIELDS.map(f => <Fragment key={f.name}>{renderField(f)}</Fragment>)}
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
          </TabsContent>

          <TabsContent value="items" className="mt-4 space-y-4">
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
                        <button type="button" onClick={() => toggleItemKind(idx, 'product')}
                          className={cn('px-2 py-0.5', item.kind === 'product' ? 'bg-violet-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                        >Product</button>
                        <button type="button" onClick={() => toggleItemKind(idx, 'service')}
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
              <Button variant="outline" size="sm" onClick={() => copyAddress('billing', 'shipping')}><Copy className="mr-1 h-3.5 w-3.5" />Copy Billing to Shipping</Button>
              <Button variant="outline" size="sm" onClick={() => copyAddress('shipping', 'billing')}><Copy className="mr-1 h-3.5 w-3.5" />Copy Shipping to Billing</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Billing Address</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Street</label>
                  <textarea className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.billingStreet || ''} onChange={e => updateForm('billingStreet', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City</label><Input className="h-9 text-sm" value={form.billingCity || ''} onChange={e => updateForm('billingCity', e.target.value)} /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">State</label><Input className="h-9 text-sm" value={form.billingState || ''} onChange={e => updateForm('billingState', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Postal Code</label><Input className="h-9 text-sm" value={form.billingPostalCode || ''} onChange={e => updateForm('billingPostalCode', e.target.value)} /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label><Input className="h-9 text-sm" value={form.billingCountry || ''} onChange={e => updateForm('billingCountry', e.target.value)} /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">PO Box</label><Input className="h-9 text-sm" value={form.billingPoBox || ''} onChange={e => updateForm('billingPoBox', e.target.value)} /></div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Shipping Address</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Street</label>
                  <textarea className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.shippingStreet || ''} onChange={e => updateForm('shippingStreet', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">City</label><Input className="h-9 text-sm" value={form.shippingCity || ''} onChange={e => updateForm('shippingCity', e.target.value)} /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">State</label><Input className="h-9 text-sm" value={form.shippingState || ''} onChange={e => updateForm('shippingState', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Postal Code</label><Input className="h-9 text-sm" value={form.shippingPostalCode || ''} onChange={e => updateForm('shippingPostalCode', e.target.value)} /></div>
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label><Input className="h-9 text-sm" value={form.shippingCountry || ''} onChange={e => updateForm('shippingCountry', e.target.value)} /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground mb-1 block">PO Box</label><Input className="h-9 text-sm" value={form.shippingPoBox || ''} onChange={e => updateForm('shippingPoBox', e.target.value)} /></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Terms & Conditions</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.terms || ''} onChange={e => updateForm('terms', e.target.value)} placeholder="Default terms auto-loaded from organization settings..." />
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
    const vendorName = vendors.find(v => v.id === r.vendorId)?.vendorName
    const contactName = contacts.find(c => c.id === r.contactId) ? [contacts.find(c => c.id === r.contactId)?.firstName, contacts.find(c => c.id === r.contactId)?.lastName].filter(Boolean).join(' ') : null
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/purchaseorders')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{r.subject || 'Purchase Order'}</h1>
              <p className="text-sm text-muted-foreground">{r.purchaseOrderNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.poStatus === 'Approved' || r.poStatus === 'Received Shipment' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : r.poStatus === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
              {r.poStatus || 'Created'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setMode('form')}><FileText className="mr-1 h-4 w-4" />Edit</Button>
            <Button variant="outline" size="sm" onClick={handlePdf}><FileDown className="mr-1 h-4 w-4" />PDF</Button>
            <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="mr-1 h-4 w-4" />Email</Button>
            <label className="inline-flex h-9 items-center gap-1.5 rounded-md border px-2 text-xs font-medium"><input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} /> Attach PDF</label>
            <Button variant="outline" size="sm" className="text-red-500" onClick={() => setDeleteTarget(true)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
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
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-medium">{item.itemName || '-'}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-2 text-right">{Number(item.discount).toFixed(2)}</td>
                      <td className="p-2 text-right">{Number(item.tax).toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">{Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Sub Total</span><span>{Number(r.subTotal || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Discount</span><span>{Number(r.discount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Tax</span><span>{Number(r.taxAmount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Shipping</span><span>{Number(r.shipping || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Adjustment</span><span>{Number(r.adjustment || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-t font-bold text-lg"><span>Grand Total</span><span>{Number(r.grandTotal || 0).toFixed(2)} {r.currency || ''}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Details</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {vendorName && <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{vendorName}</span></div>}
                {contactName && <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{contactName}</span></div>}
                {r.validUntil && <div><span className="text-muted-foreground">Valid Until:</span> <span className="font-medium">{formatDate(r.validUntil)}</span></div>}
                {r.carrier && <div><span className="text-muted-foreground">Carrier:</span> <span className="font-medium">{r.carrier}</span></div>}
                {r.assignedTo && <div><span className="text-muted-foreground">Assigned To:</span> <span className="font-medium">{r.assignedTo}</span></div>}
              </div>
            </div>

            {(r.terms || r.description) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Terms & Conditions</h3>
                {r.terms && <p className="text-sm whitespace-pre-wrap">{r.terms}</p>}
                {r.description && <div><h4 className="text-xs font-semibold text-muted-foreground mb-1">Description</h4><p className="text-sm whitespace-pre-wrap">{r.description}</p></div>}
              </div>
            )}
          </div>
        </div>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(false)}>
            <div className="bg-card rounded-xl border p-6 shadow-lg max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-2">Delete Purchase Order</h2>
              <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this purchase order?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (mode === 'list') {
    const filtered = listRecords.filter((r: any) => {
      if (!listSearch) return true
      const q = listSearch.toLowerCase()
      return (r.subject || '').toLowerCase().includes(q) ||
             (r.purchaseOrderNo || '').toLowerCase().includes(q) ||
             (r.poStatus || '').toLowerCase().includes(q)
    })

    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <Button asChild>
            <Link to="/purchaseorders/new"><Plus className="mr-1 h-4 w-4" />New Purchase Order</Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search purchase orders..."
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
        </div>

        {listLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium">No purchase orders found</p>
            <p className="text-sm mt-1">{listSearch ? 'Try a different search' : 'Create your first purchase order'}</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium text-muted-foreground">PO No</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Carrier</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Grand Total</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{r.purchaseOrderNo || '-'}</td>
                    <td className="p-3">{r.subject || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.poStatus === 'Approved' || r.poStatus === 'Received Shipment' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        r.poStatus === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {r.poStatus || 'Created'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.carrier || '-'}</td>
                    <td className="p-3 text-right font-medium">{Number(r.grandTotal || 0).toFixed(2)} {r.currency || ''}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link to={`/purchaseorders/${r.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link to={`/purchaseorders/${r.id}`} state={{ edit: true }}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return null
}
