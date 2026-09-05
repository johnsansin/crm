'use client'

import { Link, useLocation, useNavigate } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronUp, Home, Sparkles, CircleHelp, Mail, BadgeDollarSign, ArrowRight, LayoutDashboard, PlugZap } from 'lucide-react'
import { useState, useEffect, type MouseEvent } from 'react'
import { useAuthStore } from '@/lib/auth'

export function SiteHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const { token, user } = useAuthStore()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash)
    syncHash()
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('popstate', syncHash)
    return () => {
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('popstate', syncHash)
    }
  }, [location.pathname])

  useEffect(() => {
    setMobileMenu(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!mobileMenu) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenu(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileMenu])

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.userName || user?.email || ''
  const initial = (user?.firstName || user?.userName || user?.email || 'U')?.[0]?.toUpperCase()
  const menuItems = [
    { to: '/', label: 'Home', description: 'Your CRM overview', icon: Home },
    { to: '/features', label: 'Features', description: 'Explore what BizForce can do', icon: Sparkles },
    { to: '/integrations', label: 'Integrations', description: 'Connect with the tools you use', icon: PlugZap },
    { to: '/pricing', label: 'Pricing', description: 'Simple plans that scale', icon: BadgeDollarSign },
    { to: '/faq', label: 'FAQ', description: 'Frequently asked questions', icon: CircleHelp },
    { to: '/blog', label: 'Blog', description: 'CRM tips and guides', icon: Sparkles },
    { to: '/contact', label: 'Contact', description: 'Talk with our team', icon: Mail },
  ]
  const isActive = (to: string) => {
    const [pathname, hash = ''] = to.split('#')
    if (location.pathname !== pathname) return false
    if (hash) return activeHash === `#${hash}`
    return pathname !== '/' || !activeHash
  }
  const handleHomepageMenu = (to: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname !== '/' || (to !== '/' && to !== '/#features')) return
    event.preventDefault()
    const nextHash = to === '/#features' ? '#features' : ''
    setActiveHash(nextHash)
    if (nextHash) {
      if (window.location.hash !== nextHash) window.location.hash = nextHash
      document.getElementById('features')?.scrollIntoView({ block: 'start' })
    } else {
      if (window.location.hash) window.history.pushState(null, '', '/')
      window.scrollTo({ top: 0 })
    }
    setMobileMenu(false)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-slate-200 bg-white/95 shadow-lg shadow-black/5 dark:border-white/8 dark:bg-slate-900/90' : 'border-slate-200 bg-white/95 shadow-sm dark:border-white/10 dark:bg-slate-900/90'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
              <span className="relative text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">BizForce</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-white/10 dark:bg-slate-950/50 md:flex">
            {menuItems.map(item => (
              <Link key={item.to} to={item.to} onClick={event => handleHomepageMenu(item.to, event)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${isActive(item.to) ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300' : 'text-slate-600 hover:bg-white/70 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300'}`}>
                {item.label}
              </Link>
            ))}
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

          <button aria-label={mobileMenu ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenu} aria-controls="mobile-navigation" className={`md:hidden grid h-10 w-10 place-items-center rounded-xl border transition-all ${mobileMenu ? 'border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-500/25 dark:border-blue-500/40' : 'border-white/70 bg-white/70 text-slate-700 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`} onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenu && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 top-16 -z-10 cursor-default bg-slate-950/35 backdrop-blur-[2px] md:hidden" onClick={() => setMobileMenu(false)} />}

        {mobileMenu && <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/60 bg-white/95 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95 md:hidden">
          <div className="mx-auto max-w-lg space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.to)
            return (
            <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={`group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${active ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 ring-1 ring-blue-100 dark:from-blue-950/60 dark:to-indigo-950/40 dark:text-blue-300 dark:ring-blue-900' : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-white/5'}`} onClick={event => { handleHomepageMenu(item.to, event); setMobileMenu(false) }}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400'}`}><Icon size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.description}</span></span>
              <ArrowRight size={16} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${active ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
            </Link>
          )})}
          <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
            {token && user ? (
              <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25" onClick={() => { setMobileMenu(false); navigate('/dashboard') }}>
                <LayoutDashboard size={17} className="mr-2" /> {displayName || 'Open Dashboard'}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12 rounded-xl bg-white/70 font-semibold dark:bg-white/5" onClick={() => { setMobileMenu(false); navigate('/login') }}>Sign In</Button>
                <Button
                  className="h-12 rounded-xl border-none bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
                  onClick={() => { setMobileMenu(false); navigate('/signup') }}
                >
                  Get Started <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
            )}
          </div>
          </div>
        </div>}
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
