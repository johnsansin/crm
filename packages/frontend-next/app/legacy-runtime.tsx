'use client'

import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Application from '../../frontend/src/App'
import { appBasePath } from '../../frontend/src/lib/base-path'

export function LegacyRuntime() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  }))

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    const observe = () => document.querySelectorAll('.reveal:not(.revealed)').forEach(element => observer.observe(element))
    const mutations = new MutationObserver(observe)
    observe()
    mutations.observe(document.body, { childList: true, subtree: true })
    return () => { mutations.disconnect(); observer.disconnect() }
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={appBasePath || undefined}>
          <Application />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
