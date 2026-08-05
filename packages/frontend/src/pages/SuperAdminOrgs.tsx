import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import {
  Building2, Users, Calendar, ToggleLeft, ToggleRight, Search,
  LayoutGrid, Table2, X, Mail, Eye
} from 'lucide-react'
import { useToast } from '@/lib/toast'
import { formatDate, useOrgSettings } from '@/lib/org-format'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
}

type ViewMode = 'table' | 'kanban'

export function SuperAdminOrgs() {
  useOrgSettings()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [view, setView] = useState<ViewMode>('table')
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [orgDetail, setOrgDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = () => {
    setLoading(true)
    api.adminListCompanies().then(res => { setCompanies(res.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleOrg = async (id: string) => {
    setToggling(id)
    try { await api.adminToggleCompany(id); await load(); if (selectedOrg === id) loadOrgDetail(id) } catch {}
    setToggling(null)
  }

  const loadOrgDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await api.adminGetCompany(id)
      setOrgDetail(res)
    } catch { addToast({ title: 'Failed to load org details', variant: 'destructive' }) }
    setDetailLoading(false)
  }

  const openDetail = (org: any) => {
    setSelectedOrg(org)
    loadOrgDetail(org.id)
  }

  const filtered = companies.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter === 'active' && c.isActive === false) return false
    if (statusFilter === 'inactive' && c.isActive !== false) return false
    return true
  })

  const columns = [
    { key: 'name', label: 'Organization', sortable: true, render: (_: any, r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{r.name}</p>
          <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
        </div>
      </div>
    )},
    { key: 'users', label: 'Users', render: (_: any, r: any) => (
      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        <Users size={14} className="text-slate-400" />
        {r._count?.users || 0}
      </span>
    )},
    { key: 'isActive', label: 'Status', render: (v: any) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        v !== false ? statusColors.active : statusColors.inactive
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {v !== false ? 'Active' : 'Inactive'}
      </span>
    )},
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Organizations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all registered organizations</p>
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
            type="text" placeholder="Search organizations..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
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

      {/* Org Detail Panel */}
      {selectedOrg && orgDetail && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{orgDetail.name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    orgDetail.isActive !== false ? statusColors.active : statusColors.inactive
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${orgDetail.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {orgDetail.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Created {formatDate(orgDetail.createdAt)} · {orgDetail.users?.length || 0} users
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleOrg(orgDetail.id)}
                disabled={toggling === orgDetail.id}
                className={`p-2.5 rounded-xl transition-all ${
                  orgDetail.isActive !== false
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                title={orgDetail.isActive !== false ? 'Deactivate' : 'Activate'}
              >
                {toggling === orgDetail.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                ) : orgDetail.isActive !== false ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
              </button>
              <button onClick={() => { setSelectedOrg(null); setOrgDetail(null) }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={18} />
              </button>
            </div>
          </div>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Users size={16} /> Users ({orgDetail.users?.length || 0})
              </h3>
              <div className="space-y-2">
                {orgDetail.users?.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                        {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Mail size={11} />{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Admin</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!orgDetail.users || orgDetail.users.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-4">No users in this organization</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={openDetail}
          actions={(r) => (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); openDetail(r) }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="View details">
                <Eye size={15} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleOrg(r.id) }}
                disabled={toggling === r.id}
                className={`p-1.5 rounded-lg transition-all ${
                  r.isActive !== false
                    ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                title={r.isActive !== false ? 'Deactivate' : 'Activate'}
              >
                {toggling === r.id
                  ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  : r.isActive !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />
                }
              </button>
            </div>
          )}
          emptyMessage="No organizations found"
        />
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { key: 'active', label: 'Active', color: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', items: filtered.filter(c => c.isActive !== false) },
            { key: 'inactive', label: 'Inactive', color: 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800', items: filtered.filter(c => c.isActive === false) },
          ].map(col => (
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
                  <p className="text-sm text-slate-400 text-center py-8">No {col.label} organizations</p>
                ) : (
                  col.items.map(org => (
                    <button key={org.id} onClick={() => openDetail(org)}
                      className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-sky-500 shrink-0" />
                          <p className="font-medium text-sm text-slate-800 dark:text-white truncate">{org.name}</p>
                        </div>
                        <Eye size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users size={12} />{org._count?.users || 0}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(org.createdAt)}</span>
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