import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function TabsRoot({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('w-full', className)} {...props} />
}

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center gap-1 border-b border-border w-full overflow-x-auto scrollbar-none',
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
        'inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all shrink-0',
        'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
        'data-[state=active]:text-foreground data-[state=active]:border-primary',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-4', className)} {...props} />
}
