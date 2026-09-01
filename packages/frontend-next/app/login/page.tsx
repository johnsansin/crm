import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'
import { LoginPage } from '@/views/LoginPage'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your BizForce CRM account. Access your dashboard, contacts, sales pipeline, and more.',
  keywords: ['CRM login', 'BizForce login', 'CRM sign in', 'CRM dashboard'],
  alternates: {
    canonical: 'https://bizforce-crm.online/login',
  },
  openGraph: {
    title: 'Sign In — BizForce CRM',
    description: 'Sign in to your BizForce CRM account.',
    url: 'https://bizforce-crm.online/login',
  },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Sign In', url: 'https://bizforce-crm.online/login' },
      ]} />
      <LoginPage />
    </>
  )
}
