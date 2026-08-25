'use client'

import { useNavigate } from '@/lib/navigation'
import { Bell, CheckCheck, Headphones, LogOut, ShieldCheck, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { useEffect, useState } from 'react'

export function SupportAgentLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  useEffect(() => {
    api.heartbeat().catch(() => {})
    const refresh = () => api.getNotifications().then(response => setNotifications(response.data || [])).catch(() => {})
    refresh()
    const heartbeatTimer = window.setInterval(() => api.heartbeat().catch(() => {}), 45_000)
    const notificationTimer = window.setInterval(refresh, 15_000)
    return () => { window.clearInterval(heartbeatTimer); window.clearInterval(notificationTimer) }
  }, [])
  const unread = notifications.filter(item => !item.isRead).length
  const openNotification = async (notification: any) => {
    if (!notification.isRead) await api.markNotificationRead(notification.id).catch(() => {})
    setNotificationsOpen(false)
    navigate((notification.link || '/support-agent').replace('/superadmin/support', '/support-agent'))
  }
  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {})
    setNotifications(items => items.map(item => ({ ...item, isRead: true })))
  }
  return <div className="flex h-screen min-h-[100dvh] min-w-0 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] shadow-sm dark:bg-slate-900 sm:gap-3 sm:px-6">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"><Headphones size={20}/></div>
      <div className="min-w-0 flex-1"><h1 className="text-sm font-bold">Support Workspace</h1><p className="truncate text-xs text-muted-foreground">Helping organisation administrators</p></div>
      <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><ShieldCheck size={14}/> Support Agent</div>
      <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:inline">{user?.email}</span>
      <button onClick={() => setNotificationsOpen(true)} aria-label="Notifications" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-background text-muted-foreground">
        <Bell size={17}/>{unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15}/><span className="hidden sm:inline">Logout</span></button>
    </header>
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
    {notificationsOpen && <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/45" onMouseDown={event => { if (event.target === event.currentTarget) setNotificationsOpen(false) }}>
      <section role="dialog" aria-modal="true" aria-label="Notifications" className="flex h-full w-full max-w-sm flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"><div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">{unread} unread</p></div><div className="flex gap-2">{unread > 0 && <button onClick={markAllRead} className="flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs"><CheckCheck size={14}/> Read all</button>}<button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="grid h-9 w-9 place-items-center rounded-lg border"><X size={16}/></button></div></header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">{notifications.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No notifications</p> : notifications.map(notification => <button key={notification.id} onClick={() => openNotification(notification)} className={`block w-full border-b px-4 py-3 text-left hover:bg-muted ${notification.isRead ? 'opacity-60' : 'bg-blue-50/60 dark:bg-blue-950/20'}`}><p className="text-sm font-semibold">{notification.title}</p><p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{notification.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p></button>)}</div>
      </section>
    </div>}
  </div>
}
