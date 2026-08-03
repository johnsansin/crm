import { Link } from 'react-router-dom'
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail, Phone, MapPin, Globe } from 'lucide-react'

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
  return (
    <footer className="border-t border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                <span className="relative text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">BizForce</span>
            </Link>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              All-in-One CRM for growing businesses. Manage contacts, track sales, automate workflows, and grow — all from one powerful platform.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-2"><Mail size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> suhailrao@gmail.com</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> +92-321-4477664</p>
              <p className="flex items-center gap-2"><MapPin size={14} className="text-blue-600 dark:text-blue-400 shrink-0" /> LG_80, Street 1, DRGCC, Phase 6, DHA, Lahore</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2.5">
              {productLinks.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {l.label}
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

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {l.label}
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
                    className="relative w-9 h-9 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
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
