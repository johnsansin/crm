import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppBreadcrumbs, CrmFlowGuide } from './AppBreadcrumbs'
import { LiveTranslation } from '@/components/LiveTranslation'
import { SupportChatWidget } from '@/components/support/SupportChatWidget'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'
import { usePresence } from '@/hooks/usePresence'
import { UserAvatar } from '@/components/UserAvatar'
import { OnboardingTour } from '@/components/OnboardingTour'
import { QuickStartModal } from '@/components/QuickStartModal'
import { LogOut, User, Search, Sun, Moon, Loader2, Menu, Bell, Building2, Megaphone, CheckCheck, X, Languages, Check, ChevronDown, Command, MessageSquare, PlayCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { setOrgSettings, orgLocale, orgLanguage, formatDateTime, useOrgSettings } from '@/lib/org-format'
import { LANGUAGES } from '@/lib/constants'
import { useToast } from '@/lib/toast'
import { setRemoteTranslations, t } from '@/lib/i18n'
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
  const { addToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  useOrgSettings()
  usePresence()

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications().catch(() => ({ data: [] })),
    refetchInterval: 30000,
  })

  const { data: chatConvosData } = useQuery({
    queryKey: ['header-chat'],
    queryFn: () => api.getChatConversations().catch(() => ({ data: [] })),
    refetchInterval: 15000,
  })

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: () => api.getPreferences().catch(() => ({})),
  })

  const preferenceLocale = (preferences?.language || 'en_us').split('_')[0]
  const { data: translationsData } = useQuery({
    queryKey: ['active-translations', user?.companyId, preferenceLocale],
    queryFn: () => api.request<{ data: Record<string, string> }>(`/i18n/${preferenceLocale}`).catch(() => ({ data: {} })),
    enabled: Boolean(user?.companyId && preferences),
  })

  const { data: recentOrgsData } = useQuery({
    queryKey: ['admin-recent-orgs'],
    queryFn: () => api.adminRecentCompanies(5).catch(() => ({ data: [] })),
    enabled: !!user?.isSuperAdmin,
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (!preferences) return
    setOrgSettings({
      language: preferences.language || 'en_us',
      timezone: preferences.timezone || 'UTC',
      dateFormat: preferences.dateFormat || 'mm-dd-yyyy',
      hourFormat: preferences.hourFormat || '12h',
      defaultCurrency: preferences.defaultCurrency || 'USD',
      currencySymbol: preferences.currencySymbol || '$',
      calendar: preferences.calendar || {},
    })
    const lang = preferences.language || 'en_us'
    document.documentElement.lang = lang
    document.documentElement.dir = ['ar', 'ur', 'he', 'fa'].includes(lang.split('_')[0]) ? 'rtl' : 'ltr'
  }, [preferences])

  useEffect(() => {
    setRemoteTranslations(preferenceLocale, translationsData?.data || {})
  }, [preferenceLocale, translationsData])

  const [langSaving, setLangSaving] = useState(false)
  const currentLang = user?.language || orgLanguage()
  const saveLanguage = async (code: string) => {
    if (code === currentLang) return
    setLangSaving(true)
    try {
      await api.updateMe({ language: code })
      useAuthStore.setState({ user: { ...user, language: code } })
      setOrgSettings({ language: code })
      document.documentElement.lang = code
      document.documentElement.dir = ['ar', 'ur', 'he', 'fa'].includes(code.split('_')[0]) ? 'rtl' : 'ltr'
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.id] })
      addToast({ title: t('Language updated'), description: LANGUAGES.find(l => l.value === code)?.label, variant: 'success' })
    } catch (e: any) {
      addToast({ title: t('Error'), description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setLangSaving(false)
    }
  }

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: () => api.getActiveAnnouncements().catch(() => ({ data: [] })),
  })

  const notifications = notificationsData?.data || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length
  const chatUnread = (chatConvosData?.data || []).reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
  const activeAnnouncements = (announcementsData?.data || []).filter((a: any) => !dismissedAnnouncements.includes(a.id))
  const recentOrgs = recentOrgsData?.data || []

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

  const replayTour = async () => {
    try {
      await api.resetOnboarding()
      useAuthStore.setState({ user: { ...user, hasCompletedOnboarding: false } })
      addToast({ title: t('Product tour ready'), description: t('The guided tour has restarted.'), variant: 'success' })
    } catch (e: any) {
      addToast({ title: t('Unable to restart tour'), description: e?.message, variant: 'destructive' })
    }
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

  return (
    <div className="h-screen min-h-[100dvh] overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onHoverChange={(hovered) => {
          if (window.matchMedia('(min-width: 768px) and (hover: hover)').matches) setSidebarCollapsed(!hovered)
        }}
      />

      <div className={cn('h-screen min-h-[100dvh] min-w-0 flex flex-col overflow-hidden transition-all duration-300', 'ml-0 md:ml-64', sidebarCollapsed && 'md:ml-16')}>
        {activeAnnouncements.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-4 md:px-6 py-2 bg-primary text-primary-foreground text-sm shrink-0">
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
        <header data-tour="header" className="shrink-0 h-14 sm:h-16 bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm flex items-center justify-between px-2.5 sm:px-4 md:px-6 gap-1.5 md:gap-4 relative z-30">
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <button
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-3 shrink-0 mr-3 min-w-0">
            {user?.company?.logo ? (
              <img src={user.company.logo} alt={user.company.name} className="h-9 w-9 rounded-lg object-contain p-0.5 bg-white dark:bg-white/10 ring-1 ring-border shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                <Building2 size={18} />
              </div>
            )}
            <div className="hidden sm:block min-w-0 leading-tight">
              <p className="text-sm font-bold text-foreground truncate max-w-[160px]">{user?.company?.name || 'BizForce'}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {user?.isAdmin ? t('Organization Admin') : t('Workspace')}
              </p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              placeholder={t('Search records...')}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              className="h-9 pl-9 pr-14 rounded-full border-border/70 bg-muted/40 shadow-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/40 transition-all"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground rounded border border-border bg-background shadow-sm">
              <Command size={10} />K
            </kbd>
            {showSearch && (searchResults.length > 0 || searching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/60 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
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
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
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

          <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" title={t('Chat')} className="relative hidden sm:inline-flex rounded-full h-9 w-9" onClick={() => navigate('/chat')}>
              <MessageSquare size={17} />
              {chatUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('Notifications')} className="relative rounded-full h-9 w-9">
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
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
                  {user?.isSuperAdmin && recentOrgs.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                        <Building2 size={11} /> New Organizations
                      </div>
                      {recentOrgs.map((c: any) => (
                        <div
                          key={c.id}
                          className="px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer"
                          onClick={() => navigate('/superadmin/organizations')}
                        >
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c._count?.users || 0} users · {formatDateTime(c.createdAt)}</p>
                        </div>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
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
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('Toggle theme')} className="hidden sm:inline-flex rounded-full h-9 w-9">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 px-2 rounded-full h-9" title={t('Language')} disabled={langSaving}>
                  {langSaving ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />}
                  <span className="hidden md:inline text-xs font-semibold uppercase">{currentLang.split('_')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                {LANGUAGES.map(l => (
                  <DropdownMenuItem key={l.value} onClick={() => saveLanguage(l.value)} className="justify-between gap-3">
                    <span>{l.label}</span>
                    {l.value === currentLang && <Check size={14} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden md:block w-px h-6 bg-border mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1.5 pr-2.5 h-11 rounded-full" data-tour="profile">
                  <UserAvatar user={user} size={30} className="ring-2 ring-primary/20" />
                  <span className="hidden md:block text-left leading-tight">
                    <span className="block text-xs font-semibold max-w-[110px] truncate">{user?.firstName} {user?.lastName}</span>
                    <span className="block text-[10px] text-muted-foreground">{user?.isAdmin ? t('Admin') : t('Member')}</span>
                  </span>
                  <ChevronDown size={14} className="hidden md:block text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex items-center gap-3 px-3 py-3">
                  <UserAvatar user={user} size={40} className="ring-2 ring-primary/20" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <p className="mt-0.5">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {user?.isAdmin ? t('Organization Admin') : t('Member')}
                      </span>
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User size={14} className="mr-2" />
                  {t('My Profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={replayTour}>
                  <PlayCircle size={14} className="mr-2" />
                  {t('Replay product tour')}
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

        <main
          className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-slate-100/80 dark:bg-slate-950/70 p-2.5 sm:p-4 md:p-6 overscroll-contain"
          onPointerDown={() => {
            if (mobileOpen) setMobileOpen(false)
            if (!sidebarCollapsed && window.matchMedia('(min-width: 768px)').matches) setSidebarCollapsed(true)
          }}
        >
          <div className="mx-auto w-full max-w-[1600px]">
            <AppBreadcrumbs />
            <CrmFlowGuide />
            <Outlet />
          </div>
        </main>
      </div>
      {user && !user.hasCompletedQuickStart && <QuickStartModal />}
      {user && user.hasCompletedQuickStart && !user.hasCompletedOnboarding && <OnboardingTour />}
      {user?.isAdmin && !user?.isSuperAdmin && <SupportChatWidget />}
      <LiveTranslation />
    </div>
  )
}
