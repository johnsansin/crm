import { prisma } from './prisma'
import { getOrgSetting, setOrgSetting } from './settings'

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
