import type { Metadata } from 'next'
import { RefundPolicyPage } from '@/views/RefundPolicyPage'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'BizForce CRM Refund Policy. Learn about our refund and cancellation terms for all subscription plans.',
  alternates: {
    canonical: 'https://bizforce-crm.online/refund-policy',
  },
  openGraph: {
    title: 'Refund Policy — BizForce CRM',
    description: 'Learn about BizForce CRM refund and cancellation terms.',
    url: 'https://bizforce-crm.online/refund-policy',
  },
}

export default function Page() {
  return (
    <>
      <WebPageJsonLd title="Refund Policy" url="https://bizforce-crm.online/refund-policy" dateModified="2026-08-02" />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Refund Policy', url: 'https://bizforce-crm.online/refund-policy' },
      ]} />
      <RefundPolicyPage />
    </>
  )
}
