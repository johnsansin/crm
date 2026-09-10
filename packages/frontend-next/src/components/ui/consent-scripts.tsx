'use client'

import { useEffect, useRef } from 'react'

export function ConsentScripts({ measurementId, nonce }: { measurementId: string; nonce?: string }) {
  const loadedRef = useRef(false)

  useEffect(() => {
    const loadAnalytics = () => {
      if (loadedRef.current) return
      try {
        const choice = window.localStorage.getItem('bizforce_cookie_consent')
        if (choice !== 'accepted') return
        const s = document.createElement('script')
        s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
        s.async = true
        if (nonce) s.nonce = nonce
        document.head.appendChild(s)
        const analytics = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
        analytics.dataLayer ||= []
        analytics.gtag = function () { analytics.dataLayer!.push(arguments) }
        analytics.gtag('js', new Date())
        analytics.gtag('config', measurementId)
        loadedRef.current = true
      } catch { /* noop */ }
    }

    loadAnalytics()
    window.addEventListener('bizforce:cookie-consent', loadAnalytics)
    return () => window.removeEventListener('bizforce:cookie-consent', loadAnalytics)
  }, [measurementId, nonce])

  return null
}
