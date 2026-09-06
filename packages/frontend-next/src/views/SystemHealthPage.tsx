'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Activity, Server, Cpu, MemoryStick, HardDrive, Boxes, Database, RefreshCw, Loader2, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmtBytes(b: number) {
  if (!b) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

function fmtDuration(sec: number) {
  if (!sec) return '—'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', className)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
        <Icon size={16} /> {title}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}{sub ? <span className="ml-1.5 text-xs text-muted-foreground">{sub}</span> : null}</span>
    </div>
  )
}

export function SystemHealthPage() {
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.adminSystemHealth(),
    refetchInterval: 30000,
  })

  const h = data?.data

  const doRefresh = async () => {
    setRefreshing(true)
    try { await refetch() } finally { setRefreshing(false) }
  }

  if (isLoading && !h) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Collecting system health…
      </div>
    )
  }

  if (isError && !h) {
    return (
      <div className="py-16 text-center text-sm text-red-600 dark:text-red-400">
        Could not read system health. Check your connection and try again.
      </div>
    )
  }

  const memPct = pct(h?.memory?.usedB, h?.memory?.totalB)
  const diskPct = pct(h?.disk?.usedB, h?.disk?.totalB)
  const load = h?.system?.loadavg || [0, 0, 0]
  const cpus = h?.system?.cpus || 1
  const loadNorm = load.map((v: number) => (v / cpus) * 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {h?.now ? `Snapshot ${new Date(h.now).toLocaleString()}` : ''} — auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={doRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-60"
        >
          {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh now
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Cpu size={16} /> CPU Load</div>
          <p className="mt-2 text-2xl font-bold">{load[0].toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">1min / {cpus} cores</p>
          <div className="mt-3"><Bar value={loadNorm[0]} className="bg-gradient-to-r from-sky-500 to-indigo-600" /></div>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">5m: {load[1].toFixed(2)} · 15m: {load[2].toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><MemoryStick size={16} /> Memory</div>
          <p className="mt-2 text-2xl font-bold">{memPct}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtBytes(h?.memory?.usedB)} / {fmtBytes(h?.memory?.totalB)}</p>
          <div className="mt-3"><Bar value={memPct} className={memPct > 85 ? 'bg-red-500' : memPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'} /></div>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">avail {fmtBytes(h?.memory?.availableB)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><HardDrive size={16} /> Disk</div>
          <p className="mt-2 text-2xl font-bold">{diskPct}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtBytes(h?.disk?.freeB)} free of {fmtBytes(h?.disk?.totalB)}</p>
          <div className="mt-3"><Bar value={diskPct} className={diskPct > 85 ? 'bg-red-500' : diskPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'} /></div>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">{h?.disk?.mount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Database size={16} /> Database & App</div>
          <p className={cn('mt-2 inline-flex items-center gap-1.5 text-xl font-bold', h?.db?.ok ? 'text-emerald-500' : 'text-red-500')}>
            <span className={cn('h-2.5 w-2.5 rounded-full', h?.db?.ok ? 'bg-emerald-500' : 'bg-red-500')} /> {h?.db?.ok ? 'Healthy' : 'Down'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">DB latency {h?.db?.latencyMs} ms · node {h?.app?.nodeVersion}</p>
          <div className="mt-3"><Bar value={Math.min(100, (h?.app?.mem?.rss || 0) / ((h?.memory?.totalB || 1e9) / 100))} className="bg-gradient-to-r from-teal-500 to-emerald-600" /></div>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">app rss {fmtBytes(h?.app?.mem?.rss)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="System" icon={Server}>
          <Row label="Hostname" value={h?.system?.hostname} />
          <Row label="Platform" value={`${h?.system?.platform} / ${h?.system?.arch}`} />
          <Row label="Kernel" value={h?.system?.osRelease} />
          <Row label="CPU cores" value={String(h?.system?.cpus)} />
          <Row label="System uptime" value={fmtDuration(h?.system?.uptimeSec)} />
          <Row label="App uptime" value={fmtDuration(h?.app?.uptimeSec)} />
          <Row label="Zombie processes" value={String(h?.system?.zombieCount || 0)} sub={`of ${h?.system?.processCount} visible`} />
          <Row label="App PID" value={String(h?.app?.pid)} sub={h?.app?.cwd} />
        </Card>

        <Card title="Docker Containers" icon={Boxes}>
          {!h?.docker?.available ? (
            <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <TriangleAlert size={15} /> Docker socket not readable: {h?.docker?.reason}
            </p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                {(h?.docker?.containers || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', c.state === 'running' ? 'bg-emerald-500' : c.state === 'exited' ? 'bg-slate-400' : 'bg-red-500')} />
                      <span className="truncate font-medium">{c.name}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {c.state === 'running' ? `${fmtBytes(c.memUseB)} / ${fmtBytes(c.memLimitB)} · ${c.cpuPct}%` : c.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Image layers</span><span className="font-mono">{fmtBytes(h?.docker?.layersSizeB)}</span></div>
                <div className="flex justify-between"><span>Build cache</span><span className="font-mono">{fmtBytes(h?.docker?.buildCacheSizeB)}</span></div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card title="Top Processes by CPU" icon={Activity}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">PID</th>
                <th className="py-1.5 pr-3 font-medium">Process</th>
                <th className="py-1.5 pr-3 font-medium">State</th>
                <th className="py-1.5 pr-3 font-medium">CPU (lifetime)</th>
                <th className="py-1.5 font-medium">RSS</th>
              </tr>
            </thead>
            <tbody>
              {(h?.topProcesses?.byCpu || []).map((p: any) => (
                <tr key={p.pid} className="border-t border-muted">
                  <td className="py-1.5 pr-3 font-mono text-muted-foreground">{p.pid}</td>
                  <td className="py-1.5 pr-3 max-w-[260px] truncate">{p.cmd || p.comm}</td>
                  <td className="py-1.5 pr-3 font-mono">{p.state}</td>
                  <td className="py-1.5 pr-3 font-mono">{p.cpuPct || 0}%</td>
                  <td className="py-1.5 font-mono">{fmtBytes(p.rssB)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}