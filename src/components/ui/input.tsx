import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full bg-black-deep border-2 border-border-subtle px-4 py-3',
          'text-white-full placeholder:text-white-dim',
          'focus:border-orange-accent focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
