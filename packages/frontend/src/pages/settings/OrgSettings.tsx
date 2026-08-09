import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Save, Loader2, KeyRound, ShieldCheck, GitBranch, Globe, Package, ArrowDownUp, Link2 } from 'lucide-react'
import { TIMEZONES, DATE_FORMATS, LANGUAGES } from '@/lib/constants'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const LEAD_SOURCES = [
  { key: 'salutation', label: 'Salutation' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'title', label: 'Title' },
  { key: 'email', label: 'Email' },
  { key: 'secondaryEmail', label: 'Secondary Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'fax', label: 'Fax' },
  { key: 'website', label: 'Website' },
  { key: 'industry', label: 'Industry' },
  { key: 'annualRevenue', label: 'Annual Revenue' },
  { key: 'noOfEmployees', label: 'No of Employees' },
  { key: 'rating', label: 'Rating' },
  { key: 'leadStatus', label: 'Lead Status' },
  { key: 'leadSource', label: 'Lead Source' },
  { key: 'street', label: 'Street' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'postalCode', label: 'Postal Code' },
  { key: 'poBox', label: 'PO Box' },
  { key: 'description', label: 'Description' },
]

const MAPPING_GROUPS = [
  {
    module: 'account',
    label: 'Account Fields',
    fields: [
      ['accountName', 'Account Name'], ['website', 'Website'], ['phone', 'Phone'], ['fax', 'Fax'], ['email', 'Email'],
      ['industry', 'Industry'], ['annualRevenue', 'Annual Revenue'], ['rating', 'Rating'], ['employees', 'Employees'],
      ['billingStreet', 'Billing Street'], ['billingCity', 'Billing City'], ['billingState', 'Billing State'],
      ['billingCountry', 'Billing Country'], ['billingPostalCode', 'Billing Postal Code'], ['billingPoBox', 'Billing PO Box'],
      ['shippingStreet', 'Shipping Street'], ['shippingCity', 'Shipping City'], ['shippingState', 'Shipping State'],
      ['shippingCountry', 'Shipping Country'], ['shippingPostalCode', 'Shipping Postal Code'], ['shippingPoBox', 'Shipping PO Box'],
      ['description', 'Description'],
    ],
  },
  {
    module: 'contact',
    label: 'Contact Fields',
    fields: [
      ['firstName', 'First Name'], ['lastName', 'Last Name'], ['title', 'Title'], ['email', 'Email'],
      ['secondaryEmail', 'Secondary Email'], ['phone', 'Phone'], ['mobile', 'Mobile'], ['fax', 'Fax'],
      ['leadSource', 'Lead Source'], ['mailingStreet', 'Mailing Street'], ['mailingCity', 'Mailing City'],
      ['mailingState', 'Mailing State'], ['mailingCountry', 'Mailing Country'], ['mailingPostalCode', 'Mailing Postal Code'],
      ['mailingPoBox', 'Mailing PO Box'], ['description', 'Description'],
    ],
  },
  {
    module: 'potential',
    label: 'Potential Fields',
    fields: [
      ['potentialName', 'Potential Name'], ['amount', 'Amount'], ['closingDate', 'Closing Date'], ['stage', 'Stage'],
      ['probability', 'Probability'], ['nextStep', 'Next Step'], ['leadSource', 'Lead Source'], ['description', 'Description'],
    ],
  },
]

export function OrgSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [tab, setTab] = useState('security')

  const { data, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })

  const saveMutation = useMutation({
    mutationFn: (settings: any) => api.updateOrgSettings(settings),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['org-settings'] }); addToast({ title: 'Settings saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (data && !form) setForm(data)

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading settings...</p>

  const set = (group: string, field: string, value: any) =>
    setForm((f: any) => ({ ...f, [group]: { ...(f[group] || {}), [field]: value } }))

  const save = () => saveMutation.mutate(form)

  const Field = ({ label, children }: any) => (
    <div><label className="text-sm font-medium block mb-1.5">{label}</label>{children}</div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={save} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <TabsRoot value={tab} onValueChange={setTab}>
            <div className="px-6 pt-4 border-b overflow-x-auto">
              <TabsList className="border-b-0">
                <TabsTrigger value="security" className="gap-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"><ShieldCheck size={15} /> Password & Login</TabsTrigger>
                <TabsTrigger value="lead" className="gap-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"><GitBranch size={15} /> Lead Conversion</TabsTrigger>
                <TabsTrigger value="regional" className="gap-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"><Globe size={15} /> Regional & Language</TabsTrigger>
                <TabsTrigger value="inventory" className="gap-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"><Package size={15} /> Inventory</TabsTrigger>
                <TabsTrigger value="importexport" className="gap-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"><ArrowDownUp size={15} /> Import / Export</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="security" className="px-6 py-5 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3"><KeyRound size={15} /> Password Policy</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Minimum Length"><Input type="number" min={4} value={form.passwordPolicy?.minLength ?? 6} onChange={e => set('passwordPolicy', 'minLength', parseInt(e.target.value) || 0)} /></Field>
                  <Field label="Expiry (days, 0 = never)"><Input type="number" min={0} value={form.passwordPolicy?.expiryDays ?? 0} onChange={e => set('passwordPolicy', 'expiryDays', parseInt(e.target.value) || 0)} /></Field>
                  {[
                    ['requireUpper', 'Require uppercase letter'],
                    ['requireLower', 'Require lowercase letter'],
                    ['requireNumber', 'Require a number'],
                    ['requireSymbol', 'Require a symbol'],
                  ].map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!form.passwordPolicy?.[k as string]} onChange={e => set('passwordPolicy', k as string, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3"><ShieldCheck size={15} /> Login Security</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Max failed attempts before lockout"><Input type="number" min={1} value={form.loginSecurity?.maxAttempts ?? 5} onChange={e => set('loginSecurity', 'maxAttempts', parseInt(e.target.value) || 1)} /></Field>
                  <Field label="Lockout duration (minutes)"><Input type="number" min={1} value={form.loginSecurity?.lockMinutes ?? 15} onChange={e => set('loginSecurity', 'lockMinutes', parseInt(e.target.value) || 1)} /></Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!form.loginSecurity?.twoFactorRequired} onChange={e => set('loginSecurity', 'twoFactorRequired', e.target.checked)} />
                    Require two-factor authentication for all users
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lead" className="px-6 py-5 space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.leadConfig?.enableLeadConversion} onChange={e => set('leadConfig', 'enableLeadConversion', e.target.checked)} />
                Enable lead to potential conversion
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.leadConfig?.createOnContact} onChange={e => set('leadConfig', 'createOnContact', e.target.checked)} />
                Automatically create a lead when a new contact is added
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Default Lead Status"><Input value={form.leadConfig?.defaultLeadStatus ?? ''} onChange={e => set('leadConfig', 'defaultLeadStatus', e.target.value)} /></Field>
                <Field label="Default Lead Source"><Input value={form.leadConfig?.defaultLeadSource ?? ''} onChange={e => set('leadConfig', 'defaultLeadSource', e.target.value)} /></Field>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Link2 size={15} /> Field Mapping (Lead → Account / Contact / Potential)</div>
                <p className="text-xs text-muted-foreground mb-4">Choose which lead field populates each field when a lead is converted. Leave "(default)" to use the built-in mapping.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {MAPPING_GROUPS.map(group => (
                    <Card key={group.module}>
                      <CardHeader><CardTitle className="text-sm">{group.label}</CardTitle></CardHeader>
                      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                        {group.fields.map(([target, label]) => {
                          const current = form.leadConversionMapping?.[group.module]?.[target] || ''
                          return (
                            <div key={target} className="flex items-center gap-2">
                              <span className="text-xs w-32 truncate shrink-0">{label}</span>
                              <select
                                className={`${inputCls} h-8 text-xs`}
                                value={current}
                                onChange={e => setForm((f: any) => ({
                                  ...f,
                                  leadConversionMapping: {
                                    ...(f.leadConversionMapping || {}),
                                    [group.module]: { ...((f.leadConversionMapping || {})[group.module] || {}), [target]: e.target.value },
                                  },
                                }))}
                              >
                                <option value="">(default)</option>
                                {LEAD_SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                              </select>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="regional" className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Language">
                  <select className={inputCls} value={form.language || 'en_us'} onChange={e => setForm((f: any) => ({ ...f, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label="Timezone (for the organization)">
                  <select className={inputCls} value={form.timezone || 'Asia/Karachi'} onChange={e => setForm((f: any) => ({ ...f, timezone: e.target.value }))}>
                    {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Default Date Format">
                  <select className={inputCls} value={form.dateFormat || 'mm-dd-yyyy'} onChange={e => setForm((f: any) => ({ ...f, dateFormat: e.target.value }))}>
                    {DATE_FORMATS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Calendar</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <Field label="Working hours start"><Input type="time" value={form.calendar?.workingHoursStart ?? '09:00'} onChange={e => set('calendar', 'workingHoursStart', e.target.value)} /></Field>
                  <Field label="Working hours end"><Input type="time" value={form.calendar?.workingHoursEnd ?? '18:00'} onChange={e => set('calendar', 'workingHoursEnd', e.target.value)} /></Field>
                  <Field label="First day of week">
                    <select className={inputCls} value={form.calendar?.firstDayOfWeek ?? 'Sunday'} onChange={e => set('calendar', 'firstDayOfWeek', e.target.value)}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <div className="md:col-span-3">
                    <div className="text-sm font-medium mb-2">Working days</div>
                    <div className="flex flex-wrap gap-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <label key={d} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" checked={(form.calendar?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).includes(d)} onChange={e => {
                            const days = new Set(form.calendar?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
                            if (e.target.checked) days.add(d); else days.delete(d)
                            set('calendar', 'workingDays', [...days])
                          }} />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="px-6 py-5 space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.inventory?.enableStockTracking} onChange={e => set('inventory', 'enableStockTracking', e.target.checked)} />
                Enable stock tracking
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.inventory?.autoNumbering} onChange={e => set('inventory', 'autoNumbering', e.target.checked)} />
                Enable automatic numbering for products
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.inventory?.productImageRequired} onChange={e => set('inventory', 'productImageRequired', e.target.checked)} />
                Require a product image
              </label>
            </TabsContent>

            <TabsContent value="importexport" className="px-6 py-5 space-y-4">
              <Field label="Maximum rows per CSV import">
                <Input type="number" min={1} value={form.importExport?.maxRows ?? 1000} onChange={e => set('importExport', 'maxRows', parseInt(e.target.value) || 1)} className="max-w-xs" />
              </Field>
            </TabsContent>
          </TabsRoot>
        </CardContent>
      </Card>
    </div>
  )
}
