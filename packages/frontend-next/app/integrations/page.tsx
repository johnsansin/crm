import type { Metadata } from 'next'
import { IntegrationsPage } from '@/views/IntegrationsPage'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect BizForce CRM with the tools you use: email, calendars, payments, voice, SMS, web forms, plus a full REST API and webhooks for custom integrations.',
  keywords: ['CRM integrations', 'CRM API', 'webhooks', 'email integration', 'payment integration CRM', 'BizForce integrations'],
  alternates: {
    canonical: 'https://bizforce-crm.online/integrations',
  },
  openGraph: {
    title: 'Integrations — BizForce CRM',
    description: 'Native capabilities and integrations for email, calendar, payments, voice, and web, plus a full REST API and webhooks.',
    url: 'https://bizforce-crm.online/integrations',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BizForce CRM Integrations' }],
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Integrations', url: 'https://bizforce-crm.online/integrations' },
      ]} />
      <IntegrationsPage />
    </>
  )
}
