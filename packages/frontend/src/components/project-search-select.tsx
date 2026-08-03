import { useState, useRef, useEffect } from 'react'
import { Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectSearchSelectProps {
  value: string
  projects: any[]
  onSelect: (projectId: string) => void
  placeholder?: string
}

export function ProjectSearchSelect({ value, projects, onSelect, placeholder = 'Search project...' }: ProjectSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = projects.find(p => p.id === value)

  useEffect(() => {
    if (value === '' && query) setQuery('')
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? projects.filter(p =>
        [p.projectName, p.projectNo].filter(Boolean).some((f: string) => f.toLowerCase().includes(q)))
    : projects

  function handleSelect(id: string) {
    const project = projects.find(p => p.id === id)
    setQuery(project ? project.projectName || '' : '')
    setOpen(false)
    onSelect(id)
  }

  function handleClear() {
    setQuery('')
    setOpen(false)
    onSelect('')
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
          placeholder={selected && !query ? selected.projectName || '' : placeholder}
          className="flex h-8 w-full rounded-md border border-input bg-background pl-7 pr-7 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Clear project"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No projects found</div>
          ) : (
            filtered.map(p => (
              <button
                type="button"
                key={p.id}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(p.id)}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-muted',
                  p.id === value && 'bg-muted/60'
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{p.projectName || p.id}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {[p.projectNo, p.status, p.priority].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {p.id === value && <Check size={13} className="mt-0.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
