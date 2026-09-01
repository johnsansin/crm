import type { Metadata } from 'next'
import { CookiePolicyPage } from '@/views/CookiePolicyPage'
import { WebPageJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'BizForce CRM Cookie Policy. Learn about the cookies and tracking technologies we use, why we use them, and how you can control your preferences.',
  alternates: {
    canonical: 'https://bizforce-crm.online/cookie-policy',
  },
  openGraph: {
    title: 'Cookie Policy — BizForce CRM',
    description: 'Learn about the cookies BizForce CRM uses and how to control your preferences.',
    url: 'https://bizforce-crm.online/cookie-policy',
  },
}

export default function Page() {
  return (
    <>
      <WebPageJsonLd title="Cookie Policy" url="https://bizforce-crm.online/cookie-policy" dateModified="2026-08-02" />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Cookie Policy', url: 'https://bizforce-crm.online/cookie-policy' },
      ]} />
      <CookiePolicyPage />
    </>
  )
}
