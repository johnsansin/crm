import assert from 'node:assert/strict'
import test from 'node:test'
import { publicUser } from './public-user'

test('publicUser removes every authentication secret', () => {
  const result = publicUser({
    id: 'user-1',
    email: 'person@example.test',
    password: 'hash',
    twoFactorSecret: 'totp-secret',
    resetToken: 'reset-secret',
    resetTokenExpires: new Date(),
    failedLoginAttempts: 3,
    lockedUntil: new Date(),
    profile: { isSuperAdmin: true },
  }, { isSuperAdmin: true })

  assert.deepEqual(result, {
    id: 'user-1',
    email: 'person@example.test',
    isSuperAdmin: true,
  })
})

test('publicUser preserves ordinary API fields', () => {
  const company = { id: 'company-1', name: 'Example' }
  assert.deepEqual(publicUser({ id: 'user-1', firstName: 'A', company }), {
    id: 'user-1',
    firstName: 'A',
    company,
  })
})
