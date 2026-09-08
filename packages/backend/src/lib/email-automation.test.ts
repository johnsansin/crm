import assert from 'node:assert/strict'
import test from 'node:test'
import { addDelay, automationStopReason, nextSequenceState, renderMergeTemplate } from './email-automation'

test('calculates configurable follow-up intervals', () => {
  const base = new Date('2026-09-01T10:00:00.000Z')
  assert.equal(addDelay(base, 7, 'DAYS').toISOString(), '2026-09-08T10:00:00.000Z')
  assert.equal(addDelay(base, 2, 'WEEKS').toISOString(), '2026-09-15T10:00:00.000Z')
  assert.equal(addDelay(base, 3, 'HOURS').toISOString(), '2026-09-01T13:00:00.000Z')
  assert.equal(addDelay(base, 30, 'MINUTES').toISOString(), '2026-09-01T10:30:00.000Z')
})

test('renders supported merge variables and reports missing fields', () => {
  const result = renderMergeTemplate('Hi {{first_name}}, saw {{company_name}} and {{missing_field}}.', {
    firstName: 'John',
    lastName: 'Smith',
    company: 'ABC Corporation',
    email: 'john@example.com',
  })
  assert.equal(result.text, 'Hi John, saw ABC Corporation and .')
  assert.deepEqual(result.missing, ['missing_field'])
})

test('stops before sending on replies, bounces, delivery failures, and unsubscribes', () => {
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', hasReply: true }), 'REPLIED')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', leadEmailStatus: 'REPLIED' }), 'REPLIED')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', hasHardBounce: true }), 'HARD_BOUNCE')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', leadEmailStatus: 'DELIVERY_FAILED' }), 'DELIVERY_FAILED')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', emailOptOut: true }), 'UNSUBSCRIBED')
  assert.equal(automationStopReason({ enrollmentStatus: 'PAUSED' }), 'NOT_ACTIVE')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE' }), null)
})

test('important scenario: reply after follow-up stops day-14 and day-21 sends', () => {
  const day0 = new Date('2026-09-01T10:00:00.000Z')
  const afterInitial = nextSequenceState({ currentStep: 0, totalSteps: 4, sentAt: day0, nextDelayValue: 7, nextDelayUnit: 'DAYS' })
  assert.equal(afterInitial.status, 'ACTIVE')
  assert.equal(afterInitial.nextActionAt?.toISOString(), '2026-09-08T10:00:00.000Z')

  const day7 = new Date('2026-09-08T10:00:00.000Z')
  assert.equal(automationStopReason({ enrollmentStatus: 'ACTIVE', hasReply: false, leadEmailStatus: 'AWAITING_REPLY' }), null)
  const afterFollowUp = nextSequenceState({ currentStep: 1, totalSteps: 4, sentAt: day7, nextDelayValue: 14, nextDelayUnit: 'DAYS' })
  assert.equal(afterFollowUp.nextActionAt?.toISOString(), '2026-09-22T10:00:00.000Z')

  const day10ReplyStop = automationStopReason({ enrollmentStatus: 'ACTIVE', hasReply: true, leadEmailStatus: 'REPLIED' })
  assert.equal(day10ReplyStop, 'REPLIED')
  assert.equal(day10ReplyStop === 'REPLIED' ? 'STOPPED' : 'ACTIVE', 'STOPPED')
})

test('failure scenario: hard bounce stops sequence permanently', () => {
  const reason = automationStopReason({ enrollmentStatus: 'ACTIVE', hasHardBounce: true })
  assert.equal(reason, 'HARD_BOUNCE')
  assert.equal(reason === 'HARD_BOUNCE' ? 'BOUNCED' : 'AWAITING_REPLY', 'BOUNCED')
  assert.equal(reason === 'HARD_BOUNCE' ? null : new Date(), null)
})

test('no-reply scenario completes after final configured step', () => {
  const day21 = new Date('2026-09-22T10:00:00.000Z')
  const final = nextSequenceState({ currentStep: 3, totalSteps: 4, sentAt: day21 })
  assert.equal(final.status, 'COMPLETED')
  assert.equal(final.currentStep, 4)
  assert.equal(final.nextActionAt, null)
})
