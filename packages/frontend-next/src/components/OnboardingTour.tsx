'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Menu, Search, MessageSquare, Bell, Headphones, UserCog,
  ChevronRight, ChevronLeft, X, Sparkles, Check
} from 'lucide-react'

const steps = [
  {
    icon: Menu,
    titleKey: 'onboard.step1.title',
    descKey: 'onboard.step1.desc',
    target: '[data-tour="navigation"]',
  },
  {
    icon: Search,
    titleKey: 'onboard.step2.title',
    descKey: 'onboard.step2.desc',
    target: '[data-tour="search"]',
  },
  {
    icon: MessageSquare,
    titleKey: 'onboard.step3.title',
    descKey: 'onboard.step3.desc',
    target: '[data-tour="communication"], [data-tour="workspace-actions"]',
  },
  {
    icon: Bell,
    titleKey: 'onboard.step4.title',
    descKey: 'onboard.step4.desc',
    target: '[data-tour="notifications"]',
  },
  {
    icon: Headphones,
    titleKey: 'onboard.step5.title',
    descKey: 'onboard.step5.desc',
    target: '[data-tour="support-desk"]',
  },
  {
    icon: UserCog,
    titleKey: 'onboard.step6.title',
    descKey: 'onboard.step6.desc',
    target: '[data-tour="profile"]',
  },
  {
    icon: Sparkles,
    titleKey: 'onboard.step7.title',
    descKey: 'onboard.step7.desc',
    target: null,
  },
]

function getRect(el: HTMLElement | null): DOMRect | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  return r
}

export function OnboardingTour() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null)

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  const updateSpot = useCallback(() => {
    if (!current.target) { setSpotRect(null); return }
    const el = document.querySelector(current.target) as HTMLElement | null
    setSpotRect(getRect(el))
  }, [current.target])

  useEffect(() => {
    updateSpot()
    const target = current.target ? document.querySelector(current.target) as HTMLElement | null : null
    const observer = target && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSpot) : null
    if (target) observer?.observe(target)
    window.addEventListener('resize', updateSpot)
    window.addEventListener('scroll', updateSpot, true)
    return () => { observer?.disconnect(); window.removeEventListener('resize', updateSpot); window.removeEventListener('scroll', updateSpot, true) }
  }, [updateSpot])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
      if (event.key === 'ArrowLeft' && !isFirst) handleBack()
      if (event.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleClose = async () => {
    setClosing(true)
    try {
      await api.completeOnboarding()
      useAuthStore.setState({ user: { ...user, hasCompletedOnboarding: true } })
    } catch {}
    setClosing(false)
  }

  const handleNext = () => { if (isLast) handleClose(); else setStep(s => s + 1) }
  const handleBack = () => { if (!isFirst) setStep(s => s - 1) }

  const pad = 10

  const clipPath = spotRect
    ? (() => {
        const l = Math.max(0, spotRect.left - pad)
        const t = Math.max(0, spotRect.top - pad)
        const r = Math.min(window.innerWidth, spotRect.right + pad)
        const b = Math.min(window.innerHeight, spotRect.bottom + pad)
        return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 0, ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px)`
      })()
    : 'none'

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const tooltipStyle = (() => {
    const tw = isMobile ? Math.min(340, window.innerWidth - 32) : 370
    const th = 260

    if (!spotRect) {
      return { position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `${tw}px`, maxWidth: 'calc(100vw - 32px)', zIndex: 110 }
    }

    if (isMobile) {
      const top = Math.min(spotRect.bottom + pad + 12, window.innerHeight - th - 16)
      return { position: 'fixed' as const, top: `${Math.max(16, top)}px`, left: '50%', transform: 'translateX(-50%)', width: `${tw}px`, maxWidth: 'calc(100vw - 32px)', zIndex: 110 }
    }

    const gap = 16
    const rightLeft = spotRect.right + gap + tw
    if (rightLeft < window.innerWidth - 16) {
      const topCenter = spotRect.top + spotRect.height / 2
      const clampedTop = Math.max(th / 2 + 16, Math.min(topCenter, window.innerHeight - th / 2 - 16))
      return { position: 'fixed' as const, top: `${clampedTop}px`, left: `${spotRect.right + gap}px`, transform: 'translateY(-50%)', width: `${tw}px`, maxWidth: 'calc(100vw - 32px)', zIndex: 110 }
    }

    const leftLeft = spotRect.left - gap - tw
    if (leftLeft > 16) {
      const topCenter = spotRect.top + spotRect.height / 2
      const clampedTop = Math.max(th / 2 + 16, Math.min(topCenter, window.innerHeight - th / 2 - 16))
      return { position: 'fixed' as const, top: `${clampedTop}px`, left: `${leftLeft}px`, transform: 'translateY(-50%)', width: `${tw}px`, maxWidth: 'calc(100vw - 32px)', zIndex: 110 }
    }

    const topBelow = Math.min(spotRect.bottom + pad + 12, window.innerHeight - th - 16)
    return { position: 'fixed' as const, top: `${Math.max(16, topBelow)}px`, left: '50%', transform: 'translateX(-50%)', width: `${tw}px`, maxWidth: 'calc(100vw - 32px)', zIndex: 110 }
  })()

  return (
    <>
      <div
        className="fixed inset-0 z-[99]"
        style={{
          background: spotRect ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
          clipPath, WebkitClipPath: clipPath,
          transition: 'clip-path 0.3s ease, -webkit-clip-path 0.3s ease',
        }}
      />

      {spotRect && (
        <div
          className="fixed z-[100] pointer-events-none rounded-xl"
          style={{
            top: spotRect.top - pad, left: spotRect.left - pad,
            width: spotRect.width + pad * 2, height: spotRect.height + pad * 2,
            boxShadow: '0 0 0 3px rgba(99,102,241,0.7), 0 0 24px rgba(99,102,241,0.25)',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      <div style={tooltipStyle} className="animate-in fade-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl relative">
          <button onClick={handleClose} disabled={closing} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
            <X size={15} />
          </button>

          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 pb-5 pt-5 text-white sm:px-6 sm:pt-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-sm ring-1 ring-white/20">
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-100">
                  Quick tour · Task {step + 1} of {steps.length}
                </p>
                <h2 className="text-base font-bold leading-snug text-white sm:text-lg">
                  {t(current.titleKey)}
                </h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-violet-100">
              {t(current.descKey)}
            </p>
          </div>

          <div className="border-b bg-muted/30 px-5 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-1" aria-label="Tour tasks">
              {steps.map((item, index) => <button key={item.titleKey} type="button" onClick={() => setStep(index)} aria-label={`Go to task ${index + 1}`} className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold transition ${index < step ? 'bg-emerald-600 text-white' : index === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/15' : 'bg-muted text-muted-foreground'}`}>{index < step ? <Check size={13}/> : index + 1}</button>)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-2">
              {isFirst ? (
                <Button variant="ghost" size="sm" onClick={handleClose} disabled={closing} className="text-muted-foreground hover:text-foreground gap-1.5">
                  <X size={14} /> {t('onboard.skip')}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleBack} disabled={closing} className="gap-1.5">
                  <ChevronLeft size={15} /> {t('onboard.back')}
                </Button>
              )}
            </div>
            <Button size="sm" onClick={handleNext} disabled={closing} className="gap-1.5 px-4">
              {isLast ? t('onboard.getStarted') : t('onboard.next')}
              {!isLast && <ChevronRight size={15} />}
            </Button>
          </div>
          <p className="pb-3 text-center text-[10px] text-muted-foreground">Use ← → to move between tasks · Esc to finish</p>
        </div>
      </div>
    </>
  )
}
