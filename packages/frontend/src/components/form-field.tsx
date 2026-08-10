import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DateField } from '@/components/ui/date-field'
import { getFieldLabel } from '@/lib/field-utils'

export function FormField({ field, type = 'text', options, label, form, updateForm, accounts, contacts, potentials, products }: {
  field: string; type?: string; options?: string[]; label?: string;
  form: any; updateForm: (field: string, value: any) => void;
  accounts?: any[]; contacts?: any[]; potentials?: any[]; products?: any[];
}) {
  const value = form[field] ?? ''
  const lbl = label || getFieldLabel(field)

  if (type === 'select') {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
        <Select value={value} onValueChange={(v) => updateForm(field, v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{(options || []).map(o => <SelectItem key={o} value={o === '--None--' ? '' : o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
        <textarea className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]" value={value} onChange={e => updateForm(field, e.target.value)} />
      </div>
    )
  }
  if (type === 'number') {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
        <Input type="number" step="0.01" className="h-9 text-sm" value={value} onChange={e => updateForm(field, parseFloat(e.target.value) || 0)} />
      </div>
    )
  }
  if (type === 'date') {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
        <DateField className="h-9 text-sm" value={value} onChange={(v) => updateForm(field, v)} />
      </div>
    )
  }
  if (type === 'lookup') {
    const items = field === 'accountId' ? (accounts || []) : field === 'contactId' ? (contacts || []) : (potentials || [])
    const placeholder = field === 'accountId' ? 'Select Account' : field === 'contactId' ? 'Select Contact' : 'Select Potential'
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
        <Select value={value} onValueChange={(v) => updateForm(field, v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{placeholder}</SelectItem>
            {items.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>
                {field === 'accountId' ? i.accountName : field === 'contactId' ? `${i.firstName || ''} ${i.lastName || ''}`.trim() : i.potentialName || i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{lbl}</label>
      <Input type={type} className="h-9 text-sm" value={value} onChange={e => updateForm(field, e.target.value)} />
    </div>
  )
}
