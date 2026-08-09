import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { UserAvatar } from '@/components/UserAvatar'
import {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, Menu, X,
  ChevronDown, LogOut, Shield, CalendarDays, LineChart, Trash2, Zap
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { t } from '@/lib/i18n'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Users, UserPlus, TrendingUp, Megaphone,
  Package, Wrench, Truck, BookOpen, FileText, ShoppingCart, ClipboardList,
  Receipt, LifeBuoy, HelpCircle, HardDrive, FileSignature, FolderKanban,
  CheckSquare, Flag, File, Mail, MessageSquare, Settings, CalendarDays,
  LineChart, Trash2
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([activeGroup || 'Marketing'])

  useEffect(() => {
    if (activeGroup) {
      setExpandedGroups(prev => (prev.includes(activeGroup) ? prev : [...prev, activeGroup]))
    }
  }, [activeGroup])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => (prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]))
  }

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
          collapsed && 'md:w-[60px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className={cn(
          'relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-fuchsia-600',
          'flex items-center gap-3 h-16 px-4',
          collapsed && 'md:px-0 md:justify-center'
        )}>
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 shadow-lg shrink-0">
              <Zap size={18} className="text-white" fill="currentColor" />
            </span>
            <div className={cn('leading-tight', collapsed && 'md:hidden')}>
              <p className="font-bold text-white tracking-tight">BizForce</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest">CRM Suite</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            className={cn(
              'relative ml-auto p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors',
              collapsed && 'md:hidden'
            )}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
          <button
            onClick={onToggle}
            className={cn(
              'relative hidden md:flex ml-auto p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors',
              !collapsed && 'md:hidden'
            )}
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 scrollbar-thin scrollbar-thumb-sidebar-hover scrollbar-track-transparent">
          <SectionLabel collapsed={collapsed}>{t('Main')}</SectionLabel>
          <div className="space-y-0.5">
            <NavItem module="" label={t('Dashboard')} icon="LayoutDashboard" collapsed={collapsed} />
            <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} />
            <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} />
            <NavItem module="trash" label={t('Recycle Bin')} icon="Trash2" collapsed={collapsed} />
          </div>

          <SectionLabel collapsed={collapsed}>{t('Workspace')}</SectionLabel>
          <div className="space-y-0.5">
            {menuGroups.map((group) => {
              const isExpanded = collapsed ? false : expandedGroups.includes(group.label)
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      'group w-full flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] font-medium transition-colors',
                      'hover:bg-sidebar-hover hover:text-white',
                      collapsed && 'md:justify-center md:px-0'
                    )}
                    title={collapsed ? t(group.label) : undefined}
                  >
                    <span className={cn(
                      'shrink-0 h-1.5 w-1.5 rounded-full bg-primary/70',
                      collapsed && 'md:h-2 md:w-2'
                    )} />
                    <span className={cn('flex-1 text-left truncate', collapsed && 'md:hidden')}>{t(group.label)}</span>
                    <span className={cn(
                      'shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-hover text-sidebar-foreground/60',
                      collapsed && 'md:hidden'
                    )}>{group.items.length}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'shrink-0 text-sidebar-foreground/40 transition-transform duration-200',
                        collapsed && 'md:hidden',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="relative space-y-0.5 mt-0.5 mb-1 ml-2.5 pl-2.5 border-l border-sidebar-hover">
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
          </div>

          {(user?.isAdmin || user?.isSuperAdmin) && (
            <>
              <SectionLabel collapsed={collapsed}>{t('System')}</SectionLabel>
              <div className="space-y-0.5">
                {user?.isAdmin && <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed={collapsed} />}
                {user?.isSuperAdmin && <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed={collapsed} />}
              </div>
            </>
          )}
        </div>

        <div className={cn('shrink-0 border-t border-sidebar-hover bg-gradient-to-t from-sidebar to-transparent p-2.5', collapsed && 'md:p-2')}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-2 py-2 transition-colors',
                isActive ? 'bg-sidebar-active text-white' : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
                collapsed && 'md:justify-center md:px-0'
              )
            }
          >
            <UserAvatar user={user} size={34} />
            <div className={cn('flex-1 min-w-0', collapsed && 'md:hidden')}>
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
            <LogOut
              size={15}
              className={cn('shrink-0 text-sidebar-foreground/40 hover:text-destructive', collapsed && 'md:hidden')}
              onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); logout() }}
            />
          </NavLink>
        </div>
      </aside>
    </>
  )
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  if (collapsed) {
    return <div className="hidden md:block h-2" />
  }
  return (
    <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
      {children}
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
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] font-medium transition-all duration-150',
          'hover:translate-x-0.5 hover:bg-sidebar-hover hover:text-white',
          isActive
            ? 'text-white bg-gradient-to-r from-primary/25 via-primary/10 to-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
            : 'text-sidebar-foreground',
          collapsed && 'md:justify-center md:px-0 md:hover:translate-x-0'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary transition-all duration-200',
            isActive ? 'opacity-100 shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'opacity-0'
          )} />
          <span className={cn(
            'flex items-center justify-center h-7 w-7 rounded-lg transition-colors shrink-0',
            isActive ? 'bg-white/10 text-white' : 'text-sidebar-foreground/80 group-hover:text-white'
          )}>
            <Icon size={16} />
          </span>
          <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
