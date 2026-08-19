import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth'

export function SiteHeader() {
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const { token, user } = useAuthStore()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.userName || user?.email || ''
  const initial = (user?.firstName || user?.userName || user?.email || 'U')?.[0]?.toUpperCase()

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-white/40 dark:border-white/8 bg-white/85 dark:bg-slate-900/85 shadow-lg shadow-black/5' : 'border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
              <span className="relative text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">BizForce</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 hover:after:w-full after:transition-all after:duration-300">Home</Link>
            <Link to="/#features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 hover:after:w-full after:transition-all after:duration-300">Features</Link>
            <Link to="/#about" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 hover:after:w-full after:transition-all after:duration-300">About</Link>
            <Link to="/contact" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 hover:after:w-full after:transition-all after:duration-300">Contact</Link>
            <Link to="/pricing" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400 hover:after:w-full after:transition-all after:duration-300">Pricing</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {token && user ? (
              <button
                onClick={() => navigate('/dashboard')}
                title="Go to Dashboard"
                className="flex items-center gap-2 rounded-full border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">{initial}</span>
                <span className="max-w-[140px] truncate">{displayName}</span>
              </button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10">Sign In</Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="relative h-9 overflow-hidden rounded-lg text-white text-sm font-semibold border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all hover:shadow-xl"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                  <span className="relative">Get Started</span>
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenu && (
          <div className="md:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm -z-10" onClick={() => setMobileMenu(false)} />
        )}

        <div className={`md:hidden border-t border-white/60 dark:border-white/10 px-4 py-4 space-y-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 ${mobileMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          {[
            { to: '/', label: 'Home' },
            { to: '/#features', label: 'Features' },
            { to: '/#about', label: 'About' },
            { to: '/contact', label: 'Contact' },
            { to: '/pricing', label: 'Pricing' },
          ].map(link => (
            <Link key={link.to} to={link.to} className="block py-2.5 px-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors" onClick={() => setMobileMenu(false)}>{link.label}</Link>
          ))}
          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/10 mt-2">
            {token && user ? (
              <Button className="relative flex-1 overflow-hidden rounded-lg text-white text-sm font-semibold border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40" onClick={() => { setMobileMenu(false); navigate('/dashboard') }}>
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                <span className="relative">{displayName || 'Dashboard'}</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => { setMobileMenu(false); navigate('/login') }}>Sign In</Button>
                <Button
                  className="relative flex-1 overflow-hidden rounded-lg text-white text-sm font-semibold border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40"
                  onClick={() => { setMobileMenu(false); navigate('/signup') }}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
                  <span className="relative">Get Started</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <ChevronUp size={20} />
      </button>
    </>
  )
}
