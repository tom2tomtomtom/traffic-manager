import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide',
        variant === 'default' && 'bg-border-medium text-white-muted',
        variant === 'success' && 'bg-green-success text-black-ink',
        variant === 'warning' && 'bg-yellow-electric text-black-ink',
        variant === 'danger' && 'bg-red-hot text-white',
        variant === 'info' && 'bg-orange-accent text-black-ink',
        className
      )}
      {...props}
    />
  )
}

// Confidence badge with automatic color logic
export interface ConfidenceBadgeProps {
  score: number // 0-1
  className?: string
}

function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const getVariant = (
    score: number
  ): { bg: string; text: string; label: string } => {
    if (score >= 0.8) {
      return {
        bg: 'bg-orange-accent',
        text: 'text-black-ink',
        label: 'HIGH CONFIDENCE',
      }
    }
    if (score >= 0.5) {
      return {
        bg: 'bg-yellow-electric',
        text: 'text-black-ink',
        label: 'REVIEW',
      }
    }
    return {
      bg: 'bg-red-hot',
      text: 'text-white',
      label: 'VERIFY',
    }
  }

  const variant = getVariant(score)

  return (
    <span
      className={cn(
        'inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide',
        variant.bg,
        variant.text,
        className
      )}
    >
      {variant.label}
    </span>
  )
}

// Status badge for assignments/projects
export interface StatusBadgeProps {
  status: 'active' | 'paused' | 'completed' | 'briefing' | 'on-hold' | 'archived'
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (
    status: string
  ): { bg: string; text: string; label: string } => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-success', text: 'text-black-ink', label: 'ACTIVE' }
      case 'briefing':
        return { bg: 'bg-blue-info', text: 'text-white', label: 'BRIEFING' }
      case 'paused':
      case 'on-hold':
        return { bg: 'bg-yellow-electric', text: 'text-black-ink', label: 'ON HOLD' }
      case 'completed':
        return { bg: 'bg-border-medium', text: 'text-white-muted', label: 'COMPLETED' }
      case 'archived':
        return { bg: 'bg-border-subtle', text: 'text-white-dim', label: 'ARCHIVED' }
      default:
        return { bg: 'bg-border-medium', text: 'text-white-muted', label: status.toUpperCase() }
    }
  }

  const variant = getVariant(status)

  return (
    <span
      className={cn(
        'inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide',
        variant.bg,
        variant.text,
        className
      )}
    >
      {variant.label}
    </span>
  )
}

export { Badge, ConfidenceBadge, StatusBadge }
