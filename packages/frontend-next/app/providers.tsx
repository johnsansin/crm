'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: {
    retry: 1,
    staleTime: 30_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } } }))
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target) }
    }), { threshold: 0.1 })
    let frame = 0
    const observe = () => {
      frame = 0
      document.querySelectorAll('.reveal:not(.revealed)').forEach(element => observer.observe(element))
    }
    const scheduleObserve = () => { if (!frame) frame = window.requestAnimationFrame(observe) }
    const mutations = new MutationObserver(scheduleObserve)
    observe(); mutations.observe(document.body, { childList: true, subtree: true })
    return () => { if (frame) window.cancelAnimationFrame(frame); mutations.disconnect(); observer.disconnect() }
  }, [])
  return <ErrorBoundary><QueryClientProvider client={queryClient}><ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider></QueryClientProvider></ErrorBoundary>
}
