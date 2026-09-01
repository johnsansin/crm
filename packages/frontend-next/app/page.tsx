import type { Metadata } from 'next'
import { LandingPage } from '@/views/LandingPage'
import { OrganizationJsonLd, WebsiteJsonLd, LocalBusinessJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'BizForce CRM — All-in-One CRM for Growing Businesses',
  description: 'Manage contacts, track sales, automate workflows, and grow your business with BizForce CRM. 24+ modules, AI assistant, workflow automation, and real-time analytics. Start free — no credit card required.',
  keywords: ['CRM', 'customer relationship management', 'sales pipeline', 'contact management', 'workflow automation', 'AI CRM', 'business CRM', 'free CRM', 'CRM software', 'sales automation', 'lead management', 'customer management'],
  alternates: {
    canonical: 'https://bizforce-crm.online',
  },
  openGraph: {
    title: 'BizForce CRM — All-in-One CRM for Growing Businesses',
    description: 'Manage contacts, track sales, automate workflows, and grow your business with BizForce CRM. 24+ modules, AI assistant, workflow automation.',
    url: 'https://bizforce-crm.online',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BizForce CRM — All-in-One CRM for Growing Businesses' }],
  },
}

export default function Page() {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <LocalBusinessJsonLd />
      <LandingPage />
    </>
  )
}
