import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'

export const companyRouter = Router()

companyRouter.use(authMiddleware)

companyRouter.get('/', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'No company associated with user' })
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return res.status(404).json({ error: 'Company not found' })
    res.json(company)
  } catch (err) { next(err) }
})

companyRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'No company associated with user' })
    const company = await prisma.company.update({
      where: { id: companyId },
      data: req.body
    })
    res.json(company)
  } catch (err) { next(err) }
})
