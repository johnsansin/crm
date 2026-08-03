import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function SiteHeader() {
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
            <span className="relative text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">BizForce</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <Link to="/#features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link>
          <Link to="/#about" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
          <Link to="/contact" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link>
          <Link to="/pricing" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10">Sign In</Button>
          <Button
            onClick={() => navigate('/signup')}
            className="relative h-9 overflow-hidden rounded-lg text-white text-sm font-semibold border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
            <span className="relative">Get Started</span>
          </Button>
        </div>

        <button className="md:hidden p-2 text-slate-700 dark:text-slate-200" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenu && (
        <div className="md:hidden border-t border-white/60 dark:border-white/10 px-4 py-4 space-y-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <Link to="/" className="block text-sm" onClick={() => setMobileMenu(false)}>Home</Link>
          <Link to="/#features" className="block text-sm" onClick={() => setMobileMenu(false)}>Features</Link>
          <Link to="/#about" className="block text-sm" onClick={() => setMobileMenu(false)}>About</Link>
          <Link to="/contact" className="block text-sm" onClick={() => setMobileMenu(false)}>Contact</Link>
          <Link to="/pricing" className="block text-sm" onClick={() => setMobileMenu(false)}>Pricing</Link>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/login')}>Sign In</Button>
            <Button
              className="relative flex-1 overflow-hidden rounded-lg text-white text-sm font-semibold border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40"
              onClick={() => navigate('/signup')}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
              <span className="relative">Get Started</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
