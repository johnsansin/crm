import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export interface DetailRow {
  label: string
  value?: ReactNode
  full?: boolean
}

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  rows: DetailRow[]
}

export function DetailDialog({ open, onOpenChange, title, subtitle, rows }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {rows.map(r => (
            <div key={r.label} className={r.full ? 'sm:col-span-2' : ''}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{r.label}</label>
              <div className="text-sm mt-1 break-words">{r.value ?? '-'}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
