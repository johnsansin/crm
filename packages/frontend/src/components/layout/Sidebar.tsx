import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { UserAvatar } from '@/components/UserAvatar'
import {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, X,
  ChevronDown, LogOut, Shield, CalendarDays, CreditCard, Repeat, Phone,
  BarChart3, Inbox, Rss, Trash2, LineChart, Zap, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, CalendarDays,
  CreditCard, Repeat, Phone, BarChart3, Inbox, Rss, Trash2, LineChart, Zap
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
  if (!modules || modules.length === 0) return fallbackGroups
  const byGroup: Record<string, any[]> = {}
  for (const m of modules) {
    if (!m.parent) continue
    if (!byGroup[m.parent]) byGroup[m.parent] = []
    byGroup[m.parent].push({ module: m.name, label: m.label || m.name, icon: m.icon || 'FileText' })
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
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col',
          'w-64 shadow-2xl shadow-black/20',
          collapsed && 'md:w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-sidebar-hover bg-gradient-to-br from-sidebar-hover/60 via-transparent to-sidebar-active/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 text-white shadow-lg shadow-primary/30 shrink-0">
              <Zap size={17} fill="currentColor" />
            </div>
            <div className={cn('min-w-0', collapsed && 'md:hidden')}>
              <p className="font-bold text-base text-white leading-none tracking-tight truncate">BizForce</p>
              <p className="text-[10px] text-sidebar-foreground/50 mt-1 uppercase tracking-[0.2em]">CRM Suite</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            title={collapsed ? t('Expand sidebar') : t('Collapse sidebar')}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-hover transition-colors"
          >
            <X size={18} className="md:hidden" />
            {collapsed ? <PanelLeftOpen size={18} className="hidden md:block" /> : <PanelLeftClose size={18} className="hidden md:block" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-sidebar-hover [&::-webkit-scrollbar-thumb]:rounded-full">
          <SectionLabel label={t('Main')} collapsed={collapsed} />
          <NavItem module="" label={t('Dashboard')} icon="LayoutDashboard" collapsed={collapsed} />
          <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} />
          <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} />
          <NavItem module="trash" label={t('Recycle Bin')} icon="Trash2" collapsed={collapsed} />

          <SectionLabel label={t('Workspace')} collapsed={collapsed} />

          {menuGroups.map((group) => {
            const groupActive = activeGroup === group.label
            const isExpanded = collapsed ? false : expandedGroup === group.label
            return (
              <div key={group.label}>
                {collapsed ? (
                  <div className="hidden md:block my-2.5 mx-auto h-px w-8 bg-sidebar-hover" />
                ) : (
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? '' : group.label)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors',
                      groupActive ? 'text-white' : 'text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-hover'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full transition-colors', groupActive ? 'bg-primary' : 'bg-sidebar-foreground/30')} />
                    <span className="truncate">{t(group.label)}</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-hover text-sidebar-foreground/50">{group.items.length}</span>
                    <ChevronDown size={13} className={cn('transition-transform duration-200', isExpanded && 'rotate-180')} />
                  </button>
                )}
                {(isExpanded || collapsed) && (
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
                )}
              </div>
            )
          })}

          <div className="pt-2 mt-2 border-t border-sidebar-hover space-y-0.5">
            <SectionLabel label={t('System')} collapsed={collapsed} />
            {user?.isAdmin && (
              <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed={collapsed} />
            )}
            {user?.isSuperAdmin && (
              <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed={collapsed} />
            )}
          </div>
        </div>

        <div className={cn('shrink-0 border-t border-sidebar-hover p-3', collapsed && 'md:p-2')}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl border p-2.5 transition-colors',
                isActive
                  ? 'border-sidebar-active/50 bg-sidebar-active/15'
                  : 'border-sidebar-hover bg-sidebar-hover/40 hover:border-sidebar-active/40 hover:bg-sidebar-hover',
                collapsed && 'md:justify-center md:p-2'
              )
            }
          >
            <UserAvatar user={user} size={36} />
            <div className={cn('flex-1 min-w-0', collapsed && 'md:hidden')}>
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </NavLink>
          <div className={cn(collapsed && 'md:hidden')}>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-sidebar-hover py-1.5 text-xs text-sidebar-foreground/60 hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
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

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 pt-4 pb-1.5 px-2', collapsed && 'md:hidden')}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">{label}</span>
      <span className="flex-1 h-px bg-sidebar-hover" />
    </div>
  )
}

function NavItem({ module, label, icon, collapsed }: { module: string; label: string; icon: string; collapsed: boolean }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return (
    <NavLink
      to={href}
      end
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'relative group flex items-center gap-3 rounded-lg text-sm transition-colors py-1.5',
          collapsed ? 'md:justify-center md:mx-auto md:w-12' : 'px-2',
          isActive ? 'text-white' : 'text-sidebar-foreground hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary shadow-[0_0_8px_0_hsl(var(--sidebar-active))]" />
          )}
          <span
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-md shrink-0 transition-all',
              isActive
                ? 'bg-gradient-to-br from-primary to-indigo-500 text-white shadow-md shadow-primary/30'
                : 'bg-sidebar-hover text-sidebar-foreground group-hover:bg-sidebar-active/20 group-hover:text-white'
            )}
          >
            <Icon size={16} />
          </span>
          <span className={cn('truncate font-medium', collapsed && 'md:hidden')}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
