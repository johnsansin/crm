'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceSearchSelectProps {
  value: string
  services: any[]
  onSelect: (serviceId: string) => void
  placeholder?: string
  inputClassName?: string
}

export function ServiceSearchSelect({ value, services, onSelect, placeholder = 'Search service...', inputClassName }: ServiceSearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = services.find(s => s.id === value)

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
    ? services.filter(s =>
        [s.serviceName, s.serviceNo].filter(Boolean).some((f: string) => f.toLowerCase().includes(q)))
    : services

  function handleSelect(id: string) {
    const service = services.find(s => s.id === id)
    setQuery(service ? service.serviceName || '' : '')
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
          placeholder={selected && !query ? selected.serviceName || '' : placeholder}
          className={cn('flex h-8 w-full rounded-md border border-input bg-background pl-7 pr-7 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', inputClassName)}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Clear service"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No services found</div>
          ) : (
            filtered.map(s => (
              <button
                type="button"
                key={s.id}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(s.id)}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-muted',
                  s.id === value && 'bg-muted/60'
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{s.serviceName || s.id}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {[s.serviceNo, s.serviceCategory].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {s.unitPrice != null && Number(s.unitPrice) > 0 && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">${Number(s.unitPrice).toFixed(2)}</span>
                )}
                {s.id === value && <Check size={13} className="mt-0.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
