import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { formatMoney, formatDate } from '@/lib/org-format'
import { DateField } from '@/components/ui/date-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserRoleSelect, userDisplayName } from '@/components/user-role-select'
import { VendorSearchSelect } from '@/components/vendor-search-select'
import {
  ArrowLeft, Boxes, Save, Pencil, Trash2, ImageIcon, Loader2, Globe, Tag, Plus, X, Star,
  ImagePlus, CloudUpload,
} from 'lucide-react'

const PRODUCT_CATEGORIES = ['Hardware', 'Software', 'CRM Applications']

const MANUFACTURERS = [
  'Not Available', 'Acer', 'Apple', 'Asus', 'Belkin', 'Bose', 'Brother', 'Canon', 'Casio',
  'Cisco', 'Compaq', 'Dell', 'Denon', 'Dymo', 'Epson', 'Fellowes', 'Fujitsu',
  'Harman Kardon', 'Hewlett Packard', 'Hitachi', 'Honeywell', 'IBM', 'JVC', 'Kensington',
  'Kenwood', 'Kodak', 'Konica', 'Kyocera', 'LG', 'Lenovo', 'Logitech', 'Memorex',
  'Microsoft', 'Minolta', 'Mitsubishi', 'Motorola', 'NEC', 'Nikon', 'Nokia', 'Olympus',
  'Panasonic', 'Philips', 'Pioneer', 'RCA', 'Ricoh', 'Samsung', 'Sanyo', 'Sharp',
  'Siemens', 'Sony', 'Sun Microsystems', 'Toshiba', 'Viewsonic', 'Xerox', 'Yamaha', 'Zenith',
]

const USAGE_UNITS = [
  'Box', 'Carton', 'Dozen', 'Each', 'Hours', 'Impressions', 'Lb', 'M', 'Pack',
  'Pages', 'Pieces', 'Reams', 'Sheet', 'Spiral Binder', 'Sq Ft',
]

const GL_ACCOUNTS = [
  '300-Sales-Software', '301-Sales-Hardware', '302-Rental-Income', '303-Interest-Income',
  '304-Sales-Software-Support', '305-Sales Other', '306-Internet Sales',
  '307-Service-Hardware Labor', '308-Sales-Books',
]

const TAX_CLASSES = ['Sales Tax', 'Service Tax', 'Value Added Tax', 'GST']

const COMMISSION_METHODS = ['Fixed', 'Percentage']

const TAX_DEFAULTS: Record<'vat' | 'isService' | 'isSales', number> = {
  vat: 4.5,
  isService: 12.5,
  isSales: 10,
}

interface TaxFieldDef {
  key: 'vat' | 'isService' | 'isSales'
  percentKey: 'vatPercentage' | 'servicePercentage' | 'salesPercentage'
  label: string
}

const TAX_FIELDS: TaxFieldDef[] = [
  { key: 'vat', percentKey: 'vatPercentage', label: 'VAT (%)' },
  { key: 'isService', percentKey: 'servicePercentage', label: 'Service (%)' },
  { key: 'isSales', percentKey: 'salesPercentage', label: 'Sales (%)' },
]

interface ProductImage {
  url: string
  isDefault: boolean
}

interface ProductRecord {
  id: string
  productNo?: string | null
  partNumber?: string | null
  productName?: string
  isActive?: boolean
  discontinued?: boolean
  productCategory?: string | null
  manufacturer?: string | null
  website?: string | null
  mfrPartNo?: string | null
  vendorPartNo?: string | null
  productSheet?: string | null
  serialNo?: string | null
  usageUnit?: string | null
  qtyPerUnit?: string | null
  taxClass?: string | null
  glAccount?: string | null
  salesStartDate?: string | null
  salesEndDate?: string | null
  description?: string | null
  image?: string | null
  images?: ProductImage[]
  unitPrice?: number | string | null
  costPrice?: number | string | null
  commissionRate?: number | string | null
  commissionMethod?: string | null
  commissionPercentage?: number | string | null
  pricingFormula?: string | null
  markupPercent?: number | string | null
  qtyInStock?: number | string | null
  qtyInDemand?: number | string | null
  qtyOnOrder?: number | string | null
  reorderLevel?: number | string | null
  weight?: number | string | null
  packSize?: number | string | null
  assignedTo?: string | null
  vendorId?: string | null
  vat?: boolean
  isService?: boolean
  isSales?: boolean
  vatPercentage?: number | string | null
  servicePercentage?: number | string | null
  salesPercentage?: number | string | null
}

