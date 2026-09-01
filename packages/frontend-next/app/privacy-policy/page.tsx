import type { Metadata } from 'next'
import { PrivacyPolicyPage } from '@/views/PrivacyPolicyPage'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BizForce CRM Privacy Policy. Learn how we collect, use, disclose, and safeguard your information when you use our CRM platform and website.',
  alternates: {
    canonical: 'https://bizforce-crm.online/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy — BizForce CRM',
    description: 'Learn how BizForce CRM collects, uses, and safeguards your information.',
    url: 'https://bizforce-crm.online/privacy-policy',
  },
}

export default function Page() {
  return (
    <>
      <WebPageJsonLd title="Privacy Policy" url="https://bizforce-crm.online/privacy-policy" dateModified="2026-08-02" />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Privacy Policy', url: 'https://bizforce-crm.online/privacy-policy' },
      ]} />
      <PrivacyPolicyPage />
    </>
  )
}
