import { PageHeader } from '@/components/layouts/page-header'
import { BulkEntry } from '@/components/features/bulk-entry'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canEdit, UserRole } from '@/lib/auth/permissions'

async function getSetupData() {
  const supabase = await createClient()

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, full_name, role, weekly_capacity_hours')
    .eq('active', true)
    .order('full_name')

  // Get all projects (active and briefing)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, status')
    .in('status', ['briefing', 'active', 'on-hold'])
    .order('name')

  // Get existing assignments to show current state
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      id,
      project_id,
      team_member_id,
      role_on_project,
      hours_this_week,
      estimated_hours,
      status
    `)
    .eq('status', 'active')

  return {
    teamMembers: teamMembers || [],
    projects: projects || [],
    assignments: assignments || [],
  }
}

export default async function SetupPage() {
  const supabase = await createClient()

  // Check user role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || 'member') as UserRole

  // Only managers/admins can access this page
  if (!canEdit(role)) {
    redirect('/')
  }

  const { teamMembers, projects, assignments } = await getSetupData()

  return (
    <div>
      <PageHeader
        title="Quick Setup"
        description="Bulk enter current project assignments to bootstrap capacity data"
      />

      <div className="mt-6">
        <BulkEntry
          teamMembers={teamMembers}
          projects={projects}
          existingAssignments={assignments}
        />
      </div>
    </div>
  )
}
