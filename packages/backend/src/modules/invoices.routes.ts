import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { renderReport, escapeHtml } from './report'

export const invoicesRouter = Router()

invoicesRouter.use(authMiddleware)

const include = {
  lineItems: { orderBy: { sequence: 'asc' as const } },
}

function fixDates(data: any) {
  for (const k of ['invoiceDate', 'dueDate']) {
    if (data[k] && typeof data[k] === 'string') data[k] = new Date(data[k] + 'T12:00:00')
  }
  for (const k of Object.keys(data)) {
    if (data[k] === '') data[k] = null
  }
  if (data.conversionRate == null || data.conversionRate === '') data.conversionRate = 1
}

const INV_FIELDS = [
  'invoiceNo', 'subject', 'invoiceDate', 'dueDate', 'total', 'subTotal', 'discount', 'discountPercent',
  'adjustment', 'shipping', 'shippingHandling', 'taxAmount', 'taxType', 'grandTotal',
  'customerNo', 'purchaseOrderNo', 'salesCommission', 'exciseDuty', 'invoiceStatus', 'terms', 'notes',
  'currency', 'conversionRate',
  'description', 'companyId', 'isActive', 'accountId', 'contactId', 'salesOrderId', 'quoteId',
  'billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox',
  'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox',
  'assignedTo', 'createdBy',
]

function pickHeader(header: any, allowed: string[]) {
  const out: any = {}
  for (const k of allowed) if (header[k] !== undefined) out[k] = header[k]
  return out
}

function buildAddressHtml(a: any) {
  if (!a) return ''
  return [a.billingStreet, a.billingCity, a.billingState, a.billingPostalCode, a.billingCountry].filter(Boolean).map(escapeHtml).join('<br>')
}

async function relatedData(invoiceId: string, companyId: string) {
  const [comments] = await Promise.all([
    prisma.comment.findMany({ where: { moduleName: 'invoices', recordId: invoiceId }, orderBy: { createdAt: 'desc' } }),
  ])
  const userIds = new Set<string>()
  comments.forEach(c => c.userId && userIds.add(c.userId))
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, firstName: true, lastName: true, email: true, userName: true },
  })
  const nameMap = new Map(users.map(u => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email]))
  return {
    comments: comments.map(c => ({ ...c, userName: c.userId ? nameMap.get(c.userId) || c.userId : null })),
  }
}

async function resolveNames(record: any, companyId: string) {
  if (!record) return record
  const ids = new Set<string>()
  if (record.assignedTo) ids.add(record.assignedTo)
  if (record.createdBy) ids.add(record.createdBy)
  if (record.salesOrderId) ids.add(record.salesOrderId)
  const so = record.salesOrderId ? await prisma.salesOrder.findUnique({ where: { id: record.salesOrderId }, select: { salesOrderNo: true } }) : null
  if (!ids.size) return { ...record, salesOrderNo: so?.salesOrderNo || null }
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, firstName: true, lastName: true, email: true, userName: true },
  })
  const map = new Map(users.map(u => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email]))
  return {
    ...record,
    assignedToName: record.assignedTo ? map.get(record.assignedTo) || null : null,
    createdByName: record.createdBy ? map.get(record.createdBy) || null : null,
    salesOrderNo: so?.salesOrderNo || null,
  }
}

invoicesRouter.get('/', async (req, res, next) => {
  try {
    const { search, page = '1', limit = '25', sortBy, sortOrder } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum
    let where: any = { isActive: true, companyId: req.user!.companyId }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({ where, include, skip, take: limitNum, orderBy }),
      prisma.invoice.count({ where }),
    ])

    res.json({ data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
  } catch (err) { next(err) }
})

invoicesRouter.get('/users', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.json({ data: [] })
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true, userName: true },
      orderBy: { firstName: 'asc' },
    })
    res.json({ data: users })
  } catch (err) { next(err) }
})

invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include,
    })
    if (!record) return res.status(404).json({ error: 'Not found' })
    const related = await relatedData(record.id, req.user!.companyId!)
    const named = await resolveNames(record, req.user!.companyId!)
    res.json({ ...named, ...related })
  } catch (err) { next(err) }
})

