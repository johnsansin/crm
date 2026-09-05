import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Providers } from './providers'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { ConsentScripts } from '@/components/ui/consent-scripts'

const gaMeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''

export const metadata: Metadata = {
  metadataBase: new URL('https://bizforce-crm.online'),
  title: {
    default: 'BizForce CRM — All-in-One CRM for Growing Businesses',
    template: '%s | BizForce CRM',
  },
  description: 'Manage contacts, track sales, automate workflows, and grow your business with BizForce CRM. 24+ modules, AI assistant, workflow automation, and real-time analytics. Start free — no credit card required.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/bizforce-mark.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: '/bizforce-mark.svg',
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BizForce CRM',
    title: 'BizForce CRM — All-in-One CRM for Growing Businesses',
    description: 'Manage contacts, track sales, automate workflows, and grow your business with BizForce CRM. 24+ modules, AI assistant, workflow automation.',
    url: 'https://bizforce-crm.online',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BizForce CRM — All-in-One CRM for Growing Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizForce CRM — All-in-One CRM for Growing Businesses',
    description: 'Manage contacts, track sales, automate workflows, and grow your business with BizForce CRM.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://bizforce-crm.online',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="geo.region" content="PK" />
        <meta name="geo.placename" content="Lahore" />
        <meta name="geo.position" content="31.5204;74.3587" />
        <meta name="ICBM" content="31.5204, 74.3587" />
      </head>
      <body>
        {gaMeasurementId && <Suspense fallback={null}><ConsentScripts measurementId={gaMeasurementId} /></Suspense>}
        <Suspense fallback={null}><Providers>{children}</Providers></Suspense>
        <Suspense fallback={null}><CookieConsent /></Suspense>
      </body>
    </html>
  )
}
