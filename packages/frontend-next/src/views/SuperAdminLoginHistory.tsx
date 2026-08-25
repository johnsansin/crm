'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DataTable } from '@/components/ui/data-table'
import { Search, Monitor, Globe, Smartphone, ExternalLink, Clock } from 'lucide-react'
import { formatDateTime, useOrgSettings } from '@/lib/org-format'

export function SuperAdminLoginHistory() {
  useOrgSettings()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const load = (p: number) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(p), limit: '50' }
    if (search) params.search = search
    api.adminLoginHistory(params).then(res => {
      setLogs(res.data)
      setPagination(res.pagination)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const handleSearch = () => { setPage(1); load(1) }

  const columns = [
    { key: 'user', label: 'User', sortable: true, render: (_: any, r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {((r.user?.firstName?.[0] || '') + (r.user?.lastName?.[0] || '')).toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-sm text-slate-800 dark:text-white">{r.userName}</p>
          <p className="text-xs text-slate-400">{r.email}</p>
        </div>
      </div>
    )},
    { key: 'org', label: 'Organization', render: (_: any, r: any) => (
      <span className="text-sm text-slate-600 dark:text-slate-300">{r.user?.company?.name || '-'}</span>
    )},
    { key: 'ipAddress', label: 'LAN IP', render: (v: any) => (
      <div className="flex items-center gap-1.5">
        <Monitor size={13} className="text-slate-400 shrink-0" />
        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{v || '-'}</span>
      </div>
    )},
    { key: 'publicIp', label: 'Public IP', render: (v: any) => (
      <div className="flex items-center gap-1.5">
        <Globe size={13} className="text-slate-400 shrink-0" />
        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{v || '-'}</span>
      </div>
    )},
    { key: 'userAgent', label: 'Device', render: (v: any) => {
      if (!v) return <span className="text-xs text-slate-400">-</span>
      const isMobile = /mobile|android|iphone|ipad/i.test(v)
      const browser = v.split('/')[0] || 'Unknown'
      return (
        <div className="flex items-center gap-1.5 max-w-[200px]">
          {isMobile ? <Smartphone size={13} className="text-slate-400 shrink-0" /> : <Monitor size={13} className="text-slate-400 shrink-0" />}
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={v}>{browser}</span>
        </div>
      )
    }},
    { key: 'createdAt', label: 'Time', render: (v: any) => (
      <div className="flex items-center gap-1.5">
        <Clock size={13} className="text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400">{v ? formatDateTime(v) : '-'}</span>
      </div>
    )},
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Login History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track all login attempts across organizations</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search by user, email or IP..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <button onClick={handleSearch}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors shadow-sm">
          Search
        </button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No login history found"
      />
    </div>
  )
}