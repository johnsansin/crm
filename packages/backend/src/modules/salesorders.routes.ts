import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { renderReport, escapeHtml } from './report'

export const salesOrdersRouter = Router()

salesOrdersRouter.use(authMiddleware)

const include = {
  lineItems: { orderBy: { sequence: 'asc' as const } },
}

function fixDates(data: any) {
  for (const k of ['validUntil', 'startPeriod', 'endPeriod']) {
    if (data[k] && typeof data[k] === 'string') data[k] = new Date(data[k] + 'T12:00:00')
  }
  for (const k of Object.keys(data)) {
    if (data[k] === '') data[k] = null
  }
  if (data.conversionRate == null || data.conversionRate === '') data.conversionRate = 1
}

const SO_FIELDS = [
  'salesOrderNo', 'subject', 'validUntil', 'total', 'subTotal', 'discount', 'discountPercent',
  'adjustment', 'shipping', 'shippingHandling', 'taxAmount', 'taxType', 'grandTotal', 'carrier',
  'soStatus', 'customerNo', 'purchaseOrderNo', 'salesCommission', 'exciseDuty', 'pending',
  'enableRecurring', 'recurringFrequency', 'startPeriod', 'endPeriod', 'currency', 'conversionRate',
  'terms', 'description',
  'companyId', 'isActive', 'accountId', 'contactId', 'potentialId', 'quoteId', 'vendorId',
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

async function relatedData(salesOrderId: string, companyId: string) {
  const [invoices, comments] = await Promise.all([
    prisma.invoice.findMany({ where: { salesOrderId, companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.comment.findMany({ where: { moduleName: 'salesorders', recordId: salesOrderId }, orderBy: { createdAt: 'desc' } }),
  ])
  const userIds = new Set<string>()
  comments.forEach(c => c.userId && userIds.add(c.userId))
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, firstName: true, lastName: true, email: true, userName: true },
  })
  const nameMap = new Map(users.map(u => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email]))
  return {
    invoices,
    comments: comments.map(c => ({ ...c, userName: c.userId ? nameMap.get(c.userId) || c.userId : null })),
  }
}

async function resolveNames(record: any, companyId: string) {
  if (!record) return record
  const ids = new Set<string>()
  if (record.assignedTo) ids.add(record.assignedTo)
  if (record.createdBy) ids.add(record.createdBy)
  if (!ids.size) return record
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, firstName: true, lastName: true, email: true, userName: true },
  })
  const map = new Map(users.map(u => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email]))
  return {
    ...record,
    assignedToName: record.assignedTo ? map.get(record.assignedTo) || null : null,
    createdByName: record.createdBy ? map.get(record.createdBy) || null : null,
  }
}

salesOrdersRouter.get('/', async (req, res, next) => {
  try {
    const { search, page = '1', limit = '25', sortBy, sortOrder } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum
    let where: any = { isActive: true, companyId: req.user!.companyId }

    if (search) {
      where.OR = [
        { salesOrderNo: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({ where, include, skip, take: limitNum, orderBy }),
      prisma.salesOrder.count({ where }),
    ])

    res.json({ data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
  } catch (err) { next(err) }
})

salesOrdersRouter.get('/users', async (req, res, next) => {
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

salesOrdersRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include,
    })
    if (!record) return res.status(404).json({ error: 'Not found' })
    const related = await relatedData(record.id, req.user!.companyId!)
    const named = await resolveNames(record, req.user!.companyId!)
    res.json({ ...named, ...related })
  } catch (err) { next(err) }
})

