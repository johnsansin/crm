import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'

const HEARTBEAT_MS = 30000

export function usePresence() {
  const lastHeartbeat = useRef(0)

  useEffect(() => {
    const sendHeartbeat = async () => {
      const now = Date.now()
      if (now - lastHeartbeat.current < 20000) return
      lastHeartbeat.current = now
      try { await api.heartbeat() } catch {}
    }
    sendHeartbeat()
    const hb = setInterval(sendHeartbeat, HEARTBEAT_MS)
    const onFocus = () => sendHeartbeat()
    window.addEventListener('focus', onFocus)
    window.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(hb)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('visibilitychange', onFocus)
    }
  }, [])
}
