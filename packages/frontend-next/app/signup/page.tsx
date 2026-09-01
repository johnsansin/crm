import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/JsonLd'
import { SignUpPage } from '@/views/SignUpPage'

export const metadata: Metadata = {
  title: 'Get Started — Free CRM Trial',
  description: 'Create your free BizForce CRM account in seconds. No credit card required. Start managing contacts, tracking sales, and automating workflows today.',
  keywords: ['free CRM signup', 'CRM trial', 'create CRM account', 'free CRM account', 'BizForce signup'],
  alternates: {
    canonical: 'https://bizforce-crm.online/signup',
  },
  openGraph: {
    title: 'Get Started — BizForce CRM',
    description: 'Create your free BizForce CRM account in seconds. No credit card required.',
    url: 'https://bizforce-crm.online/signup',
  },
  robots: { index: false, follow: true },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Get Started', url: 'https://bizforce-crm.online/signup' },
      ]} />
      <SignUpPage />
    </>
  )
}
