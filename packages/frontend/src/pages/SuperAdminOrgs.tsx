import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Building2, Users, ToggleLeft, ToggleRight, Search,
  LayoutGrid, Table2, X, Mail, Globe, Phone, MapPin, Clock, ChevronRight, User, Pencil, Trash2
} from 'lucide-react'
import { useToast } from '@/lib/toast'
import { formatDate, useOrgSettings } from '@/lib/org-format'
import { LANGUAGES, DATE_FORMATS, TIMEZONES } from '@/lib/constants'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

type ViewMode = 'table' | 'kanban' | 'cards'

const langLabel = (code?: string) => LANGUAGES.find(l => l.value === code)?.label || code || '-'
const tzLabel = (tz?: string) => TIMEZONES.find(t => t.value === tz)?.label?.split(' ')[0] || tz || '-'
const dfLabel = (df?: string) => DATE_FORMATS.find(d => d.value === df)?.label || df || '-'

export function SuperAdminOrgs() {
  useOrgSettings()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [view, setView] = useState<ViewMode>('cards')

  const load = () => {
    setLoading(true)
    api.adminListCompanies().then(res => { setCompanies(res.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleOrg = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (toggling) return
    setToggling(id)
    try {
      await api.adminToggleCompany(id)
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
      addToast({ title: 'Status updated', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to toggle status', variant: 'destructive' })
    }
    setToggling(null)
  }

  const filtered = companies.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.email || '').toLowerCase().includes(search.toLowerCase()) && !(c.phone || '').toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter === 'active' && c.isActive === false) return false
    if (statusFilter === 'inactive' && c.isActive !== false) return false
    return true
  })

  const OrgLogo = ({ org, size = 'md' }: { org: any; size?: 'sm' | 'md' | 'lg' }) => {
    const cls = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-xs'
    if (org.logo) return <img src={org.logo} alt={org.name} className={`${cls} rounded-xl object-cover shrink-0`} />
    return (
      <div className={`${cls} rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0`}>
        {org.name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Organizations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{filtered.length} organizations total</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          <button onClick={() => setView('cards')} className={`p-2 rounded-lg transition-all ${view === 'cards' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Card view">
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Table view">
            <Table2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search by name, email, phone..."
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No organizations found</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(org => (
            <div key={org.id} className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 to-blue-600" />
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <OrgLogo org={org} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{org.name}</h3>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[org.isActive !== false ? 'active' : 'inactive']}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${org.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {org.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {org.email && <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5"><Mail size={12} />{org.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {org.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{org.phone}</span>
                    </div>
                  )}
                  {(org.addressCity || org.addressCountry) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{[org.addressCity, org.addressCountry].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {org.website && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Globe size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{org.website}</span>
                    </div>
                  )}
                  {org.language && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">{langLabel(org.language)}</span>
                    </div>
                  )}
                  {org.timezone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{tzLabel(org.timezone)}</span>
                    </div>
                  )}
                  {org.dateFormat && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">{dfLabel(org.dateFormat)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Users size={14} />
                    <span className="font-medium">{org._count?.users || 0}</span> users
                    <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs">{formatDate(org.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleOrg(e, org.id)}
                      disabled={toggling === org.id}
                      className={`p-1.5 rounded-lg transition-all ${toggling === org.id ? 'opacity-50' : ''} ${org.isActive !== false ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'}`}
                      title={org.isActive !== false ? 'Deactivate' : 'Activate'}
                    >
                      {toggling === org.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      ) : org.isActive !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Organization</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Address</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Language</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Timezone</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Date Format</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Users</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(org => (
                  <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <OrgLogo org={org} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{org.name}</p>
                          <p className="text-xs text-slate-400">{formatDate(org.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{org.phone || '-'}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{[org.addressCity, org.addressCountry].filter(Boolean).join(', ') || '-'}</td>
                    <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{langLabel(org.language)}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{tzLabel(org.timezone)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">{dfLabel(org.dateFormat)}</td>
                    <td className="px-5 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{org._count?.users || 0}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[org.isActive !== false ? 'active' : 'inactive']}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${org.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {org.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={(e) => toggleOrg(e, org.id)}
                        disabled={toggling === org.id}
                        className={`p-1.5 rounded-lg transition-all ${toggling === org.id ? 'opacity-50' : ''} ${org.isActive !== false ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'}`}
                        title={org.isActive !== false ? 'Deactivate' : 'Activate'}
                      >
                        {toggling === org.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        ) : org.isActive !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
