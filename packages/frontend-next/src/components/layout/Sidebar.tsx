'use client'

import { NavLink, useLocation } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone, Swords,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, Menu, X,
  ChevronDown, LogOut, Shield, CalendarDays, CreditCard, Repeat, Phone,
  BarChart3, Inbox, Rss, Trash2, LineChart, Zap, Send, MessageCircle,
  Globe, Share2, Webhook, Sparkles, UserCog, Tag, Star, Store
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'
import { useViewableModules } from '@/lib/permissions'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone, Swords,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, CalendarDays,
  CreditCard, Repeat, Phone, BarChart3, Inbox, Rss, Trash2, LineChart, Zap,
  Send, MessageCircle, Globe, Share2, Webhook, Sparkles, UserCog, Tag, Store
}

const GROUP_ORDER = ['Essentials', 'POS', 'Marketing', 'Sales', 'Inventory', 'Purchasing', 'Support', 'Projects', 'Tools']

const fallbackGroups = [
  {
    label: 'Essentials',
    items: [
      { module: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { module: 'calendar', label: 'Calendar', icon: 'CalendarDays' },
      { module: 'activities', label: 'To-Dos', icon: 'CheckSquare' },
      { module: 'forecast', label: 'Forecasting', icon: 'LineChart' },
      { module: 'ai-assistant', label: 'AI Assistant', icon: 'Sparkles' },
      { module: 'reports', label: 'Reports', icon: 'BarChart3' },
      { module: 'mailboxes', label: 'Inbox', icon: 'Inbox' },
      { module: 'documents', label: 'Documents', icon: 'File' },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { module: 'campaigns', label: 'Campaigns', icon: 'Megaphone' },
      { module: 'email-campaigns', label: 'Email Campaigns', icon: 'Send' },
      { module: 'landing-pages', label: 'Landing Pages', icon: 'Globe' },
      { module: 'social-media', label: 'Social Media', icon: 'Share2' },
    ]
  },
  {
    label: 'Sales',
    items: [
      { module: 'leads', label: 'Leads', icon: 'UserPlus' },
      { module: 'potentials', label: 'Opportunities', icon: 'TrendingUp' },
      { module: 'accounts', label: 'Accounts', icon: 'Building2' },
      { module: 'contacts', label: 'Contacts', icon: 'Users' },
      { module: 'quotes', label: 'Quotes', icon: 'FileText' },
      { module: 'salesorders', label: 'Sales Orders', icon: 'ShoppingCart' },
      { module: 'invoices', label: 'Invoices', icon: 'Receipt' },
      { module: 'receipts', label: 'Receipts', icon: 'Receipt' },
      { module: 'smsnotifier', label: 'SMS Notifier', icon: 'MessageSquare' },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { module: 'products', label: 'Products', icon: 'Package' },
      { module: 'services', label: 'Services', icon: 'Wrench' },
      { module: 'vendors', label: 'Vendors', icon: 'Truck' },
      { module: 'pricebooks', label: 'Price Books', icon: 'BookOpen' },
      { module: 'purchaseorders', label: 'Purchase Orders', icon: 'ClipboardList' },
    ]
  },
  {
    label: 'Purchasing',
    items: [
      { module: 'payments', label: 'Payments', icon: 'CreditCard' },
    ]
  },
  {
    label: 'Support',
    items: [
      { module: 'tickets', label: 'Tickets', icon: 'LifeBuoy' },
      { module: 'faq', label: 'FAQ', icon: 'HelpCircle' },
      { module: 'servicecontracts', label: 'Service Contracts', icon: 'FileSignature' },
      { module: 'assets', label: 'Assets', icon: 'HardDrive' },
    ]
  },
  {
    label: 'Projects',
    items: [
      { module: 'projects', label: 'Projects', icon: 'FolderKanban' },
      { module: 'projecttasks', label: 'Project Tasks', icon: 'CheckSquare' },
      { module: 'projectmilestones', label: 'Project Milestones', icon: 'Flag' },
      { module: 'timeentries', label: 'Time Entries', icon: 'Clock' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { module: 'documents', label: 'Documents', icon: 'File' },
      { module: 'emailtemplates', label: 'Email Templates', icon: 'FileText' },
      { module: 'emails', label: 'Emails', icon: 'Mail' },
      { module: 'sms', label: 'SMS', icon: 'MessageSquare' },
      { module: 'chat-admin', label: 'Chat Admin', icon: 'MessageCircle' },
      { module: 'webhooks', label: 'Webhooks', icon: 'Webhook' },
      { module: 'help', label: 'Help Center', icon: 'HelpCircle' },
    ]
  }
]

const moduleToGroup: Record<string, string> = {}
for (const group of fallbackGroups) {
  for (const item of group.items) {
    moduleToGroup[item.module] = group.label
  }
}

const WORKFLOW_ORDER = ['campaigns', 'email-campaigns', 'landing-pages', 'social-media', 'leads', 'potentials', 'accounts', 'contacts', 'quotes', 'salesorders', 'invoices']

function buildGroups(modules: any[] | null) {
  if (!modules) return fallbackGroups
  const byGroup: Record<string, any[]> = {}
  for (const m of modules) {
    if (!m.parent) continue
    if (!byGroup[m.parent]) byGroup[m.parent] = []
    byGroup[m.parent].push({ module: m.name, label: m.label || m.name, icon: m.icon || 'FileText' })
  }
  const essentials = [...(byGroup['Essentials'] || [])]
  for (const item of fallbackGroups[0].items) {
    if (!essentials.some(existing => existing.module === item.module)) essentials.push(item)
  }
  byGroup['Essentials'] = essentials
  if (!byGroup['Tools']?.some((m: any) => m.module === 'trash')) {
    byGroup['Tools'] = [...(byGroup['Tools'] || []), { module: 'trash', label: 'Recycle Bin', icon: 'Trash2' }]
  }
  if (!byGroup['Tools']?.some((m: any) => m.module === 'tags')) {
    byGroup['Tools'] = [...(byGroup['Tools'] || []), { module: 'tags', label: 'Tags', icon: 'Tag' }]
  }
  if (!byGroup['Tools']?.some((m: any) => m.module === 'help')) {
    byGroup['Tools'] = [...(byGroup['Tools'] || []), { module: 'help', label: 'Help Center', icon: 'HelpCircle' }]
  }
  const groups: string[] = []
  for (const g of GROUP_ORDER) if (byGroup[g]) groups.push(g)
  for (const g of Object.keys(byGroup)) if (!groups.includes(g)) groups.push(g)
  return groups
    .map(label => ({ label, items: byGroup[label].sort((a, b) => {
      const ai = WORKFLOW_ORDER.indexOf(a.module); const bi = WORKFLOW_ORDER.indexOf(b.module)
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      return a.label.localeCompare(b.label)
    }) }))
    .filter(g => g.items.length > 0)
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onHoverChange }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void; onHoverChange?: (hovered: boolean) => void }) {
  const location = useLocation()
  const currentModule = location.pathname.split('/')[1]
  const { user, logout } = useAuthStore()
  const viewable = useViewableModules()
  const canOpen = (module: string) => !!user?.isAdmin || !!user?.isSuperAdmin || viewable.has(module)
  const [menuModules, setMenuModules] = useState<any[] | null>(null)

  useEffect(() => {
    let mounted = true
    api.getMenuModules().then(res => {
      if (mounted) setMenuModules(res.data || [])
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const refresh = () => api.getMenuModules().then(res => setMenuModules(res.data || [])).catch(() => {})
    window.addEventListener('crm-menu-updated', refresh)
    return () => window.removeEventListener('crm-menu-updated', refresh)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileOpen, onMobileClose])

  const menuGroups = buildGroups(menuModules)
  const allMenuItems = menuGroups.flatMap(group => group.items)
  const [favoriteModules, setFavoriteModules] = useState<string[]>(['dashboard', 'leads', 'contacts', 'accounts', 'calendar', 'reports'])

  useEffect(() => {
    const key = `crm-menu-favorites:${user?.id || 'guest'}`
    let active = true
    api.getFavoriteModules().then(response => {
      if (!active) return
      if (response.configured) {
        setFavoriteModules(response.data.filter(Boolean))
        localStorage.setItem(key, JSON.stringify(response.data))
        return
      }
      let initial = ['dashboard', 'leads', 'contacts', 'accounts', 'calendar', 'reports']
      try {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (Array.isArray(saved)) initial = saved.filter(Boolean)
      } catch { /* use defaults */ }
      setFavoriteModules(initial)
      api.updateFavoriteModules(initial).catch(() => {})
    }).catch(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (Array.isArray(saved) && active) setFavoriteModules(saved.filter(Boolean))
      } catch { /* use defaults */ }
    })
    return () => { active = false }
  }, [user?.id])

  const toggleFavorite = (module: string) => {
    setFavoriteModules(current => {
      const next = current.includes(module) ? current.filter(item => item !== module) : [...current, module]
      localStorage.setItem(`crm-menu-favorites:${user?.id || 'guest'}`, JSON.stringify(next))
      api.updateFavoriteModules(next).catch(() => {})
      return next
    })
  }

  const activeGroup = currentModule ? moduleToGroup[currentModule] || '' : ''
  const [expandedGroup, setExpandedGroup] = useState(activeGroup || 'Essentials')

  useEffect(() => {
    if (activeGroup) setExpandedGroup(activeGroup)
  }, [activeGroup])

  useEffect(() => {
    if (mobileOpen) setExpandedGroup(activeGroup || 'Essentials')
  }, [mobileOpen, activeGroup])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-200',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
      />
      <aside
        data-crm-sidebar
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen min-h-[100dvh] w-full max-w-full flex-col overflow-hidden border-r bg-white text-slate-800 shadow-2xl transition-transform duration-200 dark:bg-slate-900 dark:text-slate-100 sm:w-[min(94vw,980px)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="crm-sidebar-header relative flex h-16 shrink-0 items-center justify-between border-b bg-white px-5 dark:bg-slate-900" data-tour="sidebar-logo">
          <div className={cn('relative flex items-center gap-3', collapsed && 'md:mx-auto')}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-[#1aa8a8] text-sm font-black text-white shadow-sm">B</span>
            <div className={cn('min-w-0', collapsed && 'md:hidden')}>
              <span className="block text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Main Menu</span>
              <span className="block text-[10px] text-slate-500">Browse apps and modules</span>
            </div>
          </div>
          <button
            onClick={() => {
              onMobileClose()
            }}
            aria-label={collapsed ? t('Expand menu') : t('Collapse menu')}
            className="relative grid h-9 w-9 place-items-center rounded border bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="border-b px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('Favorites')}</h2>
              <span className="text-xs text-[#168f8f]">{t('Click a star to personalize')}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {favoriteModules.map(module => allMenuItems.find(item => item.module === module)).filter(Boolean).map((item: any) => (
                <div key={item.module} className="relative shrink-0">
                  <MenuModule {...item} onNavigate={onMobileClose} favorite />
                  <button type="button" onClick={() => toggleFavorite(item.module)} aria-label={`Remove ${item.label} from favorites`} className="absolute right-1.5 top-1.5 text-amber-500 hover:text-amber-600"><Star size={13} fill="currentColor" /></button>
                </div>
              ))}
              {favoriteModules.length === 0 && <p className="py-4 text-sm text-slate-400">{t('Star modules below to add favorites.')}</p>}
            </div>
          </section>

          <div className="flex min-h-[430px] flex-col sm:flex-row" data-tour="modules">
            <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b bg-slate-50 p-2 dark:bg-slate-950/40 sm:block sm:w-48 sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
              <p className="hidden mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:block">{t('Apps')}</p>
              {menuGroups.map(group => <button key={group.label} type="button" onClick={() => setExpandedGroup(group.label)} className={cn('flex shrink-0 items-center justify-between whitespace-nowrap rounded px-3 py-2 text-left text-xs font-medium transition-colors sm:mb-1 sm:w-full sm:py-2.5 sm:text-sm', expandedGroup === group.label ? 'bg-[#1aa8a8] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800')}>
                <span>{t(group.label)}</span><ChevronDown size={14} className={cn('-rotate-90', expandedGroup === group.label && 'text-white')} />
              </button>)}
            </nav>

            <section className="min-w-0 flex-1 p-4 sm:p-7">
              <h2 className="mb-1 text-xl font-semibold">{t(expandedGroup)}</h2>
              <p className="mb-5 text-sm text-slate-500">{t('Select a module to continue')}</p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {(menuGroups.find(group => group.label === expandedGroup)?.items || []).map(item => (
                  <div key={item.module} className="group/favorite relative">
                    <MenuModule module={item.module} label={t(item.label)} icon={item.icon} onNavigate={onMobileClose} />
                    <button type="button" onClick={() => toggleFavorite(item.module)} aria-label={`${favoriteModules.includes(item.module) ? 'Remove' : 'Add'} ${item.label} ${favoriteModules.includes(item.module) ? 'from' : 'to'} favorites`} className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-500', favoriteModules.includes(item.module) ? 'text-amber-500' : 'text-slate-300 opacity-60 group-hover/favorite:opacity-100')}>
                      <Star size={15} fill={favoriteModules.includes(item.module) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-1 border-t bg-slate-50 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:bg-slate-950/40 sm:gap-2 sm:px-4 sm:py-3">
          {(user?.isAdmin || user?.isSuperAdmin) && <MenuModule module="settings" label={t('Settings')} icon="Settings" onNavigate={onMobileClose} footer />}
          {user?.isSuperAdmin && <MenuModule module="superadmin" label={t('Super Admin')} icon="Shield" onNavigate={onMobileClose} footer />}
          <MenuModule module="profile" label={t('My Profile')} icon="UserCog" onNavigate={onMobileClose} footer />
          <button onClick={logout} className="ml-auto flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut size={15} />{t('Sign out')}</button>
        </footer>
      </aside>
    </>
  )
}

function MenuModule({ module, label, icon, onNavigate, favorite, footer }: { module: string; label: string; icon: string; onNavigate: () => void; favorite?: boolean; footer?: boolean }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return <NavLink to={href} onClick={onNavigate} className={({ isActive }) => cn(
    'group flex items-center gap-3 rounded transition-colors',
    favorite && 'min-w-[112px] flex-col justify-center border bg-white px-3 py-3 text-center text-xs font-medium shadow-sm hover:border-[#1aa8a8] hover:text-[#168f8f] dark:bg-slate-800',
    !favorite && !footer && 'border-b border-slate-100 px-2 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#168f8f] dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800',
    footer && 'px-3 py-2 text-sm text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800',
    isActive && !favorite && 'font-semibold text-[#168f8f]'
  )}>
    <span className={cn('grid shrink-0 place-items-center rounded bg-slate-100 text-slate-500 group-hover:bg-[#e5f7f7] group-hover:text-[#168f8f] dark:bg-slate-800', favorite ? 'h-9 w-9' : 'h-8 w-8')}><Icon size={favorite ? 18 : 16} strokeWidth={1.7} /></span>
    <span>{label}</span>
  </NavLink>
}

function NavItem({ module, label, icon, collapsed, dataTour, onNavigate, tile, compact }: { module: string; label: string; icon: string; collapsed: boolean; dataTour?: string; onNavigate?: () => void; tile?: boolean; compact?: boolean }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return (
    <NavLink
      to={href}
      end
      data-tour={dataTour}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex min-h-9 min-w-0 items-center gap-3 rounded border px-3 py-2 text-[13px] font-medium transition-all duration-150',
          tile && 'min-h-[62px] flex-col justify-center gap-1 px-1 py-2 text-[10px]',
          compact && 'min-h-8 gap-3 rounded px-3 py-1.5 text-[12px]',
          isActive
            ? 'border-[#1aa8a8]/30 bg-[#1aa8a8] text-white shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-white/70'
            : 'border-transparent text-[#c2ccd2] hover:bg-white/[0.06] hover:text-white',
          collapsed && 'md:justify-center md:px-2'
        )
      }
    >
      <Icon size={tile ? 17 : compact ? 15 : 17} strokeWidth={1.75} className="relative shrink-0 text-[#9aa0a6] transition-colors duration-150 group-hover:text-white" />
      <span className={cn('min-w-0 break-words leading-tight', (tile || compact) ? 'line-clamp-2 text-center sm:text-left md:text-left' : 'whitespace-normal', collapsed && 'md:hidden')}>{label}</span>
    </NavLink>
  )
}
