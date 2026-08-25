'use client'

import { ReactNode } from 'react'
import { SiteLayout } from '@/components/SiteLayout'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteLayout>
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: {updated}</p>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