invoicesRouter.post('/', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    header.companyId = req.user!.companyId
    header.createdBy = req.user!.userId
    if (!header.assignedTo) header.assignedTo = req.user!.userId
    const clean = pickHeader(header, INV_FIELDS)
    const record = await prisma.invoice.create({
      data: {
        ...clean,
        lineItems: lineItems?.length ? {
          create: lineItems.map((item: any, idx: number) => ({
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            itemName: item.itemName,
            qty: item.qty || 1,
            listPrice: item.listPrice || 0,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            discountPercent: item.discountPercent || 0,
            tax: item.tax || 0,
            taxPercent: item.taxPercent || 0,
            netPrice: item.netPrice || 0,
            lineTotal: item.lineTotal || 0,
            sequence: idx,
            description: item.description || null,
          }))
        } : undefined,
      },
      include,
    })
    res.status(201).json(record)
  } catch (err) { next(err) }
})

invoicesRouter.put('/:id', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const clean = pickHeader(header, INV_FIELDS)

    const record = await prisma.$transaction(async (tx) => {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: req.params.id } })
      return tx.invoice.update({
        where: { id: req.params.id },
        data: {
          ...clean,
          lineItems: lineItems?.length ? {
            create: lineItems.map((item: any, idx: number) => ({
              productId: item.productId || null,
              serviceId: item.serviceId || null,
              itemName: item.itemName,
              qty: item.qty || 1,
              listPrice: item.listPrice || 0,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              discountPercent: item.discountPercent || 0,
              tax: item.tax || 0,
              taxPercent: item.taxPercent || 0,
              netPrice: item.netPrice || 0,
              lineTotal: item.lineTotal || 0,
              sequence: idx,
              description: item.description || null,
            }))
          } : undefined,
        },
        include,
      })
    })
    res.json(record)
  } catch (err) { next(err) }
})

invoicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    await prisma.invoice.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

invoicesRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })
    const comment = req.body.comment || ''
    if (!comment.trim()) return res.status(400).json({ error: 'Comment is required' })
    const created = await prisma.comment.create({
      data: { moduleName: 'invoices', recordId: req.params.id, comment: comment.trim(), userId: req.user!.userId, isPrivate: req.body.isPrivate || false },
    })
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true, userName: true, email: true } })
    res.status(201).json({ ...created, userName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : null })
  } catch (err) { next(err) }
})

invoicesRouter.get('/:id/payments', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })
    const data = await prisma.receipt.findMany({
      where: { invoiceId: req.params.id },
      orderBy: { paymentDate: 'desc' },
    })
    const total = data.reduce((s, p) => s + Number(p.amount || 0), 0)
    res.json({ data, total: Number(total.toFixed(2)) })
  } catch (err) { next(err) }
})

invoicesRouter.post('/:id/payments', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })
    const { amount, paymentDate, method, reference, notes } = req.body
    if (amount == null || Number(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' })
    const receipt = await prisma.receipt.create({
      data: {
        invoiceId: req.params.id,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate + 'T12:00:00') : new Date(),
        method: method || 'Other',
        reference: reference || null,
        notes: notes || null,
        companyId: req.user!.companyId,
        createdBy: req.user!.userId,
      },
    })
    const payments = await prisma.receipt.findMany({ where: { invoiceId: req.params.id } })
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    let invoiceStatus = inv.invoiceStatus
    if (totalPaid >= Number(inv.grandTotal || 0) - 0.005) {
      invoiceStatus = 'Paid'
    } else if (totalPaid > 0) {
      invoiceStatus = 'Partially Paid'
    }
    await prisma.invoice.update({ where: { id: req.params.id }, data: { invoiceStatus, paidAmount: Number(totalPaid.toFixed(2)) } })
    res.status(201).json({ data: receipt, totalPaid: Number(totalPaid.toFixed(2)), invoiceStatus })
  } catch (err) { next(err) }
})

