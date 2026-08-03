import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Phone, MapPin, User, Send, MessageSquare, Building2, Sparkles } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { SiteLayout } from '@/components/SiteLayout'

export function ContactUsPage() {
  const { addToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !message) {
      setError('Name, email and message are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      addToast({ title: 'Message sent', description: 'Thank you for contacting us!', variant: 'success' })
      setName(''); setEmail(''); setSubject(''); setMessage('')
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const infoItems = [
    { icon: Mail, label: 'Email', value: 'suhailrao@gmail.com' },
    { icon: Phone, label: 'Phone', value: '+92-321-4477664' },
    { icon: MapPin, label: 'Address', value: 'LG_80, Street 1, DRGCC, Phase 6, DHA\nLahore, Punjab, 54810\nPakistan' },
  ]

  return (
    <SiteLayout>
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Decorative glossy blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

        <div className="relative w-full max-w-3xl px-4 mx-auto">
        {/* Glossy card */}
        <div className="overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-sky-200/50 dark:shadow-indigo-950/60 border border-white/70 dark:border-white/10">
          {/* Glossy header */}
          <div className="relative bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/5 border border-white/40 flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent" />
                <MessageSquare size={22} className="relative text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Contact Us</h1>
              <p className="text-sm text-blue-100 mt-1">We'd love to hear from you. Send us a message!</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {infoItems.map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                  <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                    <item.icon size={16} className="relative text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                    />
                  </div>
                </div>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="How can we help?"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
                <textarea
                  placeholder="Write your message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="flex w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow min-h-[120px]"
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="relative w-full h-12 overflow-hidden rounded-lg text-white font-semibold text-sm border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                {sending ? (
                  <span className="relative inline-flex items-center"><Loader2 size={16} className="mr-2 animate-spin" /> Sending...</span>
                ) : (
                  <span className="relative inline-flex items-center"><Send size={16} className="mr-2" /> Send Message</span>
                )}
              </Button>
            </form>
          </div>
        </div>
        </div>
      </section>
    </SiteLayout>
  )
}
