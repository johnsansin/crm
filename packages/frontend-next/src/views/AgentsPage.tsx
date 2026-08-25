'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import {
  Mail, Phone, Building2, Search, Plus, X, Clock, Loader2, Pencil, Trash2,
  Headphones, LayoutGrid, Table2, Columns, Power, Eye, Camera, Upload, IdCard
} from 'lucide-react'
import { formatDate } from '@/lib/org-format'

type ViewMode = 'table' | 'cards' | 'kanban'

export function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('cards')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editAgent, setEditAgent] = useState<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    userName: '', email: '', firstName: '', lastName: '', password: '',
    phone: '', department: '', title: '', companyId: '', avatar: '',
  })

  const loadAgents = () => {
    api.listAgents().then(res => {
      setAgents((res.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAgents() }, [])

  const openCreate = () => {
    setForm({ userName: '', email: '', firstName: '', lastName: '', password: '', phone: '', department: '', title: '', companyId: '', avatar: '' })
    setEditAgent(null)
    setError('')
    setShowForm(true)
    api.adminListCompanies().then(res => setCompanies(res.data || [])).catch(() => {})
  }

  const openEdit = (agent: any) => {
    setForm({
      userName: agent.userName, email: agent.email, firstName: agent.firstName, lastName: agent.lastName, password: '',
      phone: agent.phone || '', department: agent.department || '', title: agent.title || '', companyId: agent.companyId || '', avatar: agent.avatar || '',
    })
    setEditAgent(agent)
    setError('')
    setShowForm(true)
    api.adminListCompanies().then(res => setCompanies(res.data || [])).catch(() => {})
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadFile(file)
      setForm(f => ({ ...f, avatar: res.path }))
    } catch {}
    setUploading(false)
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

  const handleToggle = async (agent: any) => {
    setToggling(agent.id)
    try {
      await api.toggleAgent(agent.id)
      loadAgents()
    } catch {}
    setToggling(null)
  }

  const handleDelete = async (agent: any) => {
    if (!confirm(`Deactivate agent ${agent.firstName} ${agent.lastName}?`)) return
    try {
      await api.deleteAgent(agent.id)
      loadAgents()
    } catch {}
  }

  const filtered = agents.filter(a => {
    if (statusFilter === 'active' && a.isActive === false) return false
    if (statusFilter === 'inactive' && a.isActive !== false) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (a.firstName || '').toLowerCase().includes(q) ||
      (a.lastName || '').toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.company?.name || '').toLowerCase().includes(q)
  })

  const activeCount = agents.filter(a => a.isActive !== false).length
  const inactiveCount = agents.filter(a => a.isActive === false).length

  const kanbanGroups = [
    { key: 'active', label: 'Active', color: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', items: filtered.filter(a => a.isActive !== false) },
    { key: 'inactive', label: 'Inactive', color: 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800', items: filtered.filter(a => a.isActive === false) },
  ]

  const AgentAvatar = ({ agent, size = 'md' }: { agent: any; size?: 'sm' | 'md' | 'lg' }) => {
    const s = size === 'lg' ? 'w-20 h-20 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs'
    if (agent.avatar) {
      return <img src={agent.avatar} alt={`${agent.firstName} ${agent.lastName}`} className={`${s} rounded-full object-cover shadow-lg shrink-0`} />
    }
    return (
      <div className={`${s} rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0`}>
        {((agent.firstName?.[0] || '') + (agent.lastName?.[0] || '')).toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
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

              <div className="flex items-center gap-4">
                <div className="relative group">
                  {form.avatar ? (
                    <img src={form.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {((form.firstName?.[0] || '') + (form.lastName?.[0] || '')).toUpperCase() || '?'}
                    </div>
                  )}
                  <button type="button" onClick={() => (editAgent ? editFileInputRef : fileInputRef).current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo</p>
                  <p className="text-xs text-slate-400">Click to upload a photo</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatarUpload(e)} />
                <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatarUpload(e, true)} />
              </div>

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

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedAgent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {selectedAgent.avatar ? (
                  <img src={selectedAgent.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                    {((selectedAgent.firstName?.[0] || '') + (selectedAgent.lastName?.[0] || '')).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedAgent.firstName} {selectedAgent.lastName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><Mail size={13} />{selectedAgent.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedAgent.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedAgent.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedAgent.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">Agent</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Username', value: selectedAgent.userName, icon: IdCard },
                  { label: 'Phone', value: selectedAgent.phone, icon: Phone },
                  { label: 'Title', value: selectedAgent.title, icon: IdCard },
                  { label: 'Department', value: selectedAgent.department, icon: Building2 },
                  { label: 'Organization', value: selectedAgent.company?.name, icon: Building2 },
                  { label: 'Registered', value: formatDate(selectedAgent.createdAt), icon: Clock },
                  { label: 'Last Login', value: selectedAgent.lastLogin ? formatDate(selectedAgent.lastLogin) : 'Never', icon: Clock },
                  { label: 'Last Active', value: selectedAgent.lastActiveAt ? formatDate(selectedAgent.lastActiveAt) : 'Never', icon: Clock },
                ].filter(i => i.value).map(i => (
                  <div key={i.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><i.icon size={10} />{i.label}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5 truncate">{i.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center gap-2">
              <button onClick={() => { setSelectedAgent(null); openEdit(selectedAgent) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all border border-sky-200 dark:border-sky-800">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => { setSelectedAgent(null); handleToggle(selectedAgent) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedAgent.isActive !== false ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30'}`}>
                <Power size={14} /> {selectedAgent.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Headphones size={20} className="text-white" />
            </div>
            Agents
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{filtered.length} agent{filtered.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 transition-all">
            <Plus size={16} /> Add Agent
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button onClick={() => setView('cards')} className={`p-2 rounded-lg transition-all ${view === 'cards' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Card view">
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Table view">
              <Table2 size={18} />
            </button>
            <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Kanban view">
              <Columns size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search agents by name, email or organization..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >{s}{s === 'active' ? ` (${activeCount})` : s === 'inactive' ? ` (${inactiveCount})` : ''}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Headphones size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">{search || statusFilter !== 'all' ? 'No agents match your filters' : 'No agents yet'}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{search || statusFilter !== 'all' ? 'Try a different search or filter' : 'Click "Add Agent" to create one'}</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className={`h-1.5 ${a.isActive !== false ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <AgentAvatar agent={a} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{a.firstName} {a.lastName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"><Mail size={12} />{a.email}</p>
                    {a.company?.name && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={11} />{a.company.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${a.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {a.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  {a.title && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{a.title}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {a.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{a.phone}</span>
                    </div>
                  )}
                  {a.department && (
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{a.department}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={12} />
                    {a.lastLogin ? <span>Last login {formatDate(a.lastLogin)}</span> : <span>Never logged in</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedAgent(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="View Details"><Eye size={14} /></button>
                    <button
                      onClick={() => handleToggle(a)} disabled={toggling === a.id}
                      className={`p-1.5 rounded-lg transition-all ${a.isActive !== false ? 'text-emerald-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-red-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                      title={a.isActive !== false ? 'Deactivate' : 'Activate'}
                    >{toggling === a.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}</button>
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all" title="Deactivate"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'table' ? (
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
                        <AgentAvatar agent={a} size="sm" />
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${a.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {a.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{a.lastLogin ? formatDate(a.lastLogin) : 'Never'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedAgent(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="View"><Eye size={14} /></button>
                        <button onClick={() => handleToggle(a)} disabled={toggling === a.id}
                          className={`p-1.5 rounded-lg transition-all ${a.isActive !== false ? 'text-emerald-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-red-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                          title={a.isActive !== false ? 'Deactivate' : 'Activate'}
                        >{toggling === a.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}</button>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {kanbanGroups.map(col => (
            <div key={col.key} className={`rounded-2xl border ${col.color} overflow-hidden`}>
              <div className="p-4 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.key === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold text-slate-800 dark:text-white">{col.label}</h3>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background/80 text-slate-600 dark:text-slate-300">{col.items.length}</span>
                </div>
              </div>
              <div className="p-3 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                {col.items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No {col.label.toLowerCase()} agents</p>
                ) : col.items.map(a => (
                  <div key={a.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <AgentAvatar agent={a} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{a.email}</p>
                        {a.phone && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Phone size={11} />{a.phone}</p>
                        )}
                        {a.company?.name && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building2 size={11} />{a.company.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">{a.lastLogin ? `Last login ${formatDate(a.lastLogin)}` : 'Never logged in'}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedAgent(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="View"><Eye size={12} /></button>
                        <button onClick={() => handleToggle(a)} disabled={toggling === a.id}
                          className={`p-1.5 rounded-lg transition-all ${col.key === 'active' ? 'text-emerald-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-red-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                          title={col.key === 'active' ? 'Deactivate' : 'Activate'}
                        >{toggling === a.id ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}</button>
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all" title="Edit"><Pencil size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
