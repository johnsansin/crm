'use client'

import { useEffect, useRef } from 'react'

export function ConsentScripts({ measurementId }: { measurementId: string }) {
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
        document.head.appendChild(s)
        const inline = document.createElement('script')
        inline.textContent = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}');`
        document.head.appendChild(inline)
        loadedRef.current = true
      } catch { /* noop */ }
    }

    loadAnalytics()
    window.addEventListener('bizforce:cookie-consent', loadAnalytics)
    return () => window.removeEventListener('bizforce:cookie-consent', loadAnalytics)
  }, [measurementId])

  return null
}