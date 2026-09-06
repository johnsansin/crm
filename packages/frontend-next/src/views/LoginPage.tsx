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
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [socialProviders, setSocialProviders] = useState<{ google: boolean; facebook: boolean }>({ google: false, facebook: false })
  const { login, login2fa } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    api.getSocialProviders().then(setSocialProviders).catch(() => {})
  }, [])

  const handleSocial = (provider: 'google' | 'facebook') => {
    setError('')
    setSocialLoading(provider)
    window.location.href = `/api/auth/${provider}`
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
        setError('Sign-in could not be completed. Please try again.')
      })
    } else if (window.location.search.includes('sso=error')) {
      const reason = new URLSearchParams(window.location.search).get('reason') || 'unknown'
      const messages: Record<string, string> = {
        'not-configured': 'Social sign-in is not configured yet. Please use your email and password.',
        'company-inactive': 'Your organization is deactivated. Contact your super admin.',
        'invalid-assertion': 'The identity provider response could not be verified. Please try again.',
        'no-email': 'Your identity provider did not return an email address.',
        subscription: 'Your organization subscription is inactive. Contact your super admin.',
        'account-inactive': 'Your account is blocked. Contact your organization administrator.',
      }
      setError(messages[reason] || 'Sign-in failed. Please contact your administrator.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [navigate])

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

              {(socialProviders.google || socialProviders.facebook) && (
              <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="space-y-2">
                {socialProviders.google && (
                <Button
                  type="button"
                  onClick={() => handleSocial('google')}
                  disabled={socialLoading !== null}
                  className="flex w-full h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <GoogleIcon /> Continue with Google
                </Button>
                )}
                {socialProviders.facebook && (
                <Button
                  type="button"
                  onClick={() => handleSocial('facebook')}
                  disabled={socialLoading !== null}
                  className="flex w-full h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FacebookIcon /> Continue with Facebook
                </Button>
                )}
              </div>
              </>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  )
}
