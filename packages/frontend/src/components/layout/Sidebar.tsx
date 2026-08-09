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
  LogOut, Shield, CalendarDays, LineChart, Trash2
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
          'w-60',
          collapsed && 'md:w-[52px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:z-40'
        )}
      >
        <div className="flex items-center justify-between h-12 px-3 border-b border-sidebar-hover shrink-0">
          <span className={cn('font-bold text-base text-white tracking-tight', collapsed && 'md:hidden')}>BizForce</span>
          <span className={cn('font-bold text-base text-white tracking-tight hidden', collapsed && 'md:block')}>BF</span>
          <button
            onClick={() => {
              if (window.innerWidth < 768) { onMobileClose() } else { onToggle() }
            }}
            className="p-1 rounded hover:bg-sidebar-hover text-sidebar-foreground"
          >
            <X size={18} className="md:hidden" />
            {collapsed ? <Menu size={18} className="hidden md:block" /> : <X size={18} className="hidden md:block" />}
          </button>
        </div>

        <div className="flex-1 overflow-hidden py-1.5 space-y-0.5">
          <NavItem module="" label={t('Dashboard')} icon="LayoutDashboard" collapsed={collapsed} />
          <NavItem module="calendar" label={t('Calendar')} icon="CalendarDays" collapsed={collapsed} />
          <NavItem module="forecast" label={t('Forecasting')} icon="LineChart" collapsed={collapsed} />
          <NavItem module="trash" label={t('Recycle Bin')} icon="Trash2" collapsed={collapsed} />

          {menuGroups.map((group) => (
            <div key={group.label}>
              <div className={cn(
                'px-2.5 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40',
                collapsed && 'md:hidden'
              )}>
                {t(group.label)}
              </div>
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
          ))}

          {(user?.isAdmin || user?.isSuperAdmin) && (
            <div className="pt-1.5 mt-1 border-t border-sidebar-hover space-y-0.5">
              {user?.isAdmin && <NavItem module="settings" label={t('Settings')} icon="Settings" collapsed={collapsed} />}
              {user?.isSuperAdmin && <NavItem module="superadmin" label={t('Super Admin')} icon="Shield" collapsed={collapsed} />}
            </div>
          )}
        </div>

        <div className={cn('shrink-0 border-t border-sidebar-hover p-1.5', collapsed && 'md:p-1')}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md transition-colors h-10',
                isActive ? 'bg-sidebar-active text-white' : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
                collapsed && 'md:justify-center md:h-9',
                'px-1.5'
              )
            }
          >
            <UserAvatar user={user} size={28} />
            <div className={cn('flex-1 min-w-0', collapsed && 'md:hidden')}>
              <p className="text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </NavLink>
          <div className={cn(collapsed && 'md:hidden')}>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-2 py-1 rounded-md text-xs text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-hover transition-colors"
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

function NavItem({ module, label, icon, collapsed }: { module: string; label: string; icon: string; collapsed: boolean }) {
  const Icon = iconMap[icon] || FileText
  const href = module === '' ? '/dashboard' : `/${module}`
  return (
    <NavLink
      to={href}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 h-[26px] rounded-md text-[13px] leading-none transition-colors',
          isActive
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
          collapsed && 'md:justify-center md:px-0 md:h-[22px]'
        )
      }
    >
      <Icon size={16} className="shrink-0" />
      <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
    </NavLink>
  )
}
