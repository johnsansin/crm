'use client'

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, Mail, Building2, User, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react'
import { SiteLayout } from '@/components/SiteLayout'

const CODE_RESEND_COOLDOWN = 30
const CODE_LENGTH = 6

export function SignUpPage() {
  const navigate = useNavigate()
  const { register, verifyRegister } = useAuthStore()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [delivered, setDelivered] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSocial = (provider: 'google' | 'facebook') => {
    setError('')
    setSocialLoading(provider)
    window.location.href = `/api/auth/${provider}`
  }

  const startCooldown = () => {
    setCooldown(CODE_RESEND_COOLDOWN)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1 && timerRef.current) clearInterval(timerRef.current)
        return prev > 0 ? prev - 1 : 0
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!companyName || !firstName || !lastName || !email || !password) {
      setError('All fields are required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const userName = email.split('@')[0]
      const res = await register({ userName, email, firstName, lastName, password, companyName })
      setVerificationId(res.verificationId)
      setDelivered(res.delivered !== false)
      setStep('verify')
      startCooldown()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Please enter the verification code')
      return
    }
    setLoading(true)
    try {
      await verifyRegister(verificationId, code.trim())
      navigate('/org/setup')
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')
    try {
      const res = await api.resendRegisterCode(verificationId)
      setDelivered(res.delivered !== false)
      startCooldown()
      setCode('')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <SiteLayout>
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-24 px-4">
      {/* Decorative glossy blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

        <div className="relative w-full max-w-lg">
        {/* Glossy card */}
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-sky-200/50 dark:shadow-indigo-950/60 border border-white/70 dark:border-white/10">
          {/* Glossy header */}
          <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-7 overflow-hidden">
            {/* Shine sweep */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/5 border border-white/40 flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
                {step === 'verify' ? <ShieldCheck size={22} className="relative text-white" /> : <Building2 size={22} className="relative text-white" />}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                {step === 'verify' ? 'Verify your email' : 'Create your organization'}
              </h1>
              <p className="text-sm text-blue-100 mt-1">
                {step === 'verify'
                  ? 'Enter the 6-digit code we emailed you to finish signing up'
                  : 'Set up your company and start managing customer relationships'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-7">
            {step === 'verify' ? (
              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="rounded-xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>
                    A 6-digit verification code was sent to <span className="font-semibold text-slate-800 dark:text-white">{email}</span>.
                    {!delivered && ' We could not send the email automatically — please use the resend button.'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Verification Code</label>
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        aria-label={`Digit ${i + 1}`}
                        value={code[i] ?? ''}
                        autoFocus={i === 0}
                        onChange={e => {
                          const digit = e.target.value.replace(/\D/g, '').slice(-1)
                          setCode(code.slice(0, i) + digit + code.slice(i + 1))
                          if (digit && i < CODE_LENGTH - 1) otpRefs.current[i + 1]?.focus()
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace') {
                            if (code[i]) {
                              setCode(code.slice(0, i) + code.slice(i + 1))
                            } else if (i > 0) {
                              otpRefs.current[i - 1]?.focus()
                            }
                          } else if (e.key === 'ArrowLeft' && i > 0) {
                            otpRefs.current[i - 1]?.focus()
                          } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
                            otpRefs.current[i + 1]?.focus()
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault()
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
                          if (!pasted) return
                          setCode(pasted)
                          otpRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
                        }}
                        className="flex h-14 sm:h-16 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400"
                      />
                    ))}
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
                    <span className="relative inline-flex items-center"><ShieldCheck size={16} className="mr-2" /> Verify & Create Account</span>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError('') }}
                    className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <ArrowLeft size={14} className="mr-1" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resendLoading}
                    className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-600 disabled:no-underline"
                  >
                    {resendLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Organization Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">First Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Last Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Work Email</label>
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
                       placeholder="Min. 6 characters"
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       required
                       className="h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                     />
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
                    <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Creating...</span>
                  ) : (
                    <span className="relative inline-flex items-center"><Sparkles size={16} className="mr-2" /> Create Account</span>
                  )}
                </Button>
              </form>
            )}

            {step === 'form' && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">or continue with</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => handleSocial('google')}
                    disabled={socialLoading !== null}
                    className="flex w-full h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <GoogleIcon /> Continue with Google
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSocial('facebook')}
                    disabled={socialLoading !== null}
                    className="flex w-full h-11 items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FacebookIcon /> Continue with Facebook
                  </Button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
            </p>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
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
