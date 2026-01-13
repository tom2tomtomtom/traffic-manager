import { PageHeader } from '@/components/layouts/page-header'
import { ImportForm } from './import-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ImportPage() {
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
        title="Import from Forecast"
        description="Upload CSV exports from Forecast to import team members, projects, and assignments"
      />

      <div className="mt-6">
        <ImportForm />
      </div>
    </div>
  )
}