interface FieldDef {
  key: keyof ProductRecord
  label: string
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'checkbox'
  options?: string[]
  placeholder?: string
  hint?: string
  span?: number
}

const DETAIL_FIELDS: FieldDef[] = [
  { key: 'productName', label: 'Product Name', type: 'text', span: 2, placeholder: 'Product name' },
  { key: 'isActive', label: 'Product Active', type: 'checkbox', span: 1 },
  { key: 'discontinued', label: 'Discontinued', type: 'checkbox', span: 1 },
  { key: 'productNo', label: 'Product No', type: 'text', span: 2, hint: 'Leave blank to auto-generate. Must be unique.' },
  { key: 'partNumber', label: 'Part Number', type: 'text', span: 2, placeholder: 'SKU / part code' },
  { key: 'productCategory', label: 'Product Category', type: 'select', options: PRODUCT_CATEGORIES, span: 1 },
  { key: 'manufacturer', label: 'Manufacturer', type: 'select', options: MANUFACTURERS, span: 1 },
  { key: 'website', label: 'Website', type: 'text', span: 2 },
  { key: 'mfrPartNo', label: 'Mfr PartNo', type: 'text', span: 1 },
  { key: 'vendorPartNo', label: 'Vendor PartNo', type: 'text', span: 1 },
  { key: 'vendorId', label: 'Vendor', type: 'select', span: 2 },
  { key: 'assignedTo', label: 'Handler', type: 'select', span: 2 },
  { key: 'usageUnit', label: 'Usage Unit', type: 'select', options: USAGE_UNITS, span: 1 },
  { key: 'qtyPerUnit', label: 'Qty/Unit', type: 'text', span: 1 },
  { key: 'serialNo', label: 'Serial No', type: 'text', span: 1 },
  { key: 'salesStartDate', label: 'Sales Start Date', type: 'date', span: 1 },
  { key: 'salesEndDate', label: 'Sales End Date', type: 'date', span: 1 },
  { key: 'productSheet', label: 'Product Sheet', type: 'text', span: 2 },
  { key: 'taxClass', label: 'Tax Class', type: 'select', options: TAX_CLASSES, span: 1 },
  { key: 'glAccount', label: 'GL Account', type: 'select', options: GL_ACCOUNTS, span: 1 },
  { key: 'description', label: 'Description', type: 'textarea', span: 4 },
]

const STOCK_FIELDS: FieldDef[] = [
  { key: 'qtyInStock', label: 'Qty In Stock', type: 'number', span: 1 },
  { key: 'qtyInDemand', label: 'Qty In Demand', type: 'number', span: 1 },
  { key: 'qtyOnOrder', label: 'Qty On Order', type: 'number', span: 1 },
  { key: 'reorderLevel', label: 'Reorder Level', type: 'number', span: 1 },
  { key: 'weight', label: 'Weight', type: 'number', span: 1 },
  { key: 'packSize', label: 'Pack Size', type: 'number', span: 1 },
  { key: 'taxClass', label: 'Tax Class', type: 'select', options: TAX_CLASSES, span: 2 },
  { key: 'glAccount', label: 'GL Account', type: 'select', options: GL_ACCOUNTS, span: 2 },
]

const PRICE_FIELDS: FieldDef[] = [
  { key: 'unitPrice', label: 'Unit Price', type: 'currency', span: 2 },
  { key: 'costPrice', label: 'Cost Price', type: 'currency', span: 2 },
  { key: 'commissionRate', label: 'Commission Rate', type: 'currency', span: 2 },
  { key: 'commissionPercentage', label: 'Commission %', type: 'currency', span: 2 },
  { key: 'commissionMethod', label: 'Commission Method', type: 'select', options: COMMISSION_METHODS, span: 2 },
  { key: 'pricingFormula', label: 'Pricing Formula', type: 'text', span: 1 },
  { key: 'markupPercent', label: 'Markup %', type: 'number', span: 1 },
]

