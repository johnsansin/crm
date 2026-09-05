'use client'

import { Fragment } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

export interface MobileAction {
  key: string
  label: string
  icon?: React.ComponentType<{ size?: number | string; className?: string }>
  onClick?: () => void
  destructive?: boolean
  separatorBefore?: boolean
}

interface MobileActionMenuProps {
  items: MobileAction[]
  className?: string
  align?: 'start' | 'center' | 'end'
  menuClassName?: string
  title?: string
}

export function MobileActionMenu({ items, className, align = 'end', menuClassName, title = 'More actions' }: MobileActionMenuProps) {
  if (!items.length) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={title}
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            className
          )}
        >
          <MoreHorizontal size={17} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn('w-52', menuClassName)}>
        {items.map(it => (
          <Fragment key={it.key}>
            {it.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={it.onClick} className={it.destructive ? 'text-destructive focus:text-destructive' : undefined}>
              {it.icon && <it.icon size={14} className="mr-2" />}
              {it.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}