import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { UserAvatar } from '@/components/UserAvatar'
import {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone, Swords,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, Menu, X,
  ChevronDown, LogOut, Shield, CalendarDays, CreditCard, Repeat, Phone,
  BarChart3, Inbox, Rss, Trash2, LineChart, Zap, Send, MessageCircle,
  Globe, Share2, Webhook, Sparkles, UserCog, Tag
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
  Send, MessageCircle, Globe, Share2, Webhook, Sparkles, UserCog, Tag
}

const GROUP_ORDER = ['Marketing', 'Sales', 'Inventory', 'Purchasing', 'Support', 'Projects', 'Tools']

const fallbackGroups = [
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
  if (!byGroup['Tools']?.some((m: any) => m.module === 'trash')) {
    byGroup['Tools'] = [...(byGroup['Tools'] || []), { module: 'trash', label: 'Recycle Bin', icon: 'Trash2' }]
  }
  if (!byGroup['Tools']?.some((m: any) => m.module === 'tags')) {
    byGroup['Tools'] = [...(byGroup['Tools'] || []), { module: 'tags', label: 'Tags', icon: 'Tag' }]
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
  const sidebarPalette: Record<string, { background: string; border: string }> = {
    vtiger: { background: '#2f3b46', border: '#42515d' },
    navy: { background: '#172554', border: '#1e3a8a' },
    graphite: { background: '#27272a', border: '#3f3f46' },
    emerald: { background: '#064e3b', border: '#047857' },
    burgundy: { background: '#581c2d', border: '#7f1d3f' },
  }
  const storedPalette = user?.id ? localStorage.getItem(`sidebar-color:${user.id}`) : null
  const palette = sidebarPalette[storedPalette || user?.sidebarColor || 'vtiger'] || sidebarPalette.vtiger
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

  const activeGroup = currentModule ? moduleToGroup[currentModule] || '' : ''
  const [expandedGroup, setExpandedGroup] = useState(activeGroup || 'Sales')

  useEffect(() => {
    if (activeGroup) setExpandedGroup(activeGroup)
  }, [activeGroup])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
      />
      <aside
        data-crm-sidebar
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        style={{ backgroundColor: palette.background, borderColor: palette.border }}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen min-h-[100dvh] flex-col overflow-hidden border-r text-sidebar-foreground shadow-2xl shadow-slate-950/50 transition-all duration-300',
          'w-[min(92vw,20rem)] max-w-full md:w-64',
          collapsed && 'md:w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className="crm-sidebar-header relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-[max(1rem,env(safe-area-inset-left))]" data-tour="sidebar-logo">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />
          <div className={cn('relative flex items-center gap-3', collapsed && 'md:mx-auto')}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#2fa6a6] text-sm font-black text-white shadow-lg shadow-black/25 ring-1 ring-white/15">B</span>
            <div className={cn('min-w-0', collapsed && 'md:hidden')}>
              <span className="block text-base font-extrabold tracking-tight text-white">BizForce</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9cabb5]">Smart CRM</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            aria-label={collapsed ? t('Expand menu') : t('Collapse menu')}
            className={cn('relative grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white', collapsed && 'md:absolute md:-right-4 md:top-20 md:z-10 md:rounded-full md:bg-slate-800 md:shadow-lg')}
          >
            <X size={20} className="md:hidden" />
            {collapsed ? <Menu size={20} className="hidden md:block" /> : <X size={20} className="hidden md:block" />}
          </button>
        </div>

        <div className="crm-sidebar-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className={cn(collapsed && 'md:hidden')}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('Quick access')}</p>
              <span className="rounded-full bg-[#26323b] px-2 py-0.5 text-[9px] font-semibold text-[#aebbc4]">5 apps</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {canOpen('dashboard') && <NavItem module="" label={t('Dashboards')} icon="LayoutDashboard" collapsed={collapsed} dataTour="dashboard" onNavigate={onMobileClose} tile />}
              {canOpen('calendar') && <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} dataTour="calendar" onNavigate={onMobileClose} tile />}
              {canOpen('forecast') && <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} onNavigate={onMobileClose} tile />}
              {canOpen('reports') && <NavItem module="reports" label={t('Reports')} icon="BarChart3" collapsed={collapsed} onNavigate={onMobileClose} tile />}
              {canOpen('calendar') && <NavItem module="activities" label={t('To-Dos')} icon="CheckSquare" collapsed={collapsed} onNavigate={onMobileClose} tile />}
              {canOpen('ai') && <NavItem module="ai-assistant" label={t('AI Assistant')} icon="Sparkles" collapsed={collapsed} dataTour="ai-assistant" onNavigate={onMobileClose} tile />}
            </div>
          </div>

          <div className={cn('min-h-0 flex-1', collapsed && 'md:hidden')} data-tour="modules">
            <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('Modules')}</p>
            <div className="crm-sidebar-groups grid grid-cols-4 gap-1 rounded-lg border border-white/[0.07] bg-[#293640] p-1 shadow-inner max-[380px]:grid-cols-3">
              {menuGroups.map(group => {
                const selected = expandedGroup === group.label
                return <button key={group.label} type="button" onClick={() => setExpandedGroup(group.label)} title={t(group.label)} className={cn('relative min-w-0 rounded-md border px-1 py-2 text-[9px] font-bold leading-tight transition-all', selected ? 'border-[#48aaaa]/35 bg-[#3b4a55] text-white shadow-sm' : 'border-transparent text-[#a7b3bc] hover:bg-[#35434e] hover:text-white')}>
                  {selected && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#45b8b8]" />}
                  <span className="block truncate">{t(group.label)}</span>
                </button>
              })}
            </div>

            <div className="mt-2 rounded-lg border border-white/[0.07] bg-[#293640] p-1.5 shadow-inner shadow-black/15">
              <div className="mb-1.5 flex items-center gap-2 px-1.5 py-1">
                <span className="h-2 w-2 rounded-full bg-[#45b8b8]" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#dce4e9]">{t(expandedGroup)}</p>
              </div>
              <div className="crm-sidebar-items grid grid-cols-2 gap-1 max-[340px]:grid-cols-1">
                {(menuGroups.find(group => group.label === expandedGroup)?.items || menuGroups[0]?.items || []).map(item => (
                  <NavItem key={item.module} module={item.module} label={t(item.label)} icon={item.icon} collapsed={collapsed} onNavigate={onMobileClose} compact />
                ))}
              </div>
            </div>
          </div>

          <div className={cn('hidden flex-col gap-1 md:flex', !collapsed && 'md:hidden')}>
            {canOpen('dashboard') && <NavItem module="" label={t('Dashboards')} icon="LayoutDashboard" collapsed={collapsed} dataTour="dashboard" />}
            {canOpen('calendar') && <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} />}
            {canOpen('forecast') && <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} />}
            {canOpen('reports') && <NavItem module="reports" label={t('Reports')} icon="BarChart3" collapsed={collapsed} />}
            {canOpen('calendar') && <NavItem module="activities" label={t('To-Dos')} icon="CheckSquare" collapsed={collapsed} />}
            {canOpen('ai') && <NavItem module="ai-assistant" label={t('AI Assistant')} icon="Sparkles" collapsed={collapsed} />}
          </div>
        </div>

        <div className={cn('crm-sidebar-footer shrink-0 space-y-1 border-t border-white/10 bg-black/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]', collapsed && 'md:p-2')}>
          {(user?.isAdmin || user?.isSuperAdmin) && (
            <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed={collapsed} onNavigate={onMobileClose} />
          )}
          {user?.isSuperAdmin && (
            <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed={collapsed} onNavigate={onMobileClose} />
          )}
          <NavLink
            to="/profile"
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl border transition-all',
                isActive ? 'border-[#48aaaa]/30 bg-[#3b4a55] text-white' : 'border-transparent text-sidebar-foreground hover:border-white/10 hover:bg-white/5 hover:text-white',
                collapsed && 'md:justify-center md:p-2',
                'p-2'
              )
            }
          >
            <UserAvatar user={user} size={32} />
            <div className={cn('flex-1 min-w-0', collapsed && 'md:hidden')}>
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </NavLink>
          <div className={cn(collapsed && 'md:hidden')}>
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs text-sidebar-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={14} />
              <span>{t('Sign out')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
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
          'group relative flex min-h-10 items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
          tile && 'min-h-[62px] flex-col justify-center gap-1 px-1 py-2 text-[10px]',
          compact && 'min-h-9 gap-2 rounded-lg px-2 py-2 text-[11px]',
          isActive
            ? 'border-[#4badad]/30 bg-[#3d4c57] text-white shadow-md shadow-black/20 before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-r-full before:bg-[#45b8b8]'
            : 'border-transparent text-[#c5ced4] hover:border-white/10 hover:bg-[#394752] hover:text-white',
          collapsed && 'md:justify-center md:px-2'
        )
      }
    >
      <Icon size={tile ? 17 : compact ? 15 : 18} strokeWidth={2.15} className="relative shrink-0 text-[#8fcaca] transition-all duration-200 group-hover:scale-110 group-hover:text-white" />
      <span className={cn('truncate leading-tight', collapsed && 'md:hidden')}>{label}</span>
    </NavLink>
  )
}
