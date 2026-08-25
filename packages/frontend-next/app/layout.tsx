import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'BizForce CRM',
  description: 'BizForce customer relationship management platform',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/bizforce-mark.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: '/bizforce-mark.svg',
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
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
      <body><Suspense fallback={null}><Providers>{children}</Providers></Suspense></body>
    </html>
  )
}
