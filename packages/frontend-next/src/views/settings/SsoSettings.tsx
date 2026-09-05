'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, ShieldCheck, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'

export function SsoSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const companyId = user?.companyId || ''
  const [form, setForm] = useState<any>({
    idpEntryPoint: '', issuer: '', cert: '',
    signatureAlgorithm: 'sha256', disableRequestedAuthnContext: false,
    wantAuthnResponseSigned: true, isEnabled: false,
  })
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['sso-config'], queryFn: () => api.getSsoConfig() })
  const enterprise = !!data?.enterprise
  const existing = data?.data

  useEffect(() => { setOrigin(window.location.origin) }, [])

  useEffect(() => {
    if (existing && !loaded) {
      setForm({
        idpEntryPoint: existing.idpEntryPoint || '',
        issuer: existing.issuer || '',
        cert: existing.cert || '',
        signatureAlgorithm: existing.signatureAlgorithm || 'sha256',
        disableRequestedAuthnContext: !!existing.disableRequestedAuthnContext,
        wantAuthnResponseSigned: existing.wantAuthnResponseSigned !== false,
        isEnabled: !!existing.isEnabled,
      })
      setLoaded(true)
    }
  }, [existing, loaded])

  const save = useMutation({
    mutationFn: () => api.saveSsoConfig(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-config'] })
      addToast({ title: 'SSO configuration saved', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const metadataUrl = origin + '/api/auth/sso/sp-metadata/' + companyId
  const callbackUrl = origin + '/api/auth/sso/callback'

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center rounded-2xl border bg-background p-12 text-sm text-muted-foreground"><Loader2 size={18} className="mr-2 animate-spin" />Loading...</div>
  }

  if (!enterprise) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-background px-6 py-14 text-center">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/50"><ShieldCheck size={22} /></span>
        <h3 className="text-base font-semibold text-foreground">SAML Single Sign-On</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Enable enterprise SAML SSO for your organization. This feature is available on the Enterprise plan.
          Contact our sales team to upgrade.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">SAML SSO configuration</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Users sign in through your identity provider and are matched by email.</p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })} className="h-4 w-4" />
            Enabled
          </label>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Identity Provider entry point (SSO URL)</label>
            <Input value={form.idpEntryPoint} onChange={e => setForm({ ...form, idpEntryPoint: e.target.value })} placeholder="https://yourcompany.okta.com/app/.../sso/saml" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Issuer / Entity ID (optional)</label>
            <Input value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} placeholder={callbackUrl} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Identity Provider signing certificate</label>
            <textarea
              value={form.cert}
              onChange={e => setForm({ ...form, cert: e.target.value })}
              rows={6}
              placeholder="-----BEGIN CERTIFICATE-----"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Signature algorithm</label>
              <select value={form.signatureAlgorithm} onChange={e => setForm({ ...form, signatureAlgorithm: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none">
                <option value="sha256">SHA-256 (recommended)</option>
                <option value="sha1">SHA-1</option>
              </select>
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.wantAuthnResponseSigned} onChange={e => setForm({ ...form, wantAuthnResponseSigned: e.target.checked })} className="h-4 w-4" /> Require signed response</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.disableRequestedAuthnContext} onChange={e => setForm({ ...form, disableRequestedAuthnContext: e.target.checked })} className="h-4 w-4" /> Disable authn context</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
            Save configuration
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Service provider</h3>
          <div className="space-y-3 text-xs">
            <div>
              <p className="mb-1 font-medium text-muted-foreground">SP metadata URL</p>
              <div className="flex items-center gap-1.5">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5">{metadataUrl}</code>
                <Button variant="ghost" size="sm" onClick={() => copyText(metadataUrl)} aria-label="Copy metadata URL">{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Paste this into your identity provider to configure the BizForce application.</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-muted-foreground">ACS callback URL</p>
              <div className="flex items-center gap-1.5">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5">{callbackUrl}</code>
                <Button variant="ghost" size="sm" onClick={() => copyText(callbackUrl)} aria-label="Copy callback URL">{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</Button>
              </div>
            </div>
            <div className={cn('mt-2 rounded-lg px-3 py-2', form.isEnabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50' : 'bg-slate-100 text-slate-600 dark:bg-slate-800')}>
              {form.isEnabled ? 'SSO login is enabled — the "Sign in with SSO" flow is active for your members.' : 'Login page SSO option will be hidden until this is enabled.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}