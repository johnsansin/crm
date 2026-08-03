import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Building2, Users, CheckCircle, XCircle, TrendingUp, Activity, ArrowRight } from 'lucide-react'

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, activeOrgs: 0, inactiveOrgs: 0 })

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
              <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
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

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
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
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md transition-all duration-200 text-left"
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

function Shield(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}