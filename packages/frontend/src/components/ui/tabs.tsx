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
        'inline-flex min-h-11 items-center gap-1 rounded-xl border border-border/70 bg-card p-1 w-full overflow-x-auto scrollbar-none shadow-sm',
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
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all shrink-0',
        'text-muted-foreground hover:bg-muted hover:text-foreground',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    >{translated(props.children)}</TabsPrimitive.Trigger>
  )
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-4', className)} {...props} />
}
