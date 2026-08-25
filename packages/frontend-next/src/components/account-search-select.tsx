'use client'

import { SearchSelect } from '@/components/search-select'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AccountSearchSelectProps {
  value: string
  accounts: any[]
  onSelect: (id: string) => void
  onOpenFullForm: () => void
}

export function AccountSearchSelect({ value, accounts, onSelect, onOpenFullForm }: AccountSearchSelectProps) {
  const options = accounts.map(a => ({
    value: a.id,
    label: a.accountName || a.id,
    sub: [a.email, a.phone].filter(Boolean).join(' · ') || undefined,
    group: 'Accounts',
  }))

  return (
    <div className="space-y-1.5">
      <SearchSelect
        value={value}
        options={options}
        onSelect={onSelect}
        placeholder="Search account..."
        emptyText="No accounts found"
      />
      {value && (
        <p className="text-xs text-muted-foreground">
          {accounts.find(a => a.id === value)?.accountName || 'Account selected'}
        </p>
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onOpenFullForm} className="h-7 px-2 text-xs">
        Open Full Form <ArrowRight size={12} className="ml-1" />
      </Button>
    </div>
  )
}
