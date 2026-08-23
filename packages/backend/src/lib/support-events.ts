import { EventEmitter } from 'node:events'

export interface SupportEvent {
  event: string
  conversationId: string
  companyId: string
  userId?: string | null
  payload?: unknown
}

const bus = new EventEmitter()
bus.setMaxListeners(1000)

export function publishSupportEvent(event: SupportEvent) {
  bus.emit('support', event)
}

export function subscribeSupportEvents(listener: (event: SupportEvent) => void) {
  bus.on('support', listener)
  return () => bus.off('support', listener)
}
