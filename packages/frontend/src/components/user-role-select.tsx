import { useState, useRef, useEffect } from 'react'
import { Search, X, Check, Users, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserRoleSelectProps {
  value: string
  users: any[]
  roles?: any[]
  onSelect: (value: string) => void
  placeholder?: string
}

export function userDisplayName(u: any) {
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.userName || u?.email || 'Unknown'
}

export function UserRoleSelect({ value, users, roles = [], onSelect, placeholder = 'Search users...' }: UserRoleSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedUser = users.find(u => u.id === value)
  const selectedRole = roles.find(r => r.id === value)
  const selectedName = selectedUser ? userDisplayName(selectedUser) : selectedRole?.name || ''

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
  const filteredUsers = q ? users.filter(u => userDisplayName(u).toLowerCase().includes(q)) : users
  const filteredRoles = q ? roles.filter(r => (r.name || '').toLowerCase().includes(q)) : roles
  const hasResults = filteredUsers.length > 0 || filteredRoles.length > 0

  function handleSelect(id: string) {
    setQuery('')
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
          placeholder={selectedName && !query ? selectedName : placeholder}
          className="flex h-9 w-full rounded-lg border border-input bg-background pl-7 pr-7 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Clear assignment"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {!hasResults ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No matches found</div>
          ) : (
            <>
              {filteredUsers.length > 0 && (
                <>
                  <div className="sticky top-0 flex items-center gap-1 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide bg-popover text-muted-foreground">
                    <Users size={11} /> Users
                  </div>
                  {filteredUsers.map((u: any) => (
                    <button
                      type="button"
                      key={u.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(u.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted',
                        u.id === value && 'bg-muted/60'
                      )}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{userDisplayName(u)}</span>
                        <span className="block text-[11px] text-muted-foreground">{u.role?.name || ''}</span>
                      </span>
                      {u.id === value && <Check size={13} className="mt-0.5 text-primary" />}
                    </button>
                  ))}
                </>
              )}
              {filteredRoles.length > 0 && (
                <>
                  <div className="sticky top-0 flex items-center gap-1 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide bg-popover text-muted-foreground">
                    <ShieldCheck size={11} /> Roles
                  </div>
                  {filteredRoles.map((r: any) => (
                    <button
                      type="button"
                      key={r.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(r.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted',
                        r.id === value && 'bg-muted/60'
                      )}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{r.name}</span>
                      </span>
                      {r.id === value && <Check size={13} className="mt-0.5 text-primary" />}
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
