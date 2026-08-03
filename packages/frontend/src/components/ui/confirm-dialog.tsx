import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open, onOpenChange, onConfirm, title, description,
  confirmLabel = 'Confirm', variant = 'destructive'
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={variant} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
