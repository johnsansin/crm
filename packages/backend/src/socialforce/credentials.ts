import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export function credentialKey(): Buffer {
  const value = process.env.SOCIALFORCE_ENCRYPTION_KEY || ''
  const key = Buffer.from(value, 'base64')
  if (key.length !== 32 || key.toString('base64') !== value) throw new Error('SOCIALFORCE_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  return key
}
export function seal(value: unknown, companyId: string, purpose: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', credentialKey(), iv)
  cipher.setAAD(Buffer.from(`${companyId}:${purpose}`))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.')
}
export function unseal<T>(value: string, companyId: string, purpose: string): T {
  const [version, iv, tag, ciphertext, extra] = value.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext || extra) throw new Error('Invalid encrypted credential')
  const decipher = createDecipheriv('aes-256-gcm', credentialKey(), Buffer.from(iv, 'base64url'))
  decipher.setAAD(Buffer.from(`${companyId}:${purpose}`)); decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')) as T
}
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex')
export const randomToken = () => randomBytes(32).toString('base64url')
