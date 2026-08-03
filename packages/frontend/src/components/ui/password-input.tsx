import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false)
    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
