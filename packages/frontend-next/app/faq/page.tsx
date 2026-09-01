import type { Metadata } from 'next'
import { FAQPage } from '@/views/FaqPage'
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

const faqs = [
  { q: 'What is BizForce CRM?', a: 'BizForce CRM is an all-in-one customer relationship management platform with 24+ modules for sales, marketing, support, and operations.' },
  { q: 'Is BizForce really free?', a: 'Yes! The Starter plan is free for up to 3 users with 2,000 contacts and all core CRM modules.' },
  { q: 'Can I switch plans at any time?', a: 'Yes. Upgrade or downgrade anytime. Prorated billing on upgrade, effective at period end on downgrade.' },
  { q: 'What payment methods do you accept?', a: 'All major credit cards (Visa, Mastercard, Amex) and bank transfers for annual Enterprise plans.' },
  { q: 'How many languages does BizForce support?', a: 'BizForce supports 17+ languages including English, Spanish, French, German, Chinese, Japanese, and more.' },
  { q: 'Is my data secure?', a: 'Yes. AES-256 encryption, TLS 1.3, SOC 2 compliant data centers, regular backups, and GDPR compliance.' },
  { q: 'Does BizForce have an API?', a: 'Yes. A RESTful API is available on the Enterprise plan for custom integrations and automation.' },
  { q: 'Can I export my data?', a: 'Yes. Export all your data in CSV format at any time.' },
]

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about BizForce CRM. Get answers about features, pricing, security, getting started, and more.',
  keywords: ['BizForce FAQ', 'CRM questions', 'CRM help', 'CRM pricing questions', 'CRM features'],
  alternates: {
    canonical: 'https://bizforce-crm.online/faq',
  },
  openGraph: {
    title: 'FAQ — BizForce CRM',
    description: 'Frequently asked questions about BizForce CRM features, pricing, and security.',
    url: 'https://bizforce-crm.online/faq',
  },
}

export default function Page() {
  return (
    <>
      <FAQJsonLd faqs={faqs} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'FAQ', url: 'https://bizforce-crm.online/faq' },
      ]} />
      <FAQPage />
    </>
  )
}
