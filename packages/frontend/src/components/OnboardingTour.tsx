import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Users, TrendingUp, Calendar, UserCog,
  ChevronRight, ChevronLeft, X, Sparkles, BarChart3
} from 'lucide-react'

const steps = [
  {
    icon: LayoutDashboard,
    titleKey: 'onboard.step1.title',
    descKey: 'onboard.step1.desc',
    target: '[data-tour="sidebar-logo"]',
  },
  {
    icon: BarChart3,
    titleKey: 'onboard.step2.title',
    descKey: 'onboard.step2.desc',
    target: '[data-tour="modules"]',
  },
  {
    icon: TrendingUp,
    titleKey: 'onboard.step3.title',
    descKey: 'onboard.step3.desc',
    target: '[data-tour="dashboard"]',
  },
  {
    icon: Calendar,
    titleKey: 'onboard.step4.title',
    descKey: 'onboard.step4.desc',
    target: '[data-tour="calendar"]',
  },
  {
    icon: Sparkles,
    titleKey: 'onboard.step5.title',
    descKey: 'onboard.step5.desc',
    target: '[data-tour="ai-assistant"]',
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
  const rafRef = useRef<number>(0)

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
    let running = true
    const tick = () => { if (!running) return; updateSpot(); rafRef.current = requestAnimationFrame(tick) }
    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [updateSpot])

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
        <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden relative">
          <button onClick={handleClose} disabled={closing} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
            <X size={15} />
          </button>

          <div className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-0.5">
                  Step {step + 1} / {steps.length}
                </p>
                <h2 className="text-base sm:text-lg font-bold leading-snug text-foreground">
                  {t(current.titleKey)}
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(current.descKey)}
            </p>
          </div>

          <div className="px-5 sm:px-6">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-3">
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
        </div>
      </div>
    </>
  )
}
