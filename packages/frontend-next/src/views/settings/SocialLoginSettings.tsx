'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Chrome, Facebook, KeyRound, CheckCircle2 } from 'lucide-react'

export function SocialLoginSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [google, setGoogle] = useState({ clientID: '', clientSecret: '' })
  const [facebook, setFacebook] = useState({ clientID: '', clientSecret: '' })
  const [loaded, setLoaded] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['social-login-config'], queryFn: () => api.getSocialLoginConfig() })

  useEffect(() => {
    if (data && !loaded) {
      setGoogle({ clientID: data.google.clientID || '', clientSecret: '' })
      setFacebook({ clientID: data.facebook.clientID || '', clientSecret: '' })
      setLoaded(true)
    }
  }, [data, loaded])

  const save = useMutation({
    mutationFn: () => api.saveSocialLoginConfig({ google, facebook }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-login-config'] })
      setLoaded(false)
      setGoogle(g => ({ ...g, clientSecret: '' }))
      setFacebook(f => ({ ...f, clientSecret: '' }))
      addToast({ title: 'Social login saved', variant: 'success' })
    },
    onError: (err: any) => addToast({ title: err.message || 'Failed to save', variant: 'destructive' }),
  })

  const googleActive = data?.google?.google
  const facebookActive = data?.facebook?.facebook

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60"><Chrome size={18} /></span>
            <div>
              <h3 className="text-sm font-semibold">Google</h3>
              <p className="text-xs text-muted-foreground">OAuth 2.0 Client credentials</p>
            </div>
          </div>
          <StatusPill active={googleActive} />
        </div>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Client ID</label>
            <Input value={google.clientID} onChange={e => setGoogle({ ...google, clientID: e.target.value })} placeholder="1234567890-abc.apps.googleusercontent.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Client Secret</label>
            <Input value={google.clientSecret} onChange={e => setGoogle({ ...google, clientSecret: e.target.value })} placeholder={data?.google?.clientSecret || 'Enter client secret'} />
          </div>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open Google Cloud Console →
          </a>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60"><Facebook size={18} /></span>
            <div>
              <h3 className="text-sm font-semibold">Facebook</h3>
              <p className="text-xs text-muted-foreground">Facebook App credentials</p>
            </div>
          </div>
          <StatusPill active={facebookActive} />
        </div>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">App ID</label>
            <Input value={facebook.clientID} onChange={e => setFacebook({ ...facebook, clientID: e.target.value })} placeholder="123456789012345" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">App Secret</label>
            <Input value={facebook.clientSecret} onChange={e => setFacebook({ ...facebook, clientSecret: e.target.value })} placeholder={data?.facebook?.clientSecret || 'Enter app secret'} />
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open Facebook for Developers →
          </a>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Redirect URIs to register</h3>
        <div className="grid gap-2 text-xs">
          <code className="rounded-lg bg-muted px-3 py-2">https://bizforce-crm.online/api/auth/google/callback</code>
          <code className="rounded-lg bg-muted px-3 py-2">https://bizforce-crm.online/api/auth/facebook/callback</code>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Add these exact URIs to your OAuth apps. Google users must have a verified email; Facebook apps need the
          &quot;email&quot; permission (requires a live/approved app or a test user).
        </p>
      </div>

      <div className="lg:col-span-2 flex justify-end border-t pt-4">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
          Save Social Login
        </Button>
      </div>
    </div>
  )
}

function StatusPill({ active }: { active?: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-medium">
      <CheckCircle2 size={12} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-[11px] font-medium">
      <KeyRound size={12} /> Not set
    </span>
  )
}
