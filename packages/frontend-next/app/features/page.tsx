import type { Metadata } from 'next'
import { FeaturesPage } from '@/views/FeaturesPage'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore the 24+ BizForce CRM modules: sales pipeline, AI assistant, workflow automation, email campaigns, live chat, invoicing, support tickets, and more. All-in-one CRM for growing businesses.',
  keywords: ['CRM features', 'CRM modules', 'sales pipeline software', 'workflow automation CRM', 'AI CRM assistant', 'contact management', 'invoice software', 'help desk ticks', 'CRM for small business', 'free CRM features'],
  alternates: {
    canonical: 'https://bizforce-crm.online/features',
  },
  openGraph: {
    title: 'Features — BizForce CRM',
    description: '24+ modules for sales, marketing, support, operations, and finance. One platform to grow your business.',
    url: 'https://bizforce-crm.online/features',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BizForce CRM Features' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features — BizForce CRM',
    description: '24+ modules for sales, marketing, support, operations, and finance.',
    images: ['/og-image.png'],
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Features', url: 'https://bizforce-crm.online/features' },
      ]} />
      <FeaturesPage />
    </>
  )
}