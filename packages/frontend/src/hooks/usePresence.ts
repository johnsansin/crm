import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

const HEARTBEAT_MS = 30000
const POLL_MS = 15000

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const lastHeartbeat = useRef(0)

  useEffect(() => {
    let active = true
    const sendHeartbeat = async () => {
      const now = Date.now()
      if (now - lastHeartbeat.current < 20000) return
      lastHeartbeat.current = now
      try { await api.heartbeat() } catch {}
    }
    const poll = async () => {
      try {
        const res = await api.getPresenceUsers()
        if (!active) return
        const data = (res?.data || []).map((u: any) => ({
          ...u,
          online: !!u.online,
        }))
        setOnlineUsers(data)
      } catch {}
    }
    sendHeartbeat()
    poll()
    const hb = setInterval(sendHeartbeat, HEARTBEAT_MS)
    const pl = setInterval(poll, POLL_MS)
    const onFocus = () => { sendHeartbeat(); poll() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('visibilitychange', onFocus)
    return () => {
      active = false
      clearInterval(hb)
      clearInterval(pl)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  const onlineCount = onlineUsers.filter((u: any) => u.online).length
  return { onlineUsers, onlineCount }
}
