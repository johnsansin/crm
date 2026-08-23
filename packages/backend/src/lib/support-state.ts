export const supportTransitions = {
  AI_ACTIVE: ['WAITING_FOR_AGENT', 'CLOSED'],
  WAITING_FOR_AGENT: ['AGENT_ASSIGNED', 'CLOSED'],
  AGENT_ASSIGNED: ['AGENT_ACTIVE', 'WAITING_FOR_AGENT', 'CLOSED'],
  AGENT_ACTIVE: ['RESOLVED', 'WAITING_FOR_AGENT', 'CLOSED'],
  RESOLVED: ['WAITING_FOR_AGENT', 'CLOSED'],
  CLOSED: [],
} as const

export type SupportState = keyof typeof supportTransitions

export function canTransition(from: SupportState, to: SupportState) {
  return (supportTransitions[from] as readonly string[]).includes(to)
}

export function assertSupportTransition(from: SupportState, to: SupportState) {
  if (!canTransition(from, to)) throw new Error(`Invalid support transition: ${from} -> ${to}`)
}
