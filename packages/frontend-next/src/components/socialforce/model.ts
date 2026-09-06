export const platforms = [
  { id: 'facebook', name: 'Facebook', mark: 'f', color: '#1877f2' },
  { id: 'instagram', name: 'Instagram', mark: '◎', color: '#c13584' },
  { id: 'linkedin', name: 'LinkedIn', mark: 'in', color: '#0a66c2' },
  { id: 'x', name: 'X', mark: '𝕏', color: '#18202d' },
  { id: 'youtube', name: 'YouTube', mark: '▶', color: '#e52828' },
  { id: 'tiktok', name: 'TikTok', mark: '♪', color: '#121923' },
  { id: 'threads', name: 'Threads', mark: '@', color: '#303743' },
  { id: 'pinterest', name: 'Pinterest', mark: 'P', color: '#bd081c' },
]
export type Variant = { platform: string; content: string }
export type Post = { id: string; title: string; content: string; variants: Variant[]; status: string; plannedAt: string | null; timezone: string; version: number; createdBy?: string; reviewNote?: string; updatedAt?: string }
export type Brand = { name: string; description: string; audience: string; tone: string; language: string; timezone: string; website: string; hashtags: string; forbiddenWords: string; requireApproval: boolean }
export const defaultBrand: Brand = { name: '', description: '', audience: '', tone: 'Professional, helpful, confident', language: 'English', timezone: 'UTC', website: '', hashtags: '', forbiddenWords: '', requireApproval: true }
export const sampleBrand: Brand = { ...defaultBrand, name: 'Acme Studio', description: 'A fictional CRM brand for this interactive demonstration.', audience: 'Small businesses and sales teams', timezone: 'Asia/Karachi', hashtags: '#CRM #SalesAutomation #BusinessGrowth' }
export const sampleContent = 'Your next customer deserves a timely follow-up.\n\nMeet a simpler way to keep every sales conversation moving. Our new CRM brings your contacts, reminders, and follow-ups together, so your team can focus on building relationships.\n\nReady to simplify your sales day? Explore what’s new.'
export function sampleVariants(): Variant[] {
  return [
    { platform: 'facebook', content: 'Big news for busy business owners! 🎉\n\nKeep your contacts, reminders, and sales follow-ups in one place with our new CRM. Less time juggling spreadsheets. More time connecting with customers.\n\nWhat would you do with an extra hour in your day?\n\n#CRM #SmallBusiness' },
    { platform: 'instagram', content: 'Less admin. More real connections. ✨\n\nYour contacts, reminders & follow-ups — finally working together. A fresh chapter for your sales team starts here.\n\nDiscover our CRM through the link in our bio.\n\n#CRM #SalesAutomation #SmallBusiness\n\n[Editorial note: add an approved image or video before publishing.]' },
    { platform: 'linkedin', content: 'Consistent follow-up builds stronger customer relationships.\n\nOur new CRM helps sales teams organize contacts, manage reminders, and keep conversations moving in one workspace.\n\nDesigned for small businesses ready to bring more structure to their sales process.\n\nHow does your team keep follow-ups on track?\n\n#CRM #SalesOperations' },
    { platform: 'x', content: 'Less time chasing reminders. More time building customer relationships.\n\nMeet our new CRM: contacts, follow-ups, and your sales day in one place.\n\n#CRM #Sales' },
  ]
}
export function demoPosts(): Post[] {
  const date = new Date(); date.setDate(date.getDate() + 2); date.setHours(10, 0, 0, 0)
  return [
    { id: 'sample-launch', title: 'A better way to follow up', content: sampleContent, variants: sampleVariants(), status: 'DRAFT', plannedAt: date.toISOString(), timezone: 'Asia/Karachi', version: 1, createdBy: 'demo-creator' },
    { id: 'sample-review', title: 'Five habits of an organized sales team', content: 'Start with one place for every customer conversation. Build a daily follow-up habit. Keep your next steps clear.', variants: [{ platform: 'linkedin', content: 'Great sales habits start with clarity.\n\n1. Centralize customer conversations.\n2. Set a clear next step.\n3. Follow up consistently.\n4. Review your pipeline.\n5. Share what works with your team.' }], status: 'PENDING_APPROVAL', plannedAt: null, timezone: 'UTC', version: 1, createdBy: 'demo-creator' },
  ]
}
export function postPayload(post: Post) {
  return { title: post.title, content: post.content, variants: post.variants, plannedAt: post.plannedAt, timezone: post.timezone }
}
