import type { Metadata } from 'next'
import { TermsPage } from '@/views/TermsPage'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BizForce CRM Terms of Service. Read the terms and conditions governing your use of the BizForce CRM platform and services.',
  alternates: {
    canonical: 'https://bizforce-crm.online/terms',
  },
  openGraph: {
    title: 'Terms of Service — BizForce CRM',
    description: 'Read the terms and conditions for using BizForce CRM.',
    url: 'https://bizforce-crm.online/terms',
  },
}

export default function Page() {
  return (
    <>
      <WebPageJsonLd title="Terms of Service" url="https://bizforce-crm.online/terms" dateModified="2026-08-02" />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Terms of Service', url: 'https://bizforce-crm.online/terms' },
      ]} />
      <TermsPage />
    </>
  )
}
