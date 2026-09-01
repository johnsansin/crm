import type { Metadata } from 'next'
import { ContactUsPage } from '@/views/ContactUsPage'
import { ContactPageJsonLd, BreadcrumbJsonLd, LocalBusinessJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with BizForce CRM. Email sajjad@bizforce-crm.online, call +92-345-4452741, or visit us in Lahore, Pakistan. We respond within 24 hours.',
  keywords: ['contact BizForce', 'CRM support', 'CRM help', 'BizForce email', 'BizForce phone', 'CRM contact'],
  alternates: {
    canonical: 'https://bizforce-crm.online/contact',
  },
  openGraph: {
    title: 'Contact Us — BizForce CRM',
    description: 'Get in touch with the BizForce CRM team. We respond within 24 hours.',
    url: 'https://bizforce-crm.online/contact',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contact BizForce CRM' }],
  },
}

export default function Page() {
  return (
    <>
      <ContactPageJsonLd />
      <LocalBusinessJsonLd />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Contact', url: 'https://bizforce-crm.online/contact' },
      ]} />
      <ContactUsPage />
    </>
  )
}
