import test from 'node:test'
import assert from 'node:assert/strict'
import { menuPermissionModule, socialForceMenuOverrides, withSocialForceModule } from '../socialforce/module'

test('SocialForce is registered even when an older database has no social module', () => {
  const rows = withSocialForceModule([{ name: 'contacts' }])
  assert.deepEqual(rows.map(row => row.name), ['contacts', 'socialforce'])
  assert.equal(menuPermissionModule('socialforce'), 'socialforce')
  assert.equal(menuPermissionModule('contacts'), 'contacts')
})

test('legacy social registration is consolidated without enabling a disabled module', () => {
  const rows = withSocialForceModule([{ name: 'social-media', isActive: false }, { name: 'social', isActive: true }])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'socialforce')
  assert.equal(rows[0].isActive, false)
  assert.deepEqual(socialForceMenuOverrides({ social: { isActive: false } }).socialforce, { isActive: false })
  assert.deepEqual(socialForceMenuOverrides({ social: { isActive: false }, socialforce: { label: 'Our studio' } }).socialforce, { label: 'Our studio' })
})

import { canUseSocialForce, resolveSocialForcePermissions } from '../socialforce/module'

test('legacy social grants carry over only before explicit submenu configuration', () => {
  const legacy = { moduleName: 'social', view: true, create: true, edit: false }
  assert.equal(canUseSocialForce(resolveSocialForcePermissions([legacy]), 'create-post', 'create'), true)
  assert.equal(canUseSocialForce(resolveSocialForcePermissions([legacy]), 'content', 'edit'), false)
  const explicit = resolveSocialForcePermissions([legacy, { moduleName: 'socialforce', view: true, create: true }, { moduleName: 'socialforce.calendar', view: true }])
  assert.equal(canUseSocialForce(explicit, 'calendar'), true)
  assert.equal(canUseSocialForce(explicit, 'create-post', 'create'), false)
  assert.equal(canUseSocialForce(explicit, 'dashboard'), false)
})

test('submenu grants require module access and the corresponding module action', () => {
  const rows = [{ moduleName: 'socialforce', view: false, edit: true }, { moduleName: 'socialforce.content', view: true, edit: true }]
  assert.equal(canUseSocialForce(resolveSocialForcePermissions(rows), 'content', 'edit'), false)
  rows[0].view = true; rows[0].edit = false
  assert.equal(canUseSocialForce(resolveSocialForcePermissions(rows), 'content'), true)
  assert.equal(canUseSocialForce(resolveSocialForcePermissions(rows), 'content', 'edit'), false)
  assert.equal(canUseSocialForce(resolveSocialForcePermissions([], true), 'content', 'edit'), true)
})
