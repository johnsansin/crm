import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signingSecret } from '../lib/secrets'

const PORTAL_JWT_SECRET = signingSecret('PORTAL_JWT_SECRET', 'bizforce-portal-jwt-secret-2026')

export const portalRouter = Router()

export const ticketFields = (t: any) => ({
  id: t.id,
  ticketNo: t.ticketNo,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  severity: t.severity,
  category: t.category,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
})

export const commentFields = (c: any) => ({ id: c.id, comment: c.comment, createdAt: c.createdAt, isInternal: c.isInternal })

export const lineItemFields = (l: any) => ({
  id: l.id,
  itemName: l.itemName,
  qty: l.qty,
  unitPrice: l.unitPrice,
  discount: l.discount,
  tax: l.tax,
  netPrice: l.netPrice,
  lineTotal: l.lineTotal,
  description: l.description,
})

export const invoiceFields = (i: any) => ({
  id: i.id,
  invoiceNo: i.invoiceNo,
  subject: i.subject,
  invoiceDate: i.invoiceDate,
  dueDate: i.dueDate,
  invoiceStatus: i.invoiceStatus,
  paymentTerms: i.paymentTerms,
  total: i.total,
  subTotal: i.subTotal,
  discount: i.discount,
  adjustment: i.adjustment,
  shipping: i.shipping,
  shippingHandling: i.shippingHandling,
  taxAmount: i.taxAmount,
  taxType: i.taxType,
  grandTotal: i.grandTotal,
  currency: i.currency,
  billingStreet: i.billingStreet,
  billingCity: i.billingCity,
  billingState: i.billingState,
  billingCountry: i.billingCountry,
  billingPostalCode: i.billingPostalCode,
  description: i.description,
  createdAt: i.createdAt,
  ...(Array.isArray(i.lineItems) ? { lineItems: i.lineItems.map(lineItemFields) } : {}),
})

export const documentFields = (d: any) => ({
  id: d.id,
  title: d.title,
  fileName: d.fileName,
  fileType: d.fileType,
  fileSize: d.fileSize,
  filePath: d.filePath,
  fileVersion: d.fileVersion,
  createdAt: d.createdAt,
})

function portalAuth(req: any, res: any, next: any) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, PORTAL_JWT_SECRET) as { portalUserId: string; email: string }
    req.portalUser = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid portal token' })
  }
}

portalRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    const user = await prisma.portalUser.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials or account disabled' })
      return
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    await prisma.portalUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })
    const token = jwt.sign(
      { portalUserId: user.id, email: user.email, companyId: user.companyId },
      PORTAL_JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          sharedBy: user.sharedByName || user.sharedByEmail || '',
        },
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/profile', portalAuth, async (req: any, res) => {
  try {
    const user = await prisma.portalUser.findUnique({
      where: { id: req.portalUser.portalUserId },
      select: { id: true, name: true, email: true, phone: true, lastLogin: true, createdAt: true, sharedByName: true, sharedByEmail: true },
    })
    if (!user) { res.status(404).json({ error: 'Not found' }); return }
    res.json({ data: user })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.put('/profile', portalAuth, async (req: any, res) => {
  try {
    const { name, phone } = req.body
    const user = await prisma.portalUser.update({
      where: { id: req.portalUser.portalUserId },
      data: { ...(name && { name }), ...(phone && { phone }) },
      select: { id: true, name: true, email: true, phone: true },
    })
    res.json({ data: user })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/tickets', portalAuth, async (req: any, res) => {
  try {
    const portalUser = await prisma.portalUser.findUnique({ where: { id: req.portalUser.portalUserId } })
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { contactId: portalUser?.contactId || '__none__' },
          { createdBy: portalUser?.userId || '__none__' },
          { companyId: req.portalUser.companyId },
        ],
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: tickets.map(ticketFields) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.post('/tickets', portalAuth, async (req: any, res) => {
  try {
    const { title, description, priority, category } = req.body
    if (!title) { res.status(400).json({ error: 'Title is required' }); return }
    const portalUser = await prisma.portalUser.findUnique({ where: { id: req.portalUser.portalUserId } })
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'Normal',
        status: 'Open',
        category: category || '',
        contactId: portalUser?.contactId || undefined,
        companyId: req.portalUser.companyId,
      },
    })
    res.json({ data: ticket })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/tickets/:id', portalAuth, async (req: any, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { ticketComments: { orderBy: { createdAt: 'asc' } } },
    })
    if (!ticket) { res.status(404).json({ error: 'Not found' }); return }
    const safe: any = ticketFields(ticket)
    safe.ticketComments = (ticket.ticketComments || [])
      .filter((c: any) => !c.isInternal)
      .map(commentFields)
    res.json({ data: safe })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.post('/tickets/:id/comments', portalAuth, async (req: any, res) => {
  try {
    const { comment } = req.body
    if (!comment) { res.status(400).json({ error: 'Comment is required' }); return }
    const ticketComment = await prisma.ticketComment.create({
      data: {
        ticketId: req.params.id,
        comment,
        isInternal: false,
        companyId: req.portalUser.companyId,
      },
    })
    res.json({ data: ticketComment })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/invoices', portalAuth, async (req: any, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { companyId: req.portalUser.companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: invoices.map(invoiceFields) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/invoices/:id', portalAuth, async (req: any, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true },
    })
    if (!invoice) { res.status(404).json({ error: 'Not found' }); return }
    res.json({ data: invoiceFields(invoice) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

portalRouter.get('/documents', portalAuth, async (req: any, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { companyId: req.portalUser.companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: docs.map(documentFields) })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
