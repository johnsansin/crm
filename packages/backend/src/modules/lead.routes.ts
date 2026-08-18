import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { writeAudit } from '../lib/audit'
import { nextSequenceNumber, getOrgSetting } from '../lib/settings'
import { notifyFollowersAndAssignee } from '../lib/notify'

export const leadRouter = Router()

leadRouter.use(authMiddleware)

leadRouter.get('/users', async (req, res, next) => {
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

leadRouter.get('/:id/conversion-info', async (req, res, next) => {
  try {
    const where: any = { id: req.params.id, isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const lead = await prisma.lead.findFirst({ where })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    if (lead.isConverted) return res.status(400).json({ error: 'Lead already converted' })
    const mapping = (await getOrgSetting(req.user!.companyId, 'leadConversionMapping').catch(() => ({}))) || {}
    res.json({
      lead,
      potentialInfo: {
        potentialName: lead.company,
        amount: lead.annualRevenue || null,
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: null,
        probability: null,
        nextStep: null,
        leadSource: lead.leadSource || null,
      },
      mapping,
    })
  } catch (err) { next(err) }
})

leadRouter.post('/:id/convert', async (req, res, next) => {
  try {
    const where: any = { id: req.params.id, isActive: true }
    if (req.user!.companyId) where.companyId = req.user!.companyId
    const lead = await prisma.lead.findFirst({ where })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    if (lead.isConverted) return res.status(400).json({ error: 'Lead already converted' })

    const pi = req.body.potentialInfo || {}
    const accountName = pi.accountName || lead.company
    const assignedTo = req.body.assignedTo || lead.assignedTo || req.user!.userId
    const companyId = req.user!.companyId || null
    const mods = req.body.modules || {}
    const createAccount = mods.account !== false
    const createContact = mods.contact !== false
    const createPotential = mods.potential !== false
    if (createPotential && !createAccount && !createContact) {
      return res.status(400).json({ error: 'Opportunity conversion requires at least Account or Contact to be created' })
    }

    // Org-level field mapping (SaaS: each organisation defines its own mapping)
    const mapping = (await getOrgSetting(companyId, 'leadConversionMapping').catch(() => ({}))) || {}
    const applyMap = (module: string, base: any): any => {
      const map = mapping[module] || {}
      const out = { ...base }
      for (const [target, src] of Object.entries(map)) {
        if (src && typeof src === 'string' && (lead as any)[src] != null) out[target] = (lead as any)[src]
      }
      return out
    }

    const result = await prisma.$transaction(async (tx) => {
      let account: any = null
      let contact: any = null
      if (createAccount) {
        account = await tx.account.create({
        data: applyMap('account', {
          accountNo: await nextSequenceNumber('Account', companyId),
          accountName,
          website: lead.website,
          phone: lead.phone,
          fax: lead.fax,
          email: lead.email,
          industry: lead.industry,
          annualRevenue: lead.annualRevenue,
          rating: lead.rating,
          employees: lead.noOfEmployees,
          billingStreet: lead.street,
          billingCity: lead.city,
          billingState: lead.state,
          billingCountry: lead.country,
          billingPostalCode: lead.postalCode,
          billingPoBox: lead.poBox,
          shippingStreet: lead.street,
          shippingCity: lead.city,
          shippingState: lead.state,
          shippingCountry: lead.country,
          shippingPostalCode: lead.postalCode,
          shippingPoBox: lead.poBox,
          description: lead.description,
          companyId,
          createdBy: req.user!.userId,
          assignedTo,
        }),
      })
      }

      if (createContact) {
        contact = await tx.contact.create({
          data: applyMap('contact', {
            contactNo: await nextSequenceNumber('Contact', companyId),
            salutation: lead.salutation,
            firstName: lead.firstName,
            lastName: lead.lastName,
            title: lead.title,
            email: lead.email,
            secondaryEmail: lead.secondaryEmail,
            phone: lead.phone,
            mobile: lead.mobile,
            fax: lead.fax,
            leadSource: lead.leadSource,
            isConvertedFromLead: true,
            mailingStreet: lead.street,
            mailingCity: lead.city,
            mailingState: lead.state,
            mailingCountry: lead.country,
            mailingPostalCode: lead.postalCode,
            mailingPoBox: lead.poBox,
            description: lead.description,
            accountId: account ? account.id : null,
            companyId,
            createdBy: req.user!.userId,
            assignedTo,
          }),
        })
      }

      let potential: any = null
      if (createPotential) {
        potential = await tx.potential.create({
          data: applyMap('potential', {
            potentialNo: await nextSequenceNumber('Potential', companyId),
            potentialName: pi.potentialName || lead.company,
            amount: pi.amount != null ? pi.amount : lead.annualRevenue,
            closingDate: pi.closingDate ? new Date(pi.closingDate) : null,
            stage: pi.stage || null,
            probability: pi.probability != null ? Number(pi.probability) : null,
            nextStep: pi.nextStep || null,
            leadSource: pi.leadSource || lead.leadSource,
            campaignId: lead.campaignId,
            accountId: account ? account.id : null,
            contactId: contact ? contact.id : null,
            companyId,
            createdBy: req.user!.userId,
            assignedTo,
          }),
        })
      }

      const converted = await tx.lead.update({
        where: { id: lead.id },
        data: {
          isConverted: true,
          convertedAccountId: account ? account.id : null,
          convertedContactId: contact ? contact.id : null,
          convertedPotentialId: potential ? potential.id : null,
        },
      })

      return { account, contact, potential, converted }
    })

      const newValue = `Lead converted${result.account ? ` to Account "${result.account.accountName}"` : ''}${result.contact ? ` and Contact "${result.contact.firstName} ${result.contact.lastName}"` : ''}${result.potential ? ` and Opportunity "${result.potential.potentialName}"` : ''}`
      await writeAudit({
        moduleName: 'leads', recordId: lead.id, action: 'CONVERT', newValue,
        userId: req.user!.userId, req,
      })
      notifyFollowersAndAssignee({
        moduleName: 'leads', recordId: lead.id, assigneeId: lead.assignedTo,
        title: `Lead converted: ${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.company,
        message: newValue,
        link: result.potential ? `/potentials/${result.potential.id}` : `/leads/${lead.id}`,
        companyId: req.user!.companyId, actorId: req.user!.userId,
      }).catch(() => {})
    res.json(result)
  } catch (err) { next(err) }
})
