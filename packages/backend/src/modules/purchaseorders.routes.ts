import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'
import { renderReport, escapeHtml, resolveReportLogo } from './report'
import { getOrgSetting } from '../lib/settings'
import { sendMail, getSmtpConfig } from '../lib/mailer'

const purchaseOrdersRouter = Router()

purchaseOrdersRouter.use(authMiddleware)
purchaseOrdersRouter.use(requireModulePermission('purchaseorders'))

purchaseOrdersRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { lineItems: { orderBy: { sequence: 'asc' } } },
    })
    if (!po) return res.status(404).json({ error: 'Not found' })
    const [company, user, template] = await Promise.all([
      req.user!.companyId ? prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null,
      prisma.user.findUnique({ where: { id: req.user!.userId } }),
      getOrgSetting(req.user!.companyId, 'documentTemplate', {}),
    ])
    const companyAddress = [company?.addressStreet, [company?.addressCity, company?.addressState].filter(Boolean).join(', '), company?.addressCountry, company?.addressPostalCode].filter(Boolean).map(escapeHtml).join('<br>')
    const vendorAddress = [po.billingStreet, po.billingCity, po.billingState, po.billingPostalCode, po.billingCountry].filter(Boolean).map(escapeHtml).join('<br>')
    const preparedBy = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email : req.user!.email
    const cur = po.currency ? ` (${po.currency})` : ''
    const html = renderReport({
      title: 'PURCHASE ORDER', docNo: po.purchaseOrderNo || '', fileNamePrefix: 'purchaseorder',
      companyName: company?.name || 'BizForce CRM', companyAddress, billToLabel: 'Vendor / Bill To:', billTo: vendorAddress,
      metaLines: [
        `<span class="label">Valid Until:</span> ${po.validUntil ? escapeHtml(new Date(po.validUntil).toLocaleDateString()) : 'N/A'}`,
        `<span class="label">Status:</span> ${escapeHtml(po.poStatus || 'N/A')}`,
        `<span class="label">Currency:</span> ${escapeHtml(po.currency || 'N/A')}`,
        `<span class="label">Prepared By:</span> ${escapeHtml(preparedBy)}`,
      ],
      items: po.lineItems.map(item => ({ name: item.itemName, description: item.description, qty: item.qty, rate: item.unitPrice, discount: item.discount, tax: item.tax, total: item.lineTotal })),
      totals: [
        { label: `Sub Total${cur}`, value: po.subTotal }, { label: 'Discount', value: po.discount },
        { label: 'Tax', value: po.taxAmount }, { label: 'Shipping', value: po.shipping },
        { label: 'Adjustment', value: po.adjustment }, { label: `Grand Total${cur}`, value: po.grandTotal, grand: true },
      ],
      sections: [
        po.terms ? `<div class="section"><span class="label">Terms &amp; Conditions:</span><p>${escapeHtml(po.terms)}</p></div>` : '',
        po.description ? `<div class="section"><span class="label">Description:</span><p>${escapeHtml(po.description)}</p></div>` : '',
      ],
      logoUrl: await resolveReportLogo(company?.logo), template,
    })
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Disposition', `inline; filename="${po.purchaseOrderNo || po.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

purchaseOrdersRouter.post('/:id/email', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } })
    if (!po) return res.status(404).json({ error: 'Not found' })
    const company = req.user!.companyId ? await prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null
    const to = String(req.body.to || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'A valid recipient email is required' })
    const subject = `Purchase Order: ${po.purchaseOrderNo || po.subject}`
    const pdfLink = `/api/purchaseorders/${po.id}/pdf`
    const includePdf = req.body.attachPdf !== false
    const text = `Dear Vendor,\n\nPurchase order ${po.purchaseOrderNo || ''}: ${po.subject}.\n\nTotal Amount: ${Number(po.grandTotal || 0).toFixed(2)} ${po.currency || ''}${includePdf ? `\n\nView / save the PDF: ${req.protocol}://${req.get('host')}${pdfLink}` : ''}\n\nThank you,\n${company?.name || 'BizForce CRM'}`
    const result = await sendMail({ to, subject, text, fromOverride: await getSmtpConfig(req.user!.companyId) })
    if (!result.delivered) return res.status(502).json({ error: result.error || 'Email could not be delivered' })
    res.json({ message: 'Email sent successfully', to, subject, pdfLink: includePdf ? pdfLink : null })
  } catch (err) { next(err) }
})

purchaseOrdersRouter.get('/:id/payments', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!po) return res.status(404).json({ error: 'Not found' })
    const data = await prisma.payment.findMany({
      where: { purchaseOrderId: req.params.id },
      orderBy: { paymentDate: 'desc' },
    })
    const total = data.reduce((s, p) => s + Number(p.amount || 0), 0)
    res.json({ data, total: Number(total.toFixed(2)) })
  } catch (err) { next(err) }
})

purchaseOrdersRouter.post('/:id/payments', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!po) return res.status(404).json({ error: 'Not found' })
    const { amount, paymentDate, method, reference, notes } = req.body
    if (amount == null || Number(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' })
    const payment = await prisma.payment.create({
      data: {
        purchaseOrderId: req.params.id,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate + 'T12:00:00') : new Date(),
        method: method || 'Other',
        reference: reference || null,
        notes: notes || null,
        companyId: req.user!.companyId,
        createdBy: req.user!.userId,
      },
    })
    const payments = await prisma.payment.findMany({ where: { purchaseOrderId: req.params.id } })
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    let poStatus = po.poStatus
    if (totalPaid >= Number(po.grandTotal || 0) - 0.005) {
      poStatus = 'Paid'
    } else if (totalPaid > 0) {
      poStatus = 'Partially Paid'
    }
    await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { poStatus, paidAmount: Number(totalPaid.toFixed(2)) } })
    res.status(201).json({ data: payment, totalPaid: Number(totalPaid.toFixed(2)), poStatus })
  } catch (err) { next(err) }
})

purchaseOrdersRouter.get('/:id/balance', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    })
    if (!po) return res.status(404).json({ error: 'Not found' })
    const payments = await prisma.payment.findMany({ where: { purchaseOrderId: req.params.id } })
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    res.json({ grandTotal: Number(po.grandTotal || 0), totalPaid: Number(totalPaid.toFixed(2)), balance: Number((Number(po.grandTotal || 0) - totalPaid).toFixed(2)) })
  } catch (err) { next(err) }
})

export { purchaseOrdersRouter }
