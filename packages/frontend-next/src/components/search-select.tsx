'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchOption {
  value: string
  label: string
  sub?: string
  group?: string
}

interface SearchSelectProps {
  value: string
  options: (string | SearchOption)[]
  onSelect: (value: string) => void
  placeholder?: string
  emptyText?: string
}

export function SearchSelect({ value, options, onSelect, placeholder = 'Search...', emptyText = 'No matches found' }: SearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const norm = (o: string | SearchOption): SearchOption =>
    typeof o === 'string' ? { value: o, label: o } : o

  const selected = options.map(norm).find(o => o.value === value)

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
  const all = options.map(norm)
  const filtered = q
    ? all.filter(o => o.label.toLowerCase().includes(q) || (o.sub || '').toLowerCase().includes(q))
    : all

  const groups: { group?: string; items: SearchOption[] }[] = []
  for (const o of filtered) {
    const key = o.group || ''
    const g = groups.find(x => x.group === key)
    if (g) g.items.push(o)
    else groups.push({ group: key, items: [o] })
  }

  function handleSelect(o: SearchOption) {
    setQuery('')
    setOpen(false)
    onSelect(o.value)
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
          placeholder={selected && !query ? selected.label : placeholder}
          className="flex h-9 w-full rounded-lg border border-input bg-background pl-7 pr-7 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            groups.map((g, i) => (
              <div key={g.group || `g${i}`}>
                {g.group && (
                  <div className="sticky top-0 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide bg-popover text-muted-foreground">
                    {g.group}
                  </div>
                )}
                {g.items.map(o => (
                  <button
                    type="button"
                    key={o.value}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleSelect(o)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted',
                      o.value === value && 'bg-muted/60'
                    )}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{o.label}</span>
                      {o.sub && <span className="block text-[11px] text-muted-foreground">{o.sub}</span>}
                    </span>
                    {o.value === value && <Check size={13} className="mt-0.5 text-primary" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
