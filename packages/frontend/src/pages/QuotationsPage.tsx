import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, Trash2, Plus, FileText, Mail, FileDown, Printer, Search, Copy, ShoppingCart, History, MessageSquare, Building2, Users } from 'lucide-react'
import { FormField } from '@/components/form-field'
import { ProductSearchSelect } from '@/components/product-search-select'
import { ServiceSearchSelect } from '@/components/service-search-select'
import { UserRoleSelect } from '@/components/user-role-select'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, orgCurrency, useOrgSettings } from '@/lib/org-format'

const EMPTY_LINE = { productId: '', serviceId: '', itemName: '', qty: 1, listPrice: 0, unitPrice: 0, discount: 0, discountPercent: 0, tax: 0, taxPercent: 0, netPrice: 0, lineTotal: 0, description: '', kind: 'product' }
const STAGES = ['--None--', 'Created', 'Draft', 'Reviewed', 'Delivered', 'Accepted', 'Rejected']
const TAX_TYPES = ['--None--', 'Individual', 'Group', 'VAT', 'GST', 'Sales Tax']

const ITEM_LABEL = 'block text-[11px] font-semibold text-slate-900 dark:text-slate-100 mb-1'
const ITEM_INPUT = 'h-8 text-xs'
const ITEM_VALUE = 'h-8 flex items-center justify-end rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100'

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

function calcTotals(items: any[]) {
  const subTotal = items.reduce((s, i) => s + i.lineTotal, 0)
  const totalTax = items.reduce((s, i) => s + i.tax, 0)
  return { subTotal, taxAmount: totalTax }
}

