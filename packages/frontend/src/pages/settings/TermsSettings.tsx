import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, Save } from 'lucide-react'

const inputCls = "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function TermsSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(null)

  const { data, isLoading } = useQuery({ queryKey: ['org-settings'], queryFn: () => api.getOrgSettings() })
  if (data && !form) setForm(data?.terms)

  const saveMutation = useMutation({
    mutationFn: (terms: any) => api.updateOrgSettings({ terms }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['org-settings'] }); addToast({ title: 'Terms saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading || !form) return <p className="text-sm text-muted-foreground">Loading terms...</p>

  const set = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        These terms are pre-filled as the default <em>Terms &amp; Conditions</em> when creating new quotes, sales orders, and invoices.
      </p>
      <Card>
        <CardHeader><CardTitle className="text-sm">Default Terms &amp; Conditions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'quote', label: 'Quotes' },
            { key: 'salesOrder', label: 'Sales Orders' },
            { key: 'invoice', label: 'Invoices' },
          ].map(t => (
            <div key={t.key}>
              <label className="text-sm font-medium block mb-1.5">{t.label}</label>
              <textarea className={inputCls} value={form[t.key] || ''} onChange={e => set(t.key, e.target.value)} placeholder={`Default terms for ${t.label.toLowerCase()}...`} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <FileText size={13} /> Individual documents can still override these defaults.
      </div>
    </div>
  )
}
