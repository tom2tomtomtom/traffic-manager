import { PageHeader } from '@/components/layouts/page-header'
import { UserManagement } from './user-management'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()

  // Check user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Manage user access and roles"
      />

      <div className="mt-6">
        <UserManagement />
      </div>
    </div>
  )
}