const defaultDraft: ProductRecord = {
  id: '',
  productName: '',
  productNo: '',
  partNumber: '',
  isActive: true,
  discontinued: false,
  productCategory: '',
  manufacturer: '',
  website: '',
  mfrPartNo: '',
  vendorPartNo: '',
  usageUnit: '',
  qtyPerUnit: '',
  serialNo: '',
  taxClass: '',
  glAccount: '',
  productSheet: '',
  salesStartDate: '',
  salesEndDate: '',
  description: '',
  image: '',
  images: [],
  unitPrice: '',
  costPrice: '',
  commissionRate: '',
  commissionMethod: '',
  commissionPercentage: '',
  pricingFormula: '',
  markupPercent: '',
  qtyInStock: 0,
  qtyInDemand: 0,
  qtyOnOrder: 0,
  reorderLevel: 0,
  weight: '',
  packSize: '',
  assignedTo: '',
  vendorId: '',
  vat: false,
  isService: false,
  isSales: false,
  vatPercentage: '',
  servicePercentage: '',
  salesPercentage: '',
}

const NUMERIC_FIELDS = new Set<keyof ProductRecord>([
  'unitPrice', 'costPrice', 'commissionRate', 'commissionPercentage', 'markupPercent',
  'qtyInStock', 'qtyInDemand', 'qtyOnOrder', 'reorderLevel', 'weight', 'packSize',
  'vatPercentage', 'servicePercentage', 'salesPercentage',
])

const SPAN_CLASS: Record<number, string> = {
  1: '',
  2: 'md:col-span-2',
  3: 'md:col-span-2 xl:col-span-3',
  4: 'md:col-span-2 xl:col-span-4',
}

