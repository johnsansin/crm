'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Choice = 'accepted' | 'declined' | null

export function CookieConsent() {
  const [choice, setChoice] = useState<Choice>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('bizforce_cookie_consent') : null
      if (!stored) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const choose = (value: 'accepted' | 'declined') => {
    try {
      window.localStorage.setItem('bizforce_cookie_consent', value)
      document.cookie = `bizforce_cookie_consent=${value}; path=/; max-age=31536000; SameSite=Lax`
    } catch { /* storage may be unavailable */ }
    setChoice(value)
    setVisible(false)
    try {
      window.dispatchEvent(new CustomEvent('bizforce:cookie-consent', { detail: value }))
    } catch { /* noop */ }
  }

  if (!visible || choice) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[130] p-3 sm:p-4" role="dialog" aria-label="Cookie consent">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie size={18} />
          </div>
          <div className="min-w-0 text-sm text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">We value your privacy</p>
            <p>
              We use essential cookies to keep you signed in and optional analytics cookies to understand
              how the app is used. Choose <span className="font-medium text-foreground">Yes</span> to accept
              optional cookies, or <span className="font-medium text-foreground">No</span> to use only
              essential cookies. You can change your choice anytime. Read our{' '}
              <Link href="/cookie-policy" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">Cookie Policy</Link>.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/privacy-policy">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">Privacy Policy</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => choose('declined')} className="w-full sm:w-auto">
            No, thanks
          </Button>
          <Button size="sm" onClick={() => choose('accepted')} className="w-full sm:w-auto">
            Yes, I accept
          </Button>
        </div>
      </div>
    </div>
  )
}