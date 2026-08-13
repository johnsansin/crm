import { useState } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { Download, X } from 'lucide-react'

export function InstallPromptBanner() {
  const { canInstall, isInstalled, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || isInstalled || dismissed) return null

  return (
    <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:w-80 z-50">
      <div className="flex items-center gap-3 rounded-xl border bg-popover shadow-lg p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
          <Download size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install BizForce CRM</p>
          <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
        </div>
        <button
          onClick={() => install()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
