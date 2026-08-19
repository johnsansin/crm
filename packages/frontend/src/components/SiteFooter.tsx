import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin, Globe, ArrowRight, Send } from 'lucide-react'
import { useToast } from '@/lib/toast'

const socials = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Twitter, label: 'Twitter / X', href: 'https://twitter.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
]

const productLinks = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/contact' },
]

const companyLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Cookie Policy', to: '/cookie-policy' },
  { label: 'Refund Policy', to: '/refund-policy' },
]

const modules = [
  'Accounts', 'Contacts', 'Leads', 'Opportunities', 'Quotes', 'Invoices', 'Projects', 'Support Tickets',
]

export function SiteFooter() {
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribing(true)
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
      addToast({ title: 'Subscribed!', description: 'Thanks for subscribing to our newsletter.', variant: 'success' })
      setEmail('')
    } catch {
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <footer className="border-t border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
      {/* Newsletter Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">Stay up to date</h3>
              <p className="text-sm text-blue-100 mt-1">Get the latest CRM tips, product updates, and industry insights.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 w-full md:w-72 rounded-l-lg border-0 bg-white/95 dark:bg-slate-800/95 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                type="submit"
                disabled={subscribing}
                className="h-11 px-5 rounded-r-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-sm font-semibold border-none shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:shadow-xl disabled:opacity-70"
              >
                {subscribing ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={14} />}
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                <span className="relative text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">BizForce</span>
            </Link>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All-in-One CRM for growing businesses. Manage contacts, track sales, automate workflows, and grow — all from one powerful platform.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <a href="mailto:sajjad@bizforce-crm.online" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Mail size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> sajjad@bizforce-crm.online</a>
              <a href="tel:+923454452741" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Phone size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> +92-345-4452741</a>
              <p className="flex items-center gap-2"><MapPin size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> 125-F1, Johar Town, Lahore - Pakistan</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2.5">
              {productLinks.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-0.5 transition-transform">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Modules</h3>
            <ul className="space-y-2.5">
              {modules.map(m => (
                <li key={m} className="text-sm text-slate-600 dark:text-slate-400">{m}</li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-0.5 transition-transform">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Follow us</p>
              <div className="flex items-center gap-3">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="relative w-9 h-9 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:scale-110 hover:shadow-xl transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                    <s.icon size={16} className="relative" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            &copy; {new Date().getFullYear()} BizForce.online. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link>
            <Link to="/contact" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Globe size={14} /> Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