const ALL_FIELDS: FieldDef[] = [...DETAIL_FIELDS, ...STOCK_FIELDS, ...PRICE_FIELDS]

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const isNew = !id
  const [editing, setEditing] = useState(isNew)
  const [draft, setDraft] = useState<ProductRecord>(defaultDraft)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [vendorForm, setVendorForm] = useState<Record<string, string>>({})
  const [savingVendor, setSavingVendor] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: record, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => api.get('products', id as string),
    enabled: !!id,
  })

  const vendorsQuery = useQuery({
    queryKey: ['vendors', 'all'],
    queryFn: () => api.listAll('vendors', { limit: '500' }),
  })

  const usersQuery = useQuery({
    queryKey: ['products', 'users'],
    queryFn: () => api.request<any>('/products/users'),
  })

  const categoryPicklistQuery = useQuery({
    queryKey: ['picklists', 'products', 'productCategory'],
    queryFn: () => api.getPicklists({ module: 'products', field: 'productCategory' }).catch(() => ({ data: [] })),
  })
  const categoryOptions = useMemo(() => {
    const stored = (categoryPicklistQuery.data?.data || []).map((o: any) => o.label).filter(Boolean)
    return stored.length ? stored : PRODUCT_CATEGORIES
  }, [categoryPicklistQuery.data])

  useEffect(() => {
    if (record) {
      const images = Array.isArray(record.images)
        ? record.images.map((i: any) => ({ url: i.imageUrl, isDefault: !!i.isDefault }))
        : []
      setDraft({ ...defaultDraft, ...record, images })
    }
  }, [record])

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ProductRecord>) =>
      isNew ? api.create('products', payload) : api.update('products', id as string, payload),
    onSuccess: (saved: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      addToast({ title: isNew ? 'Product created' : 'Product updated', variant: 'success' })
      navigate(`/products/${saved.id}`, { replace: true })
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('products', id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      addToast({ title: 'Deleted', description: 'Product moved to Recycle Bin', variant: 'success' })
      navigate('/products')
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const addVendorMutation = useMutation({
    mutationFn: (data: any) => api.create('vendors', data),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      addToast({ title: 'Vendor created', variant: 'success' })
      setField('vendorId', created.id || '')
      setVendorModalOpen(false)
      setVendorForm({})
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const vendorOptions = useMemo(() => {
    const rows = vendorsQuery.data?.data || vendorsQuery.data || []
    return Array.isArray(rows) ? rows : []
  }, [vendorsQuery.data])

  const userOptions = useMemo(() => {
    const rows = usersQuery.data?.data || []
    return Array.isArray(rows) ? rows : []
  }, [usersQuery.data])

  const roleOptions = useMemo(() => {
    const rows = usersQuery.data?.roles || []
    return Array.isArray(rows) ? rows : []
  }, [usersQuery.data])

  const vendorName = (v: string) => vendorOptions.find((x: any) => x.id === v)?.vendorName || v
  const userName = (v: string) => {
    const u = userOptions.find((x: any) => x.id === v)
    if (u) return userDisplayName(u)
    const r = roleOptions.find((x: any) => x.id === v)
    if (r) return r.name || v
    return v
  }

  const setField = (key: keyof ProductRecord, value: any) => {
    setDraft(d => ({ ...d, [key]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await api.uploadFile(file)
      setField('images', [...(draft.images || []), { url: res.path, isDefault: (draft.images?.length || 0) === 0 }])
    } catch (err: any) {
      addToast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingImage(false)
    }
  }

  const defaultImage = draft.images?.find(i => i.isDefault)?.url || draft.images?.[0]?.url || draft.image

  const handleSave = () => {
    if (!draft.productName?.trim()) {
      addToast({ title: 'Error', description: 'Product Name is required', variant: 'destructive' })
      return
    }
    const payload: any = {}
    for (const f of ALL_FIELDS) {
      let v: any = draft[f.key]
      if (NUMERIC_FIELDS.has(f.key)) v = v === '' || v == null ? null : Number(v)
      if (f.type === 'checkbox') v = !!v
      if (f.type === 'select' && (v === '' || v == null)) v = null
      if (f.type === 'date' && v) {
        v = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : (v as string).slice(0, 10)
      }
      payload[f.key] = v
    }
    const images = (draft.images || []).map(img => ({ url: img.url, isDefault: !!img.isDefault }))
    payload.images = images
    payload.image = defaultImage || null
    for (const tax of TAX_FIELDS) {
      payload[tax.key] = !!draft[tax.key]
      payload[tax.percentKey] = draft[tax.key]
        ? draft[tax.percentKey] === '' || draft[tax.percentKey] == null
          ? TAX_DEFAULTS[tax.key]
          : Number(draft[tax.percentKey])
        : null
    }
    saveMutation.mutate(payload)
  }

  const fieldValue = (f: FieldDef): any => {
    const v: any = draft[f.key]
    if (f.type === 'checkbox') return v
    if (f.key === 'vendorId') return v ? vendorName(String(v)) : null
    if (f.key === 'assignedTo') return v ? userName(String(v)) : null
    if (v == null || v === '') return null
    if (f.type === 'currency') return formatMoney(v)
    if (f.type === 'number') return String(Number(v))
    if (f.type === 'date') return formatDate(v)
    return v
  }

  const renderField = (f: FieldDef) => {
    const value: any = draft[f.key]
    const label = <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</label>

    if (f.type === 'checkbox') {
      return (
        <div className="space-y-1.5">
          {label}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => setField(f.key, e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">{value ? 'Yes' : 'No'}</span>
          </label>
        </div>
      )
    }

    if (f.type === 'select') {
      if (f.key === 'vendorId') {
        return (
          <div className="space-y-1.5">
            {label}
            <VendorSearchSelect
              value={String(value ?? '')}
              vendors={vendorOptions}
              onSelect={v => setField('vendorId', v === '' ? null : v)}
              onAddNew={() => setVendorModalOpen(true)}
              onOpenFullForm={() => navigate('/vendors/new')}
            />
          </div>
        )
      }
      if (f.key === 'assignedTo') {
        return (
          <div className="space-y-1.5">
            {label}
            <UserRoleSelect
              value={String(value ?? '')}
              users={userOptions}
              roles={roleOptions}
              onSelect={v => setField('assignedTo', v === '' ? null : v)}
            />
          </div>
        )
      }
      const opts = f.key === 'productCategory' ? categoryOptions : (f.options || [])
      const options = [{ id: '', label: '--None--' }, ...opts.map(o => ({ id: o, label: o }))]
      return (
        <div className="space-y-1.5">
          {label}
          <Select value={String(value ?? '')} onValueChange={v => setField(f.key, v === '' ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="--None--" />
            </SelectTrigger>
            <SelectContent>
              {options.map(o => (
                <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (f.type === 'textarea') {
      return (
        <div className="space-y-1.5">
          {label}
          <textarea
            rows={4}
            placeholder={f.placeholder}
            value={value || ''}
            onChange={e => setField(f.key, e.target.value)}
            className="flex w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      )
    }

    if (f.type === 'date') {
      return (
        <div className="space-y-1.5">
          {label}
          <DateField value={String(value ?? '')} onChange={v => setField(f.key, v)} />
          {f.hint && <p className="text-xs text-slate-400">{f.hint}</p>}
        </div>
      )
    }

    return (
      <div className="space-y-1.5">
        {label}
        <Input
          type={f.type === 'number' || f.type === 'currency' ? 'number' : 'text'}
          step={f.type === 'currency' ? '0.01' : undefined}
          min={f.type === 'number' || f.type === 'currency' ? '0' : undefined}
          placeholder={f.placeholder}
          value={value ?? ''}
          onChange={e => setField(f.key, e.target.value)}
        />
        {f.hint && <p className="text-xs text-slate-400">{f.hint}</p>}
      </div>
    )
  }

  const renderValue = (f: FieldDef) => {
    const v = fieldValue(f)
    if (f.type === 'checkbox') {
      return (
        <span
          className={
            v
              ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300'
          }
        >
          {v ? 'Yes' : 'No'}
        </span>
      )
    }
    return v == null || v === '' ? <span className="text-muted-foreground">—</span> : <span>{v}</span>
  }

  const fieldGrid = (fields: FieldDef[]) => (
    <div className="grid gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
      {fields.map(f => (
        <div key={f.key} className={SPAN_CLASS[f.span || 1]}>
          {editing ? renderField(f) : (
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.label}</label>
              <div className="text-sm">{renderValue(f)}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderTaxes = () => {
    if (!editing) {
      const active = TAX_FIELDS.filter(t => draft[t.key])
      return active.length === 0
        ? <span className="text-sm text-muted-foreground">—</span>
        : (
          <div className="flex flex-wrap gap-2">
            {active.map(t => (
              <span key={t.key} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t.label.replace(' (%)', '')}: {draft[t.percentKey] ?? TAX_DEFAULTS[t.key]}%
              </span>
            ))}
          </div>
        )
    }
    return (
      <div className="grid gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
        {TAX_FIELDS.map(t => {
          const checked = !!draft[t.key]
          const percentValue: any = draft[t.percentKey]
          return (
            <div key={t.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => {
                    setField(t.key, e.target.checked)
                    if (e.target.checked && (draft[t.percentKey] === '' || draft[t.percentKey] == null)) {
                      setField(t.percentKey, TAX_DEFAULTS[t.key])
                    }
                  }}
                  className="h-4 w-4 rounded accent-indigo-600"
                />
              </label>
              {checked && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={percentValue === null || percentValue === undefined ? '' : String(percentValue)}
                    onChange={e => setField(t.percentKey, e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderImagesTab = () => {
    const images = draft.images || []
    return (
      <div className="space-y-4">
        {editing ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {images.map((img, idx) => (
                <div key={idx} className="rounded-lg border p-3">
                  <button
                    type="button"
                    title="Click to view"
                    onClick={() => img.url && setLightboxUrl(img.url)}
                    className="mb-2 flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800"
                  >
                    {img.url ? (
                      <img src={img.url} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-slate-400" />
                    )}
                  </button>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={!!img.isDefault}
                          onChange={e => {
                            const next = images.map((x, i) => ({ ...x, isDefault: i === idx ? e.target.checked : false }))
                            setField('images', next)
                          }}
                          className="h-3.5 w-3.5 rounded accent-indigo-600"
                        />
                        Default image
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600"
                        onClick={() => setField('images', images.filter((_, i) => i !== idx))}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button type="button" variant="outline" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()}>
                {uploadingImage ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CloudUpload size={14} className="mr-1.5" />}
                Upload New Image
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                title="Click to view"
                onClick={() => img.url && setLightboxUrl(img.url)}
                className="relative block h-40 w-full cursor-pointer overflow-hidden rounded-lg border"
              >
                {img.url ? (
                  <img src={img.url} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <ImageIcon size={22} className="text-slate-400" />
                  </div>
                )}
                {img.isDefault && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                    <Star size={11} /> Default
                  </span>
                )}
              </button>
            ))}
            {images.length === 0 && (
              <p className="text-sm text-muted-foreground">No images added yet.</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const lowStock = (Number(draft.reorderLevel) > 0 && Number(draft.qtyInStock) <= Number(draft.reorderLevel))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} className="mr-1" /> Products
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && !editing && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil size={14} className="mr-1.5" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={14} className="mr-1.5" /> Delete
              </Button>
            </>
          )}
          {editing && (
            <>
              {!isNew && (
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              )}
              <Button disabled={saveMutation.isPending} onClick={handleSave}>
                {saveMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                Save Product
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm dark:from-slate-900 dark:to-slate-950">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-800">
              {defaultImage ? (
                <img src={defaultImage} alt={draft.productName || 'Product'} className="h-full w-full object-cover" />
              ) : (
                <Boxes size={26} className="text-indigo-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">{draft.productName || (isNew ? 'New Product' : '')}</h1>
                {!isNew && (
                  <span
                    className={
                      draft.isActive
                        ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }
                  >
                    {draft.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
                {lowStock && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                    Low Stock
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {draft.productNo && <span className="font-mono text-xs">{draft.productNo}</span>}
                {draft.partNumber && <span>Part: {draft.partNumber}</span>}
                {draft.productCategory && <span>{draft.productCategory}</span>}
                {draft.manufacturer && <span>{draft.manufacturer}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {draft.unitPrice != null && draft.unitPrice !== '' ? formatMoney(draft.unitPrice) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Unit Price</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <TabsRoot defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details"><Tag size={14} className="mr-1.5" /> Product Details</TabsTrigger>
                  <TabsTrigger value="stock"><Boxes size={14} className="mr-1.5" /> Stock Information</TabsTrigger>
                  <TabsTrigger value="prices"><Globe size={14} className="mr-1.5" /> Product Prices</TabsTrigger>
                  <TabsTrigger value="images"><ImageIcon size={14} className="mr-1.5" /> Product Images</TabsTrigger>
                  <TabsTrigger value="taxes"><Star size={14} className="mr-1.5" /> Taxes</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  {fieldGrid(DETAIL_FIELDS)}
                </TabsContent>
                <TabsContent value="stock">
                  {fieldGrid(STOCK_FIELDS)}
                </TabsContent>
                <TabsContent value="prices">
                  {fieldGrid(PRICE_FIELDS)}
                </TabsContent>
                <TabsContent value="images">
                  {renderImagesTab()}
                </TabsContent>
                <TabsContent value="taxes">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Product Taxes</h3>
                      <p className="text-xs text-muted-foreground">Tick a tax to apply it. The percentage can be changed per product.</p>
                    </div>
                    {renderTaxes()}
                  </div>
                </TabsContent>
              </TabsRoot>
            </CardContent>
          </Card>
        </>
      )}

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

      <Dialog open={!!lightboxUrl} onOpenChange={o => !o && setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-3 sm:p-4">
          {lightboxUrl ? (
            <img src={lightboxUrl} alt="Product image" className="max-h-[80vh] w-full rounded-lg object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product"
        description={`Move "${draft.productName}" to the Recycle Bin? Inactive products stay visible in the list.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteMutation.mutate(); setDeleteOpen(false) }}
      />
    </div>
  )
}
