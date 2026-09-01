import type { Metadata } from 'next'
import { BlogPage } from '@/views/BlogPage'
import { BreadcrumbJsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'CRM insights, sales tips, workflow automation guides, and business growth strategies from BizForce CRM. Learn how to close more deals and grow faster.',
  keywords: ['CRM blog', 'sales tips', 'CRM guides', 'business growth', 'workflow automation tips', 'CRM best practices'],
  alternates: {
    canonical: 'https://bizforce-crm.online/blog',
  },
  openGraph: {
    title: 'Blog — BizForce CRM',
    description: 'CRM insights, sales tips, and business growth strategies.',
    url: 'https://bizforce-crm.online/blog',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BizForce CRM Blog' }],
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Blog', url: 'https://bizforce-crm.online/blog' },
      ]} />
      <BlogPage />
    </>
  )
}
