import Link from 'next/link'
import { PageHeader } from '@/components/layouts/page-header'
import { UserManagement } from './user-management'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Upload } from 'lucide-react'

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

      {/* Quick Actions */}
      <div className="mt-6 mb-8">
        <Link
          href="/admin/import"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-accent text-black-ink font-bold uppercase text-sm hover:bg-orange-accent/90 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import from Forecast
        </Link>
      </div>

      <div className="mt-6">
        <UserManagement />
      </div>
    </div>
  )
}
