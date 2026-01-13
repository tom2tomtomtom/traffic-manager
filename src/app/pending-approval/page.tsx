import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PendingApprovalClient } from './pending-approval-client'

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has been approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'member'

  // If user has been promoted, redirect to dashboard
  if (role !== 'member') {
    redirect('/')
  }

  return <PendingApprovalClient userEmail={user.email || ''} />
}
