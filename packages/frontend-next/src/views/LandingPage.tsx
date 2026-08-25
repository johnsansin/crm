'use client'

import { useNavigate, useLocation } from '@/lib/navigation'
import { Button } from '@/components/ui/button'
import {
  Building2, TrendingUp, Shield, Users, BarChart3, Zap, Sparkles,
  Mail, Phone, Calendar, CheckCircle, ArrowRight, Globe, Lock,
  MessageSquare, FileText, Target, Headphones, LayoutDashboard, Clock, ChevronUp
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { SiteLayout } from '@/components/SiteLayout'
import { useCountUp } from '@/lib/hooks'

const features = [
  { icon: Sparkles, title: 'AI Assistant', description: 'Get smart suggestions, automate data entry, and generate insights powered by artificial intelligence.' },
  { icon: LayoutDashboard, title: 'Customized Dashboard', description: 'Build your own dashboard with drag-and-drop widgets, KPIs, and real-time data visualizations.' },
  { icon: TrendingUp, title: 'Sales Pipeline', description: 'Track deals from lead to close with visual pipeline management and revenue forecasting.' },
  { icon: Shield, title: 'Access Control', description: 'Role-based permissions ensure your data stays secure and accessible to the right people.' },
  { icon: Users, title: 'Team Collaboration', description: 'Share notes, assign tasks, and collaborate seamlessly across your organization.' },
  { icon: BarChart3, title: 'Reports & Analytics', description: 'Make data-driven decisions with customizable dashboards and real-time reports.' },
  { icon: Zap, title: 'Workflow Automation', description: 'Automate repetitive tasks, set triggers, and streamline your business processes.' },
  { icon: Mail, title: 'Email Campaigns', description: 'Create, send, and track email marketing campaigns with built-in analytics.' },
  { icon: MessageSquare, title: 'Live Chat', description: 'Real-time team chat and customer-facing chat widget for instant support.' },
  { icon: Calendar, title: 'Calendar & Events', description: 'Schedule meetings, set reminders, and manage your team calendar in one place.' },
  { icon: Phone, title: 'SMS & Calls', description: 'Send SMS notifications and log call activities directly from the CRM.' },
  { icon: FileText, title: 'Documents & Quotes', description: 'Generate quotes, invoices, and purchase orders with professional templates.' },
]

const steps = [
  { step: '01', title: 'Sign Up Free', description: 'Create your organization in seconds. No credit card required.' },
  { step: '02', title: 'Invite Your Team', description: 'Add team members, assign roles, and configure permissions.' },
  { step: '03', title: 'Start Selling', description: 'Import contacts, manage leads, and close deals faster than ever.' },
]

const testimonials = [
  { name: 'Sarah Mitchell', role: 'Sales Director', company: 'TechFlow Inc.', quote: 'BizForce transformed how our sales team operates. We closed 40% more deals in the first quarter.' },
  { name: 'James Rodriguez', role: 'Operations Manager', company: 'CloudBase Solutions', quote: 'The automation features alone saved us 20 hours per week. Our team finally works on what matters.' },
  { name: 'Emily Chen', role: 'CEO', company: 'GreenField Ventures', quote: 'Best CRM we have used. The multi-organization feature lets us manage all our subsidiaries from one place.' },
]

const statsData = [
  { value: 24, suffix: '+', label: 'CRM Modules' },
  { value: 99, suffix: '.9%', label: 'Uptime SLA' },
  { value: 17, suffix: '+', label: 'Languages' },
  { value: 50, suffix: '+', label: 'Integrations' },
]

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, value: displayValue } = useCountUp(value, 2000, '', suffix)
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">{displayValue}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{label}</p>
    </div>
  )
}

