import { cn } from '@/lib/utils'

export function UserAvatar({ user, size = 32, className }: { user?: any; size?: number; className?: string }) {
  const name = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '?'
    : '?'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        title={name}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover shrink-0', className)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      title={name}
      className={cn(
        'rounded-full shrink-0 bg-primary/10 text-primary flex items-center justify-center font-semibold',
        className,
      )}
    >
      {initials}
    </div>
  )
}
