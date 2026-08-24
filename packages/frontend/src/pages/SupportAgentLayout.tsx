import { Outlet, useNavigate } from 'react-router-dom'
import { Headphones, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { useEffect } from 'react'

export function SupportAgentLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  useEffect(() => {
    api.heartbeat().catch(() => {})
    const timer = window.setInterval(() => api.heartbeat().catch(() => {}), 45_000)
    return () => window.clearInterval(timer)
  }, [])
  return <div className="flex h-screen min-h-[100dvh] min-w-0 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] shadow-sm dark:bg-slate-900 sm:gap-3 sm:px-6">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"><Headphones size={20}/></div>
      <div className="min-w-0 flex-1"><h1 className="text-sm font-bold">Support Workspace</h1><p className="truncate text-xs text-muted-foreground">Helping organisation administrators</p></div>
      <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><ShieldCheck size={14}/> Support Agent</div>
      <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:inline">{user?.email}</span>
      <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15}/><span className="hidden sm:inline">Logout</span></button>
    </header>
    <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"><Outlet/></main>
  </div>
}
