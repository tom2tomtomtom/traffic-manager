import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles (ALWAYS APPLIED)
          'font-bold uppercase tracking-wide transition-all border-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-red-hot focus:ring-offset-2 focus:ring-offset-black-ink',

          // Variant styles
          variant === 'primary' &&
            'bg-red-hot text-white border-red-hot hover:bg-red-dim',
          variant === 'secondary' &&
            'bg-orange-accent text-white border-orange-accent hover:bg-orange-dim',
          variant === 'ghost' &&
            'bg-black-card text-white-muted border-border-subtle hover:border-orange-accent hover:text-white-full',
          variant === 'danger' &&
            'bg-transparent text-red-hot border-red-hot hover:bg-red-hot hover:text-white',

          // Size styles
          size === 'sm' && 'px-4 py-2 text-xs',
          size === 'md' && 'px-6 py-3 text-sm',
          size === 'lg' && 'px-8 py-4 text-base',

          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
