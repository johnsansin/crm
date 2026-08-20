import { prisma } from './prisma'

export interface SmsConfig {
  provider: 'twilio'
  accountSid: string
  authToken: string
  fromNumber: string
}

const EMPTY_SMS: SmsConfig = { provider: 'twilio', accountSid: '', authToken: '', fromNumber: '' }

export async function getSmsConfig(companyId?: string | null): Promise<SmsConfig> {
  if (companyId) {
    const row = await prisma.orgSetting.findUnique({ where: { companyId_key: { companyId, key: 'sms' } } }).catch(() => null)
    if (row?.value && (row.value as any).accountSid) return { ...EMPTY_SMS, ...(row.value as any) }
  }
  const global = await prisma.globalSetting.findUnique({ where: { key: 'sms' } }).catch(() => null)
  return global?.value ? { ...EMPTY_SMS, ...(global.value as any) } : EMPTY_SMS
}

export function publicSmsConfig(config: SmsConfig) {
  return { provider: config.provider, accountSid: config.accountSid, fromNumber: config.fromNumber, configured: !!(config.accountSid && config.authToken && config.fromNumber), authToken: '' }
}

function validateConfig(config: SmsConfig) {
  if (!/^AC[a-fA-F0-9]{32}$/.test(config.accountSid)) throw new Error('A valid Twilio Account SID is required')
  if (!config.authToken) throw new Error('Twilio auth token is required')
  if (!/^\+[1-9]\d{7,14}$/.test(config.fromNumber)) throw new Error('Twilio sender must use E.164 format, for example +14155552671')
}

async function twilioRequest(config: SmsConfig, path: string, init?: RequestInit) {
  validateConfig(config)
  const authorization = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${authorization}`, ...(init?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  })
  const body: any = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `Twilio request failed (${response.status})`)
  return body
}

export async function verifySmsConfig(config: SmsConfig) {
  await twilioRequest(config, '.json')
  return true
}

export async function sendSms(companyId: string, toNumber: string, message: string, fromOverride?: string) {
  if (!/^\+[1-9]\d{7,14}$/.test(toNumber)) throw new Error('Recipient number must use E.164 format, for example +14155552671')
  const text = String(message || '').trim()
  if (!text || text.length > 1600) throw new Error('SMS message must be between 1 and 1600 characters')
  const config = await getSmsConfig(companyId)
  const from = fromOverride || config.fromNumber
  if (from !== config.fromNumber) throw new Error('Sender number must match the configured Twilio number')
  const params = new URLSearchParams({ To: toNumber, From: from, Body: text })
  const result = await twilioRequest(config, '/Messages.json', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
  return { providerId: result.sid as string, providerStatus: result.status as string }
}
