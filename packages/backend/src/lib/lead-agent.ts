import { prisma } from './prisma'
import { getOrgSetting, setOrgSetting } from './settings'
import { createHash, randomUUID } from 'crypto'
import { nextSequenceNumber } from './settings'

export type LeadAgentConfig = {
  enabled: boolean
  mode: 'review' | 'automatic'
  highThreshold: number
  lowThreshold: number
  highStatus: string
  mediumStatus: string
  lowStatus: string
  highRating: string
  mediumRating: string
  lowRating: string
  assignHighScoreTo: string | null
}

export const defaultLeadAgentConfig: LeadAgentConfig = {
  enabled: false, mode: 'review', highThreshold: 75, lowThreshold: 40,
  highStatus: 'Qualified', mediumStatus: 'Contacted', lowStatus: 'Not Contacted',
  highRating: 'Hot', mediumRating: 'Warm', lowRating: 'Cold', assignHighScoreTo: null,
}

export async function getLeadAgentConfig(companyId: string): Promise<LeadAgentConfig> {
  const saved = await getOrgSetting(companyId, 'leadAgent', {})
  return { ...defaultLeadAgentConfig, ...(saved || {}) }
}

export async function saveLeadAgentConfig(companyId: string, input: Partial<LeadAgentConfig>) {
  const current = await getLeadAgentConfig(companyId)
  const next: LeadAgentConfig = {
    ...current, ...input,
    enabled: Boolean(input.enabled ?? current.enabled),
    mode: input.mode === 'automatic' ? 'automatic' : 'review',
    highThreshold: Math.min(100, Math.max(1, Number(input.highThreshold ?? current.highThreshold))),
    lowThreshold: Math.min(99, Math.max(0, Number(input.lowThreshold ?? current.lowThreshold))),
    assignHighScoreTo: input.assignHighScoreTo || null,
  }
  if (next.lowThreshold >= next.highThreshold) throw new Error('Low threshold must be below the high threshold')
  await setOrgSetting(companyId, 'leadAgent', next)
  return next
}

function scoreLead(lead: any, activityCount: number, emailCount: number) {
  let score = 0
  score += lead.noOfEmployees ? Math.min(15, Math.round((lead.noOfEmployees / 1000) * 15)) : 5
  score += ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Insurance'].includes(lead.industry) ? 10 : lead.industry ? 6 : 3
  score += ({ Referral: 15, 'Existing Customer': 15, Website: 12, Campaign: 10, 'Trade Show': 10, 'Cold Call': 7, 'Direct Mail': 6, Other: 5 } as Record<string, number>)[lead.leadSource] || 5
  score += Math.min(25, (activityCount + emailCount) * 5)
  const age = lead.createdAt ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000) : 0
  score += age < 7 ? 15 : age < 30 ? 12 : age < 60 ? 8 : age < 90 ? 4 : 1
  score += ({ Qualified: 10, 'Pre Qualified': 9, Hot: 10, Warm: 8, Contacted: 6, New: 5, 'Not Contacted': 3, Cold: 2, 'Junk Lead': 0, 'Lost Lead': 0, Unqualified: 0 } as Record<string, number>)[lead.leadStatus] ?? 5
  return Math.min(100, Math.max(0, score))
}

export async function runLeadAgent(companyId: string, actorUserId?: string, leadIds?: string[]) {
  const config = await getLeadAgentConfig(companyId)
  if (!config.enabled) return { config, decisions: [], applied: 0, message: 'Lead agent is disabled' }
  const leads = await prisma.lead.findMany({ where: { companyId, isActive: true, isConverted: false, ...(leadIds?.length ? { id: { in: leadIds } } : {}) }, take: leadIds?.length ? undefined : 500 })
  const decisions: any[] = []
  let applied = 0
  for (const lead of leads) {
    const [activityCount, emailCount] = await Promise.all([
      prisma.activity.count({ where: { companyId, parentModule: 'leads', parentId: lead.id } }),
      prisma.email.count({ where: { companyId, parentModule: 'leads', parentId: lead.id } }),
    ])
    const score = scoreLead(lead, activityCount, emailCount)
    const band = score >= config.highThreshold ? 'high' : score < config.lowThreshold ? 'low' : 'medium'
    const patch: any = band === 'high'
      ? { leadStatus: config.highStatus, rating: config.highRating, ...(config.assignHighScoreTo ? { assignedTo: config.assignHighScoreTo } : {}) }
      : band === 'low' ? { leadStatus: config.lowStatus, rating: config.lowRating } : { leadStatus: config.mediumStatus, rating: config.mediumRating }
    const changed = Object.entries(patch).some(([key, value]) => (lead as any)[key] !== value)
    if (config.mode === 'automatic' && changed) {
      await prisma.lead.update({ where: { id: lead.id }, data: patch })
      applied++
    }
    const decision = { leadId: lead.id, lead: `${lead.firstName} ${lead.lastName}`.trim(), company: lead.company, score, band, recommendation: patch, changed, applied: config.mode === 'automatic' && changed }
    decisions.push(decision)
    await prisma.aiLog.create({ data: { input: JSON.stringify({ leadId: lead.id, config }), output: JSON.stringify(decision), model: 'bizforce-lead-agent', tokens: 0, duration: 0, companyId, userId: actorUserId || null, moduleName: 'leads', recordId: lead.id } }).catch(() => {})
  }
  return { config, decisions, applied }
}