const pricingPlans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'For small teams getting started with CRM.',
    features: ['Up to 3 users', '2,000 contacts', 'Core CRM modules', 'Email support', 'Mobile access'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$29',
    period: '/user/month',
    description: 'For growing teams that need more power.',
    features: ['Up to 20 users', '50,000 contacts', 'All CRM modules', 'Workflow automation', 'Custom reports', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with advanced needs.',
    features: ['Unlimited users', 'Unlimited contacts', 'Advanced permissions', 'API access', 'SSO / SAML', 'Dedicated support'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

const integrations = [
  'Gmail', 'Outlook', 'Slack', 'Zapier', 'Stripe', 'Twilio',
  'Google Calendar', 'Mailchimp', 'Stripe', 'WordPress',
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
      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-16 w-40 h-40 rounded-full bg-gradient-to-b from-white/60 to-sky-200/40 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur text-sm text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Trusted by growing businesses worldwide
          </div>

          <h1 className="mt-8 text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
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
              className="relative h-13 overflow-hidden rounded-xl text-white text-base font-semibold px-8 border-none bg-gradient-to-b from-sky-500 via-blue-600 to-blue-700 hover:from-sky-400 hover:via-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/40 transition-all"
              onClick={() => navigate('/signup')}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg pointer-events-none" />
              <span className="relative inline-flex items-center"><Sparkles size={18} className="mr-2" />Start Free Trial</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base rounded-xl border-white/70 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400 flex-wrap reveal reveal-up">
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white/40 dark:bg-white/5 backdrop-blur border-y border-slate-200/50 dark:border-white/5 reveal reveal-scale">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger">
            {statsData.map(s => (
              <AnimatedStat key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Everything you need to grow</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Powerful features that help you manage customer relationships, close deals, and scale your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {features.map((feature) => (
              <div key={feature.title} className="reveal reveal-up group relative p-6 rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:shadow-sky-300/50 dark:hover:shadow-sky-800/30 hover:border-sky-300 dark:hover:border-sky-600/50 hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="relative w-10 h-10 overflow-hidden rounded-lg bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Get started in 3 simple steps</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">No complex setup. No training required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger">
            {steps.map((step, i) => (
              <div key={step.step} className="reveal reveal-up relative text-center group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-sky-300 to-indigo-300 dark:from-sky-700 dark:to-indigo-700" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-blue-500/30 mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Built for Modern Teams */}
      <section id="about" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal reveal-left">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Built for modern teams</h2>
              <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                BizForce brings together everything you need to manage customer relationships in one place.
                From sales and marketing to support and projects, our platform helps teams work smarter,
                close deals faster, and deliver exceptional customer experiences.
              </p>
              <ul className="mt-8 space-y-3 stagger">
                {['113+ data models with full CRUD', 'Real-time collaboration & chat', 'AI-powered assistant & insights', 'Multi-language support (17+ languages)'].map(item => (
                  <li key={item} className="reveal reveal-left flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <CheckCircle size={18} className="text-green-500 shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal reveal-right">
              <div className="relative">
                <div className="rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-8 border border-slate-200/60 dark:border-white/10 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4 stagger">
                    {[
                      { icon: LayoutDashboard, label: 'Dashboard', color: 'from-sky-500 to-blue-600' },
                      { icon: Target, label: 'Sales Pipeline', color: 'from-blue-500 to-indigo-600' },
                      { icon: Headphones, label: 'Support', color: 'from-indigo-500 to-violet-600' },
                      { icon: BarChart3, label: 'Analytics', color: 'from-violet-500 to-purple-600' },
                    ].map(item => (
                      <div key={item.label} className="reveal reveal-scale p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                          <item.icon size={18} className="text-white" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Loved by teams worldwide</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">See what our customers have to say.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger">
            {testimonials.map((t, i) => (
              <div key={i} className="reveal reveal-up relative p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/70 dark:border-white/10 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <svg className="w-8 h-8 text-sky-200 dark:text-sky-800 mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" /></svg>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Start free and upgrade as you grow. No hidden fees, cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {pricingPlans.map(plan => (
              <div key={plan.name} className={`reveal reveal-up relative p-7 rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col transition-all duration-300 ${plan.highlight ? 'border-sky-400 dark:border-sky-500 shadow-sky-200/60 dark:shadow-indigo-950/60 hover:shadow-xl hover:scale-[1.02]' : 'border-white/70 dark:border-white/10 shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:-translate-y-1'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0"><CheckCircle size={12} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`relative mt-8 w-full h-11 overflow-hidden rounded-lg !text-white font-semibold text-sm !border-0 shadow-lg transition-all hover:shadow-xl ${plan.highlight ? '!bg-gradient-to-b !from-sky-500 !via-blue-600 !to-blue-700 hover:!from-sky-400 hover:!via-blue-500 hover:!to-blue-600 shadow-blue-500/40' : '!bg-gradient-to-b !from-slate-600 !to-slate-800 hover:!from-slate-500 hover:!to-slate-700 shadow-slate-500/30'}`}
                  onClick={() => navigate(plan.name === 'Enterprise' ? '/contact' : '/signup')}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
                  <span className="relative">{plan.cta}</span>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">Need a custom plan? <button onClick={() => navigate('/contact')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Contact our sales team</button></p>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur border-y border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white reveal reveal-up">Integrates with your tools</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto reveal reveal-up">Connect BizForce with the tools you already use.</p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 stagger">
            {integrations.map(name => (
              <div key={name} className="reveal reveal-scale px-6 py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-white/70 dark:border-white/10 backdrop-blur shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal reveal-scale relative rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 sm:p-16 text-center overflow-hidden shadow-2xl shadow-blue-500/40">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/15 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-bold text-white">Ready to transform your business?</h2>
              <p className="mt-4 text-blue-100 max-w-xl mx-auto text-lg">
                Join thousands of businesses using BizForce to manage customer relationships and drive growth.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="relative h-12 px-8 text-base overflow-hidden rounded-xl bg-white text-blue-700 font-semibold border-none hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate('/signup')}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/0 to-transparent rounded-t-lg pointer-events-none" />
                  <span className="relative inline-flex items-center"><Sparkles size={18} className="mr-2" />Get Started Free</span>
                </Button>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white border-none shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all"
                  onClick={() => navigate('/contact')}
                >
                  Talk to Sales <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
