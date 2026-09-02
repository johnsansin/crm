export default function CrmLoading() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading page">
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div className="space-y-2"><div className="h-5 w-36 rounded bg-muted" /><div className="h-3 w-56 max-w-[60vw] rounded bg-muted" /></div>
        <div className="h-9 w-24 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-24 rounded-xl border bg-card" />)}
      </div>
      <div className="h-72 rounded-xl border bg-card" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