export type LeadCandidateInput = {
  source?: string; sourceReference?: string; consentBasis?: string
  firstName?: string; lastName: string; company: string; email?: string; phone?: string
  website?: string; title?: string; industry?: string; country?: string; employeeCount?: number
}

function clean(value: unknown) { return typeof value === 'string' ? value.trim() : '' }

function candidateScore(input: LeadCandidateInput) {
  let score = 20
  const reasons: string[] = ['Company and contact name supplied (+20)']
  if (input.email) { score += 20; reasons.push('Work email supplied (+20)') }
  if (input.phone) { score += 10; reasons.push('Phone supplied (+10)') }
  if (input.website) { score += 10; reasons.push('Company website supplied (+10)') }
  if (input.title) { score += 10; reasons.push('Job title supplied (+10)') }
  if (input.industry) { score += 10; reasons.push('Industry identified (+10)') }
  if (input.employeeCount && input.employeeCount >= 10) { score += 10; reasons.push('Established company size (+10)') }
  if (input.consentBasis) { score += 10; reasons.push('Acquisition basis recorded (+10)') }
  score = Math.min(100, score)
  return { score, band: score >= 75 ? 'high' : score < 40 ? 'low' : 'medium', reasons }
}

async function promoteCandidate(candidateId: string, companyId: string, reviewerId: string) {
  const [candidate] = await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "id" = ${candidateId} AND "companyId" = ${companyId} LIMIT 1`
  if (!candidate) throw new Error('Candidate not found')
  if (candidate.createdLeadId) return candidate
  if (candidate.status === 'REJECTED' || candidate.status === 'DUPLICATE') throw new Error(`Cannot approve a ${candidate.status.toLowerCase()} candidate`)
  const duplicate = await prisma.lead.findFirst({ where: { companyId, isActive: true, OR: [
    ...(candidate.email ? [{ email: { equals: candidate.email, mode: 'insensitive' as const } }] : []),
    ...(candidate.phone ? [{ phone: candidate.phone }, { mobile: candidate.phone }] : []),
  ] } })
  if (duplicate) {
    await prisma.$executeRaw`UPDATE "LeadCandidate" SET "status" = 'DUPLICATE', "duplicateLeadId" = ${duplicate.id}, "reviewedBy" = ${reviewerId}, "reviewedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${candidate.id}`
    return (await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "id" = ${candidate.id}`)[0]
  }
  const sequenceLeadNo = await nextSequenceNumber('Lead', companyId)
  let leadNo = sequenceLeadNo
  if (await prisma.lead.findUnique({ where: { leadNo }, select: { id: true } })) {
    leadNo = `${sequenceLeadNo}-${companyId.slice(0, 6).toUpperCase()}`
  }
  if (await prisma.lead.findUnique({ where: { leadNo }, select: { id: true } })) {
    leadNo = `${sequenceLeadNo}-${randomUUID().slice(0, 6).toUpperCase()}`
  }
  const lead = await prisma.lead.create({ data: {
    leadNo, firstName: candidate.firstName, lastName: candidate.lastName,
    company: candidate.company, email: candidate.email, phone: candidate.phone, website: candidate.website,
    title: candidate.title, industry: candidate.industry, country: candidate.country, noOfEmployees: candidate.employeeCount,
    leadSource: candidate.source, leadStatus: candidate.band === 'high' ? 'Qualified' : 'Not Contacted',
    rating: candidate.band === 'high' ? 'Hot' : candidate.band === 'medium' ? 'Warm' : 'Cold', leadScore: candidate.score,
    description: [
      'Created by Lead Intake Agent',
      '',
      `Contact: ${[candidate.firstName, candidate.lastName].filter(Boolean).join(' ')}`,
      `Company: ${candidate.company}`,
      `Job title: ${candidate.title || 'Not provided'}`,
      `Email: ${candidate.email || 'Not provided'}`,
      `Phone: ${candidate.phone || 'Not provided'}`,
      `Website: ${candidate.website || 'Not provided'}`,
      `Industry: ${candidate.industry || 'Not provided'}`,
      `Employees: ${candidate.employeeCount ?? 'Not provided'}`,
      `Country: ${candidate.country || 'Not provided'}`,
      '',
      `Source: ${candidate.source}`,
      `Source reference: ${candidate.sourceReference || 'Not provided'}`,
      `Consent / legal basis: ${candidate.consentBasis || 'Not recorded'}`,
      `Qualification: ${candidate.score}/100 (${candidate.band})`,
      '',
      'Score rationale:',
      ...JSON.parse(candidate.reasons).map((reason: string) => `• ${reason}`),
    ].join('\n'),
    companyId, createdBy: reviewerId,
  } })
  await prisma.$executeRaw`UPDATE "LeadCandidate" SET "status" = 'APPROVED', "createdLeadId" = ${lead.id}, "reviewedBy" = ${reviewerId}, "reviewedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${candidate.id}`
  return (await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "id" = ${candidate.id}`)[0]
}

export async function ingestLeadCandidate(companyId: string, actorUserId: string, raw: LeadCandidateInput) {
  const input: LeadCandidateInput = {
    source: clean(raw.source) || 'Agent intake', sourceReference: clean(raw.sourceReference) || undefined,
    consentBasis: clean(raw.consentBasis) || undefined, firstName: clean(raw.firstName), lastName: clean(raw.lastName),
    company: clean(raw.company), email: clean(raw.email).toLowerCase() || undefined, phone: clean(raw.phone) || undefined,
    website: clean(raw.website) || undefined, title: clean(raw.title) || undefined, industry: clean(raw.industry) || undefined,
    country: clean(raw.country) || undefined, employeeCount: raw.employeeCount ? Math.max(0, Number(raw.employeeCount)) : undefined,
  }
  if (!input.lastName || !input.company || (!input.email && !input.phone)) throw new Error('Last name, company, and an email or phone are required')
  const key = input.email || input.phone || `${input.company}|${input.lastName}`
  const fingerprint = createHash('sha256').update(key.toLowerCase()).digest('hex')
  const [previous] = await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "companyId" = ${companyId} AND "fingerprint" = ${fingerprint} LIMIT 1`
  if (previous) return { candidate: previous, created: false, automaticallyApproved: false }
  const duplicate = await prisma.lead.findFirst({ where: { companyId, isActive: true, OR: [
    ...(input.email ? [{ email: { equals: input.email, mode: 'insensitive' as const } }] : []),
    ...(input.phone ? [{ phone: input.phone }, { mobile: input.phone }] : []),
  ] }, select: { id: true } })
  const result = candidateScore(input)
  const id = randomUUID()
  const status = duplicate ? 'DUPLICATE' : 'PENDING'
  const reasons = JSON.stringify(result.reasons)
  const rawPayload = JSON.stringify(raw)
  const rows = await prisma.$queryRaw<any[]>`INSERT INTO "LeadCandidate" ("id", "source", "sourceReference", "consentBasis", "fingerprint", "status", "firstName", "lastName", "company", "email", "phone", "website", "title", "industry", "country", "employeeCount", "score", "band", "reasons", "rawPayload", "duplicateLeadId", "companyId", "createdBy", "createdAt", "updatedAt") VALUES (${id}, ${input.source!}, ${input.sourceReference || null}, ${input.consentBasis || null}, ${fingerprint}, ${status}, ${input.firstName || ''}, ${input.lastName}, ${input.company}, ${input.email || null}, ${input.phone || null}, ${input.website || null}, ${input.title || null}, ${input.industry || null}, ${input.country || null}, ${input.employeeCount || null}, ${result.score}, ${result.band}, ${reasons}, ${rawPayload}, ${duplicate?.id || null}, ${companyId}, ${actorUserId}, NOW(), NOW()) ON CONFLICT ("companyId", "fingerprint") DO NOTHING RETURNING *`
  let candidate = rows[0]
  if (!candidate) {
    candidate = (await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "companyId" = ${companyId} AND "fingerprint" = ${fingerprint} LIMIT 1`)[0]
    return { candidate, created: false, automaticallyApproved: false }
  }
  const config = await getLeadAgentConfig(companyId)
  const automaticallyApproved = !duplicate && config.enabled && config.mode === 'automatic' && result.score >= config.lowThreshold
  if (automaticallyApproved) candidate = await promoteCandidate(candidate.id, companyId, actorUserId)
  return { candidate, created: true, automaticallyApproved }
}

export async function reviewLeadCandidate(companyId: string, actorUserId: string, id: string, action: 'approve' | 'reject') {
  if (action === 'approve') return promoteCandidate(id, companyId, actorUserId)
  const [candidate] = await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "id" = ${id} AND "companyId" = ${companyId} LIMIT 1`
  if (!candidate) throw new Error('Candidate not found')
  if (candidate.createdLeadId) throw new Error('An approved candidate cannot be rejected')
  await prisma.$executeRaw`UPDATE "LeadCandidate" SET "status" = 'REJECTED', "reviewedBy" = ${actorUserId}, "reviewedAt" = NOW(), "updatedAt" = NOW() WHERE "id" = ${id}`
  return (await prisma.$queryRaw<any[]>`SELECT * FROM "LeadCandidate" WHERE "id" = ${id}`)[0]
}
