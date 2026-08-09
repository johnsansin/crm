import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'
import { usePresence } from '@/hooks/usePresence'
import { UserAvatar } from '@/components/UserAvatar'
import { LogOut, User, Search, Sun, Moon, Loader2, Menu, Bell, Building2, Megaphone, CheckCheck, X } from 'lucide-react'
import { api } from '@/lib/api'
import { setOrgSettings, orgLocale, formatDateTime, useOrgSettings } from '@/lib/org-format'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

const searchModules = ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'tickets', 'projects']

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  useOrgSettings()
  const { onlineUsers, onlineCount } = usePresence()
  const meOnline = onlineUsers.some((u: any) => u.id === user?.id && u.online)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications().catch(() => ({ data: [] })),
    refetchInterval: 30000,
  })

  const { data: orgSettingsData } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings().catch(() => ({})),
  })

  useEffect(() => {
    if (!orgSettingsData) return
    setOrgSettings({
      language: orgSettingsData.language || 'en_us',
      timezone: orgSettingsData.timezone || 'Asia/Karachi',
      dateFormat: orgSettingsData.dateFormat || 'mm-dd-yyyy',
      calendar: orgSettingsData.calendar || {},
    })
    const lang = orgSettingsData.language || 'en_us'
    document.documentElement.lang = orgLocale()
    document.documentElement.dir = ['ar', 'he', 'fa'].includes(lang) ? 'rtl' : 'ltr'
  }, [orgSettingsData])

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: () => api.getActiveAnnouncements().catch(() => ({ data: [] })),
  })

  const notifications = notificationsData?.data || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length
  const activeAnnouncements = (announcementsData?.data || []).filter((a: any) => !dismissedAnnouncements.includes(a.id))

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {}
  }

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {}
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const token = localStorage.getItem('token')
        const results = await Promise.allSettled(
          searchModules.map(async (mod) => {
            const res = await fetch(`/api/${mod}?search=${encodeURIComponent(searchQuery)}&limit=3`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) return { module: mod, data: [] }
            const json = await res.json()
            return { module: mod, data: json.data || [] }
          })
        )
        const flat = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => (r as PromiseFulfilledResult<any>).value)
          .filter((r: any) => r.data?.length > 0)
        setSearchResults(flat)
      } catch { }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={cn('transition-all duration-300', 'ml-0 md:ml-64', sidebarCollapsed && 'md:ml-16')}>
        {activeAnnouncements.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-4 md:px-6 py-2 bg-primary text-primary-foreground text-sm">
            <Megaphone size={15} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}</span>
              {a.message && <span className="opacity-90 ml-2">{a.message}</span>}
            </div>
            <button onClick={() => setDismissedAnnouncements(prev => [...prev, a.id])} className="p-1 rounded hover:bg-primary-foreground/20" title={t('Dismiss')}>
              <X size={15} />
            </button>
          </div>
        ))}
        <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 md:px-6 gap-2 md:gap-4">
          <button
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 shrink-0 mr-3">
            {user?.company?.logo ? (
              <img src={user.company.logo} alt={user.company.name} className="h-7 w-7 rounded object-cover" />
            ) : (
              <Building2 size={20} className="text-primary" />
            )}
            <span className="text-sm font-semibold text-foreground hidden sm:inline">{user?.company?.name || 'BizForce'}</span>
          </div>

          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Global search...')}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              className="pl-9 h-9"
            />
            {showSearch && (searchResults.length > 0 || searching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin mr-2" /> {t('Searching...')}
                  </div>
                ) : (
                  searchResults.map((group: any) => (
                    <div key={group.module}>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground bg-muted/50">
                        {group.module}
                      </div>
                      {group.data.map((record: any) => (
                        <button
                          key={record.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => { navigate(`/${group.module}/${record.id}`); setShowSearch(false); setSearchQuery('') }}
                        >
                          {record[Object.keys(record).find(k => k.endsWith('Name') || k.endsWith('name') || k === 'title' || k === 'subject') || 'id']}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('Notifications')} className="relative">
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-semibold">{t('Notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <CheckCheck size={13} /> {t('Mark all read')}
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-sm text-muted-foreground px-3 py-6 text-center">{t('No notifications')}</p>
                  )}
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : ''}`}
                      onClick={() => { markRead(n.id); if (n.link) navigate(n.link) }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {n.createdAt ? formatDateTime(n.createdAt) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('Toggle theme')}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-1.5">
                  <div className="relative">
                    <UserAvatar user={user} size={28} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                        meOnline ? 'bg-green-500' : 'bg-muted-foreground/60'
                      }`}
                    />
                  </div>
                  <span className="hidden sm:inline max-w-[130px] truncate">{user?.firstName} {user?.lastName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <UserAvatar user={user} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <span className={`text-xs font-medium ${meOnline ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {meOnline ? t('Online') : t('Offline')}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{t('Team online')}</span>
                    <span className="text-xs text-muted-foreground">{onlineCount}/{onlineUsers.length}</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {onlineUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-2 py-1">
                        <div className="relative">
                          <UserAvatar user={u} size={26} />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-popover ${u.online ? 'bg-green-500' : 'bg-muted-foreground/60'}`} />
                        </div>
                        <span className="text-sm flex-1 truncate">{u.firstName} {u.lastName}</span>
                        <span className={`text-xs ${u.online ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {u.online ? t('Online') : t('Offline')}
                        </span>
                      </div>
                    ))}
                    {onlineUsers.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">{t('No users')}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User size={14} className="mr-2" />
                  {t('My Profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut size={14} className="mr-2" />
                  {t('Logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
