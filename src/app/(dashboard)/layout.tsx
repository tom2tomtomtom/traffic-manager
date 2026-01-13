import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/layouts/dashboard-nav'
import { ToastProvider } from '@/components/ui/toast'
import { UserProvider } from '@/lib/auth/user-context'
import { UserRole } from '@/lib/auth/permissions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || 'member') as UserRole

  // Redirect pending users to approval page
  if (role === 'member') {
    redirect('/pending-approval')
  }

  // Get linked team member info
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, full_name')
    .eq('profile_id', user.id)
    .single()

  return (
    <ToastProvider>
      <UserProvider
        role={role}
        teamMemberId={teamMember?.id || null}
        teamMemberName={teamMember?.full_name || null}
      >
        <div className="min-h-screen bg-black-ink bg-grid">
          {/* Navigation */}
          <DashboardNav user={user} role={role} />

          {/* Main content */}
          <main className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </UserProvider>
    </ToastProvider>
  )
}
