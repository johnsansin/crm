'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SiteLayout } from '@/components/SiteLayout'
import { Link } from '@/lib/navigation'

const faqCategories = [
  {
    category: 'Getting Started',
    faqs: [
      { q: 'What is BizForce CRM?', a: 'BizForce CRM is an all-in-one customer relationship management platform designed for growing businesses. It includes 24+ modules covering sales pipeline management, contact management, workflow automation, email campaigns, live chat, calendar, SMS, documents, quotes, invoices, and real-time analytics.' },
      { q: 'How do I get started with BizForce?', a: 'Getting started is simple. Click "Start Free Trial" on our homepage, create your organization, invite your team members, and start managing your contacts and sales. No credit card required for the free Starter plan.' },
      { q: 'Do I need technical knowledge to use BizForce?', a: 'No. BizForce is designed for business users, not developers. The intuitive interface makes it easy to manage contacts, track deals, and automate workflows without any technical background.' },
    ],
  },
  {
    category: 'Plans & Pricing',
    faqs: [
      { q: 'Is BizForce really free?', a: 'Yes! Our Starter plan is completely free for up to 3 users with 2,000 contacts. You get access to all core CRM modules, email support, and mobile access at no cost.' },
      { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade at any time. When you upgrade, you are billed the prorated difference immediately. When you downgrade, the change takes effect at the end of your current billing period.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express) as well as bank transfers for annual Enterprise plans.' },
      { q: 'How does the per-user pricing work?', a: 'You only pay for active users in your organization. You can add or remove users at any time and your bill adjusts automatically at the next billing cycle.' },
      { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer special pricing for registered nonprofits and educational institutions. Contact our sales team to learn more.' },
    ],
  },
  {
    category: 'Features',
    faqs: [
      { q: 'What CRM modules are included?', a: 'BizForce includes 24+ modules: Accounts, Contacts, Leads, Opportunities, Sales Orders, Purchase Orders, Quotes, Invoices, Products, Projects, Support Tickets, Campaigns, Calendar, Live Chat, SMS, Documents, Reports, Dashboards, Workflow Automation, AI Assistant, and more.' },
      { q: 'Does BizForce support multiple organizations?', a: 'Yes. BizForce supports multi-organization setups, allowing you to manage multiple subsidiaries or business units from a single platform with role-based access control.' },
      { q: 'Is there an API available?', a: 'Yes, BizForce provides a RESTful API for Enterprise plan users. You can integrate BizForce with your existing tools, build custom workflows, and automate data synchronization.' },
      { q: 'Does BizForce support multiple languages?', a: 'Yes, BizForce supports 17+ languages including English, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Arabic, and more.' },
    ],
  },
  {
    category: 'Security & Privacy',
    faqs: [
      { q: 'How is my data protected?', a: 'We use industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. All data is stored in secure, SOC 2 compliant data centers with regular backups and disaster recovery procedures.' },
      { q: 'Can I export my data?', a: 'Yes. You can export all your data (contacts, leads, deals, etc.) at any time in CSV format. We believe your data belongs to you.' },
      { q: 'Do you comply with GDPR?', a: 'Yes. BizForce is fully GDPR compliant. We provide data processing agreements, support data subject access requests, and ensure all data handling meets EU privacy regulations.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-200/60 dark:border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        aria-expanded={open}
      >
        {q}
        <ChevronDown size={16} className={`shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export function FAQPage() {
  return (
    <SiteLayout>
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Frequently Asked Questions</h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Everything you need to know about BizForce CRM.</p>
          </div>

          <div className="space-y-12">
            {faqCategories.map(cat => (
              <div key={cat.category}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{cat.category}</h2>
                <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg divide-y divide-slate-200/60 dark:divide-white/10">
                  {cat.faqs.map(faq => (
                    <div key={faq.q} className="px-5">
                      <FAQItem q={faq.q} a={faq.a} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Still have questions? <Link to="/contact" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Contact our team</Link> and we will get back to you within 24 hours.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
