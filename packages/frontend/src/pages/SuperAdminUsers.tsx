import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import {
  Users, Mail, Shield, Search, Building2, LayoutGrid, Table2,
  Eye, Calendar, ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import { formatDate, useOrgSettings } from '@/lib/org-format'

type ViewMode = 'table' | 'kanban'

export function SuperAdminUsers() {
  useOrgSettings()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('table')
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  useEffect(() => {
    api.adminListUsers().then(res => {
      const raw = res.data || []
      const sorted = raw.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUsers(sorted)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      if (!u.email.toLowerCase().includes(q) &&
          !(u.firstName || '').toLowerCase().includes(q) &&
          !(u.lastName || '').toLowerCase().includes(q) &&
          !(u.company?.name || '').toLowerCase().includes(q)) return false
    }
    if (roleFilter === 'superadmin' && !u.isSuperAdmin) return false
    if (roleFilter === 'admin' && (!u.isAdmin || u.isSuperAdmin)) return false
    if (roleFilter === 'user' && (u.isAdmin || u.isSuperAdmin)) return false
    if (statusFilter === 'active' && u.isActive === false) return false
    if (statusFilter === 'inactive' && u.isActive !== false) return false
    return true
  })

  const columns = [
    { key: 'name', label: 'User', sortable: true, render: (_: any, r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
          {((r.firstName?.[0] || '') + (r.lastName?.[0] || '')).toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{r.firstName} {r.lastName}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={11} />{r.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (_: any, r: any) => (
      <div className="flex gap-1">
        {r.isSuperAdmin ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            <Shield size={11} />Super Admin
          </span>
        ) : r.isAdmin ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Admin</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">User</span>
        )}
      </div>
    )},
    { key: 'isActive', label: 'Status', render: (v: any) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        v !== false
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {v !== false ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'company', label: 'Company', render: (_: any, r: any) => (
      r.company?.name ? (
        <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <Building2 size={14} className="text-slate-400 shrink-0" />
          {r.company.name}
        </span>
      ) : <span className="text-xs text-slate-400">—</span>
    )},
    { key: 'lastLogin', label: 'Last Login', render: (v: any) => (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {v ? formatDate(v) : 'Never'}
      </span>
    )},
  ]

  // Group for Kanban
  const kanbanGroups = [
    { key: 'Super Admin', label: 'Super Admin', color: 'bg-sky-50/80 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800', items: filtered.filter(u => u.isSuperAdmin) },
    { key: 'Admin', label: 'Admins', color: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', items: filtered.filter(u => u.isAdmin && !u.isSuperAdmin) },
    { key: 'User', label: 'Users', color: 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700', items: filtered.filter(u => !u.isAdmin && !u.isSuperAdmin) },
  ]

  const roleFilterOptions = [
    { label: 'All', value: 'all' as const },
    { label: 'Super Admin', value: 'superadmin' as const },
    { label: 'Admin', value: 'admin' as const },
    { label: 'User', value: 'user' as const },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">All users across organizations</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Table view">
            <Table2 size={18} />
          </button>
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Kanban view">
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search users by name, email or company..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          {roleFilterOptions.map(o => (
            <button key={o.value} onClick={() => setRoleFilter(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                roleFilter === o.value
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >{o.label}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
                {((selectedUser.firstName?.[0] || '') + (selectedUser.lastName?.[0] || '')).toUpperCase() || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  {selectedUser.isSuperAdmin ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"><Shield size={11} />Super Admin</span>
                  ) : selectedUser.isAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Admin</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">User</span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedUser.isActive !== false
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <Mail size={13} />{selectedUser.email}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <ChevronUp size={18} />
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-1">Username</p>
              <p className="font-medium text-slate-800 dark:text-white">{selectedUser.userName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Organization</p>
              <p className="font-medium text-slate-800 dark:text-white flex items-center gap-1">
                <Building2 size={14} className="text-slate-400" />
                {selectedUser.company?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Last Login</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Created</p>
              <p className="font-medium text-slate-800 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={setSelectedUser}
          actions={(r) => (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setSelectedUser(r) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all">
                <Eye size={15} />
              </button>
            </div>
          )}
          emptyMessage="No users found"
        />
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {kanbanGroups.map(col => (
            <div key={col.key} className={`rounded-2xl border ${col.color} overflow-hidden`}>
              <div className="p-4 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{col.label}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background/80 text-slate-600 dark:text-slate-300">
                    {col.items.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : col.items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No {col.label.toLowerCase()}</p>
                ) : (
                  col.items.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)}
                      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                          {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          {u.company?.name && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Building2 size={11} />{u.company.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive !== false
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}