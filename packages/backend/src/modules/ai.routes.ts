import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'
import { getLeadAgentConfig, ingestLeadCandidate, reviewLeadCandidate, runLeadAgent, saveLeadAgentConfig } from '../lib/lead-agent'

export const aiRouter = Router()
aiRouter.use(authMiddleware)
aiRouter.use(requireModulePermission('ai', 'view'))

async function logAi(req: any, input: any, output: any, moduleName?: string, recordId?: string) {
  try {
    await prisma.aiLog.create({
      data: {
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        model: 'bizforce-ai-template',
        tokens: JSON.stringify(output).split(' ').length,
        duration: 0,
        companyId: req.user?.companyId,
        userId: req.user?.userId,
        moduleName: moduleName || null,
        recordId: recordId || null,
      },
    })
  } catch {}
}

// ===== EXISTING ENDPOINTS =====

aiRouter.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, context, module } = req.body
    if (!prompt) { res.status(400).json({ error: 'prompt required' }); return }
    const startTime = Date.now()
    const output = generateSmartResponse(prompt, context, module)
    const duration = Date.now() - startTime
    await logAi(req, { prompt, context, module }, output, module)
    res.json({ data: { output, model: 'bizforce-ai-template', tokens: output.split(' ').length, duration } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.post('/suggest', authMiddleware, async (req, res) => {
  try {
    const { module, recordId, fieldName, currentValue } = req.body
    const suggestions: Record<string, Record<string, string[]>> = {
      leads: { email: ['contact@company.com', 'sales@company.com'], leadSource: ['Web', 'Referral', 'Cold Call', 'Trade Show'], leadStatus: ['New', 'Contacted', 'Qualified'], industry: ['Technology', 'Healthcare', 'Finance'] },
      contacts: { email: ['firstname.lastname@company.com'], title: ['CEO', 'CTO', 'VP Sales', 'Director'] },
      potentials: { stage: ['Prospecting', 'Qualification', 'Negotiation', 'Closed Won'], priority: ['High', 'Medium', 'Low'] },
      tickets: { priority: ['High', 'Medium', 'Low', 'Urgent'], status: ['Open', 'In Progress', 'Closed'], category: ['Technical', 'Billing', 'General'] },
    }
    const fieldSuggestions = suggestions[module]?.[fieldName] || ['Suggestion 1', 'Suggestion 2', 'Suggestion 3']
    const output = { module, fieldName, currentValue, suggestions: fieldSuggestions, reasoning: `Based on ${module} patterns for ${fieldName}` }
    await logAi(req, req.body, output, module, recordId)
    res.json({ data: output })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { module, recordId } = req.body
    const output = {
      module, recordId,
      analysis: {
        summary: `Analysis of ${module || 'record'} shows standard patterns with room for optimization.`,
        insights: ['Record follows typical workflow patterns.', 'Consider updating related fields.', 'Activity history suggests regular follow-ups.'],
        score: Math.floor(Math.random() * 40) + 60,
        recommendations: ['Update contact information.', 'Schedule a follow-up.', 'Review associated records.'],
      },
      model: 'bizforce-ai-template',
    }
    await logAi(req, req.body, output, module, recordId)
    res.json({ data: output })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.get('/prompts', authMiddleware, async (req: any, res) => {
  try {
    const prompts = await prisma.aiPrompt.findMany({
      where: { companyId: req.user?.companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: prompts })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.post('/prompts', authMiddleware, async (req: any, res) => {
  try {
    const { name, prompt, module } = req.body
    if (!name || !prompt) { res.status(400).json({ error: 'name and prompt required' }); return }
    const saved = await prisma.aiPrompt.create({
      data: { name, prompt, module: module || null, companyId: req.user?.companyId, createdBy: req.user?.userId },
    })
    res.json({ data: saved })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.get('/logs', authMiddleware, async (req: any, res) => {
  try {
    const logs = await prisma.aiLog.findMany({
      where: { companyId: req.user?.companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ data: logs })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1a. AI EMAIL DRAFTING =====

aiRouter.post('/draft-email', authMiddleware, async (req: any, res) => {
  try {
    const { contactId, subject, tone } = req.body
    if (!contactId) { res.status(400).json({ error: 'contactId required' }); return }

    const companyId = req.user!.companyId
    const contact: any = await prisma.contact.findFirst({ where: { id: contactId, companyId } }).catch(() => null)
    if (!contact) { res.status(404).json({ error: 'Contact not found' }); return }

    const account = contact.accountId ? await prisma.account.findFirst({ where: { id: contact.accountId, companyId } }).catch(() => null) : null
    const activities = await prisma.activity.findMany({ where: { companyId, parentModule: 'contacts', parentId: contactId }, orderBy: { createdAt: 'desc' }, take: 5 })
    const tickets = await prisma.ticket.findMany({ where: { companyId, contactId }, orderBy: { createdAt: 'desc' }, take: 3 })

    const firstName = contact.firstName || 'there'
    const companyName = account?.accountName || contact.department || ''
    const recentTopics = activities.map(a => a.subject).filter(Boolean).slice(0, 3)
    const openTickets = tickets.filter(t => t.status !== 'Closed').length

    const emailBody = composeEmail({ firstName, companyName, subject, tone, recentTopics, openTickets, contact })
    const subjectLine = subject || `Following up, ${firstName}`

    const output = { subject: subjectLine, body: emailBody, tone: tone || 'professional', context: { contactName: `${contact.firstName} ${contact.lastName}`, company: companyName, recentInteractions: recentTopics.length, openTickets } }
    await logAi(req, req.body, output, 'contacts', contactId)
    res.json({ data: output })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1b. AI MEETING SUMMARIES =====

aiRouter.post('/meeting-summary', authMiddleware, async (req: any, res) => {
  try {
    const { notes, taskSubject } = req.body
    if (!notes) { res.status(400).json({ error: 'notes required' }); return }

    const lines = notes.split('\n').filter((l: string) => l.trim())
    const sentences = notes.split(/[.!?]+/).filter((s: string) => s.trim())

    const summary = {
      title: taskSubject || 'Meeting Summary',
      attendees: extractAttendees(notes),
      keyPoints: lines.slice(0, Math.min(5, lines.length)).map((l: string) => l.trim().replace(/^[-•*]\s*/, '')),
      actionItems: lines.filter((l: string) => /action|todo|follow[- ]?up|assign|schedule|complete|send|review|prepare/i.test(l)).map((l: string) => l.trim().replace(/^[-•*]\s*/, '')).slice(0, 5),
      nextSteps: generateNextSteps(sentences),
      sentiment: detectSentiment(notes),
      wordCount: notes.split(/\s+/).length,
      estimatedDuration: estimateDuration(notes),
    }

    await logAi(req, { notes: notes.slice(0, 500) }, summary, 'activities')
    res.json({ data: summary })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1c. AI CUSTOMER NOTE SUMMARIES =====

aiRouter.post('/customer-summary', authMiddleware, async (req: any, res) => {
  try {
    const { contactId } = req.body
    if (!contactId) { res.status(400).json({ error: 'contactId required' }); return }

    const companyId = req.user!.companyId
    const contact: any = await prisma.contact.findFirst({ where: { id: contactId, companyId } }).catch(() => null)
    if (!contact) { res.status(404).json({ error: 'Contact not found' }); return }

    const [activities, tickets, comments] = await Promise.all([
      prisma.activity.findMany({ where: { companyId, parentModule: 'contacts', parentId: contactId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.ticket.findMany({ where: { companyId, contactId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.comment.findMany({ where: { companyId, moduleName: 'contacts', recordId: contactId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ])

    const allText = [...activities.map(a => `${a.subject} ${a.description || ''}`), ...tickets.map(t => `${t.title} ${t.description || ''} ${t.solution || ''}`), ...comments.map(c => c.comment)].filter(Boolean)

    const topics = extractTopics(allText)
    const sentiment = analyzeSentiment(allText)
    const totalInteractions = activities.length + tickets.length + comments.length
    const lastInteraction = activities[0]?.createdAt || tickets[0]?.createdAt || comments[0]?.createdAt

    const summary = {
      contactName: `${contact.firstName} ${contact.lastName}`,
      totalInteractions,
      lastInteraction: lastInteraction ? new Date(lastInteraction).toISOString() : null,
      keyTopics: topics,
      sentiment,
      interactionBreakdown: { activities: activities.length, tickets: tickets.length, comments: comments.length },
      recommendedActions: generateRecommendations(contact, activities, tickets),
      recentHighlights: allText.slice(0, 5).map(t => t.slice(0, 200)),
    }

    await logAi(req, { contactId }, summary, 'contacts', contactId)
    res.json({ data: summary })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1d. AI LEAD SCORING =====

aiRouter.post('/lead-score', authMiddleware, async (req: any, res) => {
  try {
    const { leadId } = req.body
    if (!leadId) { res.status(400).json({ error: 'leadId required' }); return }

    const companyId = req.user!.companyId
    const lead: any = await prisma.lead.findFirst({ where: { id: leadId, companyId } }).catch(() => null)
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return }

    const activities = await prisma.activity.findMany({ where: { companyId, parentModule: 'leads', parentId: leadId } })
    const emails = await prisma.email.findMany({ where: { companyId, parentModule: 'leads', parentId: leadId } })

    const score = computeLeadScore(lead, activities, emails)
    await prisma.lead.update({ where: { id: leadId }, data: { leadScore: score.score } })

    await logAi(req, { leadId }, score, 'leads', leadId)
    res.json({ data: score })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.post('/lead-score/batch', authMiddleware, async (req: any, res) => {
  try {
    const companyId = req.user!.companyId
    const leads: any[] = await prisma.lead.findMany({ where: { companyId, isActive: true, isConverted: false } }).catch(() => [])
    const results: any[] = []
    for (const lead of leads) {
      const activities = await prisma.activity.findMany({ where: { companyId, parentModule: 'leads', parentId: lead.id } }).catch(() => [])
      const emails = await prisma.email.findMany({ where: { companyId, parentModule: 'leads', parentId: lead.id } }).catch(() => [])
      const score = computeLeadScore(lead, activities, emails)
      results.push({ leadId: lead.id, firstName: lead.firstName, lastName: lead.lastName, company: lead.company, score: score.score, factors: score.factors, color: score.color })
    }
    await logAi(req, { batch: true }, { scored: results.length }, 'leads')
    res.json({ data: results })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.get('/lead-agent/config', async (req: any, res) => {
  try {
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    res.json({ data: await getLeadAgentConfig(req.user.companyId) })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

aiRouter.put('/lead-agent/config', async (req: any, res) => {
  try {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) return res.status(403).json({ error: 'Administrator access required' })
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    res.json({ data: await saveLeadAgentConfig(req.user.companyId, req.body || {}) })
  } catch (err: any) { res.status(400).json({ error: err.message }) }
})

aiRouter.post('/lead-agent/run', async (req: any, res) => {
  try {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) return res.status(403).json({ error: 'Administrator access required' })
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    res.json({ data: await runLeadAgent(req.user.companyId, req.user.userId) })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

aiRouter.get('/lead-agent/candidates', async (req: any, res) => {
  try {
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    const status = typeof req.query.status === 'string' && req.query.status !== 'ALL' ? req.query.status.toUpperCase() : undefined
    const all = await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "companyId" = ${req.user.companyId} ORDER BY "createdAt" DESC LIMIT 200`
    const candidates = status ? all.filter(item => item.status === status) : all
    res.json({ data: candidates.map(item => ({ ...item, reasons: JSON.parse(item.reasons || '[]') })) })
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

aiRouter.post('/lead-agent/intake', async (req: any, res) => {
  try {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) return res.status(403).json({ error: 'Administrator access required' })
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    const result = await ingestLeadCandidate(req.user.companyId, req.user.userId, req.body || {})
    res.status(result.created ? 201 : 200).json({ data: result })
  } catch (err: any) { res.status(400).json({ error: err.message }) }
})

aiRouter.post('/lead-agent/candidates/:id/review', async (req: any, res) => {
  try {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) return res.status(403).json({ error: 'Administrator access required' })
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    if (!['approve', 'reject'].includes(req.body?.action)) return res.status(400).json({ error: 'Action must be approve or reject' })
    res.json({ data: await reviewLeadCandidate(req.user.companyId, req.user.userId, req.params.id, req.body.action) })
  } catch (err: any) { res.status(400).json({ error: err.message }) }
})

aiRouter.post('/lead-agent/demo', async (req: any, res) => {
  try {
    if (!req.user?.isAdmin && !req.user?.isSuperAdmin) return res.status(403).json({ error: 'Administrator access required' })
    if (!req.user?.companyId) return res.status(400).json({ error: 'Organization is required' })
    const stamp = new Date().toISOString().slice(0, 10)
    const samples = [
      { firstName: 'Maya', lastName: 'Chen', company: 'Northstar Analytics', email: `maya.chen+${stamp}@example.com`, title: 'VP Sales', website: 'https://example.com/northstar', industry: 'Technology', employeeCount: 240, country: 'United States', source: 'Demo website form', sourceReference: 'agentic-demo', consentBasis: 'Requested a product demonstration' },
      { firstName: 'Omar', lastName: 'Rahman', company: 'Harbor Logistics', email: `omar.rahman+${stamp}@example.com`, industry: 'Transportation', employeeCount: 65, country: 'United Kingdom', source: 'Demo event import', sourceReference: 'agentic-demo', consentBasis: 'Opted in at industry event' },
      { firstName: 'Priya', lastName: 'Shah', company: 'Brightlane Studio', phone: `+1555${stamp.replace(/-/g, '').slice(2)}`, source: 'Demo referral', sourceReference: 'agentic-demo' },
    ]
    const results = []
    for (const sample of samples) results.push(await ingestLeadCandidate(req.user.companyId, req.user.userId, sample))
    res.json({ data: results, message: 'Three realistic demo candidates processed' })
  } catch (err: any) { res.status(400).json({ error: err.message }) }
})

// ===== 1e. AI SALES OPPORTUNITY PREDICTION =====

aiRouter.post('/predictions', authMiddleware, async (req: any, res) => {
  try {
    const companyId = req.user!.companyId
    const opportunities = await prisma.potential.findMany({
      where: { isActive: true, stage: { notIn: ['Closed Won', 'Closed Lost'] }, ...(companyId ? { companyId } : {}) },
      orderBy: { closingDate: 'asc' },
      take: 10,
    })
    const data = await Promise.all(opportunities.map(async (potential: any) => {
      const [activities, stageHistory, competitors] = await Promise.all([
        prisma.activity.findMany({ where: { companyId: potential.companyId, parentModule: 'potentials', parentId: potential.id } }),
        prisma.potentialStageHistory.findMany({ where: { potentialId: potential.id } } as any),
        prisma.potentialCompetitor.findMany({ where: { potentialId: potential.id }, include: { competitor: true } }),
      ])
      return {
        id: potential.id,
        potentialName: potential.potentialName,
        stage: potential.stage,
        amount: potential.amount,
        prediction: computeOpportunityPrediction(potential, activities, stageHistory, competitors),
      }
    }))
    await logAi(req, {}, { count: data.length }, 'potentials')
    res.json({ data })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

aiRouter.post('/opportunity-prediction', authMiddleware, async (req: any, res) => {  try {
    const { potentialId } = req.body
    if (!potentialId) { res.status(400).json({ error: 'potentialId required' }); return }

    const companyId = req.user!.companyId
    const potential: any = await prisma.potential.findFirst({ where: { id: potentialId, companyId } }).catch(() => null)
    if (!potential) { res.status(404).json({ error: 'Opportunity not found' }); return }

    const [activities, stageHistory, competitors] = await Promise.all([
      prisma.activity.findMany({ where: { companyId, parentModule: 'potentials', parentId: potentialId } }),
      prisma.potentialStageHistory.findMany({ where: { potentialId } } as any),
      prisma.potentialCompetitor.findMany({ where: { potentialId }, include: { competitor: true } }),
    ])

    const prediction = computeOpportunityPrediction(potential, activities, stageHistory, competitors)

    await logAi(req, { potentialId }, prediction, 'potentials', potentialId)
    res.json({ data: prediction })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1f. AI SUGGEST ACTIONS =====

aiRouter.post('/suggest-actions', authMiddleware, async (req: any, res) => {
  try {
    const { module, recordId } = req.body
    const suggestions: any[] = []

    if (module === 'potentials' && recordId) {
      const potential: any = await prisma.potential.findFirst({ where: { id: recordId, companyId: req.user!.companyId } }).catch(() => null)
      if (potential) {
        const activities = await prisma.activity.findMany({ where: { companyId: req.user!.companyId, parentModule: 'potentials', parentId: recordId }, orderBy: { createdAt: 'desc' }, take: 5 })
        const daysSinceLastActivity = activities.length > 0 ? Math.floor((Date.now() - new Date(activities[0].createdAt).getTime()) / 86400000) : 999
        const daysInPipeline = potential.createdAt ? Math.floor((Date.now() - new Date(potential.createdAt).getTime()) / 86400000) : 0

        if (daysSinceLastActivity > 7) suggestions.push({ type: 'follow-up', priority: 'high', title: 'Schedule follow-up', description: `No activity for ${daysSinceLastActivity} days. Reach out to keep momentum.`, icon: 'calendar' })
        if (daysInPipeline > 30 && !['Closed Won', 'Closed Lost'].includes(potential.stage || '')) suggestions.push({ type: 'escalate', priority: 'medium', title: 'Review pipeline position', description: `Deal has been in pipeline for ${daysInPipeline} days. Consider adjusting strategy.`, icon: 'alert' })
        if (potential.amount && Number(potential.amount) > 50000) suggestions.push({ type: 'priority', priority: 'high', title: 'High-value deal', description: `This $${Number(potential.amount).toLocaleString()} deal warrants priority attention.`, icon: 'star' })
        if (potential.stage === 'Negotiation/Review') suggestions.push({ type: 'close', priority: 'high', title: 'Push for close', description: 'Opportunity is in negotiation. Prepare final proposal and set closing timeline.', icon: 'target' })
        if (potential.nextFollowUp && new Date(potential.nextFollowUp) < new Date()) suggestions.push({ type: 'overdue', priority: 'high', title: 'Overdue follow-up', description: `Follow-up was due on ${new Date(potential.nextFollowUp).toLocaleDateString()}.`, icon: 'alert' })
      }
    } else if (module === 'leads' && recordId) {
      const lead: any = await prisma.lead.findFirst({ where: { id: recordId, companyId: req.user!.companyId } }).catch(() => null)
      if (lead) {
        const daysSinceCreated = lead.createdAt ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000) : 0
        const activities = await prisma.activity.findMany({ where: { companyId: req.user!.companyId, parentModule: 'leads', parentId: recordId } })

        if (daysSinceCreated > 7 && activities.length === 0) suggestions.push({ type: 'stale', priority: 'high', title: 'Stale lead', description: `Lead created ${daysSinceCreated} days ago with no activity. Contact them or mark as unqualified.`, icon: 'clock' })
        if (lead.leadStatus === 'Contacted' && daysSinceCreated > 3) suggestions.push({ type: 'follow-up', priority: 'medium', title: 'Follow up on outreach', description: 'Lead has been contacted but no response yet. Send a follow-up.', icon: 'mail' })
        if (activities.length > 3) suggestions.push({ type: 'convert', priority: 'medium', title: 'Consider converting', description: `${activities.length} activities logged. This lead may be ready for conversion.`, icon: 'refresh' })
      }
    } else if (module === 'tickets' && recordId) {
      const ticket: any = await prisma.ticket.findFirst({ where: { id: recordId, companyId: req.user!.companyId } }).catch(() => null)
      if (ticket) {
        const hoursOpen = ticket.createdAt ? Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 3600000) : 0
        if (ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date()) suggestions.push({ type: 'sla-breach', priority: 'critical', title: 'SLA breach', description: `SLA deadline was ${new Date(ticket.slaDeadline).toLocaleString()}. Immediate action required.`, icon: 'alert' })
        if (ticket.status !== 'Closed' && ticket.priority === 'Urgent') suggestions.push({ type: 'escalate', priority: 'high', title: 'Urgent ticket pending', description: 'Urgent ticket needs immediate attention.', icon: 'alert' })
        if (hoursOpen > 48 && ticket.status !== 'Closed') suggestions.push({ type: 'follow-up', priority: 'medium', title: 'Aging ticket', description: `Ticket open for ${Math.floor(hoursOpen / 24)} days. Consider escalation or status update.`, icon: 'clock' })
      }
    }

    if (suggestions.length === 0) suggestions.push({ type: 'none', priority: 'low', title: 'All clear', description: 'No action needed at this time.', icon: 'check' })

    await logAi(req, req.body, { suggestions }, module, recordId)
    res.json({ data: { suggestions } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== 1g. AI GENERATE EMAIL =====

aiRouter.post('/generate-email', authMiddleware, async (req: any, res) => {
  try {
    const { potentialId, template } = req.body
    if (!potentialId) { res.status(400).json({ error: 'potentialId required' }); return }

    const companyId = req.user!.companyId
    const potential: any = await prisma.potential.findFirst({ where: { id: potentialId, companyId } }).catch(() => null)
    if (!potential) { res.status(404).json({ error: 'Opportunity not found' }); return }

    const contact = potential.contactId ? await prisma.contact.findFirst({ where: { id: potential.contactId, companyId } }).catch(() => null) : null
    const account = potential.accountId ? await prisma.account.findFirst({ where: { id: potential.accountId, companyId } }).catch(() => null) : null
    const activities = await prisma.activity.findMany({ where: { companyId, parentModule: 'potentials', parentId: potentialId }, orderBy: { createdAt: 'desc' }, take: 5 })

    const daysSinceLastActivity = activities.length > 0 ? Math.floor((Date.now() - new Date(activities[0].createdAt).getTime()) / 86400000) : null
    const email = composeSalesEmail({ potential, contact, account, activities, daysSinceLastActivity, template })

    await logAi(req, { potentialId, template }, email, 'potentials', potentialId)
    res.json({ data: email })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== AI INSIGHTS (for dashboard) =====

aiRouter.get('/insights', authMiddleware, async (req: any, res) => {
  try {
    const companyId = req.user?.companyId

    const [topOpportunities, atRiskLeads, recentTickets, openActivities] = await Promise.all([
      prisma.potential.findMany({
        where: { companyId, isActive: true, stage: { notIn: ['Closed Won', 'Closed Lost'] } },
        orderBy: { amount: 'desc' },
        take: 5,
      }).catch(() => []),
      prisma.lead.findMany({
        where: { companyId, isActive: true, isConverted: false },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }).catch(() => []),
      prisma.ticket.findMany({
        where: { companyId, isActive: true, status: { notIn: ['Closed'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }).catch(() => []),
      prisma.activity.findMany({
        where: { companyId, status: { notIn: ['Completed', 'Held'] } },
        orderBy: { dueAt: 'asc' },
        take: 5,
      }).catch(() => []),
    ])

    const staleLeads = atRiskLeads.filter(l => {
      const days = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 86400000)
      return days > 7
    }).slice(0, 5)

    const insights = {
      topOpportunities: topOpportunities.map(o => ({ id: o.id, name: o.potentialName, amount: o.amount, stage: o.stage })),
      staleLeads: staleLeads.map(l => ({ id: l.id, name: `${l.firstName} ${l.lastName}`, company: l.company, daysStale: Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 86400000) })),
      openTickets: recentTickets.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
      upcomingActions: openActivities.map(a => ({ subject: a.subject, dueAt: a.dueAt, type: a.activityType })),
      summary: {
        totalOpenOpps: topOpportunities.length,
        staleLeadCount: staleLeads.length,
        openTicketCount: recentTickets.length,
        overdueActions: openActivities.filter(a => a.dueAt && new Date(a.dueAt) < new Date()).length,
      },
    }

    res.json({ data: insights })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== CHAT (freeform queries) =====

aiRouter.post('/chat', authMiddleware, async (req: any, res) => {
  try {
    const { message } = req.body
    if (!message) { res.status(400).json({ error: 'message required' }); return }

    const lowerMsg = message.toLowerCase()
    let response = ''

    if (/today|to-?do|task|overdue|prioriti[sz]e my work/.test(lowerMsg)) {
      const now = new Date()
      const end = new Date(now); end.setHours(23, 59, 59, 999)
      const activities = await prisma.activity.findMany({
        where: { companyId: req.user?.companyId, isActive: true, status: { notIn: ['Completed', 'Cancelled'] }, dueAt: { lte: end } },
        orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }], take: 10,
      }).catch(() => [])
      const overdue = activities.filter((a: any) => a.dueAt && new Date(a.dueAt) < now)
      const lines = activities.slice(0, 6).map((a: any, i: number) => `${i + 1}. ${a.subject || 'Untitled task'}${a.dueAt ? ` — due ${new Date(a.dueAt).toLocaleDateString()}` : ''}${a.priority ? ` (${a.priority})` : ''}`)
      response = activities.length ? `You have ${activities.length} due or overdue activities, including ${overdue.length} overdue.\n\n${lines.join('\n')}\n\nStart with overdue and high-priority items, then update their status when completed.` : 'You have no due or overdue activities today. Your immediate task queue is clear.'
    } else if (/forecast|weighted|closing this month/.test(lowerMsg)) {
      const opportunities = await prisma.potential.findMany({ where: { companyId: req.user?.companyId, isActive: true, stage: { notIn: ['Closed Won', 'Closed Lost'] } }, orderBy: { closingDate: 'asc' }, take: 100 }).catch(() => [])
      const weighted = opportunities.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0) * (Number(item.probability) || 0) / 100, 0)
      response = `Your active forecast contains ${opportunities.length} opportunities with a probability-weighted value of $${Math.round(weighted).toLocaleString()}. Review deals with near closing dates and low probability first.`
    } else if (/inventory|stock|reorder|product/.test(lowerMsg)) {
      const products = await prisma.product.findMany({ where: { companyId: req.user?.companyId, isActive: true }, take: 500 }).catch(() => [])
      const lowStock = products.filter((p: any) => Number(p.reorderLevel) > 0 && Number(p.qtyInStock) <= Number(p.reorderLevel))
      response = `You have ${products.length} active products and ${lowStock.length} at or below their reorder level.${lowStock.length ? `\n\nPriority restock: ${lowStock.slice(0, 6).map((p: any) => `${p.productName} (${p.qtyInStock || 0} available)`).join(', ')}.` : ' Inventory levels currently look healthy.'}`
    } else if (/tag|segment|label/.test(lowerMsg)) {
      const tags = await prisma.tag.findMany({ where: { companyId: req.user?.companyId, recordId: { not: null }, OR: [{ isPrivate: false }, { userId: req.user?.userId }] }, take: 1000 }).catch(() => [])
      const usage = new Map<string, number>(); tags.forEach((tag: any) => usage.set(tag.name, (usage.get(tag.name) || 0) + 1))
      const top = [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
      response = top.length ? `Your most-used visible tags are:\n\n${top.map(([name, count], i) => `${i + 1}. ${name} — ${count} record${count === 1 ? '' : 's'}`).join('\n')}\n\nUse these tags to open focused record segments and identify follow-up groups.` : 'No visible record tags are in use yet. Create organisation tags from Tools → Tags, then attach them from record pages.'
    } else if (/lead|leads/.test(lowerMsg)) {
      const count = await prisma.lead.count({ where: { companyId: req.user?.companyId, isActive: true } }).catch(() => 0)
      const converted = await prisma.lead.count({ where: { companyId: req.user?.companyId, isActive: true, isConverted: true } }).catch(() => 0)
      response = `You have ${count} total leads, ${converted} of which have been converted. ${converted > 0 ? `That's a ${Math.round((converted / count) * 100)}% conversion rate.` : 'Consider qualifying and converting promising leads.'}`
    } else if (/opportunit|potential|deal|pipeline/.test(lowerMsg)) {
      const opps = await prisma.potential.findMany({ where: { companyId: req.user?.companyId, isActive: true, stage: { notIn: ['Closed Won', 'Closed Lost'] } } }).catch(() => [])
      const totalValue = opps.reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0)
      response = `You have ${opps.length} open opportunities worth $${totalValue.toLocaleString()} total. ${opps.length > 0 ? `The average deal size is $${Math.round(totalValue / opps.length).toLocaleString()}.` : 'Consider adding opportunities to your pipeline.'}`
    } else if (/ticket|support/.test(lowerMsg)) {
      const open = await prisma.ticket.count({ where: { companyId: req.user?.companyId, isActive: true, status: { notIn: ['Closed'] } } }).catch(() => 0)
      const urgent = await prisma.ticket.count({ where: { companyId: req.user?.companyId, isActive: true, status: { notIn: ['Closed'] }, priority: 'Urgent' } }).catch(() => 0)
      response = `You have ${open} open tickets${urgent > 0 ? `, ${urgent} of which are urgent` : ''}. ${urgent > 0 ? 'Urgent tickets should be addressed immediately.' : 'Your support queue looks manageable.'}`
    } else if (/contact|customer/.test(lowerMsg)) {
      const count = await prisma.contact.count({ where: { companyId: req.user?.companyId, isActive: true } }).catch(() => 0)
      response = `You have ${count} contacts in your CRM. ${count > 0 ? 'Keep your contact information up to date for better engagement.' : 'Start adding contacts to build your customer database.'}`
    } else if (/account|company/.test(lowerMsg)) {
      const count = await prisma.account.count({ where: { companyId: req.user?.companyId, isActive: true } }).catch(() => 0)
      response = `You have ${count} accounts. ${count > 0 ? 'Accounts help organize contacts and opportunities by organization.' : 'Create accounts to track your business relationships.'}`
    } else if (/revenue|sale|income|money/.test(lowerMsg)) {
      const won = await prisma.potential.findMany({ where: { companyId: req.user?.companyId, stage: 'Closed Won' } }).catch(() => [])
      const total = won.reduce((s: number, o: any) => s + (Number(o.amount) || 0), 0)
      response = `You have ${won.length} closed-won deals totaling $${total.toLocaleString()}. ${total > 0 ? 'Great job on closing these deals!' : 'Start closing deals to see revenue insights.'}`
    } else if (/hello|hi|hey|help/.test(lowerMsg)) {
      response = "Hello! I'm your BizForce AI Assistant. I can help you with:\n\n• **Lead insights** — Ask about your leads and conversion rates\n• **Pipeline analysis** — Get details on open opportunities and pipeline value\n• **Ticket status** — Check support ticket metrics\n• **Contact & account counts** — Quick CRM stats\n• **Revenue summaries** — See closed-won deal totals\n\nJust ask me anything about your CRM data!"
    } else {
      response = `I can help you with insights about your CRM data. Try asking about:\n\n• Your leads and conversion rates\n• Open opportunities and pipeline value\n• Support ticket status\n• Contact and account counts\n• Revenue and closed deals\n\nWhat would you like to know?`
    }

    const output = { response, model: 'bizforce-ai-template' }
    await logAi(req, { message }, output)
    res.json({ data: output })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ===== HELPER FUNCTIONS =====

function generateSmartResponse(prompt: string, context: any, module?: string): string {
  const lower = prompt.toLowerCase()
  if (/email|draft|compose/.test(lower)) {
    return `Here's a draft email based on your prompt:\n\nSubject: Following Up\n\nDear ${context?.contactName || 'Client'},\n\nThank you for taking the time to connect with us recently. I wanted to follow up on our previous conversation regarding ${context?.topic || 'your requirements'}.\n\nWe believe our solution would be an excellent fit for ${context?.company || 'your organization'}. I'd love to schedule a brief call to discuss the next steps.\n\nPlease let me know your availability, and I'll be happy to arrange a meeting.\n\nBest regards,\nBizForce CRM`
  }
  if (/summar|summary/.test(lower)) {
    return `Summary:\n\nBased on the ${module || 'CRM'} data provided, here are the key findings:\n\n1. The record shows consistent engagement patterns\n2. There are opportunities for follow-up and nurturing\n3. Related data suggests potential for conversion\n\nRecommendation: Maintain regular contact and provide value-added information to move the relationship forward.`
  }
  if (/suggest|recommend|action/.test(lower)) {
    return `AI Recommendations:\n\n1. **Immediate**: Schedule a follow-up call within 48 hours\n2. **Short-term**: Share relevant case studies or materials\n3. **Long-term**: Add to nurture campaign for ongoing engagement\n\nPriority: Medium | Confidence: High`
  }
  if (/score|rating|eval/.test(lower)) {
    return `Analysis Score: ${Math.floor(Math.random() * 30) + 65}/100\n\nThis record shows moderate engagement. Key factors:\n- Contact information is ${context?.hasEmail ? 'complete' : 'incomplete'}\n- Recent activity level: ${context?.activityLevel || 'Moderate'}\n- Pipeline position: ${context?.stage || 'Early stage'}\n\nRecommendation: Increase touchpoints to improve score.`
  }
  return `Based on the context provided for ${module || 'CRM'}:\n\nThe data shows standard patterns. Key observations:\n- Record is actively maintained\n- Related data is reasonably complete\n- Opportunities for optimization exist\n\nNext Steps: Review associated records and consider scheduling follow-up activities.`
}

function composeEmail(opts: { firstName: string; companyName: string; subject?: string; tone?: string; recentTopics: string[]; openTickets: number; contact: any }): string {
  const { firstName, companyName, tone, recentTopics, openTickets } = opts
  const greeting = tone === 'friendly' ? `Hi ${firstName}!` : tone === 'urgent' ? `Dear ${firstName},` : `Dear ${firstName},`
  const body: string[] = [greeting, '']

  if (tone === 'friendly') {
    body.push(`I hope you're doing well! I wanted to reach out${companyName ? ` regarding your work at ${companyName}` : ''}.`)
    if (recentTopics.length > 0) body.push(`\nI've been thinking about our recent discussions on ${recentTopics.join(', ')} and wanted to continue that conversation.`)
    body.push('\nDo you have some time this week for a quick catch-up? I have a few ideas I think you\'ll find interesting.')
  } else if (tone === 'urgent') {
    body.push(`I'm writing to bring to your attention a time-sensitive matter${companyName ? ` regarding ${companyName}` : ''}.`)
    if (openTickets > 0) body.push(`\nWe currently have ${openTickets} open support ticket${openTickets > 1 ? 's' : ''} that need your attention.`)
    body.push('\nPlease respond at your earliest convenience so we can resolve this promptly.')
  } else {
    body.push(`I hope this message finds you well. I'm reaching out${companyName ? ` on behalf of our team working with ${companyName}` : ''}.`)
    if (recentTopics.length > 0) body.push(`\nFollowing up on our recent discussions about ${recentTopics.join(', ')}, I wanted to share some updates and next steps.`)
    else body.push('\nI wanted to introduce some updates that may be relevant to your needs.')
    if (openTickets > 0) body.push(`\nAdditionally, please note there are ${openTickets} open support item${openTickets > 1 ? 's' : ''} in your account.`)
    body.push('\nI would be happy to schedule a call to discuss further. Please let me know your availability.')
  }

  body.push('', 'Best regards,', 'BizForce CRM Team')
  return body.join('\n')
}

function composeSalesEmail(opts: { potential: any; contact: any; account: any; activities: any[]; daysSinceLastActivity: number | null; template?: string }): string {
  const { potential, contact, account, activities, daysSinceLastActivity, template } = opts
  const contactName = contact ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'there' : 'there'
  const companyName = account?.accountName || potential?.companyName || ''
  const amount = potential?.amount ? `$${Number(potential.amount).toLocaleString()}` : ''
  const stage = potential?.stage || 'Prospecting'

  const lines: string[] = []
  lines.push(`Dear ${contactName},`)
  lines.push('')

  if (template === 'follow-up' || daysSinceLastActivity && daysSinceLastActivity > 7) {
    lines.push(`I hope you're doing well. I wanted to follow up on our opportunity "${potential?.potentialName || 'Deal'}" ${companyName ? `with ${companyName}` : ''}.`)
    if (daysSinceLastActivity && daysSinceLastActivity > 14) {
      lines.push(`It's been ${daysSinceLastActivity} days since our last interaction, and I want to make sure we're keeping momentum.`)
    }
    lines.push('\nHere\'s a quick summary of where we stand:')
    lines.push(`  - Current stage: ${stage}`)
    if (amount) lines.push(`  - Deal value: ${amount}`)
    lines.push(`  - Win probability: ${potential?.probability || 50}%`)
    lines.push('\nI\'d love to schedule some time to discuss next steps. Would you be available for a brief call this week?')
  } else if (template === 'proposal') {
    lines.push(`I'm excited to share our proposal for "${potential?.potentialName || 'your project'}".`)
    if (amount) lines.push(`\nThe proposed investment is ${amount}, and I believe this solution will deliver significant value to ${companyName || 'your organization'}.`)
    lines.push('\nI\'ve attached the detailed proposal for your review. Key highlights:')
    lines.push('  - Tailored solution designed around your specific needs')
    lines.push('  - Competitive pricing with flexible payment terms')
    lines.push('  - Dedicated support and implementation team')
    lines.push('\nPlease let me know if you have any questions or would like to schedule a walkthrough.')
  } else if (template === 'intro') {
    lines.push(`Thank you for your interest in our solutions${companyName ? `, ${companyName}` : ''}.`)
    lines.push(`I\'d like to introduce our team and how we can help achieve your goals.`)
    if (amount) lines.push(`\nBased on our initial discussions, we\'ve prepared a solution valued at ${amount} that addresses your key requirements.`)
    lines.push('\nWould you have 30 minutes this week for an introductory call? I\'d love to learn more about your priorities and share how we can add value.')
  } else {
    lines.push(`I wanted to reach out regarding our ongoing opportunity "${potential?.potentialName || 'Deal'}".`)
    if (activities.length > 0) {
      const last = activities[0]
      lines.push(`\nFollowing up on our recent ${last.activityType?.toLowerCase() || 'interaction'}, I wanted to check if you have any questions or need additional information.`)
    }
    if (amount) lines.push(`\nCurrent deal value: ${amount}`)
    lines.push(`Stage: ${stage}`)
    lines.push('\nPlease don\'t hesitate to reach out if there\'s anything I can help with.')
  }

  lines.push('', 'Best regards,', 'BizForce CRM Team')
  return lines.join('\n')
}

function extractAttendees(notes: string): string[] {
  const attendeePatterns = [
    /attendees?:?\s*(.+)/i,
    /present:?\s*(.+)/i,
    /participants?:?\s*(.+)/i,
    /with:?\s*(.+)/i,
  ]
  for (const pattern of attendeePatterns) {
    const match = notes.match(pattern)
    if (match) return match[1].split(/[,;]+/).map(n => n.trim()).filter(Boolean).slice(0, 10)
  }
  const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g
  const names: string[] = []
  let m
  while ((m = namePattern.exec(notes)) !== null) {
    if (!names.includes(m[1]) && names.length < 10) names.push(m[1])
  }
  return names
}

function generateNextSteps(sentences: string[]): string[] {
  const actionVerbs = ['schedule', 'send', 'review', 'follow', 'update', 'create', 'assign', 'complete', 'prepare', 'discuss']
  const steps: string[] = []
  for (const s of sentences) {
    const trimmed = s.trim()
    if (actionVerbs.some(v => trimmed.toLowerCase().startsWith(v)) && trimmed.length > 10 && trimmed.length < 200) {
      steps.push(trimmed)
      if (steps.length >= 5) break
    }
  }
  if (steps.length === 0) steps.push('Review meeting notes and distribute to attendees', 'Schedule follow-up meeting if needed', 'Send any requested materials')
  return steps
}

function detectSentiment(text: string): string {
  const positive = ['great', 'excellent', 'good', 'positive', 'agree', 'success', 'progress', 'opportunity', 'excited', 'happy', 'satisfied', 'delighted']
  const negative = ['problem', 'issue', 'concern', 'risk', 'delay', 'negative', 'frustrat', 'worried', 'urgent', 'critical', 'fail', 'disagree']
  const lower = text.toLowerCase()
  const posCount = positive.filter(w => lower.includes(w)).length
  const negCount = negative.filter(w => lower.includes(w)).length
  if (posCount > negCount + 1) return 'Positive'
  if (negCount > posCount + 1) return 'Negative'
  return 'Neutral'
}

function estimateDuration(text: string): string {
  const wordCount = text.split(/\s+/).length
  const minutes = Math.max(5, Math.round(wordCount / 130))
  if (minutes < 60) return `${minutes} minutes`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function extractTopics(texts: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    'Product Discussion': ['product', 'feature', 'demo', 'trial', 'pricing', 'quote'],
    'Support': ['issue', 'problem', 'bug', 'fix', 'ticket', 'support', 'error'],
    'Onboarding': ['onboard', 'setup', 'training', 'implementation', 'deploy'],
    'Billing': ['invoice', 'payment', 'billing', 'subscription', 'renewal'],
    'Partnership': ['partner', 'collaboration', 'integration', 'alliance'],
    'Strategy': ['strategy', 'plan', 'goal', 'objective', 'roadmap'],
  }
  const combined = texts.join(' ').toLowerCase()
  const topics: string[] = []
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => combined.includes(k))) topics.push(topic)
  }
  return topics.length > 0 ? topics.slice(0, 5) : ['General']
}

function analyzeSentiment(texts: string[]): string {
  const combined = texts.join(' ').toLowerCase()
  const positive = ['great', 'excellent', 'happy', 'satisfied', 'love', 'amazing', 'perfect', 'wonderful', 'appreciate']
  const negative = ['bad', 'terrible', 'angry', 'frustrated', 'hate', 'awful', 'horrible', 'disappointed', 'unacceptable']
  const posCount = positive.filter(w => combined.includes(w)).length
  const negCount = negative.filter(w => combined.includes(w)).length
  if (posCount > negCount) return 'Positive'
  if (negCount > posCount) return 'Negative'
  return 'Neutral'
}

function generateRecommendations(contact: any, activities: any[], tickets: any[]): string[] {
  const recs: string[] = []
  if (activities.length === 0) recs.push('No activities logged yet. Schedule an introductory call or meeting.')
  else if (activities.length < 3) recs.push('Increase engagement frequency with more touchpoints.')
  if (tickets.some(t => t.status !== 'Closed')) recs.push('Address open support tickets to improve satisfaction.')
  if (!contact.email) recs.push('Add email address for better communication.')
  if (!contact.phone && !contact.mobile) recs.push('Add phone number for direct outreach.')
  if (recs.length === 0) recs.push('Maintain current engagement level. Look for upsell opportunities.')
  return recs.slice(0, 5)
}

function computeLeadScore(lead: any, activities: any[], emails: any[]): any {
  let score = 0
  const factors: { name: string; points: number; max: number; reason: string }[] = []

  // Company size factor (0-15)
  const empScore = lead.noOfEmployees ? Math.min(15, Math.round((lead.noOfEmployees / 1000) * 15)) : 5
  factors.push({ name: 'Company Size', points: empScore, max: 15, reason: lead.noOfEmployees ? `${lead.noOfEmployees} employees` : 'Unknown company size' })
  score += empScore

  // Industry relevance (0-10)
  const highValueIndustries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Insurance']
  const indScore = highValueIndustries.includes(lead.industry) ? 10 : lead.industry ? 6 : 3
  factors.push({ name: 'Industry', points: indScore, max: 10, reason: lead.industry || 'No industry specified' })
  score += indScore

  // Lead source quality (0-15)
  const sourceScores: Record<string, number> = { 'Referral': 15, 'Existing Customer': 15, 'Website': 12, 'Campaign': 10, 'Trade Show': 10, 'Cold Call': 7, 'Direct Mail': 6, 'Other': 5 }
  const srcScore = sourceScores[lead.leadSource] || 5
  factors.push({ name: 'Lead Source', points: srcScore, max: 15, reason: lead.leadSource || 'Unknown source' })
  score += srcScore

  // Engagement level (0-25)
  const totalEngagements = activities.length + emails.length
  const engScore = Math.min(25, totalEngagements * 5)
  factors.push({ name: 'Engagement', points: engScore, max: 25, reason: `${totalEngagements} interactions (${activities.length} activities, ${emails.length} emails)` })
  score += engScore

  // Time in pipeline (0-15)
  const daysSinceCreated = lead.createdAt ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000) : 0
  const timeScore = daysSinceCreated < 7 ? 15 : daysSinceCreated < 30 ? 12 : daysSinceCreated < 60 ? 8 : daysSinceCreated < 90 ? 4 : 1
  factors.push({ name: 'Recency', points: timeScore, max: 15, reason: `Created ${daysSinceCreated} days ago` })
  score += timeScore

  // Status quality (0-10)
  const statusScores: Record<string, number> = { 'Qualified': 10, 'Pre Qualified': 9, 'Hot': 10, 'Warm': 8, 'Contacted': 6, 'New': 5, 'Not Contacted': 3, 'Cold': 2, 'Junk Lead': 0, 'Lost Lead': 0, 'Unqualified': 0 }
  const statusScore = statusScores[lead.leadStatus] ?? 5
  factors.push({ name: 'Lead Status', points: statusScore, max: 10, reason: lead.leadStatus || 'No status' })
  score += statusScore

  score = Math.min(100, Math.max(0, score))
  const color = score <= 30 ? 'red' : score <= 70 ? 'yellow' : 'green'
  const label = score <= 30 ? 'Low' : score <= 70 ? 'Medium' : 'High'

  return { score, color, label, factors }
}

function computeOpportunityPrediction(potential: any, activities: any[], stageHistory: any[], competitors: any[]): any {
  let probability = 0
  const factors: { name: string; impact: string; score: number }[] = []

  // Base stage probability
  const stageMap: Record<string, number> = {
    'Prospecting': 10, 'Qualification': 20, 'Needs Analysis': 30,
    'Value Proposition': 40, 'Id. Decision Makers': 50,
    'Perception Analysis': 55, 'Proposal/Price Quote': 65,
    'Negotiation/Review': 80, 'Closed Won': 100, 'Closed Lost': 0,
  }
  const stageBase = stageMap[potential.stage] ?? 25
  probability += stageBase
  factors.push({ name: 'Pipeline Stage', impact: potential.stage || 'Unknown', score: stageBase })

  // Days in current stage
  const lastStageChange = stageHistory.length > 0 ? stageHistory[stageHistory.length - 1] : null
  const daysInStage = lastStageChange ? Math.floor((Date.now() - new Date(lastStageChange.createdAt).getTime()) / 86400000) : 30
  const stageTimeScore = daysInStage < 7 ? 15 : daysInStage < 14 ? 10 : daysInStage < 30 ? 5 : -5
  probability += stageTimeScore
  factors.push({ name: 'Days in Stage', impact: `${daysInStage} days`, score: stageTimeScore })

  // Deal size
  const amount = Number(potential.amount) || 0
  const amountScore = amount > 100000 ? 10 : amount > 50000 ? 8 : amount > 10000 ? 5 : 2
  probability += amountScore
  factors.push({ name: 'Deal Size', impact: `$${amount.toLocaleString()}`, score: amountScore })

  // Activity level
  const recentActivities = activities.filter(a => {
    const d = new Date(a.createdAt).getTime()
    return Date.now() - d < 14 * 86400000
  }).length
  const activityScore = recentActivities >= 5 ? 15 : recentActivities >= 3 ? 10 : recentActivities >= 1 ? 5 : -5
  probability += activityScore
  factors.push({ name: 'Activity Level', impact: `${recentActivities} recent activities`, score: activityScore })

  // Competitor involvement
  const competitorPenalty = competitors.length > 0 ? -competitors.length * 5 : 5
  probability += competitorPenalty
  factors.push({ name: 'Competition', impact: `${competitors.length} competitor(s)`, score: competitorPenalty })

  probability = Math.min(95, Math.max(5, probability))

  const confidence = factors.length >= 4 ? (daysInStage < 30 && recentActivities > 0 ? 'High' : 'Medium') : 'Low'

  return { probability, confidence, factors, recommendation: probability >= 70 ? 'Strong close candidate' : probability >= 40 ? 'Needs nurturing' : 'At risk — consider strategy change' }
}
