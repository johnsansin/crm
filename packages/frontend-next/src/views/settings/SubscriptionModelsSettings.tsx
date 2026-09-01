'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'

const empty = { code: '', name: '', description: '', price: '', billingCycle: 'MONTHLY', userLimit: 3, contactLimit: 2000, featuresText: '', isActive: true }

export function SubscriptionModelsSettings() {
  const { addToast } = useToast()
  const [models, setModels] = useState<any[]>([])
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const load = () => api.adminListSubscriptionModels().then(r => setModels(r.data || []))
  useEffect(() => { load().catch(() => {}) }, [])

  const edit = (model?: any) => setForm(model ? { ...model, price: model.price ?? '', featuresText: (model.features || []).join('\n') } : { ...empty })
  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, features: String(form.featuresText || '').split('\n').map((v: string) => v.trim()).filter(Boolean) }
      if (form.id) await api.adminUpdateSubscriptionModel(form.id, payload)
      else await api.adminCreateSubscriptionModel(payload)
      await load(); setForm(null)
      addToast({ title: form.id ? 'Subscription plan updated' : 'Subscription plan created', variant: 'success' })
    } catch (error: any) { addToast({ title: 'Could not save plan', description: error.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }
  const remove = async (model: any) => {
    if (!window.confirm(`Delete ${model.name}?`)) return
    try { await api.adminDeleteSubscriptionModel(model.id); await load(); addToast({ title: 'Plan deleted', variant: 'success' }) }
    catch (error: any) { addToast({ title: 'Could not delete plan', description: error.message, variant: 'destructive' }) }
  }

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Create the plans that can be assigned to organisations. Limits are copied into an organisation when a plan is selected.</p><button onClick={() => edit()} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus size={16}/>New plan</button></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{models.map(model => <article key={model.id} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-bold">{model.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${model.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{model.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="mt-1 text-xs text-muted-foreground">{model.code} · {model._count?.companies || 0} organisations</p></div><div className="flex"><button onClick={() => edit(model)} className="rounded-lg p-2 hover:bg-muted" aria-label="Edit plan"><Pencil size={15}/></button><button onClick={() => remove(model)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete plan"><Trash2 size={15}/></button></div></div>
      <p className="mt-4 min-h-10 text-sm text-muted-foreground">{model.description || 'No description'}</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-muted p-2"><b>{model.userLimit.toLocaleString()}</b><br/>users</div><div className="rounded-lg bg-muted p-2"><b>{model.contactLimit.toLocaleString()}</b><br/>contacts</div></div>
      <p className="mt-3 text-sm font-semibold">{model.price == null ? 'Custom price' : `$${Number(model.price).toLocaleString()}`} <span className="text-xs font-normal text-muted-foreground">· {model.billingCycle.toLowerCase().replace('_', ' ')}</span></p>
    </article>)}</div>
    {form && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-3" onMouseDown={e => e.target === e.currentTarget && setForm(null)}><section className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{form.id ? 'Edit subscription plan' : 'New subscription plan'}</h2><button onClick={() => setForm(null)} className="rounded-lg p-2 hover:bg-muted"><X size={18}/></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Plan name"><input value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></Field><Field label="Code"><input value={form.code} onChange={e => setForm({...form,code:e.target.value.toUpperCase()})}/></Field>
      <Field label="Price (USD)"><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form,price:e.target.value})}/></Field><Field label="Billing cycle"><select value={form.billingCycle} onChange={e => setForm({...form,billingCycle:e.target.value})}>{['MONTHLY','YEARLY','ONE_TIME','CUSTOM'].map(v=><option key={v}>{v}</option>)}</select></Field>
      <Field label="User limit"><input type="number" min="1" value={form.userLimit} onChange={e => setForm({...form,userLimit:e.target.value})}/></Field><Field label="Contact limit"><input type="number" min="1" value={form.contactLimit} onChange={e => setForm({...form,contactLimit:e.target.value})}/></Field>
      <Field label="Description" wide><textarea rows={2} value={form.description || ''} onChange={e => setForm({...form,description:e.target.value})}/></Field><Field label="Features (one per line)" wide><textarea rows={5} value={form.featuresText} onChange={e => setForm({...form,featuresText:e.target.value})}/></Field>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form,isActive:e.target.checked})}/>Available for assignment</label>
    </div><div className="mt-5 flex justify-end"><button disabled={saving || !form.name || !form.code} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save size={16}/>{saving?'Saving…':'Save plan'}</button></div></section></div>}
  </div>
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactElement }) {
  return <label className={`text-xs font-semibold text-muted-foreground ${wide ? 'sm:col-span-2' : ''}`}>{label}<span className="mt-1 block [&>input]:h-10 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:bg-background [&>input]:px-3 [&>select]:h-10 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:bg-background [&>select]:px-3 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:bg-background [&>textarea]:p-3">{children}</span></label>
}
