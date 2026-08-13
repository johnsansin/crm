import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Target, Loader2, Save, Undo2 } from 'lucide-react'

export const LEAD_SOURCE_FIELDS: { field: string; label: string }[] = [
  { field: 'firstName', label: 'First Name' },
  { field: 'lastName', label: 'Last Name' },
  { field: 'title', label: 'Title' },
  { field: 'company', label: 'Company' },
  { field: 'email', label: 'Email' },
  { field: 'secondaryEmail', label: 'Secondary Email' },
  { field: 'phone', label: 'Phone' },
  { field: 'mobile', label: 'Mobile' },
  { field: 'fax', label: 'Fax' },
  { field: 'website', label: 'Website' },
  { field: 'leadSource', label: 'Lead Source' },
  { field: 'leadStatus', label: 'Lead Status' },
  { field: 'industry', label: 'Industry' },
  { field: 'annualRevenue', label: 'Annual Revenue' },
  { field: 'noOfEmployees', label: 'No. of Employees' },
  { field: 'rating', label: 'Rating' },
  { field: 'street', label: 'Street' },
  { field: 'city', label: 'City' },
  { field: 'state', label: 'State' },
  { field: 'country', label: 'Country' },
  { field: 'postalCode', label: 'Postal Code' },
  { field: 'poBox', label: 'PO Box' },
  { field: 'description', label: 'Description' },
  { field: 'interest', label: 'Interest' },
]

const MODULE_TARGET_FIELDS: { module: string; label: string; fields: { field: string; label: string }[] }[] = [
  {
    module: 'account',
    label: 'Account',
    fields: [
      { field: 'accountName', label: 'Account Name' },
      { field: 'website', label: 'Website' },
      { field: 'phone', label: 'Phone' },
      { field: 'fax', label: 'Fax' },
      { field: 'email', label: 'Email' },
      { field: 'industry', label: 'Industry' },
      { field: 'annualRevenue', label: 'Annual Revenue' },
      { field: 'rating', label: 'Rating' },
      { field: 'employees', label: 'Employees' },
      { field: 'accountType', label: 'Account Type' },
      { field: 'ownership', label: 'Ownership' },
      { field: 'billingStreet', label: 'Billing Street' },
      { field: 'billingCity', label: 'Billing City' },
      { field: 'billingState', label: 'Billing State' },
      { field: 'billingCountry', label: 'Billing Country' },
      { field: 'billingPostalCode', label: 'Billing Postal Code' },
      { field: 'billingPoBox', label: 'Billing PO Box' },
      { field: 'shippingStreet', label: 'Shipping Street' },
      { field: 'shippingCity', label: 'Shipping City' },
      { field: 'shippingState', label: 'Shipping State' },
      { field: 'shippingCountry', label: 'Shipping Country' },
      { field: 'shippingPostalCode', label: 'Shipping Postal Code' },
      { field: 'shippingPoBox', label: 'Shipping PO Box' },
      { field: 'description', label: 'Description' },
    ],
  },
  {
    module: 'contact',
    label: 'Contact',
    fields: [
      { field: 'salutation', label: 'Salutation' },
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'title', label: 'Title' },
      { field: 'email', label: 'Email' },
      { field: 'secondaryEmail', label: 'Secondary Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'mobile', label: 'Mobile' },
      { field: 'fax', label: 'Fax' },
      { field: 'leadSource', label: 'Lead Source' },
      { field: 'department', label: 'Department' },
      { field: 'mailingStreet', label: 'Mailing Street' },
      { field: 'mailingCity', label: 'Mailing City' },
      { field: 'mailingState', label: 'Mailing State' },
      { field: 'mailingCountry', label: 'Mailing Country' },
      { field: 'mailingPostalCode', label: 'Mailing Postal Code' },
      { field: 'mailingPoBox', label: 'Mailing PO Box' },
      { field: 'description', label: 'Description' },
    ],
  },
  {
    module: 'potential',
    label: 'Opportunity',
    fields: [
      { field: 'potentialName', label: 'Opportunity Name' },
      { field: 'amount', label: 'Amount' },
      { field: 'closingDate', label: 'Closing Date' },
      { field: 'stage', label: 'Stage' },
      { field: 'probability', label: 'Probability (%)' },
      { field: 'nextStep', label: 'Next Step' },
      { field: 'leadSource', label: 'Lead Source' },
      { field: 'description', label: 'Description' },
    ],
  },
]

