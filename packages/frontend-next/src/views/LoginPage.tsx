'use client'

import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react'
import { SiteLayout } from '@/components/SiteLayout'
import { api } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [twoFactorChallenge, setTwoFactorChallenge] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ssoEmail, setSsoEmail] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const { login, login2fa } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSsoEnabled(localStorage.getItem('bizforce.sso.enabled') === '1')
  }, [])

  const toggleSso = (on: boolean) => {
    setSsoEnabled(on)
    if (typeof window !== 'undefined') {
      if (on) localStorage.setItem('bizforce.sso.enabled', '1')
      else localStorage.removeItem('bizforce.sso.enabled')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.startsWith('#token=')) {
      const token = decodeURIComponent(hash.replace('#token=', ''))
      setLoading(true)
      useAuthStore.getState().setToken(token)
      useAuthStore.getState().loadUser().then(() => {
        const u = useAuthStore.getState().user
        if (u) {
          window.history.replaceState(null, '', window.location.pathname)
          navigate(u?.isSuperAdmin ? '/superadmin' : u?.isAgent ? '/support-agent' : '/dashboard')
        } else {
          setLoading(false)
        }
      }).catch(() => {
        setLoading(false)
        setError('SSO sign-in could not be completed. Please try again.')
      })
    } else if (window.location.search.includes('sso=error')) {
      const reason = new URLSearchParams(window.location.search).get('reason') || 'unknown'
      const messages: Record<string, string> = {
        'not-enabled': 'Single sign-on is not enabled for your organization. Contact your administrator.',
        'company-inactive': 'Your organization is deactivated. Contact your super admin.',
        'invalid-assertion': 'The identity provider response could not be verified. Check your SSO configuration.',
        'no-email': 'Your identity provider did not return an email address.',
        subscription: 'Your organization subscription is inactive. Contact your super admin.',
        'account-inactive': 'Your account is blocked. Contact your organization administrator.',
      }
      setError(messages[reason] || 'Single sign-on failed. Please contact your administrator.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [navigate])

  const handleSso = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!ssoEmail) {
      setError('Enter your work email to continue')
      return
    }
    setSsoLoading(true)
    try {
      const res = await api.ssoInit(ssoEmail)
      window.location.href = res.redirectUrl
    } catch (err: any) {
      setError(err.message || 'Single sign-on is not available for this organization')
      setSsoLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    try {
      const res = await login(email, password)
      if (res?.requires2FA) {
        setTwoFactorChallenge(res.challenge || '')
        setLoading(false)
        return
      }
      const u = useAuthStore.getState().user
      navigate(u?.isSuperAdmin ? '/superadmin' : u?.isAgent ? '/support-agent' : '/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code) {
      setError('Enter your verification code')
      return
    }
    setLoading(true)
    try {
      await login2fa(twoFactorChallenge, code)
      const u = useAuthStore.getState().user
      navigate(u?.isSuperAdmin ? '/superadmin' : u?.isAgent ? '/support-agent' : '/dashboard')
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 px-3 pb-6 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:px-4 sm:py-24">
        {/* Decorative glossy blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

        <div className="relative w-full min-w-0 max-w-md">
        {/* Glossy card */}
        <div className="overflow-hidden rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-sky-200/50 dark:shadow-indigo-950/60 border border-white/70 dark:border-white/10 sm:rounded-2xl sm:shadow-2xl">
          {/* Glossy header */}
          <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-4 py-5 overflow-hidden sm:px-6 sm:py-8">
            {/* Shine sweep */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-gradient-to-br from-white/30 to-white/5 shadow-lg shadow-blue-900/30 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
                <span className="relative text-white font-extrabold text-2xl">B</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-sm sm:text-2xl">Welcome back</h1>
              <p className="text-sm text-blue-100 mt-1">Sign in to your BizForce account</p>
            </div>
          </div>

          {/* Form body */}
          <div className="p-4 sm:p-6 md:p-8">
            {twoFactorChallenge ? (
              <form onSubmit={handle2fa} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Verification Code</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      placeholder="6-digit code from your authenticator app"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-12 overflow-hidden rounded-lg text-white font-semibold text-sm border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                  {loading ? (
                    <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Verifying...</span>
                  ) : (
                    <span className="relative inline-flex items-center"><ShieldCheck size={16} className="mr-2" /> Verify & Sign In</span>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setTwoFactorChallenge(''); setCode(''); setError('') }}
                  className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              <>
              <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                <div className="relative">
                  <PasswordInput
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Glossy sign-in button */}
<Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-12 overflow-hidden rounded-lg text-white font-semibold text-sm border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                  {loading ? (
                    <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Signing in...</span>
                  ) : (
                    <span className="relative inline-flex items-center"><Sparkles size={16} className="mr-2" /> Sign In</span>
                  )}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <button
                  type="button"
                  onClick={() => toggleSso(!ssoEnabled)}
                  className="flex w-full items-center justify-between gap-3"
                  aria-pressed={ssoEnabled}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <ShieldCheck size={16} className="text-slate-400" />
                    Sign in with SSO
                  </span>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ssoEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${ssoEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </span>
                </button>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">Remembered on this browser. Only for organizations with SAML SSO enabled.</p>
              </div>

              {ssoEnabled && (
              <form onSubmit={handleSso} className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Work email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={ssoEmail}
                    onChange={e => setSsoEmail(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={ssoLoading}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {ssoLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ShieldCheck size={16} className="mr-2" />}
                  Continue with SSO
                </Button>
              </form>
              )}
            </>
            )}

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
      </section>
    </SiteLayout>
  )
}
