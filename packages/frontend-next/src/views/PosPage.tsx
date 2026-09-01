'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Search, ShoppingCart, Store, Trash2, Loader2, Receipt, History, X } from 'lucide-react'
import { formatDateTime, formatMoney } from '@/lib/org-format'

export function PosPage() {
  const { addToast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [discounts, setDiscounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [sales, setSales] = useState<any[]>([])
  const [salesOpen, setSalesOpen] = useState(false)
  const [salesLoading, setSalesLoading] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  const load = async (term = search) => {
    setLoading(true); setError('')
    try { const response = await api.request<any>(`/pos/catalog${term ? `?search=${encodeURIComponent(term)}` : ''}`); const data=response.data || []; setProducts(data); return data }
    catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
    return []
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(search) }, search ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadSales = async () => {
    setSalesLoading(true)
    try { const response = await api.request<any>('/pos/sales'); setSales(response.data || []); setSalesOpen(true) }
    catch (err: any) { addToast({ title: 'Could not load POS sales', description: err.message, variant: 'destructive' }) }
    finally { setSalesLoading(false) }
  }
  const loadSale = async (id: string) => {
    setSalesLoading(true)
    try {
      const response = await api.request<any>(`/pos/sales/${id}`)
      const sale = response.data
      setProducts(current => {
        const merged = new Map(current.map(product => [product.id, product]))
        for (const product of sale.products || []) merged.set(product.id, product)
        return [...merged.values()]
      })
      setCart(Object.fromEntries((sale.lineItems || []).filter((item: any) => item.productId).map((item: any) => [item.productId, Number(item.qty)])))
      setDiscounts(Object.fromEntries((sale.lineItems || []).filter((item: any) => item.productId).map((item: any) => [item.productId, Number(item.discountPercent || 0)])))
      setPaymentMethod(sale.receipt?.method || sale.notes?.replace(/^POS payment:\s*/, '') || 'Cash')
      setEditingInvoice(sale)
      setSalesOpen(false)
      addToast({ title: `Loaded ${sale.invoiceNo}`, description: 'Saving will update this sale and reconcile its stock.', variant: 'success' })
    } catch (err: any) { addToast({ title: 'Could not load sale', description: err.message, variant: 'destructive' }) }
    finally { setSalesLoading(false) }
  }
  const cancelEdit = () => { setEditingInvoice(null); setCart({}); setDiscounts({}); setPaymentMethod('Cash'); void load() }

  const rows = useMemo(() => Object.entries(cart).map(([id, qty]) => ({ product: products.find(product => product.id === id), qty, discountPercent: discounts[id] || 0 })).filter(row => row.product), [cart, discounts, products])
  const subtotal = rows.reduce((sum, row) => sum + Number(row.product.unitPrice || 0) * row.qty, 0)
  const discount = rows.reduce((sum, row) => sum + Number(row.product.unitPrice || 0) * row.qty * row.discountPercent / 100, 0)
  const taxable = subtotal - discount
  const tax = rows.reduce((sum, row) => { const gross = Number(row.product.unitPrice || 0) * row.qty; return sum + (gross - gross * row.discountPercent / 100) * Number(row.product.taxPercent || 0) / 100 }, 0)
  const updateQty = (id: string, qty: number) => setCart(current => { const next = { ...current }; if (qty <= 0) { delete next[id]; setDiscounts(values => { const copy = { ...values }; delete copy[id]; return copy }) } else next[id] = qty; return next })
  const updateDiscount = (id: string, value: number) => setDiscounts(current => ({ ...current, [id]: Math.min(100, Math.max(0, value || 0)) }))
  const addSearchResult = async () => {
    const term = search.trim()
    if (!term) return
    const matches = await load(term)
    const exact = matches.find((product: any) => String(product.productNo || '').toLowerCase() === term.toLowerCase())
      || matches.find((product: any) => String(product.productName || '').toLowerCase() === term.toLowerCase())
      || matches[0]
    if (!exact) return addToast({ title: 'No matching product', description: `No product found for “${term}”.`, variant: 'destructive' })
    if (Number(exact.qtyInStock || 0) <= (cart[exact.id] || 0)) return addToast({ title: 'Out of stock', description: `${exact.productName} has no available stock.`, variant: 'destructive' })
    updateQty(exact.id, (cart[exact.id] || 0) + 1)
    setSearch('')
  }
  const checkout = async () => {
    setCheckingOut(true)
    try {
      const response = await api.request<any>('/pos/checkout', { method: 'POST', body: JSON.stringify({ invoiceId: editingInvoice?.id, items: rows.map(row => ({ productId: row.product.id, qty: row.qty, discountPercent: row.discountPercent })), paymentMethod }) })
      setCart({})
      setDiscounts({})
      setEditingInvoice(null)
      addToast({ title: editingInvoice ? 'Sale updated' : 'Sale completed', description: 'The receipt and inventory quantities were updated.', variant: 'success' })
      await api.openAuthenticatedFile(response.thermalReceiptUrl || `/pos/sales/${response.data.id}/thermal-receipt`)
      await load()
    } catch (err: any) { addToast({ title: 'Checkout failed', description: err.message, variant: 'destructive' }) }
    finally { setCheckingOut(false) }
  }

  if (error) return <div className="mx-auto max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm"><Store className="mx-auto text-muted-foreground"/><h1 className="mt-3 text-xl font-bold">Point of Sale is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><p className="mt-4 text-xs text-muted-foreground">Organization admins can enable POS from Settings → Picklists & Fields → Module Manager.</p></div>

  return <div className="w-full min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-2xl"><Store size={22}/>Point of Sale</h1><p className="mt-1 text-sm text-muted-foreground">A separate checkout workspace connected to products, invoices, receipts and stock.</p></div><Button variant="outline" onClick={loadSales} disabled={salesLoading}>{salesLoading?<Loader2 className="mr-2 animate-spin" size={16}/>:<History className="mr-2" size={16}/>}Previous sales</Button></div>
    {editingInvoice && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"><div><b>Editing {editingInvoice.invoiceNo}</b><span className="ml-2 text-muted-foreground">Stock availability includes the quantities from this sale.</span></div><Button variant="ghost" size="sm" onClick={cancelEdit}><X className="mr-1" size={15}/>Cancel edit</Button></div>}
    {salesOpen && <section className="rounded-2xl border bg-card shadow-sm"><div className="flex items-center justify-between border-b p-4"><h2 className="font-bold">Recent POS sales</h2><Button variant="ghost" size="sm" onClick={()=>setSalesOpen(false)}><X size={17}/></Button></div><div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">{sales.length ? sales.map(sale=><button key={sale.id} type="button" onClick={()=>loadSale(sale.id)} className="rounded-xl border p-3 text-left transition hover:border-primary"><div className="flex justify-between gap-2"><b>{sale.invoiceNo}</b><span className="font-semibold">{formatMoney(sale.grandTotal||0)}</span></div><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(sale.invoiceDate)} · {sale.paymentMethod}</p></button>) : <p className="p-4 text-sm text-muted-foreground">No POS sales found.</p>}</div></section>}
    <div className="grid min-h-[65vh] gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 rounded-2xl border bg-card shadow-sm">
        <div className="flex gap-2 border-b p-3"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/><Input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if(event.key==='Enter'){ event.preventDefault(); void addSearchResult() } }} placeholder="Search name, SKU/barcode, or category…" className="pl-9" autoFocus/></div><Button variant="outline" onClick={()=>void addSearchResult()}>Add</Button></div>
        {loading ? <div className="grid place-items-center py-20"><Loader2 className="animate-spin"/></div> : <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">{products.map(product => <button key={product.id} type="button" onClick={() => updateQty(product.id, (cart[product.id] || 0) + 1)} disabled={Number(product.qtyInStock || 0) <= (cart[product.id] || 0)} className="rounded-xl border bg-background p-4 text-left transition hover:border-primary hover:shadow-sm disabled:opacity-50"><p className="truncate font-semibold">{product.productName}</p><p className="mt-1 text-xs text-muted-foreground">{product.productNo || 'No product number'} · {product.productCategory || 'Uncategorized'}</p><p className="mt-1 text-xs text-muted-foreground">Stock {Number(product.qtyInStock || 0)}</p><p className="mt-4 text-lg font-bold">{formatMoney(product.unitPrice || 0)}</p></button>)}</div>}
      </section>
      <aside className="flex min-h-[420px] flex-col rounded-2xl border bg-card shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between border-b p-4"><h2 className="flex items-center gap-2 font-bold"><ShoppingCart size={18}/>Current sale</h2><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{rows.reduce((sum,row)=>sum+row.qty,0)} items</span></div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">{rows.length ? rows.map(row => { const gross=Number(row.product.unitPrice||0)*row.qty; const discountAmount=gross*row.discountPercent/100; const net=gross-discountAmount; const taxAmount=net*Number(row.product.taxPercent||0)/100; return <div key={row.product.id} className="rounded-xl border p-3"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{row.product.productName}</p><p className="text-xs text-muted-foreground">{formatMoney(row.product.unitPrice)} · Tax {Number(row.product.taxPercent||0)}%</p></div><button onClick={() => updateQty(row.product.id,0)} aria-label="Remove product" className="text-muted-foreground hover:text-destructive"><Trash2 size={15}/></button></div><div className="mt-3 flex flex-wrap items-end justify-between gap-2"><div className="flex items-center rounded-lg border"><button className="grid h-8 w-8 place-items-center" onClick={() => updateQty(row.product.id,row.qty-1)}><Minus size={13}/></button><span className="w-9 text-center text-sm font-bold">{row.qty}</span><button className="grid h-8 w-8 place-items-center" onClick={() => updateQty(row.product.id,row.qty+1)} disabled={row.qty>=Number(row.product.qtyInStock||0)}><Plus size={13}/></button></div><label className="text-[11px] font-semibold text-muted-foreground">Discount %<Input type="number" min="0" max="100" step="0.01" value={row.discountPercent} onChange={event=>updateDiscount(row.product.id,Number(event.target.value))} className="mt-1 h-8 w-24 text-right"/></label><span className="font-semibold">{formatMoney(net+taxAmount)}</span></div><div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-xs"><span className="text-muted-foreground">Gross</span><span className="text-right">{formatMoney(gross)}</span><span className="text-muted-foreground">Discount</span><span className="text-right text-emerald-600">−{formatMoney(discountAmount)}</span><span className="text-muted-foreground">Taxable</span><span className="text-right">{formatMoney(net)}</span><span className="text-muted-foreground">Tax</span><span className="text-right">{formatMoney(taxAmount)}</span></div></div>}) : <div className="grid h-full place-items-center py-14 text-center text-sm text-muted-foreground"><div><ShoppingCart className="mx-auto mb-2"/><p>Your cart is empty</p></div></div>}</div>
        <div className="border-t p-4"><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><b>{formatMoney(subtotal)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Discount</span><b className="text-emerald-600">−{formatMoney(discount)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Taxable amount</span><b>{formatMoney(taxable)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Tax</span><b>{formatMoney(tax)}</b></div><div className="flex justify-between border-t pt-3 text-lg"><span className="font-bold">Total</span><b>{formatMoney(taxable+tax)}</b></div></div><label className="mt-4 block text-xs font-semibold text-muted-foreground">Payment method<select value={paymentMethod} onChange={event=>setPaymentMethod(event.target.value)} className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground"><option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Other</option></select></label><Button className="mt-4 w-full" size="lg" disabled={!rows.length||checkingOut} onClick={checkout}>{checkingOut?<Loader2 className="mr-2 animate-spin" size={17}/>:<Receipt className="mr-2" size={17}/>} {editingInvoice ? 'Update sale & print receipt' : 'Complete sale & print receipt'}</Button></div>
      </aside>
    </div>
  </div>
}