const DEFAULT_UI_MAP: Record<string, Record<string, string>> = {
  account: {
    website: 'website', phone: 'phone', fax: 'fax', email: 'email', industry: 'industry',
    annualRevenue: 'annualRevenue', rating: 'rating', employees: 'noOfEmployees',
    billingStreet: 'street', billingCity: 'city', billingState: 'state', billingCountry: 'country',
    billingPostalCode: 'postalCode', billingPoBox: 'poBox',
    shippingStreet: 'street', shippingCity: 'city', shippingState: 'state', shippingCountry: 'country',
    shippingPostalCode: 'postalCode', shippingPoBox: 'poBox', description: 'description',
  },
  contact: {
    salutation: 'salutation', firstName: 'firstName', lastName: 'lastName', title: 'title',
    email: 'email', secondaryEmail: 'secondaryEmail', phone: 'phone', mobile: 'mobile',
    fax: 'fax', leadSource: 'leadSource',
    mailingStreet: 'street', mailingCity: 'city', mailingState: 'state', mailingCountry: 'country',
    mailingPostalCode: 'postalCode', mailingPoBox: 'poBox', description: 'description',
  },
  potential: {
    potentialName: 'company', amount: 'annualRevenue', leadSource: 'leadSource',
  },
}

type Mapping = Record<string, Record<string, string>>

export function LeadSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })

  const [mapping, setMapping] = useState<Mapping>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!settings) return
    const stored = settings.leadConversionMapping || {}
    const merged: Mapping = {}
    for (const mod of MODULE_TARGET_FIELDS) {
      merged[mod.module] = {}
      for (const f of mod.fields) {
        const src = stored[mod.module]?.[f.field] || DEFAULT_UI_MAP[mod.module]?.[f.field] || ''
        if (src) merged[mod.module][f.field] = src
      }
    }
    setMapping(merged)
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => api.updateOrgSettings({ leadConversionMapping: mapping }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
      setDirty(false)
      addToast({ title: 'Saved', description: 'Lead conversion mapping updated', variant: 'success' })
    },
    onError: (e: any) => addToast({ title: 'Save failed', description: e?.message || 'Something went wrong', variant: 'destructive' }),
  })

  const setMap = (module: string, target: string, src: string) => {
    setMapping(m => {
      const next: Mapping = { ...m, [module]: { ...(m[module] || {}) } }
      if (src) next[module][target] = src
      else delete next[module][target]
      return next
    })
    setDirty(true)
  }

  const resetAll = () => {
    setMapping(prev => {
      const next: Mapping = {}
      for (const mod of MODULE_TARGET_FIELDS) {
        next[mod.module] = {}
        for (const f of mod.fields) {
          const src = DEFAULT_UI_MAP[mod.module]?.[f.field]
          if (src) next[mod.module][f.field] = src
        }
      }
      return next
    })
    setDirty(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Map Lead fields to Account, Contact and Opportunity fields used when converting a Lead.
          Defaults apply automatically; assign a Lead field below to override a target field.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetAll}><Undo2 size={14} className="mr-1" /> Reset to defaults</Button>
          <Button size="sm" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Save mapping
          </Button>
        </div>
      </div>

      {MODULE_TARGET_FIELDS.map(mod => (
        <Card key={mod.module}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Target size={16} className="text-primary" /> {mod.label}</CardTitle>
            <CardDescription>Choose which Lead field populates each {mod.label} field on conversion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {mod.fields.map(f => (
                <div key={f.field}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  <Select
                    value={mapping[mod.module]?.[f.field] || 'none'}
                    onValueChange={v => setMap(mod.module, f.field, v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Default —</SelectItem>
                      {LEAD_SOURCE_FIELDS.map(sf => (
                        <SelectItem key={sf.field} value={sf.field}>{sf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
