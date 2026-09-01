import { prisma } from './prisma'

export type OrganizationResource = 'users' | 'contacts'

export async function getOrganizationUsage(companyId: string) {
  const [company, users, contacts] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.user.count({ where: { companyId, isActive: true } }),
    prisma.contact.count({ where: { companyId, isActive: true } }),
  ])
  if (!company) throw new Error('Organization not found')
  return { company, users, contacts }
}

export async function checkOrganizationLimit(companyId: string, resource: OrganizationResource, additional = 1) {
  const usage = await getOrganizationUsage(companyId)
  const used = resource === 'users' ? usage.users : usage.contacts
  const limit = resource === 'users' ? usage.company.userLimit : usage.company.contactLimit
  return { allowed: used + additional <= limit, used, limit, company: usage.company }
}

export function organizationAccessError(company: {
  subscriptionStatus: string
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
}) {
  const now = Date.now()
  if (company.subscriptionStatus === 'SUSPENDED') return 'Organization subscription is suspended. Contact your super admin.'
  if (company.subscriptionStatus === 'EXPIRED') return 'Organization subscription has expired. Contact your super admin.'
  if (company.subscriptionStatus === 'TRIAL' && company.trialEndsAt && company.trialEndsAt.getTime() < now) return 'Organization trial has expired. Contact your super admin.'
  if (company.subscriptionStatus === 'ACTIVE' && company.subscriptionEndsAt && company.subscriptionEndsAt.getTime() < now) return 'Organization subscription has expired. Contact your super admin.'
  return null
}
