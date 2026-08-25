'use client'

import { SearchSelect } from '@/components/search-select'

interface ContactSearchSelectProps {
  value: string
  contacts: any[]
  onSelect: (id: string) => void
}

export function ContactSearchSelect({ value, contacts, onSelect }: ContactSearchSelectProps) {
  const options = contacts.map(c => ({
    value: c.id,
    label: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id,
    sub: [c.email, c.phone, c.accountName].filter(Boolean).join(' · ') || undefined,
    group: 'Contacts',
  }))

  return (
    <div className="space-y-1.5">
      <SearchSelect
        value={value}
        options={options}
        onSelect={onSelect}
        placeholder="Search contact..."
        emptyText="No contacts found"
      />
      {value && (
        <p className="text-xs text-muted-foreground">
          {contacts.find(c => c.id === value) ? [contacts.find(c => c.id === value)?.firstName, contacts.find(c => c.id === value)?.lastName].filter(Boolean).join(' ') : 'Contact selected'}
        </p>
      )}
    </div>
  )
}
