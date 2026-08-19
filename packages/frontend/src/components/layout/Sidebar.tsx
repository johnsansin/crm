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
  Globe, Share2, Webhook, Sparkles, UserCog
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'
import { api } from '@/lib/api'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone, Swords,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, CalendarDays,
  CreditCard, Repeat, Phone, BarChart3, Inbox, Rss, Trash2, LineChart, Zap,
  Send, MessageCircle, Globe, Share2, Webhook, Sparkles, UserCog
}

const GROUP_ORDER = ['Marketing', 'Sales', 'Inventory', 'Support', 'Projects', 'Tools']

const fallbackGroups = [
  {
    label: 'Marketing',
    items: [
      { module: 'campaigns', label: 'Campaigns', icon: 'Megaphone' },
      { module: 'leads', label: 'Leads', icon: 'UserPlus' },
      { module: 'accounts', label: 'Accounts', icon: 'Building2' },
      { module: 'contacts', label: 'Contacts', icon: 'Users' },
      { module: 'landing-pages', label: 'Landing Pages', icon: 'Globe' },
      { module: 'social-media', label: 'Social Media', icon: 'Share2' },
    ]
  },
  {
    label: 'Sales',
    items: [
      { module: 'potentials', label: 'Opportunities', icon: 'TrendingUp' },
      { module: 'quotes', label: 'Quotes', icon: 'FileText' },
      { module: 'salesorders', label: 'Sales Orders', icon: 'ShoppingCart' },
      { module: 'invoices', label: 'Invoices', icon: 'Receipt' },
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
    ]
  },
  {
    label: 'Tools',
    items: [
      { module: 'documents', label: 'Documents', icon: 'File' },
      { module: 'emailtemplates', label: 'Email Templates', icon: 'FileText' },
      { module: 'emails', label: 'Emails', icon: 'Mail' },
      { module: 'email-campaigns', label: 'Email Campaigns', icon: 'Send' },
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
  const groups: string[] = []
  for (const g of GROUP_ORDER) if (byGroup[g]) groups.push(g)
  for (const g of Object.keys(byGroup)) if (!groups.includes(g)) groups.push(g)
  return groups
    .map(label => ({ label, items: byGroup[label].sort((a, b) => a.module.localeCompare(b.module)) }))
    .filter(g => g.items.length > 0)
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  const location = useLocation()
  const currentModule = location.pathname.split('/')[1]
  const { user, logout } = useAuthStore()
  const [menuModules, setMenuModules] = useState<any[] | null>(null)

  useEffect(() => {
    let mounted = true
    api.getMenuModules().then(res => {
      if (mounted) setMenuModules(res.data || [])
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const menuGroups = buildGroups(menuModules)

  const activeGroup = currentModule ? moduleToGroup[currentModule] || '' : ''
  const [expandedGroup, setExpandedGroup] = useState(activeGroup || '')

  useEffect(() => {
    if (activeGroup) setExpandedGroup(activeGroup)
  }, [activeGroup])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
          'w-64',
          collapsed && 'md:w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-hover/50 shrink-0" data-tour="sidebar-logo">
          <span className={cn('font-extrabold text-xl text-white tracking-tight', collapsed && 'md:hidden')}>BizForce</span>
          <span className={cn('font-extrabold text-xl text-white tracking-tight hidden', collapsed && 'md:block')}>BF</span>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            className="p-1 rounded hover:bg-sidebar-hover text-sidebar-foreground"
          >
            <X size={20} className="md:hidden" />
            {collapsed ? <Menu size={20} className="hidden md:block" /> : <X size={20} className="hidden md:block" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hidden">
          <NavItem module="" label={t('Dashboard')} icon="LayoutDashboard" collapsed={collapsed} dataTour="dashboard" />
          <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} dataTour="calendar" />
          <NavItem module="chat" label={t('Chat')} icon="MessageSquare" collapsed={collapsed} />
          <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} />
          <NavItem module="ai-assistant" label={t('AI Assistant')} icon="Sparkles" collapsed={collapsed} dataTour="ai-assistant" />

          <div className="pt-2 pb-1">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-hover to-transparent mx-1" />
          </div>

          <div data-tour="modules">
          {menuGroups.map((group) => {
            const isExpanded = collapsed ? false : expandedGroup === group.label
            return (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? '' : group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-hover/50 transition-colors"
                >
                  <span className={cn(collapsed && 'md:hidden')}>{t(group.label)}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'transition-transform duration-200 shrink-0',
                      collapsed && 'md:hidden',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded || collapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.module}
                        module={item.module}
                        label={t(item.label)}
                        icon={item.icon}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        </div>

        <div className={cn('shrink-0 border-t border-sidebar-hover/50 p-3 space-y-1', collapsed && 'md:p-2')}>
          {(user?.isAdmin || user?.isSuperAdmin) && (
            <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed={collapsed} />
          )}
          {user?.isSuperAdmin && (
            <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed={collapsed} />
          )}
          <button
            onClick={async () => {
              try {
                await api.resetOnboarding()
                useAuthStore.setState({ user: { ...user, hasCompletedOnboarding: false } })
              } catch {}
            }}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-white',
              collapsed && 'md:justify-center md:px-2',
              'px-3 py-2.5 text-[13px] font-medium'
            )}
          >
            <Sparkles size={19} strokeWidth={1.8} className="shrink-0" />
            <span className={cn('truncate leading-tight', collapsed && 'md:hidden')}>{t('Replay Tour')}</span>
          </button>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg transition-colors',
                isActive ? 'bg-sidebar-active text-white' : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
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
              className="w-full flex items-center gap-3 px-2 py-1.5 mt-1 rounded-md text-xs text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-hover transition-colors"
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

function NavItem({ module, label, icon, collapsed, dataTour }: { module: string; label: string; icon: string; collapsed: boolean; dataTour?: string }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return (
    <NavLink
      to={href}
      end
      data-tour={dataTour}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-sidebar-active text-white shadow-sm shadow-sidebar-active/30'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-white',
          collapsed && 'md:justify-center md:px-2'
        )
      }
    >
      <Icon size={19} strokeWidth={isActive => isActive ? 2.2 : 1.8} className="shrink-0" />
      <span className={cn('truncate leading-tight', collapsed && 'md:hidden')}>{label}</span>
    </NavLink>
  )
}
