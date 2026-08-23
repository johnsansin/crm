import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, Save, Palette } from 'lucide-react'

const inputCls = "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export function TermsSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [documentTemplate, setDocumentTemplate] = useState<any>(null)

  const { data, isLoading } = useQuery({ queryKey: ['org-settings'], queryFn: () => api.getOrgSettings() })
  useEffect(() => {
    if (!data) return
    setForm(data.terms || {})
    setDocumentTemplate({
      isActive: true,
      headerText: '', bodyText: '', footerText: 'Thank you for your business.', accentColor: '#2563eb',
      fontFamily: 'Arial', showLogo: true, showCompanyName: true,
      ...(data.documentTemplate || {}),
    })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => api.updateOrgSettings({ terms: form, documentTemplate }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['org-settings'] }); addToast({ title: 'Master document saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading || !form || !documentTemplate) return <p className="text-sm text-muted-foreground">Loading document settings...</p>

  const set = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save Master Document
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        These terms are pre-filled as the default <em>Terms &amp; Conditions</em> when creating new quotes, sales orders, purchase orders, and invoices.
      </p>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Palette size={16} className="text-primary" /> Master Document &amp; Letterhead</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <label className={`flex items-center justify-between gap-4 rounded-xl border-2 p-4 transition-colors ${documentTemplate.isActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border bg-muted/30'}`}>
              <span><span className="block text-sm font-bold">Active master document</span><span className="block text-xs text-muted-foreground">Apply this letterhead, logo, body and footer to all organization PDFs.</span></span>
              <input type="checkbox" checked={documentTemplate.isActive !== false} onChange={e => setDocumentTemplate((v:any) => ({ ...v, isActive: e.target.checked }))} className="h-5 w-5 accent-emerald-600" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium">Accent colour</label><div className="flex gap-2"><input type="color" value={documentTemplate.accentColor} onChange={e => setDocumentTemplate((v:any) => ({ ...v, accentColor: e.target.value }))} className="h-10 w-12 rounded border bg-background p-1" /><input value={documentTemplate.accentColor} onChange={e => setDocumentTemplate((v:any) => ({ ...v, accentColor: e.target.value }))} className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" /></div></div>
              <div><label className="mb-1.5 block text-sm font-medium">Document font</label><select value={documentTemplate.fontFamily} onChange={e => setDocumentTemplate((v:any) => ({ ...v, fontFamily: e.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option>Arial</option><option>Helvetica</option><option>Georgia</option><option>Times New Roman</option></select></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={documentTemplate.showLogo} onChange={e => setDocumentTemplate((v:any) => ({ ...v, showLogo: e.target.checked }))} /> Show organization logo</label>
              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={documentTemplate.showCompanyName} onChange={e => setDocumentTemplate((v:any) => ({ ...v, showCompanyName: e.target.checked }))} /> Show organization name</label>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium">Header / letterhead text</label><textarea className={inputCls} value={documentTemplate.headerText} onChange={e => setDocumentTemplate((v:any) => ({ ...v, headerText: e.target.value }))} placeholder="Registration number, tax number, contact details…" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Body introduction</label><textarea className={inputCls} value={documentTemplate.bodyText} onChange={e => setDocumentTemplate((v:any) => ({ ...v, bodyText: e.target.value }))} placeholder="Optional text shown before line items…" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Footer</label><textarea className={inputCls} value={documentTemplate.footerText} onChange={e => setDocumentTemplate((v:any) => ({ ...v, footerText: e.target.value }))} placeholder="Footer text, bank details, legal notice…" /></div>
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</p>
            <div className="aspect-[1/1.414] overflow-hidden rounded-lg border bg-white p-5 text-slate-700 shadow-lg" style={{ fontFamily: documentTemplate.fontFamily }}>
              <div className="flex justify-between gap-3 border-b pb-3" style={{ borderColor: documentTemplate.accentColor }}><div>{documentTemplate.showLogo && <div className="mb-2 grid h-9 w-16 place-items-center rounded bg-slate-100 text-[9px]">LOGO</div>}{documentTemplate.showCompanyName && <p className="text-sm font-bold" style={{ color: documentTemplate.accentColor }}>Organization Name</p>}<p className="whitespace-pre-line text-[7px] text-slate-500">{documentTemplate.headerText}</p></div><div className="text-right"><p className="text-sm font-black" style={{ color: documentTemplate.accentColor }}>QUOTATION</p><p className="text-[8px]">QT-0001</p></div></div>
              <p className="my-3 whitespace-pre-line text-[8px]">{documentTemplate.bodyText}</p>
              <div className="mt-3 h-4 rounded text-white" style={{ background: documentTemplate.accentColor }} /><div className="space-y-2 py-2">{[1,2,3].map(i => <div key={i} className="h-2 border-b" />)}</div>
              <div className="mt-auto border-t pt-2 text-[7px] text-slate-500" style={{ borderColor: documentTemplate.accentColor }}>{documentTemplate.footerText}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Default Terms &amp; Conditions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'quote', label: 'Quotes' },
            { key: 'salesOrder', label: 'Sales Orders' },
            { key: 'invoice', label: 'Invoices' },
            { key: 'purchaseOrder', label: 'Purchase Orders' },
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
