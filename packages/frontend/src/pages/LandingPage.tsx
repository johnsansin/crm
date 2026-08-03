import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Building2, TrendingUp, Shield, Users, BarChart3, Zap, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { SiteLayout } from '@/components/SiteLayout'

const features = [
  { icon: Building2, title: 'Account Management', description: 'Manage all your customer accounts with detailed profiles, activity logs, and relationship mapping.' },
  { icon: TrendingUp, title: 'Sales Pipeline', description: 'Track deals from lead to close with visual pipeline management and forecasting.' },
  { icon: Shield, title: 'Access Control', description: 'Role-based permissions ensure your data stays secure and accessible to the right people.' },
  { icon: Users, title: 'Team Collaboration', description: 'Share notes, assign tasks, and collaborate seamlessly across your organization.' },
  { icon: BarChart3, title: 'Reports & Analytics', description: 'Make data-driven decisions with customizable dashboards and real-time reports.' },
  { icon: Zap, title: 'Workflow Automation', description: 'Automate repetitive tasks and streamline your business processes.' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  return (
    <SiteLayout>
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Decorative glossy blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-16 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />
        <div className="absolute bottom-20 left-16 w-32 h-32 rounded-full bg-gradient-to-b from-white/60 to-indigo-200/40 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur text-sm text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Trusted by growing businesses
          </div>

          <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
            All-in-One CRM for{' '}
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Growing Businesses
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Manage contacts, track sales, automate workflows, and grow your business — all from one powerful platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="relative h-12 overflow-hidden rounded-lg text-white text-base font-semibold px-8 border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
              onClick={() => navigate('/signup')}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
              <span className="relative inline-flex items-center"><Sparkles size={18} className="mr-2" />Start Free Trial</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base rounded-lg border-white/70 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-2">✓ No credit card required</span>
            <span className="flex items-center gap-2">✓ 14-day free trial</span>
            <span className="flex items-center gap-2">✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Everything you need to grow</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Powerful features that help you manage customer relationships, close deals, and scale your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="group relative p-6 rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-700/50 transition-all duration-300">
                <div className="relative w-10 h-10 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                  <feature.icon size={20} className="relative text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Built for modern teams</h2>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              BizForce brings together everything you need to manage customer relationships in one place.
              From sales and marketing to support and projects, our platform helps teams work smarter,
              close deals faster, and deliver exceptional customer experiences.
            </p>
            <div className="mt-8 flex items-center justify-center gap-12 text-center">
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">24+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">CRM Modules</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">99.9%</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 sm:p-12 text-center overflow-hidden shadow-2xl shadow-blue-500/40">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/15 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to transform your business?</h2>
              <p className="mt-4 text-blue-100 max-w-xl mx-auto">
                Join thousands of businesses using BizForce to manage customer relationships and drive growth.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="relative mt-8 h-12 px-8 text-base overflow-hidden rounded-lg bg-white text-blue-700 font-semibold border-none hover:bg-blue-50 shadow-lg transition-all"
                onClick={() => navigate('/signup')}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/0 to-transparent rounded-t-lg pointer-events-none" />
                <span className="relative">Get Started Free</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
