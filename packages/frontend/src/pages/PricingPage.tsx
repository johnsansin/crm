import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown } from 'lucide-react'
import { SiteLayout } from '@/components/SiteLayout'
import { useState } from 'react'

const plans = [
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

const faqs = [
  { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade at any time. When you upgrade, you are billed the prorated difference immediately. When you downgrade, the change takes effect at the end of your current billing period.' },
  { q: 'Is there a free trial for paid plans?', a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can explore all features and decide if BizForce is the right fit for your team.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express) as well as bank transfers for annual Enterprise plans.' },
  { q: 'How does the per-user pricing work?', a: 'You only pay for active users in your organization. You can add or remove users at any time and your bill adjusts automatically at the next billing cycle.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer special pricing for registered nonprofits and educational institutions. Contact our sales team to learn more about our nonprofit discount program.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/70 dark:border-white/10 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden transition-all">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-sky-50/50 dark:hover:bg-white/5 transition-colors">
        <span className="text-sm font-semibold text-slate-900 dark:text-white pr-4">{q}</span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export function PricingPage() {
  return (
    <SiteLayout>
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Simple, transparent pricing</h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`reveal reveal-up relative p-7 rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'border-sky-400 dark:border-sky-500 shadow-sky-200/60 dark:shadow-indigo-950/60 hover:shadow-xl hover:scale-[1.02]'
                    : 'border-white/70 dark:border-white/10 shadow-sky-200/40 dark:shadow-indigo-950/40 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30">
                    Most Popular
                  </span>
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
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                        <Check size={12} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`relative mt-8 w-full h-11 overflow-hidden rounded-lg !text-white font-semibold text-sm !border-0 shadow-lg transition-all hover:shadow-xl ${
                    plan.highlight
                      ? '!bg-gradient-to-b !from-sky-500 !via-blue-600 !to-blue-700 hover:!from-sky-400 hover:!via-blue-500 hover:!to-blue-600 shadow-blue-500/40'
                      : '!bg-gradient-to-b !from-slate-600 !to-slate-800 hover:!from-slate-500 hover:!to-slate-700 shadow-slate-500/30'
                  }`}
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.location.href = '/contact'
                    } else {
                      window.location.href = '/signup'
                    }
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
                  <span className="relative">{plan.cta}</span>
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Need a custom plan? <Link to="/contact" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Contact our sales team</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal reveal-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Everything you need to know about pricing.</p>
          </div>
          <div className="space-y-3 stagger">
            {faqs.map(faq => (
              <div key={faq.q} className="reveal reveal-up">
                <FAQItem q={faq.q} a={faq.a} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