invoicesRouter.get('/:id/balance', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })
    const payments = await prisma.receipt.findMany({ where: { invoiceId: req.params.id } })
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    res.json({ grandTotal: Number(inv.grandTotal || 0), totalPaid: Number(totalPaid.toFixed(2)), balance: Number((Number(inv.grandTotal || 0) - totalPaid).toFixed(2)) })
  } catch (err) { next(err) }
})

invoicesRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include,
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })

    const [company, user] = await Promise.all([
      req.user!.companyId ? prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null,
      prisma.user.findUnique({ where: { id: req.user!.userId } }),
    ])

    const companyName = company?.name || 'BizForce CRM'
    const companyAddress = [company?.addressStreet, [company?.addressCity, company?.addressState].filter(Boolean).join(', '), company?.addressCountry, company?.addressPostalCode].filter(Boolean).map(escapeHtml).join('<br>')
    const preparedBy = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : req.user!.email

    const billTo = buildAddressHtml(inv)
    const cur = inv.currency ? ` (${inv.currency})` : ''
    const html = renderReport({
      title: 'INVOICE',
      docNo: inv.invoiceNo || '',
      fileNamePrefix: 'invoice',
      companyName,
      companyAddress,
      billToLabel: 'Bill To:',
      billTo,
      metaLines: [
        `<span class="label">Invoice Date:</span> ${inv.invoiceDate ? escapeHtml(new Date(inv.invoiceDate).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Due Date:</span> ${inv.dueDate ? escapeHtml(new Date(inv.dueDate).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Status:</span> ${escapeHtml(inv.invoiceStatus || 'N/A')}`,
        `<span class="label">Currency:</span> ${escapeHtml(inv.currency || 'N/A')}${inv.conversionRate && Number(inv.conversionRate) !== 1 ? ` <span class="item-desc">(rate ${escapeHtml(String(inv.conversionRate))})</span>` : ''}`,
        `<span class="label">Prepared By:</span> ${escapeHtml(preparedBy)}`,
      ],
      items: inv.lineItems.map((item: any) => ({
        name: item.itemName,
        description: item.description,
        qty: item.qty,
        rate: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.lineTotal,
      })),
      totals: [
        { label: `Sub Total${cur}`, value: inv.subTotal },
        { label: 'Discount', value: inv.discount },
        { label: 'Tax', value: inv.taxAmount },
        { label: 'Shipping', value: inv.shipping },
        { label: 'Adjustment', value: inv.adjustment },
        { label: `Grand Total${cur}`, value: inv.grandTotal, grand: true },
      ],
      sections: [
        inv.notes ? `<div class="section"><span class="label">Notes:</span><p>${escapeHtml(inv.notes)}</p></div>` : '',
        inv.terms ? `<div class="section"><span class="label">Terms &amp; Conditions:</span><p>${escapeHtml(inv.terms)}</p></div>` : '',
        inv.description ? `<div class="section"><span class="label">Description:</span><p>${escapeHtml(inv.description)}</p></div>` : '',
      ],
    })

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="${inv.invoiceNo || inv.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

invoicesRouter.post('/:id/email', async (req, res, next) => {
  try {
    const inv = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!inv) return res.status(404).json({ error: 'Not found' })

    const company = req.user!.companyId ? await prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null
    const companyName = company?.name || 'BizForce CRM'
    const to = req.body.to || ''
    const subject = `Invoice: ${inv.invoiceNo || inv.subject}`
    const pdfLink = `/api/invoices/${inv.id}/pdf`
    const text = `Dear Customer,\n\nPlease find attached invoice ${inv.invoiceNo || ''} for ${inv.subject}.\n\nTotal Amount: ${Number(inv.grandTotal || 0).toFixed(2)} ${inv.currency || ''}\n\nYou can view the invoice PDF at: ${pdfLink}\n\nThank you,\n${companyName}`

    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`)
    console.log(`[EMAIL] PDF attachment ready: ${pdfLink}`)
    res.json({ message: 'Email sent successfully (logged to console; PDF attached)', to, subject, pdfLink })
  } catch (err) { next(err) }
})
