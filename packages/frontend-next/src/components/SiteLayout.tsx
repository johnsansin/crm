'use client'

import { ReactNode } from 'react'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] min-w-0 overflow-x-hidden flex flex-col bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
