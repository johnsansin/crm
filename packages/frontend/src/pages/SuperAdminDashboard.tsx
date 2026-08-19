import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { TrendingUp, Activity, ArrowRight, Mail, Phone, UserPlus, ChevronRight, Shield, CheckCircle, XCircle, Users, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/org-format'

function Building3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="bldg-face" x1="12" y1="8" x2="36" y2="40">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="bldg-side" x1="24" y1="10" x2="36" y2="40">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d="M10 40V16l14-6 14 6v24H10z" fill="url(#bldg-face)" />
      <path d="M38 16l-14-6v30h14V16z" fill="url(#bldg-side)" opacity="0.85" />
      <rect x="15" y="18" width="4" height="4" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="21" y="18" width="4" height="4" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="27" y="18" width="4" height="4" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="15" y="25" width="4" height="4" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="21" y="25" width="4" height="4" rx="0.5" fill="#fff" opacity="0.7" />
      <rect x="27" y="25" width="4" height="4" rx="0.5" fill="#fff" opacity="0.5" />
      <rect x="20" y="32" width="6" height="8" rx="1" fill="#1e3a8a" opacity="0.6" />
      <path d="M10 40l14 4 14-4" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
    </svg>
  )
}

function Users3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="usr1" x1="8" y1="10" x2="28" y2="38">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="usr2" x1="18" y1="10" x2="38" y2="38">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="16" r="7" fill="url(#usr1)" />
      <path d="M6 36c0-7 5-12 12-12s12 5 12 12" fill="url(#usr1)" opacity="0.5" />
      <circle cx="32" cy="14" r="6" fill="url(#usr2)" />
      <path d="M22 34c0-6 4-10 10-10s10 4 10 10" fill="url(#usr2)" opacity="0.5" />
      <circle cx="18" cy="16" r="3" fill="#fff" opacity="0.4" />
      <circle cx="32" cy="14" r="2.5" fill="#fff" opacity="0.4" />
    </svg>
  )
}

function Active3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="act-g" x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#act-g)" />
      <circle cx="24" cy="24" r="12" fill="url(#act-g)" opacity="0.3" />
      <path d="M16 24l5 5 11-11" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="1" opacity="0.2" />
    </svg>
  )
}

function Inactive3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="inact-r" x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#inact-r)" />
      <circle cx="24" cy="24" r="12" fill="url(#inact-r)" opacity="0.3" />
      <path d="M18 18l12 12M30 18l-12 12" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="1" opacity="0.2" />
    </svg>
  )
}

const icon3d: Record<string, React.ComponentType<any>> = {
  building: Building3D,
  users: Users3D,
  active: Active3D,
  inactive: Inactive3D,
}

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, activeOrgs: 0, inactiveOrgs: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentOrgs, setRecentOrgs] = useState<any[]>([])

  useEffect(() => {
    api.adminListCompanies().then(res => {
      const companies = res.data || []
      setStats({
        totalOrgs: companies.length,
        totalUsers: companies.reduce((s: number, c: any) => s + (c._count?.users || 0), 0),
        activeOrgs: companies.filter((c: any) => c.isActive !== false).length,
        inactiveOrgs: companies.filter((c: any) => c.isActive === false).length,
      })
    }).catch(() => {})
    api.adminListUsers().then(res => {
      const raw = (res.data || [])
        .filter((u: any) => !u.isSuperAdmin)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
      setRecentUsers(raw)
    }).catch(() => {})
    api.adminRecentCompanies(6).then(res => setRecentOrgs(res.data || [])).catch(() => {})
  }, [])

  const cards = [
    { label: 'Organizations', value: stats.totalOrgs, icon: Building2, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-950/30', path: '/superadmin/organizations' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/30', path: '/superadmin/users' },
    { label: 'Active', value: stats.activeOrgs, icon: CheckCircle, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', path: '/superadmin/organizations' },
    { label: 'Inactive', value: stats.inactiveOrgs, icon: XCircle, color: 'from-rose-500 to-red-500', bg: 'bg-rose-50 dark:bg-rose-950/30', path: '/superadmin/organizations' },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">SuperAdmin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and manage all organizations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="relative group text-left"
            >
              <div className="relative overflow-hidden rounded-2xl p-5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon size={24} className={`text-transparent bg-clip-text bg-gradient-to-r ${card.color}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={14} /> Real-time
                  </span>
                  <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition-colors" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <UserPlus size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Users</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Latest users across all organizations</p>
              </div>
            </div>
            <button onClick={() => navigate('/superadmin/users')} className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {recentUsers.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">No registered users yet</p>
            ) : recentUsers.map(u => (
              <button key={u.id} onClick={() => navigate('/superadmin/users')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                  {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Mail size={11} />{u.email}
                  </p>
                  {(u.phone || u.mobile) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <Phone size={11} />{u.phone || u.mobile}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">{formatDate(u.createdAt)}</p>
                  {u.company?.name && <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{u.company.name}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-500/25">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Organizations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Newly registered organizations</p>
              </div>
            </div>
            <button onClick={() => navigate('/superadmin/organizations')} className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {recentOrgs.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">No organizations registered yet</p>
            ) : recentOrgs.map(c => (
              <button key={c.id} onClick={() => navigate('/superadmin/organizations')} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c._count?.users || 0} users</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                  <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${c.isActive !== false ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {c.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Quick Actions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Frequently used tasks</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Manage Organizations', desc: 'View, activate or deactivate organizations', path: '/superadmin/organizations', icon: Building2, color: 'from-sky-500 to-blue-600' },
              { label: 'View All Users', desc: 'Browse users across all organizations', path: '/superadmin/users', icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Org Details', desc: 'Drill into organization records and stats', path: '/superadmin/organizations', icon: Activity, color: 'from-emerald-500 to-green-500' },
            ].map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="group p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 p-6 text-white shadow-xl shadow-blue-500/20 flex items-center gap-4">
        <Shield size={32} className="opacity-80 shrink-0" />
        <div>
          <p className="font-semibold text-lg">Super Admin Access</p>
          <p className="text-sm text-white/70">You have full system-wide access to manage all organizations and users</p>
        </div>
      </div>
    </div>
  )
}

