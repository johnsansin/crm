'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Building2, Users, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDate, useOrgSettings } from '@/lib/org-format'

export function AdminPage() {
  useOrgSettings()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadCompanies = () => {
    setLoading(true)
    api.adminListCompanies().then(res => { setCompanies(res.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { loadCompanies() }, [])

  const toggleOrg = async (id: string) => {
    setToggling(id)
    try {
      await api.adminToggleCompany(id)
      await loadCompanies()
    } catch {}
    setToggling(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage all organizations</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid gap-4">
          {companies.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <span className={`inline-block w-2 h-2 rounded-full ${c.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Users size={12} />{c._count?.users || 0} users</span>
                    <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(c.createdAt)}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${c.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {c.isActive !== false ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleOrg(c.id)}
                  disabled={toggling === c.id}
                  className={`p-2 rounded-lg transition-colors ${c.isActive !== false ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950'}`}
                  title={c.isActive !== false ? 'Deactivate' : 'Activate'}
                >
                  {toggling === c.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                  ) : c.isActive !== false ? (
                    <ToggleRight size={22} />
                  ) : (
                    <ToggleLeft size={22} />
                  )}
                </button>
              </div>
            </div>
          ))}
          {companies.length === 0 && <p className="text-center text-muted-foreground py-8">No organizations found</p>}
        </div>
      )}
    </div>
  )
}