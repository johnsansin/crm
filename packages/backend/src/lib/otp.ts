import crypto from 'crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateSecret(length = 20): string {
  const bytes = crypto.randomBytes(length)
  let secret = ''
  for (const b of bytes) secret += BASE32[b & 31]
  return secret.replace(/=+$/, '')
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const c of clean) {
    const idx = BASE32.indexOf(c)
    if (idx >= 0) bits += idx.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

export function hotp(secret: string, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const key = base32Decode(secret)
  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return (code % 10 ** digits).toString().padStart(digits, '0')
}

export function totp(secret: string, window = 30, digits = 6): string {
  const counter = Math.floor(Date.now() / 1000 / window)
  return hotp(secret, counter, digits)
}

export function verifyTotp(secret: string, code: string, window = 30, skew = 1): boolean {
  if (!secret || !code) return false
  const normalized = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  const counter = Math.floor(Date.now() / 1000 / window)
  for (let i = -skew; i <= skew; i++) {
    if (hotp(secret, counter + i) === normalized) return true
  }
  return false
}

export function otpauthUri(secret: string, email: string, issuer = 'BizForce CRM'): string {
  const label = `${issuer}:${email}`
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
