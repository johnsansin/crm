'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { Children, isValidElement, cloneElement } from 'react'
import { t } from '@/lib/i18n'

function translated(node: React.ReactNode): React.ReactNode {
  return Children.map(node, child => {
    if (typeof child === 'string') {
      const leading = child.match(/^\s*/)?.[0] || ''; const trailing = child.match(/\s*$/)?.[0] || ''; const key = child.trim()
      return key ? `${leading}${t(key)}${trailing}` : child
    }
    if (isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) return cloneElement(child, {}, translated(child.props.children))
    return child
  })
}

export function TabsRoot({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('w-full', className)} {...props} />
}

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex min-h-11 w-full items-center gap-1 overflow-x-auto rounded-xl border border-border/80 bg-muted/60 p-1 scrollbar-none shadow-inner',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-all',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        'data-[state=active]:!border-primary/40 data-[state=active]:!bg-primary data-[state=active]:!font-bold data-[state=active]:!text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 data-[state=active]:ring-1 data-[state=active]:ring-primary/20',
        className
      )}
      {...props}
    >{translated(props.children)}</TabsPrimitive.Trigger>
  )
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-4', className)} {...props} />
}
