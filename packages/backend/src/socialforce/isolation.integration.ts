import '../loadEnv'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { signingSecret } from '../lib/secrets'
import { socialForceRouter } from './routes'
import { socialRouter } from '../modules/social.routes'

async function main() {
  if (process.env.RUN_SOCIALFORCE_INTEGRATION !== '1') throw new Error('Set RUN_SOCIALFORCE_INTEGRATION=1 to authorize temporary database fixtures')
  const id = randomUUID(), companies: string[] = [], users: string[] = [], roles: string[] = []
  const app = express(); app.use(express.json()); app.use('/api/socialforce', socialForceRouter); app.use('/api/social', socialRouter)
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address() as { port: number }
  const secret = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')
  async function user(companyId: string | null, suffix: string, isAdmin: boolean, roleId?: string) {
    const u = await prisma.user.create({ data: { email: `sf-${id}-${suffix}@example.invalid`, userName: `sf-${id}-${suffix}`, firstName: 'SocialForce', lastName: 'Integration', password: '!no-login-test-fixture', companyId, isAdmin, roleId } })
    users.push(u.id)
    return jwt.sign({ userId: u.id, email: u.email, tokenVersion: 0 }, secret, { expiresIn: '5m' })
  }
  async function call(token: string | null, path: string, method = 'GET', data?: unknown) {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) })
    return { status: response.status, body: await response.json() as any }
  }
  try {
    for (const suffix of ['a', 'b']) { const c = await prisma.company.create({ data: { name: `SocialForce integration ${id}-${suffix}` } }); companies.push(c.id) }
    const adminA = await user(companies[0], 'a', true), adminB = await user(companies[1], 'b', true), reviewerA = await user(companies[0], 'reviewer', true), noTenant = await user(null, 'none', true)
    const role = await prisma.role.create({ data: { name: `SF Viewer ${id}`, companyId: companies[0], permissions: { create: { moduleName: 'social', view: true } } } }); roles.push(role.id)
    const viewer = await user(companies[0], 'viewer', false, role.id)
    assert.equal((await call(null, '/api/socialforce/workspace')).status, 401)
    assert.equal((await call(noTenant, '/api/socialforce/workspace')).status, 403)
    const draft = { title: 'Private A launch', content: 'Tenant A only', variants: [{ platform: 'linkedin', content: 'A business announcement' }], timezone: 'UTC', plannedAt: null }
    assert.equal((await call(viewer, '/api/socialforce/posts', 'POST', draft)).status, 403)
    assert.equal((await call(adminA, '/api/socialforce/posts', 'POST', { ...draft, companyId: companies[1] })).status, 400)
    assert.equal((await call(adminA, '/api/socialforce/posts', 'POST', { ...draft, status: 'PUBLISHED' })).status, 400)
    const created = await call(adminA, '/api/socialforce/posts', 'POST', draft)
    assert.equal(created.status, 201)
    const post = created.body.data
    assert.equal(post.companyId, companies[0])
    assert.equal((await call(adminB, '/api/socialforce/workspace')).body.data.posts.length, 0)
    assert.equal((await call(adminB, `/api/socialforce/posts/${post.id}`, 'PUT', { ...draft, version: 1 })).status, 409)
    assert.equal((await call(adminB, `/api/socialforce/posts/${post.id}`, 'DELETE')).status, 404)
    assert.equal((await call(adminB, `/api/socialforce/posts/${post.id}/submit`, 'POST', {})).status, 409)
    assert.equal((await call(adminB, `/api/socialforce/posts/${post.id}/review`, 'POST', { decision: 'APPROVED', note: '', version: 1 })).status, 404)
    assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}`, 'PUT', { ...draft, version: 1, title: 'Revised launch' })).status, 200)
    assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}`, 'PUT', { ...draft, version: 1 })).status, 409)
    assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}/submit`, 'POST', {})).status, 200)
    assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}/review`, 'POST', { decision: 'APPROVED', note: '', version: 3 })).status, 403)
    assert.equal((await call(reviewerA, `/api/socialforce/posts/${post.id}/review`, 'POST', { decision: 'APPROVED', note: 'Reviewed', version: 3 })).status, 200)
    assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}`, 'PUT', { ...draft, version: 4 })).body.data.status, 'DRAFT')
    for (const action of ['publish', 'schedule']) assert.equal((await call(adminA, `/api/socialforce/posts/${post.id}/${action}`, 'POST', {})).status, 503)
    const brand = { name: 'Private A', description: 'Private guidelines', audience: '', tone: '', language: 'English', timezone: 'UTC', website: '', hashtags: '', forbiddenWords: '', requireApproval: true }
    assert.equal((await call(adminA, '/api/socialforce/brand', 'PUT', brand)).status, 200)
    assert.equal((await call(adminB, '/api/socialforce/workspace')).body.data.brand, null)
    assert.equal((await call(viewer, '/api/socialforce/brand', 'PUT', brand)).status, 403)
    const profile = await prisma.socialMediaProfile.create({ data: { companyId: companies[0], platform: 'facebook', profileId: `test-${id}`, accessToken: 'test-never-expose', refreshToken: 'test-never-expose' } })
    const publicProfiles = await call(adminA, '/api/social/profiles')
    assert.equal(publicProfiles.status, 200)
    assert.equal(JSON.stringify(publicProfiles.body).includes('test-never-expose'), false)
    assert.equal((await call(adminB, '/api/social/profiles')).body.data.length, 0)
    assert.equal((await call(noTenant, '/api/social/profiles')).status, 403)
    assert.equal((await call(adminA, '/api/social/posts/fake/publish', 'POST', {})).status, 410)
    await prisma.socialMediaProfile.delete({ where: { id: profile.id } })
    assert.ok((await call(adminA, '/api/socialforce/workspace')).body.data.events.length >= 5)
    assert.equal((await call(adminB, '/api/socialforce/workspace')).body.data.events.length, 0)
    console.log('PASS: 30+ authenticated HTTP assertions: tenant isolation, RBAC, payload forgery, version conflicts, approvals, audit isolation, token redaction and disabled publishing.')
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()))
    await prisma.socialMediaProfile.deleteMany({ where: { companyId: { in: companies } } })
    await prisma.socialForcePost.deleteMany({ where: { companyId: { in: companies } } })
    await prisma.socialForceBrand.deleteMany({ where: { companyId: { in: companies } } })
    await prisma.socialForceEvent.deleteMany({ where: { companyId: { in: companies } } })
    await prisma.user.deleteMany({ where: { id: { in: users } } })
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: roles } } })
    await prisma.role.deleteMany({ where: { id: { in: roles } } })
    await prisma.company.deleteMany({ where: { id: { in: companies } } })
    await prisma.$disconnect()
  }
}
main().catch(err => { console.error(err instanceof Error ? err.message : 'Integration test failed'); process.exitCode = 1 })
