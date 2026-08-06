import { SearchSelect } from '@/components/search-select'
import { Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VendorSearchSelectProps {
  value: string
  vendors: any[]
  onSelect: (id: string) => void
  onAddNew: () => void
  onOpenFullForm: () => void
}

export function VendorSearchSelect({ value, vendors, onSelect, onAddNew, onOpenFullForm }: VendorSearchSelectProps) {
  const options = vendors.map(v => ({
    value: v.id,
    label: v.vendorName || v.id,
    sub: [v.email, v.phone].filter(Boolean).join(' · ') || undefined,
    group: 'Vendors',
  }))

  return (
    <div className="space-y-1.5">
      <SearchSelect
        value={value}
        options={options}
        onSelect={onSelect}
        placeholder="Search vendor..."
        emptyText="No vendors found"
      />
      {value && (
        <p className="text-xs text-muted-foreground">
          {vendors.find(v => v.id === value)?.vendorName || 'Vendor selected'}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button type="button" size="sm" variant="outline" onClick={onAddNew} className="h-7 px-2 text-xs">
          <Plus size={12} className="mr-1" /> Add New Vendor
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onOpenFullForm} className="h-7 px-2 text-xs">
          Open Full Form <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
