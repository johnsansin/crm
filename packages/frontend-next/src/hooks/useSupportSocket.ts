import { useCallback, useEffect, useRef, useState } from 'react'

export function createSupportMessageId() {
  const randomUuid = globalThis.crypto?.randomUUID
  if (typeof randomUuid === 'function') return randomUuid.call(globalThis.crypto)
  const random = Math.random().toString(36).slice(2)
  return `support-${Date.now().toString(36)}-${random}`
}

export function useSupportSocket(conversationId: string | null, onEvent: (event: any) => void) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const typingTimerRef = useRef<number | undefined>(undefined)
  const typingSentRef = useRef(false)
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    let stopped = false
    let retry = 1000
    let socket: WebSocket | null = null
    let timer: number | undefined

    const connect = () => {
      if (stopped) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/api/support/ws?token=${encodeURIComponent(token)}`)
      socketRef.current = socket
      socket.onopen = () => { setConnected(true); retry = 1000; if (conversationId) socket?.send(JSON.stringify({ event: 'conversation.subscribe', conversationId })) }
      socket.onmessage = message => { try { callbackRef.current(JSON.parse(message.data)) } catch {} }
      socket.onclose = () => { setConnected(false); if (!stopped) { timer = window.setTimeout(connect, retry); retry = Math.min(15_000, retry * 2) } }
      socket.onerror = () => socket?.close()
    }
    connect()
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
      typingSentRef.current = false
      socket?.close()
    }
  }, [conversationId])

  const sendTyping = useCallback((typing: boolean, agent = false) => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
    const send = (value: boolean) => {
      if (!conversationId || socketRef.current?.readyState !== WebSocket.OPEN) return
      socketRef.current.send(JSON.stringify({ event: agent ? 'agent.typing' : 'customer.typing', conversationId, typing: value }))
    }
    if (!typing) {
      if (typingSentRef.current) send(false)
      typingSentRef.current = false
      return
    }
    // Send the leading edge once, then only renew the local trailing timer on
    // subsequent keystrokes. This avoids one WebSocket event per keypress.
    if (!typingSentRef.current) {
      send(true)
      typingSentRef.current = true
    }
    typingTimerRef.current = window.setTimeout(() => {
      if (typingSentRef.current) send(false)
      typingSentRef.current = false
    }, 1200)
  }, [conversationId])
  return { connected, sendTyping }
}
