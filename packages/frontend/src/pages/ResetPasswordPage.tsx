import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2, CheckCircle2, Lock, KeyRound, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { SiteLayout } from '@/components/SiteLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) { setError('Password is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!token) { setError('Reset token is missing'); return }
    setLoading(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <SiteLayout>
        <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-24 px-4">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
          <div className="relative w-full max-w-md">
            <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-sky-200/50 dark:shadow-indigo-950/60 border border-white/70 dark:border-white/10 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Password reset successful</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">You can now sign in with your new password.</p>
              <Button
                onClick={() => navigate('/login')}
                className="relative mt-6 w-full h-12 overflow-hidden rounded-lg text-white font-semibold text-sm border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                <span className="relative">Sign In</span>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-24 px-4">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

        <div className="relative w-full max-w-md">
          <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-sky-200/50 dark:shadow-indigo-950/60 border border-white/70 dark:border-white/10">
            <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
              <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/25 to-transparent" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/5 border border-white/40 flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
                  <KeyRound size={22} className="relative text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Set new password</h1>
                <p className="text-sm text-blue-100 mt-1">Enter your new password below</p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {!token ? (
                <div className="text-center space-y-4 py-2">
                  <p className="text-sm text-red-600 dark:text-red-400">Invalid or missing reset token.</p>
                  <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Request a new reset link
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
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <PasswordInput
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="pl-9 h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <PasswordInput
                        placeholder="Re-enter your password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        className="pl-9 h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
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
                      <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Resetting...</span>
                    ) : (
                      <span className="relative inline-flex items-center"><Sparkles size={16} className="mr-2" /> Reset Password</span>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
