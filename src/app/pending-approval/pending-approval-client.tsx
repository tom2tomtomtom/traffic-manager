'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Clock, LogOut, Mail } from 'lucide-react'

interface PendingApprovalClientProps {
  userEmail: string
}

export function PendingApprovalClient({ userEmail }: PendingApprovalClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black-ink bg-grid flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-accent/20 mx-auto mb-6 flex items-center justify-center">
            <Clock className="w-8 h-8 text-orange-accent" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white-full uppercase tracking-wide mb-2">
            Pending Approval
          </h1>

          {/* Message */}
          <p className="text-white-muted mb-6">
            Your account is awaiting approval from an administrator.
            You&apos;ll receive access once your account has been reviewed.
          </p>

          {/* User Email */}
          <div className="bg-black-deep border-2 border-border-subtle p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-white-dim">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{userEmail}</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="text-left mb-8">
            <p className="text-xs uppercase font-bold text-orange-accent mb-3">
              What happens next?
            </p>
            <ul className="space-y-2 text-sm text-white-dim">
              <li className="flex items-start gap-2">
                <span className="text-orange-accent">1.</span>
                <span>An admin will review your sign-up request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-accent">2.</span>
                <span>You&apos;ll be assigned a role (viewer, manager, or admin)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-accent">3.</span>
                <span>Refresh this page or sign in again to access the app</span>
              </li>
            </ul>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 border-border-subtle text-white-muted hover:border-red-hot hover:text-red-hot transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white-dim mt-6">
          Need help? Contact your team administrator.
        </p>
      </div>
    </div>
  )
}
