import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission, requireTenant } from '../lib/module-permissions'
import { getAllOrgSettings, getOrgSetting, nextSequenceNumber } from '../lib/settings'
import { escapeHtml } from './report'

export const posRouter = Router()
posRouter.use(authMiddleware, requireTenant)
posRouter.use(async (req, res, next) => {
  try {
    const menu = await getOrgSetting(req.user!.companyId, 'menuConfig', {}) as Record<string, any>
    if (menu.pos?.isActive !== true) return res.status(403).json({ error: 'POS is not enabled for this organization. An organization admin can enable it in Settings → Module Manager.' })
    next()
  } catch (error) { next(error) }
})
posRouter.use(requireModulePermission('pos'))

const isPosInvoice = (invoice: { subject: string; notes: string | null }) => invoice.subject.startsWith('POS Sale ') || Boolean(invoice.notes?.startsWith('POS payment:'))

function formatOrgDateTime(value: Date, settings: Record<string, any>): string {
  const timezone = String(settings.timezone || 'UTC')
  const hour12 = settings.hourFormat !== '24h'
  const locale = String(settings.language || 'en_us').replace('_', '-')
  try {
    const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
    const part = (type: string) => dateParts.find(item => item.type === type)?.value || ''
    const year = part('year'), month = part('month'), day = part('day')
    const date = String(settings.dateFormat || 'mm-dd-yyyy')
      .replace('yyyy', year).replace('mm', month).replace('dd', day).replace('yy', year.slice(2))
      .replace('M', String(Number(month))).replace('d', String(Number(day)))
    const time = new Intl.DateTimeFormat(locale, { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12 }).format(value)
    return `${date} ${time}`
  } catch {
    return value.toISOString()
  }
}

posRouter.get('/catalog', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const [products, defaultTax] = await Promise.all([prisma.product.findMany({
      where: { companyId: req.user!.companyId, isActive: true, ...(search ? { OR: [
        { productName: { contains: search, mode: 'insensitive' as const } },
        { productNo: { contains: search, mode: 'insensitive' as const } },
        { productCategory: { contains: search, mode: 'insensitive' as const } },
      ] } : {}) },
      select: { id: true, productName: true, productNo: true, unitPrice: true, qtyInStock: true, vat: true, vatPercentage: true, productCategory: true },
      orderBy: { productName: 'asc' }, take: 250,
    }), prisma.taxInfo.findFirst({ where: { companyId: req.user!.companyId, isActive: true, isDefault: true }, select: { taxRate: true } })])
    res.json({ data: products.map(product => ({ ...product, taxPercent: product.vat ? Number(product.vatPercentage ?? defaultTax?.taxRate ?? 0) : 0 })) })
  } catch (error) { next(error) }
})

posRouter.get('/sales', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const sales = await prisma.invoice.findMany({
      where: { companyId: req.user!.companyId, isActive: true,
        OR: [{ subject: { startsWith: 'POS Sale ' } }, { notes: { startsWith: 'POS payment:' } }],
        ...(search ? { AND: [{ OR: [
          { invoiceNo: { contains: search, mode: 'insensitive' as const } },
          { subject: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ] }] } : {}) },
      select: { id: true, invoiceNo: true, invoiceDate: true, grandTotal: true, notes: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }, take: 50,
    })
    res.json({ data: sales.map(sale => ({ ...sale, paymentMethod: sale.notes?.replace(/^POS payment:\s*/, '') || 'Cash' })) })
  } catch (error) { next(error) }
})

posRouter.get('/sales/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId, isActive: true }, include: { lineItems: { orderBy: { sequence: 'asc' } } } })
    if (!invoice || !isPosInvoice(invoice)) return res.status(404).json({ error: 'POS sale not found' })
    const receipt = await prisma.receipt.findFirst({ where: { invoiceId: invoice.id, companyId: req.user!.companyId, isActive: true }, orderBy: { createdAt: 'desc' } })
    const productIds = invoice.lineItems.map(item => item.productId).filter((id): id is string => Boolean(id))
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, companyId: req.user!.companyId }, select: { id: true, productName: true, productNo: true, unitPrice: true, qtyInStock: true, vat: true, vatPercentage: true, productCategory: true } })
    const oldQty = new Map(invoice.lineItems.map(item => [item.productId, Number(item.qty)]))
    const lineByProduct = new Map(invoice.lineItems.map(item => [item.productId, item]))
    res.json({ data: { ...invoice, receipt, products: products.map(product => ({ ...product, taxPercent: Number(lineByProduct.get(product.id)?.taxPercent || 0), qtyInStock: Number(product.qtyInStock || 0) + (oldQty.get(product.id) || 0) })) } })
  } catch (error) { next(error) }
})

