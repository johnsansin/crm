import type { Server } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { signingSecret } from './secrets'
import { publishSupportEvent, subscribeSupportEvents } from './support-events'

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')
const connections = new Set<{ socket: WebSocket; user: any; subscriptions: Set<string> }>()

export function activeSupportUserIds(conversationId: string) {
  return new Set([...connections]
    .filter(connection => connection.socket.readyState === WebSocket.OPEN && connection.subscriptions.has(conversationId))
    .map(connection => connection.user.id as string))
}

async function canSubscribe(user: any, conversationId: string) {
  const conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId } })
  if (!conversation) return false
  if (user.isSuperAdmin) return true
  if (user.isAgent) return conversation.assignedAgentId === user.id || (conversation.status === 'WAITING_FOR_AGENT' && !conversation.assignedAgentId)
  return user.isAdmin && !!user.companyId && conversation.companyId === user.companyId
}

export function setupSupportWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', async (request, socket, head) => {
    try {
      const url = new URL(request.url || '', 'http://localhost')
      if (url.pathname !== '/api/support/ws') return
      const token = url.searchParams.get('token') || ''
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tokenVersion?: number }
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { profile: true } })
      if (!user || !user.isActive || (decoded.tokenVersion ?? 0) !== user.tokenVersion) throw new Error('Unauthorized')
      ;(request as any).supportUser = { id: user.id, companyId: user.companyId, isAdmin: user.isAdmin, isAgent: user.isAgent, isSuperAdmin: !!user.profile?.isSuperAdmin }
      wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request))
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n')
      socket.destroy()
    }
  })

  wss.on('connection', (socket, request) => {
    const connection = { socket, user: (request as any).supportUser, subscriptions: new Set<string>() }
    connections.add(connection)
    socket.send(JSON.stringify({ event: 'connection.ready' }))
    socket.on('message', async raw => {
      try {
        const message = JSON.parse(String(raw))
        const conversationId = String(message.conversationId || '')
        if (!conversationId || !(await canSubscribe(connection.user, conversationId))) return
        if (message.event === 'conversation.subscribe') {
          connection.subscriptions.add(conversationId)
          socket.send(JSON.stringify({ event: 'conversation.subscribed', conversationId }))
        } else if (message.event === 'conversation.unsubscribe') {
          connection.subscriptions.delete(conversationId)
        } else if (message.event === 'agent.typing' || message.event === 'customer.typing') {
          publishSupportEvent({ event: message.event, conversationId, companyId: connection.user.companyId || '', userId: connection.user.id, payload: { typing: !!message.typing } })
        }
      } catch { /* malformed client events are ignored */ }
    })
    socket.on('close', () => connections.delete(connection))
    socket.on('error', () => connections.delete(connection))
  })

  subscribeSupportEvents(event => {
    const body = JSON.stringify({ event: event.event, conversationId: event.conversationId, payload: event.payload })
    for (const connection of connections) {
      if (connection.socket.readyState !== WebSocket.OPEN) continue
      const staffQueueEvent = (connection.user.isSuperAdmin || connection.user.isAgent) && ['conversation.created', 'conversation.assigned', 'conversation.status_changed', 'message.created'].includes(event.event)
      if (staffQueueEvent || connection.subscriptions.has(event.conversationId)) connection.socket.send(body)
    }
  })

  return wss
}
