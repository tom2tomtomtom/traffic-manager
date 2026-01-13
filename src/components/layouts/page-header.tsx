import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  backLink?: string
  backLabel?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, backLink, backLabel, children }: PageHeaderProps) {
  return (
    <div>
      {backLink && (
        <Link
          href={backLink}
          className="inline-flex items-center gap-1 text-white-dim text-sm hover:text-orange-accent transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel || 'Back'}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-accent uppercase tracking-wide">
            {title}
          </h1>
          {description && (
            <p className="text-white-muted text-sm mt-1">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
