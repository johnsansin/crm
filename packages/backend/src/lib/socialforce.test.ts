import test from 'node:test'
import assert from 'node:assert/strict'
import { canReview, overallStatus, postSchema, retryDelay, tenantId, providers } from '../socialforce/domain'

test('tenant context is mandatory, including for users with no organization', () => {
  assert.throws(() => tenantId(undefined))
  assert.throws(() => tenantId({}))
  assert.throws(() => tenantId({ companyId: '' }))
  assert.equal(tenantId({ companyId: 'tenant-a' }), 'tenant-a')
})
test('client cannot forge tenant, publication state or duplicate variants', () => {
  const post = { title: 'Launch', content: 'Hello', variants: [], timezone: 'Asia/Karachi' }
  assert.equal(postSchema.safeParse(post).success, true)
  for (const override of [{ companyId: 'tenant-b' }, { status: 'PUBLISHED' }, { createdBy: 'admin' }, { timezone: 'invalid' }, { variants: [{ platform: 'x', content: 'a' }, { platform: 'x', content: 'b' }] }]) {
    assert.equal(postSchema.safeParse({ ...post, ...override }).success, false)
  }
})
test('human review requires an administrator distinct from the author', () => {
  assert.equal(canReview({ isAdmin: true }, 'author', 'author'), false)
  assert.equal(canReview({ isAdmin: false }, 'author', 'other'), false)
  assert.equal(canReview({ isAdmin: true }, 'author', 'reviewer'), true)
})
test('partial success is preserved and pending targets are not terminal', () => {
  assert.equal(overallStatus(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'FAILED']), 'PARTIALLY_PUBLISHED')
  assert.equal(overallStatus(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED']), 'PUBLISHED')
  assert.equal(overallStatus(['PUBLISHED', 'QUEUED']), 'PUBLISHING')
  assert.equal(overallStatus(['FAILED']), 'FAILED')
  assert.equal(overallStatus([]), 'DRAFT')
})
test('retry policy backs off transient failures without retrying permanent errors', () => {
  assert.equal(retryDelay('NETWORK', 0), 30000)
  assert.equal(retryDelay('NETWORK', 1), 60000)
  assert.equal(retryDelay('RATE_LIMIT', 2, 240000), 240000)
  assert.equal(retryDelay('NETWORK', 3), null)
  for (const kind of ['AUTHENTICATION', 'PERMISSION', 'INVALID_MEDIA', 'INVALID_CONTENT', 'UNKNOWN']) assert.equal(retryDelay(kind, 0), null)
})
test('unconfigured provider registry never advertises real publishing or connection', () => {
  assert.equal(providers.length, 8)
  assert.ok(providers.every(p => !p.canConnect && !p.canPublish && p.status === 'NOT_CONFIGURED'))
})
