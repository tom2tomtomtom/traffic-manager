'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface PageHelpProps {
  title: string
  children: React.ReactNode
}

export function PageHelp({ title, children }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Help trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-orange-accent text-black-ink flex items-center justify-center hover:bg-orange-accent/90 transition-all z-40"
        aria-label="Show help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black-ink/80 z-50 flex items-center justify-center p-4">
          <div className="bg-black-card border-2 border-orange-accent max-w-lg w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h2 className="text-lg font-bold text-orange-accent uppercase tracking-wide">
                {title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white-dim hover:text-white-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-white-muted text-sm space-y-4">
              {children}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-subtle">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-orange-accent text-black-ink font-bold uppercase text-sm hover:bg-orange-accent/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
