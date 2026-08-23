import { useState, useRef, useEffect } from 'react'
import { Search, X, Check, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface UserRoleSelectProps {
  value: string
  users: any[]
  roles?: any[]
  groups?: any[]
  onSelect: (value: string) => void
  placeholder?: string
}

export function userDisplayName(u: any) {
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.userName || u?.email || 'Unknown'
}

export function UserRoleSelect({ value, users, roles = [], groups, onSelect, placeholder = 'Search users or groups...' }: UserRoleSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const { data: groupsData } = useQuery({
    queryKey: ['usergroups', 'assignment-picker'],
    queryFn: () => api.listGroups().catch(() => ({ data: [] })),
    enabled: groups === undefined,
    staleTime: 60_000,
  })
  const availableGroups = groups ?? groupsData?.data ?? []

  const selectedUser = users.find(u => u.id === value)
  const selectedGroup = availableGroups.find(g => g.id === value)
  const selectedRole = roles.find(r => r.id === value)
  const selectedName = selectedUser ? userDisplayName(selectedUser) : selectedGroup?.name || selectedRole?.name || ''

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
  const filteredGroups = q ? availableGroups.filter(g => (g.name || '').toLowerCase().includes(q)) : availableGroups
  const hasResults = filteredUsers.length > 0 || filteredGroups.length > 0

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
              {filteredGroups.length > 0 && (
                <>
                  <div className="sticky top-0 flex items-center gap-1 border-t bg-popover px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Users size={11} /> Groups
                  </div>
                  {filteredGroups.map((g: any) => (
                    <button
                      type="button"
                      key={g.id}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(g.id)}
                      className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted', g.id === value && 'bg-primary/10 text-primary')}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><Users size={14} /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium">{g.name}</span><span className="block text-[11px] text-muted-foreground">{g.members?.length ?? 0} members</span></span>
                      {g.id === value && <Check size={13} className="text-primary" />}
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
