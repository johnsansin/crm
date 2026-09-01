import type { Metadata } from 'next'
import { PricingPage } from '@/views/PricingPage'
import { ProductJsonLd, FAQJsonLd, ServiceJsonLd } from '@/components/JsonLd'

const faqs = [
  { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade at any time. When you upgrade, you are billed the prorated difference immediately. When you downgrade, the change takes effect at the end of your current billing period.' },
  { q: 'Is there a free trial for paid plans?', a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can explore all features and decide if BizForce is the right fit for your team.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express) as well as bank transfers for annual Enterprise plans.' },
  { q: 'How does the per-user pricing work?', a: 'You only pay for active users in your organization. You can add or remove users at any time and your bill adjusts automatically at the next billing cycle.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer special pricing for registered nonprofits and educational institutions. Contact our sales team to learn more about our nonprofit discount program.' },
  { q: 'What is included in the free Starter plan?', a: 'The Starter plan includes up to 3 users, 2,000 contacts, core CRM modules (contacts, leads, accounts, opportunities), email support, and mobile access — all completely free.' },
  { q: 'What CRM modules are included in the Growth plan?', a: 'The Growth plan includes all 24+ CRM modules: sales pipeline, workflow automation, custom reports, email campaigns, live chat, calendar, SMS, documents, quotes, invoices, and more.' },
]

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for BizForce CRM. Start free with up to 3 users, or upgrade to Growth at $29/user/month. 14-day free trial, no credit card required.',
  keywords: ['CRM pricing', 'CRM plans', 'free CRM', 'CRM cost', 'business CRM pricing', 'CRM per user', 'CRM subscription'],
  alternates: {
    canonical: 'https://bizforce-crm.online/pricing',
  },
  openGraph: {
    title: 'Pricing — BizForce CRM',
    description: 'Simple, transparent pricing for BizForce CRM. Start free, upgrade as you grow.',
    url: 'https://bizforce-crm.online/pricing',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BizForce CRM Pricing Plans' }],
  },
}

export default function Page() {
  return (
    <>
      <ProductJsonLd />
      <ServiceJsonLd />
      <FAQJsonLd faqs={faqs} />
      <PricingPage />
    </>
  )
}
