import { useState } from 'react'
import { Database, Mail, ArrowLeft, ChevronRight } from 'lucide-react'
import { DataSettings } from '@/pages/settings/DataSettings'
import { EmailSettings } from '@/pages/settings/EmailSettings'

const sections = [
  { key: 'data', label: 'Data Management', icon: Database, desc: 'Backup, export, and CSV import', tint: 'from-teal-500 to-emerald-700' },
  { key: 'email', label: 'Email / SMTP', icon: Mail, desc: 'Outgoing mail server, test and send emails', tint: 'from-orange-500 to-amber-600' },
]

export function SuperAdminSettings() {
  const [active, setActive] = useState<string | null>(null)
  const sec = sections.find(s => s.key === active)

  if (sec) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setActive(null)}
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> All Settings
        </button>
        <div className="p-5 md:p-6 rounded-2xl border bg-card relative overflow-hidden">
          <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${sec.tint} opacity-20 blur-2xl pointer-events-none`} />
          <div className="relative flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${sec.tint} text-white flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
              <sec.icon size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">{sec.label}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{sec.desc}</p>
            </div>
          </div>
        </div>
        {sec.key === 'data' && <DataSettings />}
        {sec.key === 'email' && <EmailSettings />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Superadmin settings</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className="group text-left p-4 rounded-2xl border bg-card hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
          >
            <div className="flex items-start gap-3.5">
              <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${s.tint} text-white flex items-center justify-center shadow-md shadow-black/5 group-hover:scale-105 transition-transform`}>
                <s.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold flex items-center justify-between gap-2">
                  {s.label}
                  <ChevronRight size={15} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
