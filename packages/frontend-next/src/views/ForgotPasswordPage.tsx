'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { SiteLayout } from '@/components/SiteLayout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Email is required'); return }
    setLoading(true)
    try {
      const res = await api.forgotPassword(email)
      setSentTo(res.email || email)
      setSentMessage(res.message || '')
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-24 px-4">
      {/* Decorative glossy blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-md">
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
                <KeyRound size={22} className="relative text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Reset password</h1>
              <p className="text-sm text-blue-100 mt-1">Enter your email address and we'll send you a reset link</p>
            </div>
          </div>

          {/* Form body */}
          <div className="p-6 md:p-7">
            {sent ? (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Check your inbox</h2>
                {sentMessage && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{sentMessage}</p>
                )}
                <div className="mx-auto max-w-xs rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 px-4 py-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200 break-all">
                    We've sent a reset link to <span className="font-semibold text-sky-700 dark:text-sky-300">{sentTo}</span>
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  The link expires in 1 hour. If it doesn't arrive, check your spam folder.
                </p>
                <Link
                  to="/login"
                  className="inline-flex w-full h-12 items-center justify-center rounded-lg text-white font-semibold text-sm bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
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

                {/* Glossy button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative w-full h-12 overflow-hidden rounded-lg text-white font-semibold text-sm border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                  {loading ? (
                    <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Sending...</span>
                  ) : (
                    <span className="relative inline-flex items-center"><Sparkles size={16} className="mr-2" /> Send Reset Link</span>
                  )}
                </Button>
              </form>
            )}

            {!sent && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                Remembered it?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Back to sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
      </section>
    </SiteLayout>
  )
}