posRouter.get('/sales/:id/thermal-receipt', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId, isActive: true }, include: { lineItems: { orderBy: { sequence: 'asc' } } } })
    if (!invoice || !isPosInvoice(invoice)) return res.status(404).json({ error: 'POS sale not found' })
    const [company, receipt, orgSettings] = await Promise.all([
      prisma.company.findUnique({ where: { id: req.user!.companyId } }),
      prisma.receipt.findFirst({ where: { invoiceId: invoice.id, companyId: req.user!.companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
      getAllOrgSettings(req.user!.companyId),
    ])
    const currency = String(orgSettings.defaultCurrency || invoice.currency || 'USD').toUpperCase().slice(0, 3)
    const receiptDate = formatOrgDateTime(invoice.invoiceDate || invoice.createdAt, orgSettings)
    const money = (value: any) => Number(value || 0).toFixed(2)
    const address = [company?.addressStreet, company?.addressCity, company?.addressState, company?.addressCountry, company?.addressPostalCode].filter(Boolean).join(', ')
    const rows = invoice.lineItems.map(item => `<tr><td><b>${escapeHtml(item.itemName)}</b><small>Qty: ${money(item.qty)} · Rate: ${money(item.unitPrice)}</small><small>Discount (${money(item.discountPercent)}%): −${money(Number(item.discount) * Number(item.qty))}</small><small>Tax (${money(item.taxPercent)}%): ${money(item.tax)}</small></td><td>${money(item.lineTotal)}</td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receipt ${escapeHtml(invoice.invoiceNo || '')}</title><style>@page{size:80mm auto;margin:3mm}*{box-sizing:border-box}body{margin:0;background:#eef0f4;color:#111;font:12px/1.35 Arial,sans-serif}.receipt{width:80mm;max-width:100%;margin:18px auto;background:#fff;padding:6mm;box-shadow:0 8px 30px #0002}.center{text-align:center}.brand{font-size:20px;font-weight:800}.muted{color:#555;font-size:10px}.rule{border-top:1px dashed #777;margin:10px 0}.meta{display:grid;grid-template-columns:1fr auto;gap:4px}table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px dotted #aaa;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}small{display:block;color:#555;margin-top:2px}.total{font-size:16px;font-weight:800}.actions{width:80mm;max-width:100%;margin:12px auto;display:flex;gap:8px}.actions button{flex:1;border:0;border-radius:8px;padding:11px;background:#111;color:#fff;font-weight:700;cursor:pointer}@media print{body{background:#fff}.receipt{margin:0;width:74mm;padding:2mm;box-shadow:none}.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Print thermal receipt</button><button onclick="window.close()">Close</button></div><main class="receipt"><header class="center"><div class="brand">${escapeHtml(company?.name || 'Point of Sale')}</div>${address ? `<div class="muted">${escapeHtml(address)}</div>` : ''}${company?.phone ? `<div class="muted">${escapeHtml(company.phone)}</div>` : ''}${company?.taxId ? `<div class="muted">Tax ID: ${escapeHtml(company.taxId)}</div>` : ''}<div class="rule"></div><b>SALES RECEIPT</b></header><div class="rule"></div><div class="meta"><span>Invoice</span><b>${escapeHtml(invoice.invoiceNo || '—')}</b><span>Date</span><span>${escapeHtml(receiptDate)}</span><span>Payment</span><span>${escapeHtml(receipt?.method || invoice.notes?.replace(/^POS payment:\s*/, '') || 'Cash')}</span></div><div class="rule"></div><table><tbody>${rows}</tbody></table><div class="rule"></div><div class="meta"><span>Subtotal</span><span>${money(invoice.subTotal)}</span><span>Discount</span><span>−${money(invoice.discount)}</span><span>Taxable amount</span><span>${money(invoice.total)}</span><span>Tax</span><span>${money(invoice.taxAmount)}</span><span class="total">TOTAL</span><span class="total">${escapeHtml(currency)} ${money(invoice.grandTotal)}</span><span>Paid</span><span>${money(invoice.paidAmount)}</span></div><div class="rule"></div><footer class="center"><b>Thank you for your business</b><div class="muted">Generated by: bizforce-crm.online</div></footer></main></body></html>`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="receipt-${invoice.invoiceNo || invoice.id}.html"`)
    res.send(html)
  } catch (error) { next(error) }
})

posRouter.post('/checkout', async (req, res, next) => {
  try {
    const requested = Array.isArray(req.body.items) ? req.body.items : []
    if (!requested.length) return res.status(400).json({ error: 'Add at least one product to the cart' })
    const invoiceId = String(req.body.invoiceId || '').trim() || null
    const existing = invoiceId ? await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: req.user!.companyId, isActive: true }, include: { lineItems: true } }) : null
    if (invoiceId && (!existing || !isPosInvoice(existing))) return res.status(404).json({ error: 'The POS sale to edit was not found' })
    const oldQtyByProduct = new Map<string, number>()
    for (const item of existing?.lineItems || []) if (item.productId) oldQtyByProduct.set(item.productId, (oldQtyByProduct.get(item.productId) || 0) + Number(item.qty))
    const ids: string[] = [...new Set<string>(requested.map((item: any) => String(item.productId || '')).filter(Boolean))]
    const [products, defaultTax] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: ids }, companyId: req.user!.companyId, isActive: true } }),
      prisma.taxInfo.findFirst({ where: { companyId: req.user!.companyId, isActive: true, isDefault: true }, select: { taxRate: true } }),
    ])
    const map = new Map(products.map(product => [product.id, product]))
    const items: any[] = requested.map((requestedItem: any, sequence: number) => {
      const product = map.get(String(requestedItem.productId))
      if (!product) throw new Error('One or more products are unavailable')
      const qty = Math.max(1, Number(requestedItem.qty) || 1)
      const available = Number(product.qtyInStock || 0) + (oldQtyByProduct.get(product.id) || 0)
      if (available < qty) throw new Error(`Insufficient stock for ${product.productName} (${available} available)`)
      const unitPrice = Number(product.unitPrice || 0)
      const discountPercent = Math.min(100, Math.max(0, Number(requestedItem.discountPercent) || 0))
      const discount = unitPrice * discountPercent / 100
      const netPrice = Math.max(0, unitPrice - discount)
      const lineTotal = netPrice * qty
      const taxPercent = product.vat ? Number(product.vatPercentage ?? defaultTax?.taxRate ?? 0) : 0
      const tax = lineTotal * taxPercent / 100
      return { product, qty, unitPrice, discountPercent, discount, netPrice, lineTotal, taxPercent, tax, sequence }
    })
    const subTotal = items.reduce((sum: number, item: any) => sum + item.qty * item.unitPrice, 0)
    const discount = items.reduce((sum: number, item: any) => sum + item.discount * item.qty, 0)
    const total = subTotal - discount
    const taxAmount = items.reduce((sum: number, item: any) => sum + item.tax, 0)
    const grandTotal = total + taxAmount
    const paymentMethod = String(req.body.paymentMethod || 'Cash').slice(0, 50)
    const currency = String(await getOrgSetting(req.user!.companyId, 'defaultCurrency', 'USD') || 'USD').toUpperCase().slice(0, 3)
    const lineItems = items.map((item: any) => ({ productId: item.product.id, itemName: item.product.productName, qty: item.qty, listPrice: item.unitPrice, unitPrice: item.unitPrice, discount: item.discount, discountPercent: item.discountPercent, taxPercent: item.taxPercent, tax: item.tax, netPrice: item.netPrice, lineTotal: item.lineTotal, sequence: item.sequence }))
    const invoice = await prisma.$transaction(async tx => {
      if (existing) {
        for (const oldItem of existing.lineItems) if (oldItem.productId) await tx.product.update({ where: { id: oldItem.productId }, data: { qtyInStock: { increment: oldItem.qty } } })
        const updated = await tx.invoice.update({ where: { id: existing.id }, data: { subTotal, total, discount, taxAmount, grandTotal, paidAmount: grandTotal, currency, invoiceStatus: 'Paid', notes: `POS payment: ${paymentMethod}`, lineItems: { deleteMany: {}, create: lineItems } } })
        for (const item of items) await tx.product.update({ where: { id: item.product.id }, data: { qtyInStock: { decrement: item.qty } } })
        const receipt = await tx.receipt.findFirst({ where: { invoiceId: existing.id, companyId: req.user!.companyId, isActive: true }, orderBy: { createdAt: 'desc' } })
        if (receipt) await tx.receipt.update({ where: { id: receipt.id }, data: { amount: grandTotal, method: paymentMethod, paymentDate: new Date() } })
        else await tx.receipt.create({ data: { invoiceId: existing.id, amount: grandTotal, method: paymentMethod, companyId: req.user!.companyId, createdBy: req.user!.userId } })
        return updated
      }
      const invoiceNo = await nextSequenceNumber('Invoice', req.user!.companyId)
      const created = await tx.invoice.create({ data: { invoiceNo, subject: `POS Sale ${invoiceNo}`, invoiceDate: new Date(), dueDate: new Date(), subTotal, total, discount, taxAmount, grandTotal, paidAmount: grandTotal, invoiceStatus: 'Paid', currency, accountId: req.body.accountId || null, contactId: req.body.contactId || null, companyId: req.user!.companyId, createdBy: req.user!.userId, assignedTo: req.user!.userId, notes: `POS payment: ${paymentMethod}`, lineItems: { create: lineItems } } })
      for (const item of items) await tx.product.update({ where: { id: item.product.id }, data: { qtyInStock: { decrement: item.qty } } })
      await tx.receipt.create({ data: { invoiceId: created.id, amount: grandTotal, method: paymentMethod, companyId: req.user!.companyId, createdBy: req.user!.userId } })
      return created
    })
    res.status(existing ? 200 : 201).json({ data: invoice, thermalReceiptUrl: `/pos/sales/${invoice.id}/thermal-receipt` })
  } catch (error: any) {
    if (/unavailable|Insufficient stock/.test(error?.message || '')) return res.status(409).json({ error: error.message })
    next(error)
  }
})