export function QuotationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  useOrgSettings()
  const isNew = !id || id === 'new'

  const [mode, setMode] = useState<'list' | 'form' | 'view'>(id === 'new' ? 'form' : id ? 'view' : 'list')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')

  const [form, setForm] = useState<any>({
    subject: '', quoteNo: '', validUntil: '', quoteStage: '', carrier: '', inventoryManager: '',
    taxType: '', total: 0, subTotal: 0, discount: 0, discountPercent: 0, adjustment: 0,
    shipping: 0, shippingHandling: 0, taxAmount: 0, grandTotal: 0,
    currency: '', conversionRate: 1,
    accountId: '', contactId: '', potentialId: '',
    billingStreet: '', billingCity: '', billingState: '', billingCountry: '', billingPostalCode: '', billingPoBox: '',
    shippingStreet: '', shippingCity: '', shippingState: '', shippingCountry: '', shippingPostalCode: '', shippingPoBox: '',
    terms: '', description: '',
  })
  const [lineItems, setLineItems] = useState<any[]>([{ ...EMPTY_LINE, lineTotal: 0 }])

  const [accounts, setAccounts] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [potentials, setPotentials] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  const [related, setRelated] = useState<any>({ stageHistory: [], salesOrders: [], invoices: [], comments: [] })
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    Promise.all([
      api.list('accounts').then(r => setAccounts(r.data || [])).catch(() => {}),
      api.list('contacts').then(r => setContacts(r.data || [])).catch(() => {}),
      api.list('potentials').then(r => setPotentials(r.data || [])).catch(() => {}),
      api.list('products').then(r => setProducts(r.data || [])).catch(() => {}),
      api.list('services').then(r => setServices(r.data || [])).catch(() => {}),
      api.listAll('currencies').then(r => setCurrencies(r.data || r || [])).catch(() => {}),
      api.request<any>('/quotations/users').then(r => { setTeam(r.data || []); setRoles(r.roles || []) }).catch(() => {}),
    ])
  }, [])

  async function loadList() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      if (search) params.set('search', search)
      const res = await api.request<any>('/quotations?' + params.toString())
      setRecords(res.data || [])
      setPagination(res.pagination)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (mode === 'list' || (!id && mode !== 'form')) loadList() }, [page, mode])

  async function loadRecord(recordId: string) {
    setLoading(true)
    try {
      const res = await api.request<any>(`/quotations/${recordId}`)
      const r = res
      setForm({
        subject: r.subject || '', quoteNo: r.quoteNo || '', validUntil: r.validUntil ? r.validUntil.split('T')[0] : '',
        quoteStage: r.quoteStage || '', carrier: r.carrier || '', inventoryManager: r.inventoryManager || '',
        taxType: r.taxType || '', total: r.total || 0, subTotal: r.subTotal || 0, discount: r.discount || 0,
        discountPercent: r.discountPercent || 0, adjustment: r.adjustment || 0, shipping: r.shipping || 0,
        shippingHandling: r.shippingHandling || 0, taxAmount: r.taxAmount || 0, grandTotal: r.grandTotal || 0,
        accountId: r.accountId || '', contactId: r.contactId || '', potentialId: r.potentialId || '',
        billingStreet: r.billingStreet || '', billingCity: r.billingCity || '', billingState: r.billingState || '',
        billingCountry: r.billingCountry || '', billingPostalCode: r.billingPostalCode || '', billingPoBox: r.billingPoBox || '',
        shippingStreet: r.shippingStreet || '', shippingCity: r.shippingCity || '', shippingState: r.shippingState || '',
        shippingCountry: r.shippingCountry || '', shippingPostalCode: r.shippingPostalCode || '', shippingPoBox: r.shippingPoBox || '',
        terms: r.terms || '', description: r.description || '',
        currency: r.currency || '', conversionRate: Number(r.conversionRate) || 1,
      })
      setLineItems((r.lineItems || []).map((i: any) => ({
        productId: i.productId || '', serviceId: i.serviceId || '', itemName: i.itemName || '',
        qty: Number(i.qty || 1), listPrice: Number(i.listPrice || 0), unitPrice: Number(i.unitPrice || 0),
        discount: Number(i.discount || 0), discountPercent: Number(i.discountPercent || 0),
        tax: Number(i.tax || 0), taxPercent: Number(i.taxPercent || 0),
        netPrice: Number(i.netPrice || 0), lineTotal: Number(i.lineTotal || 0), description: i.description || '',
        kind: i.serviceId ? 'service' : 'product',
      })))
      setRelated({
        stageHistory: r.stageHistory || [],
        salesOrders: r.salesOrders || [],
        invoices: r.invoices || [],
        comments: r.comments || [],
      })
      setMode('view')
    } catch { addToast({ title: 'Error', description: 'Failed to load quotation', variant: 'destructive' }) }
    setLoading(false)
  }

  useEffect(() => {
    api.getOrgSettings().then((s: any) => {
      const t = s?.terms?.quote || ''
      if (id === 'new') setForm((prev: any) => ({ ...prev, terms: prev.terms || t }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (id && id !== 'new') loadRecord(id)
    else if (id === 'new') { setMode('form'); setForm((prev: any) => ({ ...prev, quoteNo: 'QUO-' + Date.now(), currency: orgCurrency() })) }
  }, [id])

  function updateForm(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function handleCurrencyChange(code: string) {
    const cur = currencies.find(c => (c.code || c.name) === code)
    const rate = cur && Number(cur.rate) > 0 ? Number(cur.rate) : 1
    setForm((prev: any) => ({ ...prev, currency: code, conversionRate: rate }))
  }

  function updateLineItem(idx: number, field: string, value: any) {
    setLineItems((prev: any[]) => {
      const next = prev.map((item, i) => {
        if (i !== idx) return item
        if (field === 'discountPercent' && (value === 0 || value === '')) return { ...item, discountPercent: 0, discount: 0 }
        return { ...item, [field]: value }
      })
      const computed = next.map(i => calcItem(i))
      const totals = calcTotals(computed)
      setForm((f: any) => ({
        ...f,
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        grandTotal: totals.subTotal + totals.taxAmount + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0),
      }))
      return computed
    })
  }

  function addLineItem() {
    setLineItems((prev: any[]) => [...prev, { ...EMPTY_LINE, kind: 'product' }])
  }

  function addServiceLineItem() {
    setLineItems((prev: any[]) => [...prev, { ...EMPTY_LINE, kind: 'service' }])
  }

  function removeLineItem(idx: number) {
    setLineItems((prev: any[]) => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) next.push({ ...EMPTY_LINE })
      const computed = next.map(i => calcItem(i))
      const totals = calcTotals(computed)
      setForm((f: any) => ({
        ...f, subTotal: totals.subTotal, taxAmount: totals.taxAmount,
        grandTotal: totals.subTotal + totals.taxAmount + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0),
      }))
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
        const totals = calcTotals(computed)
        setForm((f: any) => ({
          ...f, subTotal: totals.subTotal, taxAmount: totals.taxAmount,
          grandTotal: totals.subTotal + totals.taxAmount + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0),
        }))
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
        const totals = calcTotals(computed)
        setForm((f: any) => ({
          ...f, subTotal: totals.subTotal, taxAmount: totals.taxAmount,
          grandTotal: totals.subTotal + totals.taxAmount + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0),
        }))
        return computed
      })
    }
  }

  function toggleItemKind(idx: number, kind: 'product' | 'service') {
    setLineItems((prev: any[]) => {
      const next = [...prev]
      next[idx] = { ...next[idx], kind, productId: '', serviceId: '' }
      const computed = next.map(i => calcItem(i))
      const totals = calcTotals(computed)
      setForm((f: any) => ({
        ...f, subTotal: totals.subTotal, taxAmount: totals.taxAmount,
        grandTotal: totals.subTotal + totals.taxAmount + Number(f.shipping || 0) + Number(f.shippingHandling || 0) + Number(f.adjustment || 0) - Number(f.discount || 0),
      }))
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
        await api.request('/quotations', { method: 'POST', body: payload })
        addToast({ title: 'Created', description: 'Quotation created successfully', variant: 'success' })
      } else {
        await api.request(`/quotations/${id}`, { method: 'PUT', body: payload })
        addToast({ title: 'Saved', description: 'Quotation updated successfully', variant: 'success' })
      }
      navigate('/quotes')
    } catch (e: any) {
      addToast({ title: 'Error', description: e?.message || 'Failed to save quotation', variant: 'destructive' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this quotation?')) return
    try {
      await api.request(`/quotations/${id}`, { method: 'DELETE' })
      addToast({ title: 'Deleted', description: 'Quotation deleted' })
      navigate('/quotes')
    } catch { addToast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }) }
  }

  async function handleConvertInvoice() {
    if (!confirm('Convert this quotation to an Invoice?')) return
    try {
      const inv = await api.request(`/quotations/${id}/convert-invoice`, { method: 'POST' })
      addToast({ title: 'Invoice Created', description: `Invoice ${inv.invoiceNo || ''} created` })
      loadRecord(id!)
    } catch { addToast({ title: 'Error', description: 'Failed to convert', variant: 'destructive' }) }
  }

  async function handleConvertSalesOrder() {
    if (!confirm('Convert this quotation to a Sales Order?')) return
    try {
      const so = await api.request(`/quotations/${id}/convert-salesorder`, { method: 'POST' })
      addToast({ title: 'Sales Order Created', description: `Sales Order ${so.salesOrderNo || ''} created` })
      loadRecord(id!)
    } catch { addToast({ title: 'Error', description: 'Failed to convert', variant: 'destructive' }) }
  }

  async function handleAddComment() {
    if (!comment.trim()) return
    setAddingComment(true)
    try {
      const created = await api.request(`/quotations/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
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
      await api.request(`/quotations/${id}/email`, { method: 'POST', body: JSON.stringify({ to }) })
      addToast({ title: 'Sent', description: `Email logged to console for ${to}` })
    } catch { addToast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' }) }
  }

  async function handlePdf() {
    try { await api.openAuthenticatedFile(`/quotations/${id}/pdf`) }
    catch (e: any) { addToast({ title: 'PDF preview failed', description: e.message, variant: 'destructive' }) }
  }

  const selectedRecord = records.find(r => r.id === id)

  const fieldProps = { form, updateForm, accounts, contacts, potentials, products, team }

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
            <button onClick={() => navigate('/quotes')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-bold">{isNew ? 'New Quotation' : 'Edit Quotation'}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/quotes')}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-1 h-4 w-4" /> : <Save className="mr-1 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <TabsRoot value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details" className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />Details
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-violet-500" />Line Items
            </TabsTrigger>
            <TabsTrigger value="address" className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />Address
            </TabsTrigger>
            <TabsTrigger value="terms" className="data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />Terms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField {...fieldProps} field="subject" type="text" />
              <FormField {...fieldProps} field="quoteNo" type="text" />
              <FormField {...fieldProps} field="validUntil" type="date" />
              <FormField {...fieldProps} field="quoteStage" type="select" options={STAGES} />
              <FormField {...fieldProps} field="carrier" type="text" />
              <FormField {...fieldProps} field="inventoryManager" type="text" />
              <FormField {...fieldProps} field="taxType" type="select" options={TAX_TYPES} />
              <FormField {...fieldProps} field="currency" type="select" options={currencies.map((c: any) => c.code || c.name)} onSelect={handleCurrencyChange} />
              <FormField {...fieldProps} field="conversionRate" type="number" />
              <FormField {...fieldProps} field="accountId" type="lookup" />
              <FormField {...fieldProps} field="contactId" type="lookup" />
              <FormField {...fieldProps} field="potentialId" type="lookup" />
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
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.discount} onChange={e => updateForm('discount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex justify-between py-1"><span>Tax:</span><span className="font-medium">{lineItems.reduce((s, i) => s + i.tax, 0).toFixed(2)}</span></div>
                <div className="flex justify-between py-1">
                  <span>Shipping:</span>
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.shipping} onChange={e => updateForm('shipping', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex justify-between py-1">
                  <span>Adjustment:</span>
                  <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right inline-block" value={form.adjustment} onChange={e => updateForm('adjustment', parseFloat(e.target.value) || 0)} />
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
                <FormField {...fieldProps} field="billingStreet" type="textarea" label="Street" />
                <div className="grid grid-cols-2 gap-2">
                  <FormField {...fieldProps} field="billingCity" type="text" label="City" />
                  <FormField {...fieldProps} field="billingState" type="text" label="State" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField {...fieldProps} field="billingPostalCode" type="text" label="Postal Code" />
                  <FormField {...fieldProps} field="billingCountry" type="text" label="Country" />
                </div>
                <FormField {...fieldProps} field="billingPoBox" type="text" label="PO Box" />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Shipping Address</h3>
                <FormField {...fieldProps} field="shippingStreet" type="textarea" label="Street" />
                <div className="grid grid-cols-2 gap-2">
                  <FormField {...fieldProps} field="shippingCity" type="text" label="City" />
                  <FormField {...fieldProps} field="shippingState" type="text" label="State" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField {...fieldProps} field="shippingPostalCode" type="text" label="Postal Code" />
                  <FormField {...fieldProps} field="shippingCountry" type="text" label="Country" />
                </div>
                <FormField {...fieldProps} field="shippingPoBox" type="text" label="PO Box" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="mt-4 space-y-4">
            <FormField {...fieldProps} field="terms" type="textarea" label="Terms & Conditions" />
            <FormField {...fieldProps} field="description" type="textarea" label="Description" />
          </TabsContent>
        </TabsRoot>
      </div>
    )
  }

  if (mode === 'view' && id) {
    const r = form
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/quotes')} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{r.subject || 'Quotation'}</h1>
              <p className="text-sm text-muted-foreground">{r.quoteNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.quoteStage === 'Accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : r.quoteStage === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
              {r.quoteStage || 'Draft'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setMode('form')}><FileText className="mr-1 h-4 w-4" />Edit</Button>
            <Button variant="outline" size="sm" onClick={handlePdf}><FileDown className="mr-1 h-4 w-4" />PDF</Button>
            <Button variant="outline" size="sm" onClick={handleEmail}><Mail className="mr-1 h-4 w-4" />Email</Button>
            <Button variant="outline" size="sm" onClick={handleConvertSalesOrder}><ShoppingCart className="mr-1 h-4 w-4" />Sales Order</Button>
            <Button variant="outline" size="sm" onClick={handleConvertInvoice}><Printer className="mr-1 h-4 w-4" />Invoice</Button>
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
              <p><span className="text-muted-foreground">Stage:</span> {r.quoteStage || 'N/A'}</p>
              <p><span className="text-muted-foreground">Valid Until:</span> {r.validUntil ? formatDate(r.validUntil) : 'N/A'}</p>
              <p><span className="text-muted-foreground">Carrier:</span> {r.carrier || 'N/A'}</p>
              <p><span className="text-muted-foreground">Currency:</span> {r.currency || 'N/A'}{r.conversionRate && Number(r.conversionRate) !== 1 ? ` (rate ${r.conversionRate})` : ''}</p>
              <p><span className="text-muted-foreground">Tax Type:</span> {r.taxType || 'N/A'}</p>
            </div>
            {r.terms && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Terms</h4><p className="text-muted-foreground">{r.terms}</p></div>}
            {r.description && <div className="rounded-xl border bg-card p-4 text-sm"><h4 className="font-semibold mb-1">Description</h4><p className="text-muted-foreground">{r.description}</p></div>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><History size={16} />Quote Stage History</h3>
            {related.stageHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stage changes recorded.</p>
            ) : (
              <ol className="relative border-l border-muted ml-2 space-y-4">
                {related.stageHistory.map((h: any, idx: number) => (
                  <li key={idx} className="ml-4">
                    <div className="absolute -left-[5px] mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-sm font-medium">{h.stage}</p>
                    <p className="text-xs text-muted-foreground">{h.changedByName || 'Unknown'} · {formatDateTime(h.createdAt)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingCart size={16} />Related Sales Orders</h3>
            {related.salesOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales orders from this quote.</p>
            ) : (
              <div className="space-y-2">
                {related.salesOrders.map((so: any) => (
                  <div key={so.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium">{so.salesOrderNo || so.subject}</p>
                      <p className="text-xs text-muted-foreground">{so.soStatus || 'Created'} · {formatDate(so.createdAt)}</p>
                    </div>
                    <span className="font-semibold">${Number(so.grandTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Printer size={16} />Related Invoices</h3>
            {related.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices from this quote.</p>
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
        </div>

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

  const listColumns = [
    { key: 'quoteNo', label: 'Quote No', render: (v: any) => <span className="font-medium">{v || '-'}</span> },
    { key: 'subject', label: 'Subject' },
    { key: 'grandTotal', label: 'Amount', render: (v: any, row: any) => <span className="font-medium">{Number(v || 0).toFixed(2)} {row.currency || ''}</span> },
    { key: 'quoteStage', label: 'Stage', render: (v: any) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${v === 'Accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : v === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
        {v || 'Draft'}
      </span>
    )},
    { key: 'validUntil', label: 'Valid Until', render: (v: any) => <span className="text-muted-foreground">{v ? formatDate(v) : '-'}</span> },
    { key: 'createdAt', label: 'Created', render: (v: any) => <span className="text-muted-foreground">{formatDate(v)}</span> },
  ]

  const handleSearch = () => { setPage(1); loadList() }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-sm text-muted-foreground">Manage quotations</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}><Plus className="mr-1 h-4 w-4" />New Quotation</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by quote no or subject..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-9" />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
      </div>

      <DataTable
        columns={listColumns}
        data={records}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/quotes/${r.id}`)}
        emptyMessage="No quotations found"
      />
    </div>
  )
}