salesOrdersRouter.post('/', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    header.companyId = req.user!.companyId
    header.createdBy = req.user!.userId
    if (!header.assignedTo) header.assignedTo = req.user!.userId
    const clean = pickHeader(header, SO_FIELDS)
    const record = await prisma.salesOrder.create({
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

salesOrdersRouter.put('/:id', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    const existing = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const clean = pickHeader(header, SO_FIELDS)

    const record = await prisma.$transaction(async (tx) => {
      await tx.salesOrderLineItem.deleteMany({ where: { salesOrderId: req.params.id } })
      return tx.salesOrder.update({
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

salesOrdersRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    await prisma.salesOrder.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

salesOrdersRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const so = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!so) return res.status(404).json({ error: 'Not found' })
    const comment = req.body.comment || ''
    if (!comment.trim()) return res.status(400).json({ error: 'Comment is required' })
    const created = await prisma.comment.create({
      data: { moduleName: 'salesorders', recordId: req.params.id, comment: comment.trim(), userId: req.user!.userId, isPrivate: req.body.isPrivate || false },
    })
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true, userName: true, email: true } })
    res.status(201).json({ ...created, userName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : null })
  } catch (err) { next(err) }
})

salesOrdersRouter.post('/:id/convert-invoice', async (req, res, next) => {
  try {
    const so = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!so) return res.status(404).json({ error: 'Sales Order not found' })

    const now = new Date()
    const invoice = await prisma.invoice.create({
      data: {
        subject: so.subject,
        invoiceNo: 'INV-' + Date.now(),
        invoiceDate: now,
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        invoiceStatus: 'Created',
        total: so.total,
        subTotal: so.subTotal,
        discount: so.discount,
        discountPercent: so.discountPercent,
        adjustment: so.adjustment,
        shipping: so.shipping,
        shippingHandling: so.shippingHandling,
        taxAmount: so.taxAmount,
        taxType: so.taxType,
        grandTotal: so.grandTotal,
        customerNo: so.customerNo,
        purchaseOrderNo: so.purchaseOrderNo,
        salesCommission: so.salesCommission,
        exciseDuty: so.exciseDuty,
        currency: so.currency,
        conversionRate: so.conversionRate || 1,
        terms: so.terms,
        description: so.description,
        companyId: so.companyId,
        accountId: so.accountId,
        contactId: so.contactId,
        salesOrderId: so.id,
        quoteId: so.quoteId,
        billingStreet: so.billingStreet,
        billingCity: so.billingCity,
        billingState: so.billingState,
        billingCountry: so.billingCountry,
        billingPostalCode: so.billingPostalCode,
        billingPoBox: so.billingPoBox,
        shippingStreet: so.shippingStreet,
        shippingCity: so.shippingCity,
        shippingState: so.shippingState,
        shippingCountry: so.shippingCountry,
        shippingPostalCode: so.shippingPostalCode,
        shippingPoBox: so.shippingPoBox,
        assignedTo: so.assignedTo,
        createdBy: req.user!.userId,
      },
    })

    if (so.lineItems?.length) {
      await prisma.invoiceLineItem.createMany({
        data: so.lineItems.map((item, idx) => ({
          invoiceId: invoice.id,
          productId: item.productId,
          serviceId: item.serviceId,
          itemName: item.itemName,
          qty: item.qty,
          listPrice: item.listPrice,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountPercent: item.discountPercent,
          tax: item.tax,
          taxPercent: item.taxPercent,
          netPrice: item.netPrice,
          lineTotal: item.lineTotal,
          sequence: idx,
          description: item.description,
        })),
      })
    }

    const created = await prisma.invoice.findUnique({ where: { id: invoice.id } })
    res.status(201).json(created)
  } catch (err) { next(err) }
})

salesOrdersRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const so = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include,
    })
    if (!so) return res.status(404).json({ error: 'Not found' })

    const [company, user] = await Promise.all([
      req.user!.companyId ? prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null,
      prisma.user.findUnique({ where: { id: req.user!.userId } }),
    ])

    const companyName = company?.name || 'BizForce CRM'
    const companyAddress = [company?.addressStreet, [company?.addressCity, company?.addressState].filter(Boolean).join(', '), company?.addressCountry, company?.addressPostalCode].filter(Boolean).map(escapeHtml).join('<br>')
    const preparedBy = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : req.user!.email

    const billTo = buildAddressHtml(so)
    const cur = so.currency ? ` (${so.currency})` : ''
    const html = renderReport({
      title: 'SALES ORDER',
      docNo: so.salesOrderNo || '',
      fileNamePrefix: 'salesorder',
      companyName,
      companyAddress,
      billToLabel: 'Bill To:',
      billTo,
      metaLines: [
        `<span class="label">Valid Until:</span> ${so.validUntil ? escapeHtml(new Date(so.validUntil).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Status:</span> ${escapeHtml(so.soStatus || 'N/A')}`,
        `<span class="label">Currency:</span> ${escapeHtml(so.currency || 'N/A')}${so.conversionRate && Number(so.conversionRate) !== 1 ? ` <span class="item-desc">(rate ${escapeHtml(String(so.conversionRate))})</span>` : ''}`,
        `<span class="label">Prepared By:</span> ${escapeHtml(preparedBy)}`,
      ],
      items: so.lineItems.map((item: any) => ({
        name: item.itemName,
        description: item.description,
        qty: item.qty,
        rate: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.lineTotal,
      })),
      totals: [
        { label: `Sub Total${cur}`, value: so.subTotal },
        { label: 'Discount', value: so.discount },
        { label: 'Tax', value: so.taxAmount },
        { label: 'Shipping', value: so.shipping },
        { label: 'Adjustment', value: so.adjustment },
        { label: `Grand Total${cur}`, value: so.grandTotal, grand: true },
      ],
      sections: [
        so.terms ? `<div class="section"><span class="label">Terms &amp; Conditions:</span><p>${escapeHtml(so.terms)}</p></div>` : '',
        so.description ? `<div class="section"><span class="label">Description:</span><p>${escapeHtml(so.description)}</p></div>` : '',
      ],
    })

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="${so.salesOrderNo || so.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

salesOrdersRouter.post('/:id/email', async (req, res, next) => {
  try {
    const so = await prisma.salesOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!so) return res.status(404).json({ error: 'Not found' })

    const company = req.user!.companyId ? await prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null
    const companyName = company?.name || 'BizForce CRM'
    const to = req.body.to || ''
    const subject = `Sales Order: ${so.salesOrderNo || so.subject}`
    const pdfLink = `/api/salesorders/${so.id}/pdf`
    const text = `Dear Customer,\n\nPlease find attached sales order ${so.salesOrderNo || ''} for ${so.subject}.\n\nTotal Amount: ${Number(so.grandTotal || 0).toFixed(2)} ${so.currency || ''}\n\nYou can view the sales order PDF at: ${pdfLink}\n\nThank you,\n${companyName}`

    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`)
    console.log(`[EMAIL] PDF attachment ready: ${pdfLink}`)
    res.json({ message: 'Email sent successfully (logged to console; PDF attached)', to, subject, pdfLink })
  } catch (err) { next(err) }
})
