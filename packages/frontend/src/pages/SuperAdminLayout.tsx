import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { api } from '@/lib/api'
import { AppBreadcrumbs } from '@/components/layout/AppBreadcrumbs'
import { useSupportSocket } from '@/hooks/useSupportSocket'
import { Building2, LayoutDashboard, Users, History, Settings, LogOut, Sun, Moon, Menu, X, Shield, Bell, Search, Loader2, Mail, Phone, Globe, Headphones } from 'lucide-react'

const navItems = [
  { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
  { path: '/superadmin/users', label: 'Users', icon: Users },
  { path: '/superadmin/agents', label: 'Agents', icon: Headphones },
  { path: '/superadmin/support', label: 'Support Inbox', icon: Headphones },
  { path: '/superadmin/login-history', label: 'Login History', icon: History },
  { path: '/superadmin/settings', label: 'Settings', icon: Settings },
]

export function SuperAdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ companies: any[]; users: any[] }>({ companies: [], users: [] })
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadNotifications = () => api.getNotifications().then(response => setNotifications(response.data || [])).catch(() => {})

  useEffect(() => {
    loadNotifications()
    const timer = window.setInterval(loadNotifications, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useSupportSocket(null, event => {
    if (event.event === 'conversation.created' || event.event === 'conversation.status_changed') loadNotifications()
  })

  useEffect(() => {
    if (!user?.isSuperAdmin) navigate('/login')
  }, [user])

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ companies: [], users: [] })
      setSearching(false)
      setShowSearch(false)
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      setShowSearch(true)
      api.adminSearch(searchQuery).then(res => {
        setSearchResults(res.data || { companies: [], users: [] })
        setSearching(false)
      }).catch(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const handleLogout = () => { logout(); navigate('/login') }

  const hasResults = searchResults.companies.length > 0 || searchResults.users.length > 0
  const unreadNotifications = notifications.filter(item => !item.isRead)

  async function openNotification(item: any) {
    if (!item.isRead) await api.markNotificationRead(item.id).catch(() => {})
    setShowNotifications(false)
    setNotifications(rows => rows.map(row => row.id === item.id ? { ...row, isRead: true } : row))
    navigate(item.link || '/superadmin/support')
  }

  return (
    <div className="h-screen min-h-[100dvh] overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[min(92vw,20rem)] lg:w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
              <Shield size={18} className="relative text-white" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">SuperAdmin</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">Control Panel</p>
              </div>
            )}
          </div>
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false) }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path, item.exact)
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${active
                    ? 'bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className={active ? 'text-sky-600 dark:text-sky-400' : ''} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {(user.firstName?.[0] || 'S') + (user.lastName?.[0] || 'A')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`min-w-0 flex-1 h-screen min-h-[100dvh] flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-72'}`}>
        <header className="shrink-0 h-14 border-b bg-background/95 backdrop-blur flex items-center pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] md:px-6 gap-2 sm:gap-3 relative z-30">
          <button
            onClick={() => { setCollapsed(false); setMobileOpen(true) }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-foreground hover:bg-accent lg:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 shrink-0 mr-2">
            <Shield size={20} className="text-primary" />
            <span className="text-sm font-bold text-foreground hidden sm:inline">SuperAdmin</span>
          </div>

          <div className="min-w-0 flex-1 max-w-xl relative" ref={searchRef}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search organizations, users, emails..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => { if (searchQuery.length >= 2) setShowSearch(true) }}
              className="w-full h-9 pl-9 pr-10 rounded-full bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground rounded border border-border bg-background shadow-sm">
              Ctrl K
            </kbd>

            {showSearch && (searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin mr-2" /> Searching...
                  </div>
                ) : !hasResults ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
                ) : (
                  <>
                    {searchResults.companies.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                          <Building2 size={11} /> Organizations ({searchResults.companies.length})
                        </div>
                        {searchResults.companies.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { navigate('/superadmin/organizations'); setShowSearch(false); setSearchQuery('') }}
                            className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                                <Building2 size={14} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Mail size={10} />{c.email || 'No email'}
                                {c.phone && <><span className="mx-1">·</span><Phone size={10} />{c.phone}</>}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.isActive !== false ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {c.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{c._count?.users || 0} users</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.users.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                          <Users size={11} /> Users ({searchResults.users.length})
                        </div>
                        {searchResults.users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => { navigate('/superadmin/users'); setShowSearch(false); setSearchQuery('') }}
                            className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Mail size={10} />{u.email}
                                {u.company?.name && <><span className="mx-1">·</span>{u.company.name}</>}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              {u.isAdmin && <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Admin</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative">
              <button onClick={() => setShowNotifications(value => !value)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative" title="Notifications">
                <Bell size={17} />
                {unreadNotifications.length > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-background">{unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}</span>}
              </button>
              {showNotifications && <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b px-4 py-3"><div><p className="text-sm font-semibold">Notifications</p><p className="text-[11px] text-muted-foreground">{unreadNotifications.length} unread</p></div>{unreadNotifications.length > 0 && <button onClick={async () => { await api.markAllNotificationsRead().catch(() => {}); setNotifications(rows => rows.map(row => ({ ...row, isRead: true }))) }} className="text-xs font-semibold text-indigo-600">Mark all read</button>}</div>
                <div className="max-h-[420px] overflow-y-auto p-2">{notifications.length === 0 ? <div className="p-8 text-center"><Bell className="mx-auto mb-2 text-muted-foreground"/><p className="text-sm font-medium">No notifications</p></div> : notifications.map(item => <button key={item.id} onClick={() => openNotification(item)} className={`mb-1 w-full rounded-xl p-3 text-left transition hover:bg-muted ${!item.isRead ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : ''}`}><div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!item.isRead ? 'bg-indigo-500' : 'bg-slate-300'}`}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p></div></div></button>)}</div>
              </div>}
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {(user?.firstName?.[0] || 'S') + (user?.lastName?.[0] || 'A')}
              </div>
              <span className="hidden lg:inline text-xs font-medium text-slate-600 dark:text-slate-400 max-w-[100px] truncate">{user?.firstName} {user?.lastName}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 ml-1" title="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-100/80 dark:bg-slate-950/70 p-2.5 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <AppBreadcrumbs />
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
