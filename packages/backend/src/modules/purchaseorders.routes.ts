import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'

const purchaseOrdersRouter = Router()

purchaseOrdersRouter.use(authMiddleware)
purchaseOrdersRouter.use(requireModulePermission('purchaseorders'))

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
