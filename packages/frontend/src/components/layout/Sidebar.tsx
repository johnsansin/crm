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
  LogOut, Shield, CalendarDays, LineChart, Trash2, Zap
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

const mainItems = [
  { module: '', label: 'Dashboard', icon: 'LayoutDashboard' },
  { module: 'calendar', label: 'Calendar', icon: 'CalendarDays' },
  { module: 'forecast', label: 'Forecasting', icon: 'LineChart' },
  { module: 'trash', label: 'Recycle Bin', icon: 'Trash2' },
]

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
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
          collapsed && 'md:w-[56px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className={cn(
          'shrink-0 flex items-center gap-2.5 h-14 px-3.5 border-b border-sidebar-hover/70',
          collapsed && 'md:px-0 md:justify-center'
        )}>
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 text-primary shrink-0">
            <Zap size={16} />
          </span>
          <span className={cn('font-bold text-[15px] text-white tracking-tight', collapsed && 'md:hidden')}>
            BizForce
          </span>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            className={cn(
              'ml-auto p-1.5 rounded-md text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-hover transition-colors',
              collapsed && 'md:hidden'
            )}
          >
            <X size={17} />
          </button>
          <button
            onClick={onToggle}
            className={cn(
              'hidden md:flex ml-auto p-1.5 rounded-md text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-hover transition-colors',
              !collapsed && 'md:hidden'
            )}
          >
            <Menu size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 scrollbar-thin scrollbar-thumb-sidebar-hover scrollbar-track-transparent">
          {collapsed ? (
            <div className="flex flex-col items-center space-y-1">
              {[...mainItems, ...menuGroups.flatMap(g => g.items)].map(item => (
                <NavItem key={item.module || 'dashboard'} module={item.module} label={t(item.label)} icon={item.icon} collapsed />
              ))}
              {user?.isAdmin && <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed />}
              {user?.isSuperAdmin && <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed />}
            </div>
          ) : (
            <>
              <SectionLabel>{t('Main')}</SectionLabel>
              <div className="space-y-0.5">
                {mainItems.map(item => (
                  <NavItem key={item.module || 'dashboard'} module={item.module} label={t(item.label)} icon={item.icon} />
                ))}
              </div>

              {menuGroups.map(group => (
                <div key={group.label}>
                  <SectionLabel hairline>{t(group.label)}</SectionLabel>
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <NavItem key={item.module} module={item.module} label={t(item.label)} icon={item.icon} />
                    ))}
                  </div>
                </div>
              ))}

              {(user?.isAdmin || user?.isSuperAdmin) && (
                <>
                  <SectionLabel hairline>{t('System')}</SectionLabel>
                  <div className="space-y-0.5">
                    {user?.isAdmin && <NavItem module="settings" label={t('Settings')} icon="Settings" />}
                    {user?.isSuperAdmin && <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" />}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className={cn('shrink-0 border-t border-sidebar-hover/70 p-2.5', collapsed && 'md:p-2')}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                isActive ? 'bg-sidebar-active text-white' : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
                collapsed && 'md:justify-center md:px-0'
              )
            }
          >
            <UserAvatar user={user} size={30} />
            <div className={cn('flex-1 min-w-0', collapsed && 'md:hidden')}>
              <p className="text-[13px] font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
            <LogOut
              size={14}
              className={cn('shrink-0 text-sidebar-foreground/40 hover:text-destructive', collapsed && 'md:hidden')}
              onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); logout() }}
            />
          </NavLink>
        </div>
      </aside>
    </>
  )
}

function SectionLabel({ hairline, children }: { hairline?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(
      'px-2.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35',
      hairline && 'mt-3 border-t border-sidebar-hover/60'
    )}>
      {children}
    </div>
  )
}

function NavItem({ module, label, icon, collapsed }: { module: string; label: string; icon: string; collapsed?: boolean }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return (
    <NavLink
      to={href}
      end
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 h-8 text-[13px] transition-colors',
          isActive
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
          collapsed && 'md:justify-center md:px-0 md:h-9 md:w-9 md:mx-auto'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={cn('shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground/70')} />
          <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
