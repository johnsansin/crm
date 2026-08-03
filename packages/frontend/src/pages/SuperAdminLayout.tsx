import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Building2, LayoutDashboard, Users, History, Settings, LogOut, Sun, Moon, Menu, X, Shield, Bell, User } from 'lucide-react'

const navItems = [
  { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
  { path: '/superadmin/users', label: 'Users', icon: Users },
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

  useEffect(() => {
    if (!user?.isSuperAdmin) navigate('/login')
  }, [user])

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
      `}>
        {/* Logo */}
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

        {/* Nav */}
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

        {/* Bottom */}
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

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"
      >
        <Menu size={20} className="text-slate-600 dark:text-slate-400" />
      </button>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 md:px-6 gap-2 md:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            {user?.company?.logo ? (
              <img src={user.company.logo} alt={user.company.name} className="h-7 w-7 rounded object-cover" />
            ) : (
              <Building2 size={20} className="text-primary" />
            )}
            <span className="text-sm font-semibold text-foreground hidden sm:inline">{user?.company?.name || 'BizForce'}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="Notifications">
              <Bell size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 ml-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {(user?.firstName?.[0] || 'S') + (user?.lastName?.[0] || 'A')}
              </div>
              <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400">{user?.email}</span>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}