/** Production signing keys may not silently fall back to a public value. */
export function signingSecret(name: string, developmentFallback: string): string {
  const value = process.env[name]
  if (value && value.length >= 32) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set to a random value of at least 32 characters in production`)
  }
  return developmentFallback
}
