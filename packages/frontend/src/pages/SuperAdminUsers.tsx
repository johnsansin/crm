import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Users, Mail, Shield, Search, Building2, LayoutGrid, Table2,
  Calendar, Phone, MapPin, IdCard, Clock, Globe, ChevronRight, Plus, X
} from 'lucide-react'
import { formatDate, useOrgSettings } from '@/lib/org-format'

type ViewMode = 'table' | 'cards' | 'kanban'

export function SuperAdminUsers() {
  useOrgSettings()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('cards')
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyRoles, setCompanyRoles] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    userName: '', email: '', firstName: '', lastName: '', password: '',
    companyId: '', isAdmin: false, roleId: '', phone: '', department: '', title: ''
  })

  const loadUsers = () => {
    api.adminListUsers().then(res => {
      const raw = res.data || []
      const sorted = raw.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUsers(sorted)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    if (showCreate && companies.length === 0) {
      api.adminListCompanies().then(res => setCompanies(res.data || [])).catch(() => {})
    }
  }, [showCreate])

  useEffect(() => {
    if (form.companyId) {
      api.adminCompanyRoles(form.companyId).then(res => {
        setCompanyRoles(res.data || [])
        setForm(f => ({ ...f, roleId: '' }))
      }).catch(() => setCompanyRoles([]))
    } else {
      setCompanyRoles([])
    }
  }, [form.companyId])

  const openCreate = () => {
    setForm({ userName: '', email: '', firstName: '', lastName: '', password: '', companyId: '', isAdmin: false, roleId: '', phone: '', department: '', title: '' })
    setCreateError('')
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await api.adminCreateUser(form)
      setShowCreate(false)
      loadUsers()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const filtered = users.filter(u => {
    if (search) {
      const q = search.toLowerCase()
      if (!u.email.toLowerCase().includes(q) &&
          !(u.firstName || '').toLowerCase().includes(q) &&
          !(u.lastName || '').toLowerCase().includes(q) &&
          !(u.phone || '').toLowerCase().includes(q) &&
          !(u.mobile || '').toLowerCase().includes(q) &&
          !(u.company?.name || '').toLowerCase().includes(q)) return false
    }
    if (roleFilter === 'superadmin' && !u.isSuperAdmin) return false
    if (roleFilter === 'admin' && (!u.isAdmin || u.isSuperAdmin)) return false
    if (roleFilter === 'user' && (u.isAdmin || u.isSuperAdmin)) return false
    if (statusFilter === 'active' && u.isActive === false) return false
    if (statusFilter === 'inactive' && u.isActive !== false) return false
    return true
  })

  const getRole = (u: any) => {
    if (u.isSuperAdmin) return { label: 'Super Admin', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', icon: Shield }
    if (u.isAdmin) return { label: 'Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Building2 }
    return { label: 'User', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: Users }
  }

  const kanbanGroups = [
    { key: 'Super Admin', label: 'Super Admin', color: 'bg-sky-50/80 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800', items: filtered.filter(u => u.isSuperAdmin) },
    { key: 'Admin', label: 'Admins', color: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', items: filtered.filter(u => u.isAdmin && !u.isSuperAdmin) },
    { key: 'User', label: 'Users', color: 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700', items: filtered.filter(u => !u.isAdmin && !u.isSuperAdmin) },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Create User Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !creating && setShowCreate(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Agent</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create a new user in an organization</p>
              </div>
              <button onClick={() => !creating && setShowCreate(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {createError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">{createError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Organization *</label>
                <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all">
                  <option value="">Select organization...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username *</label>
                  <input type="text" required value={form.userName} onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="johndoe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Password *</label>
                <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="Min 8 characters" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="+92..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="Sales Agent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
                  <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" placeholder="Sales" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                  <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all">
                    <option value="">No role</option>
                    {companyRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-500/30" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Admin privileges</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{filtered.length} users across all organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button onClick={() => setView('cards')} className={`p-2 rounded-lg transition-all ${view === 'cards' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Card view">
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView('table')} className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} title="Table view">
              <Table2 size={18} />
            </button>
          </div>
        </div>
      </div>

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
          {(['all', 'superadmin', 'admin', 'user'] as const).map(o => (
            <button key={o} onClick={() => setRoleFilter(o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap capitalize ${
                roleFilter === o
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >{o === 'all' ? 'All' : o === 'superadmin' ? 'Super Admin' : o === 'admin' ? 'Admin' : 'User'}</button>
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
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRole(selectedUser).color}`}>{getRole(selectedUser).label}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><Mail size={13} />{selectedUser.email}</p>
                {(selectedUser.phone || selectedUser.mobile) && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><Phone size={13} />{selectedUser.phone || selectedUser.mobile}</p>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <span className="sr-only">Close</span>×
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Username', value: selectedUser.userName },
                { label: 'Title', value: selectedUser.title },
                { label: 'Department', value: selectedUser.department },
                { label: 'Phone', value: selectedUser.phone },
                { label: 'Mobile', value: selectedUser.mobile },
                { label: 'Organization', value: selectedUser.company?.name },
                { label: 'Timezone', value: selectedUser.timezone },
                { label: 'Language', value: selectedUser.language },
                { label: 'Street', value: selectedUser.addressStreet },
                { label: 'City', value: selectedUser.addressCity },
                { label: 'State', value: selectedUser.addressState },
                { label: 'Country', value: selectedUser.addressCountry },
                { label: 'Postal Code', value: selectedUser.addressPostalCode },
                { label: 'PBX Extension', value: selectedUser.pbxExtension },
                { label: 'Registered', value: formatDate(selectedUser.createdAt) },
                { label: 'Last Login', value: selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never' },
              ].filter(i => i.value).map(i => (
                <div key={i.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{i.label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5 truncate">{i.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No users found</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => {
            const role = getRole(u)
            const RoleIcon = role.icon
            return (
              <div key={u.id} onClick={() => setSelectedUser(u)} className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className={`h-1.5 ${u.isSuperAdmin ? 'bg-gradient-to-r from-sky-500 to-blue-600' : u.isAdmin ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500'}`} />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
                      {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{u.firstName} {u.lastName}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1"><Mail size={12} />{u.email}</p>
                      {u.company?.name && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Building2 size={11} />{u.company.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${role.color}`}>
                      <RoleIcon size={11} />{role.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {(u.phone || u.mobile) && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{u.phone || u.mobile}</span>
                      </div>
                    )}
                    {(u.addressCity || u.addressCountry) && (
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{[u.addressCity, u.addressCountry].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {u.title && (
                      <div className="flex items-center gap-2">
                        <IdCard size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{u.title}</span>
                      </div>
                    )}
                    {u.department && (
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{u.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock size={12} />
                      {u.lastLogin ? <span>Last login {formatDate(u.lastLogin)}</span> : <span>Never logged in</span>}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition-colors" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : view === 'table' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Company</th>
                  <th className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Last Login</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(u => {
                  const role = getRole(u)
                  return (
                    <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md shrink-0">
                            {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.phone || u.mobile || '-'}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>{role.label}</span></td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.company?.name || '-'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {kanbanGroups.map(col => (
            <div key={col.key} className={`rounded-2xl border ${col.color} overflow-hidden`}>
              <div className="p-4 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{col.label}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background/80 text-slate-600 dark:text-slate-300">{col.items.length}</span>
                </div>
              </div>
              <div className="p-3 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                {col.items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No {col.label.toLowerCase()}</p>
                ) : col.items.map(u => (
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
                        {(u.phone || u.mobile) && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Phone size={11} />{u.phone || u.mobile}</p>
                        )}
                        {u.company?.name && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building2 size={11} />{u.company.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
