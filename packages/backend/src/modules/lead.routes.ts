import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'
import { writeAudit } from '../lib/audit'
import { nextSequenceNumber, getOrgSetting } from '../lib/settings'
import { notifyFollowersAndAssignee } from '../lib/notify'
import { checkOrganizationLimit } from '../lib/organization-limits'
import { renderReport, escapeHtml, resolveReportLogo } from './report'
import { sendMail, getSmtpConfig } from '../lib/mailer'
import { pdfAttachmentFromRoute } from '../lib/pdf'

export const leadRouter = Router()

leadRouter.use(authMiddleware)
leadRouter.use(requireModulePermission('leads'))

leadRouter.get('/users', async (req, res, next) => {
  try {
    if (!req.user!.companyId) return res.json({ data: [] })
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, isActive: true, isAgent: false },
      select: { id: true, firstName: true, lastName: true, email: true, userName: true },
      orderBy: { firstName: 'asc' },
    })
    res.json({ data: users })
  } catch (err) { next(err) }
})

leadRouter.post('/bulk-email', async (req, res, next) => {
  try {
    const companyId = req.user!.companyId
    if (!companyId) return res.status(400).json({ error: 'Organization is required' })
    const { target = 'selected', ids = [], tagId, search = '', subject, body } = req.body || {}
    if (!String(subject || '').trim()) return res.status(400).json({ error: 'Subject is required' })
    if (!String(body || '').trim()) return res.status(400).json({ error: 'Email body is required' })
    const where: any = { companyId, isActive: true, isConverted: false, email: { not: null }, emailOptOut: false }
    if (target === 'selected') {
      if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'Select at least one lead' })
      where.id = { in: ids.slice(0, 500) }
    } else if (target === 'tag') {
      if (!tagId) return res.status(400).json({ error: 'Choose a tag' })
      const assignments = await prisma.tag.findMany({ where: { companyId, module: 'leads', OR: [{ parentTagId: tagId }, { id: tagId, recordId: { not: null } }] }, select: { recordId: true } })
      where.id = { in: assignments.map(item => item.recordId).filter(Boolean) }
    } else if (target === 'all' && String(search).trim()) {
      where.OR = ['firstName', 'lastName', 'company', 'email'].map(field => ({ [field]: { contains: String(search).trim(), mode: 'insensitive' } }))
    }
    const leads = await prisma.lead.findMany({ where, take: 500, orderBy: { createdAt: 'desc' } })
    if (!leads.length) return res.status(400).json({ error: 'No eligible leads with email addresses were found' })
    const smtp = await getSmtpConfig(companyId)
    const failures: { leadId: string; email: string; error: string }[] = []
    let sent = 0
    for (const lead of leads) {
      const personalized = String(body).replace(/\{firstName\}/g, lead.firstName || '').replace(/\{lastName\}/g, lead.lastName || '').replace(/\{company\}/g, lead.company || '')
      const result = await sendMail({ to: lead.email!, subject: String(subject), html: personalized.replace(/\n/g, '<br>'), companyId, fromOverride: smtp })
      if (!result.delivered) { failures.push({ leadId: lead.id, email: lead.email!, error: result.error || 'Delivery failed' }); continue }
      sent++
      await prisma.email.create({ data: { subject: String(subject), body: personalized, fromEmail: req.user!.email, toEmails: lead.email, emailFlag: 'Sent', parentModule: 'leads', parentId: lead.id, companyId, assignedTo: req.user!.userId, createdBy: req.user!.userId, dateSent: new Date() } }).catch(() => {})
    }
    res.json({ data: { matched: leads.length, sent, failed: failures.length, failures } })
  } catch (err) { next(err) }
})

leadRouter.get('/:id/pdf', async (req, res, next) => {
  try {
    const lead: any = await prisma.lead.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId, isActive: true } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const [company, template, owner] = await Promise.all([
      req.user!.companyId ? prisma.company.findUnique({ where: { id: req.user!.companyId } }) : null,
      getOrgSetting(req.user!.companyId, 'documentTemplate', {}),
      lead.assignedTo ? prisma.user.findUnique({ where: { id: lead.assignedTo }, select: { firstName: true, lastName: true, email: true } }) : null,
    ])
    const name = [lead.salutation, lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Lead'
    const address = [lead.street, lead.city, lead.state, lead.postalCode, lead.country].filter(Boolean).map(escapeHtml).join('<br>')
    const detail = (key: string, value: any) => `<div class="detail"><span class="k">${escapeHtml(key)}</span><span class="v">${escapeHtml(value || '—')}</span></div>`
    const html = renderReport({
      title: 'LEAD PROFILE', docNo: lead.leadNo || '', fileNamePrefix: 'lead',
      companyName: company?.name || 'BizForce CRM',
      companyAddress: [company?.addressStreet, company?.addressCity, company?.addressCountry].filter(Boolean).map(escapeHtml).join('<br>'),
      billToLabel: 'Lead Contact', billTo: `<strong>${escapeHtml(name)}</strong>${address ? `<br>${address}` : ''}`,
      metaLines: [
        `<span class="label">Status:</span> ${escapeHtml(lead.leadStatus || 'New')}`,
        `<span class="label">Source:</span> ${escapeHtml(lead.leadSource || 'N/A')}`,
        `<span class="label">Owner:</span> ${escapeHtml(owner ? [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.email : 'Unassigned')}`,
        `<span class="label">Created:</span> ${lead.createdAt ? escapeHtml(new Date(lead.createdAt).toLocaleDateString()) : 'N/A'}`,
      ],
      items: [], totals: [], showItems: false,
      sections: [
        `<div class="section"><span class="label">Contact &amp; qualification</span><div class="detail-grid" style="margin-top:12px">${detail('Company', lead.company)}${detail('Email', lead.email)}${detail('Phone', lead.phone || lead.mobile)}${detail('Industry', lead.industry)}${detail('Rating', lead.rating)}${detail('Annual revenue', lead.annualRevenue)}</div></div>`,
        lead.description ? `<div class="section"><span class="label">Notes</span><p>${escapeHtml(lead.description)}</p></div>` : '',
      ],
      logoUrl: await resolveReportLogo(company?.logo), template,
    })
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="${lead.leadNo || lead.id}.html"`)
    res.send(html)
  } catch (err) { next(err) }
})

leadRouter.post('/:id/email', async (req, res, next) => {
  try {
    const lead: any = await prisma.lead.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId, isActive: true } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const to = String(req.body.to || lead.email || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'A valid recipient email is required' })
    const includePdf = req.body.attachPdf !== false
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Lead'
    const subject = `Lead profile: ${name}`
    const text = `Hello,\n\nPlease find the lead profile for ${name}${includePdf ? ' attached as a PDF.' : '.'}\n\nThank you.`
    const attachments = includePdf ? [await pdfAttachmentFromRoute(req, `/leads/${lead.id}/pdf`, `${lead.leadNo || name || 'lead'}.pdf`)] : undefined
    const result = await sendMail({ to, subject, text, attachments, companyId: req.user!.companyId, fromOverride: await getSmtpConfig(req.user!.companyId) })
    if (!result.delivered) return res.status(502).json({ error: result.error || 'Email could not be delivered' })
    res.json({ message: 'Email sent successfully', to, subject, attachedPdf: includePdf })
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

    if (createContact && companyId) {
      const capacity = await checkOrganizationLimit(companyId, 'contacts')
      if (!capacity.allowed) return res.status(409).json({ error: `Contact limit reached (${capacity.used}/${capacity.limit}). Increase the organization limit before converting this lead.` })
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
