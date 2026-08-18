import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Users, Mail, Phone, Building2, Search, Plus, X, Clock, MapPin, Loader2, Pencil, Trash2, Shield
} from 'lucide-react'
import { formatDate } from '@/lib/org-format'

export function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editAgent, setEditAgent] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    userName: '', email: '', firstName: '', lastName: '', password: '',
    phone: '', department: '', title: '', companyId: '',
  })

  const loadAgents = () => {
    api.listAgents().then(res => {
      setAgents((res.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAgents() }, [])

  const openCreate = () => {
    setForm({ userName: '', email: '', firstName: '', lastName: '', password: '', phone: '', department: '', title: '', companyId: '' })
    setEditAgent(null)
    setError('')
    setShowForm(true)
    api.adminListCompanies().then(res => setCompanies(res.data || [])).catch(() => {})
  }

  const openEdit = (agent: any) => {
    setForm({
      userName: agent.userName, email: agent.email, firstName: agent.firstName, lastName: agent.lastName, password: '',
      phone: agent.phone || '', department: agent.department || '', title: agent.title || '', companyId: agent.companyId || '',
    })
    setEditAgent(agent)
    setError('')
    setShowForm(true)
    api.adminListCompanies().then(res => setCompanies(res.data || [])).catch(() => {})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editAgent) {
        const payload: any = { ...form }
        if (!payload.password) delete payload.password
        delete payload.userName
        await api.updateAgent(editAgent.id, payload)
      } else {
        await api.createAgent(form)
      }
      setShowForm(false)
      loadAgents()
    } catch (err: any) {
      setError(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (agent: any) => {
    if (!confirm(`Deactivate agent ${agent.firstName} ${agent.lastName}?`)) return
    try {
      await api.deleteAgent(agent.id)
      loadAgents()
    } catch {}
  }

  const filtered = agents.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (a.firstName || '').toLowerCase().includes(q) ||
      (a.lastName || '').toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.company?.name || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Headphones size={20} className="text-white" />
            </div>
            Agents
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Users who assist the superadmin across organizations</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 transition-all">
          <Plus size={16} /> Add Agent
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search agents by name, email or organization..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editAgent ? 'Edit Agent' : 'Add Agent'}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{editAgent ? 'Update agent details' : 'Create a new superadmin assistant'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username *</label>
                  <input type="text" required value={form.userName} onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
                    disabled={!!editAgent}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{editAgent ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" {...(!editAgent ? { required: true } : {})} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Support Agent"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Support"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Organization</label>
                  <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all">
                    <option value="">None (global)</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving...' : editAgent ? 'Update Agent' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Headphones size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">{search ? 'No agents match your search' : 'No agents yet'}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{search ? 'Try a different search term' : 'Click "Add Agent" to create one'}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Agent</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Organization</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Last Login</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shrink-0">
                          {((a.firstName?.[0] || '') + (a.lastName?.[0] || '')).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{a.firstName} {a.lastName}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10} />{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.phone || '-'}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{a.title || '-'}</td>
                    <td className="px-5 py-3">
                      {a.company?.name ? (
                        <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <Building2 size={13} className="text-slate-400 shrink-0" />{a.company.name}
                        </span>
                      ) : <span className="text-xs text-slate-400">Global</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${a.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{a.lastLogin ? formatDate(a.lastLogin) : 'Never'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all" title="Deactivate"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400">
            {filtered.length} agent{filtered.length !== 1 ? 's' : ''} total
          </div>
        </div>
      )}
    </div>
  )
}
