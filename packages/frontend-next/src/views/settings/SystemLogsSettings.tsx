'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Trash2, Search, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const LEVELS = [
  { key: 'all', label: 'All', cls: '' },
  { key: 'error', label: 'Errors', cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  { key: 'warn', label: 'Warnings', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { key: 'info', label: 'Info', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  { key: 'log', label: 'Logs', cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400' },
]

const LEVEL_BADGE: Record<string, string> = {
  log: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
}

export function SystemLogsSettings() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState('all')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const res = await api.adminGetLogs({ level, q, limit: 300 })
      setLogs(res.data || [])
    } catch { /* keep current */ }
  }

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [level, q])

  const clear = async () => {
    if (!window.confirm('Clear all captured application logs? This cannot be undone.')) return
    try {
      await api.adminClearLogs()
      setLogs([])
      addToast({ title: 'Logs cleared', variant: 'success' })
    } catch (e: any) {
      addToast({ title: 'Could not clear logs', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {LEVELS.map(l => (
            <button
              key={l.key}
              onClick={() => setLevel(l.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                level === l.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setQ(e.target.value) }}
              placeholder="Search logs..."
              className="h-9 w-52 pl-8 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
          <Button variant="destructive" size="sm" onClick={clear}><Trash2 size={14} className="mr-1.5" />Clear</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <Clock size={13} className="text-muted-foreground" />
          Auto-refreshes every 4 seconds. The latest {logs.length} captured entries are shown (ring-buffer of the backend console output).
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No logs match the current filter.</div>
          ) : (
            <ul className="divide-y">
              {logs.map((log, i) => (
                <li key={`${log.ts}-${i}`} className="flex items-start gap-3 px-4 py-2.5 font-mono text-xs">
                  <span className="shrink-0 whitespace-nowrap text-muted-foreground">{formatTime(log.ts)}</span>
                  <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', LEVEL_BADGE[log.level] || LEVEL_BADGE.log)}>
                    {log.level}
                  </span>
                  <span className={cn('min-w-0 whitespace-pre-wrap break-words',
                    log.level === 'error' ? 'text-red-600 dark:text-red-400'
                    : log.level === 'warn' ? 'text-amber-700 dark:text-amber-300'
                    : 'text-foreground/80')}>
                    {log.msg}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
