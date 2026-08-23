import assert from 'node:assert/strict'
import test from 'node:test'
import { canTransition } from './support-state'

test('permits the required support lifecycle transitions', () => {
  assert.equal(canTransition('AI_ACTIVE', 'WAITING_FOR_AGENT'), true)
  assert.equal(canTransition('WAITING_FOR_AGENT', 'AGENT_ASSIGNED'), true)
  assert.equal(canTransition('AGENT_ASSIGNED', 'AGENT_ACTIVE'), true)
  assert.equal(canTransition('AGENT_ACTIVE', 'RESOLVED'), true)
  assert.equal(canTransition('RESOLVED', 'CLOSED'), true)
  assert.equal(canTransition('RESOLVED', 'WAITING_FOR_AGENT'), true)
})

test('prevents AI from resuming after human takeover', () => {
  assert.equal(canTransition('AGENT_ASSIGNED', 'AI_ACTIVE'), false)
  assert.equal(canTransition('AGENT_ACTIVE', 'AI_ACTIVE'), false)
  assert.equal(canTransition('WAITING_FOR_AGENT', 'AI_ACTIVE'), false)
})

test('keeps permanently closed conversations immutable', () => {
  assert.equal(canTransition('CLOSED', 'AI_ACTIVE'), false)
  assert.equal(canTransition('CLOSED', 'WAITING_FOR_AGENT'), false)
})
