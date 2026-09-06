import { z } from 'zod'

export const platformIds = ['facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'threads', 'pinterest'] as const
export const providers = platformIds.map((id, i) => ({
  id, name: ['Facebook', 'Instagram', 'X', 'LinkedIn', 'YouTube', 'TikTok', 'Threads', 'Pinterest'][i],
  status: 'NOT_CONFIGURED' as const, canConnect: false, canPublish: false,
  reason: 'Official OAuth adapter, application credentials and provider approval are required.',
}))
export interface SocialProvider {
  id: typeof platformIds[number]
  connect(context: { companyId: string; userId: string; redirectUri: string }): Promise<{ authorizationUrl: string }>
  publish(input: { companyId: string; accountId: string; content: string; idempotencyKey: string }): Promise<{ externalId: string; url?: string }>
  capabilities(accountId: string): Promise<{ contentTypes: string[]; maxCharacters: number | null; analytics: string[] }>
}
export interface AIProvider {
  generate(input: { companyId: string; userId: string; instruction: string; brand: unknown; platforms: string[] }): Promise<{ content: string; variants: { platform: string; content: string }[]; inputTokens: number; outputTokens: number; model: string }>
}
export interface PublishingJob {
  id: string; companyId: string; postId: string; accountId: string; variantVersion: number
  idempotencyKey: string; attempt: number; availableAt: Date
}
export const timezoneSchema = z.string().max(100).refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true } catch { return false }
}, 'Choose a valid IANA time zone')
export const postSchema = z.object({
  title: z.string().trim().min(1).max(200), content: z.string().trim().min(1).max(20000),
  variants: z.array(z.object({ platform: z.enum(platformIds), content: z.string().max(20000) }).strict()).max(8)
    .refine(v => new Set(v.map(x => x.platform)).size === v.length, 'Use one variant per platform'),
  plannedAt: z.string().datetime({ offset: true }).nullable().default(null), timezone: timezoneSchema.default('UTC'),
}).strict()
export const brandSchema = z.object({
  name: z.string().trim().max(200), description: z.string().max(4000), audience: z.string().max(2000),
  tone: z.string().max(500), language: z.string().max(100), timezone: timezoneSchema,
  website: z.union([z.literal(''), z.string().url().max(500).refine(v => v.startsWith('https://'), 'Use an HTTPS website')]),
  hashtags: z.string().max(1000), forbiddenWords: z.string().max(2000), requireApproval: z.boolean(),
}).strict()
export function tenantId(user?: { companyId?: string }) {
  if (!user?.companyId) throw new Error('Organization context required')
  return user.companyId
}
export function canReview(user: { isAdmin: boolean; isSuperAdmin?: boolean }, author: string, reviewer: string) {
  return !!(user.isAdmin || user.isSuperAdmin) && author !== reviewer
}
export function overallStatus(states: string[]) {
  if (!states.length) return 'DRAFT'
  if (states.every(s => s === 'PUBLISHED')) return 'PUBLISHED'
  if (states.some(s => ['QUEUED', 'PUBLISHING', 'SCHEDULED'].includes(s))) return 'PUBLISHING'
  if (states.some(s => s === 'PUBLISHED')) return 'PARTIALLY_PUBLISHED'
  return 'FAILED'
}
export function retryDelay(kind: string, attempt: number, retryAfterMs = 0): number | null {
  if (!['RATE_LIMIT', 'NETWORK', 'PLATFORM'].includes(kind) || attempt >= 3) return null
  return Math.max(retryAfterMs, 30000 * 2 ** attempt)
}
