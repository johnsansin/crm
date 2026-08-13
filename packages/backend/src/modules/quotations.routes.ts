import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { renderReport, escapeHtml } from './report'

export const quotationsRouter = Router()

quotationsRouter.use(authMiddleware)

const quoteInclude = {
  lineItems: { orderBy: { sequence: 'asc' as const } },
}

function buildAddressHtml(a: any) {
  if (!a) return ''
  return [a.billingStreet, a.billingCity, a.billingState, a.billingPostalCode, a.billingCountry].filter(Boolean).map(escapeHtml).join('<br>')
}

async function quoteRelatedData(quoteId: string, companyId: string) {
  const [stageHistory, salesOrders, invoices, comments] = await Promise.all([
    prisma.quoteStageHistory.findMany({ where: { quoteId }, orderBy: { createdAt: 'asc' } }),
    prisma.salesOrder.findMany({ where: { quoteId, companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.findMany({ where: { quoteId, companyId, isActive: true }, orderBy: { createdAt: 'desc' } }),
    prisma.comment.findMany({ where: { moduleName: 'quotes', recordId: quoteId }, orderBy: { createdAt: 'desc' } }),
  ])
  const userIds = new Set<string>()
  stageHistory.forEach(h => h.changedBy && userIds.add(h.changedBy))
  comments.forEach(c => c.userId && userIds.add(c.userId))
  salesOrders.forEach(s => s.assignedTo && userIds.add(s.assignedTo))
  invoices.forEach(i => i.assignedTo && userIds.add(i.assignedTo))
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, firstName: true, lastName: true, email: true, userName: true },
  })
  const nameMap = new Map(users.map(u => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email]))
  return {
    stageHistory: stageHistory.map(h => ({ ...h, changedByName: h.changedBy ? nameMap.get(h.changedBy) || h.changedBy : null })),
    salesOrders,
    invoices,
    comments: comments.map(c => ({ ...c, userName: c.userId ? nameMap.get(c.userId) || c.userId : null })),
  }
}

async function logStage(quoteId: string, stage: string, userId: string) {
  if (!stage) return
  await prisma.quoteStageHistory.create({ data: { quoteId, stage, changedBy: userId } })
}

quotationsRouter.get('/', async (req, res, next) => {
  try {
    const { search, page = '1', limit = '25', sortBy, sortOrder } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum
    let where: any = { isActive: true, companyId: req.user!.companyId }

    if (search) {
      where.OR = [
        { quoteNo: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy) orderBy = { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' }

    const [data, total] = await Promise.all([
      prisma.quote.findMany({ where, include: quoteInclude, skip, take: limitNum, orderBy }),
      prisma.quote.count({ where }),
    ])

    res.json({ data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } })
  } catch (err) { next(err) }
})

quotationsRouter.get('/users', async (req, res, next) => {
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

quotationsRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: quoteInclude,
    })
    if (!record) return res.status(404).json({ error: 'Not found' })
    const related = await quoteRelatedData(record.id, req.user!.companyId!)
    res.json({ ...record, ...related })
  } catch (err) { next(err) }
})

function fixDates(data: any) {
  if (data.validUntil && typeof data.validUntil === 'string') data.validUntil = new Date(data.validUntil + 'T12:00:00')
  for (const k of Object.keys(data)) {
    if (data[k] === '') data[k] = null
  }
  if (data.conversionRate == null || data.conversionRate === '') data.conversionRate = 1
}

quotationsRouter.post('/', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    header.companyId = req.user!.companyId
    header.createdBy = req.user!.userId
    if (!header.assignedTo) header.assignedTo = req.user!.userId
    const record = await prisma.quote.create({
      data: {
        ...header,
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
        stageHistory: { create: { stage: header.quoteStage || 'Created', changedBy: req.user!.userId } },
      },
      include: quoteInclude,
    })
    res.status(201).json(record)
  } catch (err) { next(err) }
})

quotationsRouter.put('/:id', async (req, res, next) => {
  try {
    const { lineItems, ...header } = req.body
    fixDates(header)
    const existing = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    if (header.quoteStage && header.quoteStage !== existing.quoteStage) {
      await logStage(req.params.id, header.quoteStage, req.user!.userId)
    }

    const record = await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.deleteMany({ where: { quoteId: req.params.id } })
      return tx.quote.update({
        where: { id: req.params.id },
        data: {
          ...header,
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
        include: quoteInclude,
      })
    })
    res.json(record)
  } catch (err) { next(err) }
})

quotationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    await prisma.quote.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

quotationsRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!quote) return res.status(404).json({ error: 'Not found' })
    const comment = req.body.comment || ''
    if (!comment.trim()) return res.status(400).json({ error: 'Comment is required' })
    const created = await prisma.comment.create({
      data: { moduleName: 'quotes', recordId: req.params.id, comment: comment.trim(), userId: req.user!.userId, isPrivate: req.body.isPrivate || false },
    })
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { firstName: true, lastName: true, userName: true, email: true } })
    res.status(201).json({ ...created, userName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : null })
  } catch (err) { next(err) }
})

quotationsRouter.post('/:id/convert-salesorder', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const so = await prisma.salesOrder.create({
      data: {
        subject: quote.subject,
        salesOrderNo: 'SO-' + Date.now(),
        validUntil: quote.validUntil,
        total: quote.total,
        subTotal: quote.subTotal,
        discount: quote.discount,
        discountPercent: quote.discountPercent,
        adjustment: quote.adjustment,
        shipping: quote.shipping,
        shippingHandling: quote.shippingHandling,
        taxAmount: quote.taxAmount,
        taxType: quote.taxType,
        grandTotal: quote.grandTotal,
        currency: quote.currency,
        conversionRate: quote.conversionRate || 1,
        carrier: quote.carrier,
        soStatus: 'Created',
        terms: quote.terms,
        description: quote.description,
        companyId: quote.companyId,
        accountId: quote.accountId,
        contactId: quote.contactId,
        potentialId: quote.potentialId,
        quoteId: quote.id,
        billingStreet: quote.billingStreet,
        billingCity: quote.billingCity,
        billingState: quote.billingState,
        billingCountry: quote.billingCountry,
        billingPostalCode: quote.billingPostalCode,
        billingPoBox: quote.billingPoBox,
        shippingStreet: quote.shippingStreet,
        shippingCity: quote.shippingCity,
        shippingState: quote.shippingState,
        shippingCountry: quote.shippingCountry,
        shippingPostalCode: quote.shippingPostalCode,
        shippingPoBox: quote.shippingPoBox,
        assignedTo: quote.assignedTo,
        createdBy: req.user!.userId,
      },
    })

    if (quote.lineItems?.length) {
      await prisma.salesOrderLineItem.createMany({
        data: quote.lineItems.map((item, idx) => ({
          salesOrderId: so.id,
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

    await prisma.quote.update({
      where: { id: quote.id },
      data: { quoteStage: 'Delivered' },
    })
    await logStage(quote.id, 'Delivered', req.user!.userId)

    const created = await prisma.salesOrder.findUnique({ where: { id: so.id } })
    res.status(201).json(created)
  } catch (err) { next(err) }
})

quotationsRouter.post('/:id/convert-invoice', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const now = new Date()
    const invoice = await prisma.invoice.create({
      data: {
        subject: 'Invoice from ' + quote.subject,
        invoiceNo: 'INV-' + Date.now(),
        invoiceDate: now,
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        invoiceStatus: 'Created',
        total: quote.total,
        subTotal: quote.subTotal,
        discount: quote.discount,
        discountPercent: quote.discountPercent,
        adjustment: quote.adjustment,
        shipping: quote.shipping,
        shippingHandling: quote.shippingHandling,
        taxAmount: quote.taxAmount,
        taxType: quote.taxType,
        grandTotal: quote.grandTotal,
        currency: quote.currency,
        conversionRate: quote.conversionRate || 1,
        terms: quote.terms,
        description: quote.description,
        companyId: quote.companyId,
        accountId: quote.accountId,
        contactId: quote.contactId,
        quoteId: quote.id,
        billingStreet: quote.billingStreet,
        billingCity: quote.billingCity,
        billingState: quote.billingState,
        billingCountry: quote.billingCountry,
        billingPostalCode: quote.billingPostalCode,
        billingPoBox: quote.billingPoBox,
        shippingStreet: quote.shippingStreet,
        shippingCity: quote.shippingCity,
        shippingState: quote.shippingState,
        shippingCountry: quote.shippingCountry,
        shippingPostalCode: quote.shippingPostalCode,
        shippingPoBox: quote.shippingPoBox,
        assignedTo: quote.assignedTo,
        createdBy: req.user!.userId,
      },
    })

    if (quote.lineItems?.length) {
      await prisma.invoiceLineItem.createMany({
        data: quote.lineItems.map((item, idx) => ({
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

    await prisma.quote.update({
      where: { id: quote.id },
      data: { quoteStage: 'Accepted' },
    })
    await logStage(quote.id, 'Accepted', req.user!.userId)

    const created = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    })
    res.status(201).json(created)
  } catch (err) { next(err) }
})

quotationsRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { ...quoteInclude },
    })
    if (!quote) return res.status(404).json({ error: 'Not found' })

    const [company, user] = await Promise.all([
      req.user!.companyId ? prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null,
      prisma.user.findUnique({ where: { id: req.user!.userId } }),
    ])

    const companyName = company?.name || 'BizForce CRM'
    const companyAddress = [company?.addressStreet, [company?.addressCity, company?.addressState].filter(Boolean).join(', '), company?.addressCountry, company?.addressPostalCode].filter(Boolean).map(escapeHtml).join('<br>')
    const preparedBy = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : req.user!.email

    const billTo = buildAddressHtml(quote)
    const cur = quote.currency ? ` (${quote.currency})` : ''
    const html = renderReport({
      title: 'QUOTATION',
      docNo: quote.quoteNo || '',
      fileNamePrefix: 'quote',
      companyName,
      companyAddress,
      billToLabel: 'Quote To:',
      billTo,
      metaLines: [
        `<span class="label">Valid Until:</span> ${quote.validUntil ? escapeHtml(new Date(quote.validUntil).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Stage:</span> ${escapeHtml(quote.quoteStage || 'N/A')}`,
        `<span class="label">Currency:</span> ${escapeHtml(quote.currency || 'N/A')}${quote.conversionRate && Number(quote.conversionRate) !== 1 ? ` <span class="item-desc">(rate ${escapeHtml(String(quote.conversionRate))})</span>` : ''}`,
        `<span class="label">Prepared By:</span> ${escapeHtml(preparedBy)}`,
      ],
      items: quote.lineItems.map((item: any) => ({
        name: item.itemName,
        description: item.description,
        qty: item.qty,
        rate: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.lineTotal,
      })),
      totals: [
        { label: `Sub Total${cur}`, value: quote.subTotal },
        { label: 'Discount', value: quote.discount },
        { label: 'Tax', value: quote.taxAmount },
        { label: 'Shipping', value: quote.shipping },
        { label: 'Adjustment', value: quote.adjustment },
        { label: `Grand Total${cur}`, value: quote.grandTotal, grand: true },
      ],
      sections: [
        quote.terms ? `<div class="section"><span class="label">Terms &amp; Conditions:</span><p>${escapeHtml(quote.terms)}</p></div>` : '',
        quote.description ? `<div class="section"><span class="label">Description:</span><p>${escapeHtml(quote.description)}</p></div>` : '',
      ],
    })

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="${quote.quoteNo || quote.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

quotationsRouter.post('/:id/email', async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: true },
    })
    if (!quote) return res.status(404).json({ error: 'Not found' })

    const company = req.user!.companyId ? await prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null
    const companyName = company?.name || 'BizForce CRM'
    const to = req.body.to || ''
    const subject = `Quotation: ${quote.quoteNo || quote.subject}`
    const pdfLink = `/api/quotations/${quote.id}/pdf`
    const text = `Dear Customer,\n\nPlease find attached quotation ${quote.quoteNo || ''} for ${quote.subject}.\n\nTotal Amount: ${Number(quote.grandTotal || 0).toFixed(2)} ${quote.currency || ''}\n\nYou can view the quotation PDF at: ${pdfLink}\n\nThank you,\n${companyName}`

    // Email sending placeholder — logs to console with the PDF attachment link
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`)
    console.log(`[EMAIL] PDF attachment ready: ${pdfLink}`)
    res.json({ message: 'Email sent successfully (logged to console; PDF attached)', to, subject, pdfLink })
  } catch (err) { next(err) }
})
