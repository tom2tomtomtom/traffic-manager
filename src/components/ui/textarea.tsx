import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full bg-black-deep border-2 border-border-subtle px-4 py-3',
          'text-white-full placeholder:text-white-dim',
          'focus:border-orange-accent focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors resize-none',
          'font-mono text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
