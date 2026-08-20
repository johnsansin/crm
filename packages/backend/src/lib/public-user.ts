const PRIVATE_USER_FIELDS = new Set([
  'password',
  'twoFactorSecret',
  'resetToken',
  'resetTokenExpires',
  'failedLoginAttempts',
  'lockedUntil',
])

/** Build an API-safe user object without relying on callers to remember secrets. */
export function publicUser<T extends Record<string, any>>(user: T, extra: Record<string, any> = {}) {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(user)) {
    if (!PRIVATE_USER_FIELDS.has(key) && key !== 'profile') result[key] = value
  }
  return { ...result, ...extra }
}
