import { PageHeader } from '@/components/layouts/page-header'
import { TeamDirectory } from '@/components/features/team-directory'
import { createClient } from '@/lib/supabase/server'

async function getTeamData() {
  const supabase = await createClient()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .order('full_name')

  // Get current allocations
  const { data: assignments } = await supabase
    .from('assignments')
    .select('team_member_id, hours_this_week')
    .eq('status', 'active')

  const allocationMap = new Map<string, number>()
  assignments?.forEach(a => {
    const current = allocationMap.get(a.team_member_id) || 0
    allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))
  })

  const membersWithCapacity = (teamMembers || []).map(m => ({
    ...m,
    allocated_hours: allocationMap.get(m.id) || 0,
    available_hours: (m.weekly_capacity_hours || 40) - (allocationMap.get(m.id) || 0),
  }))

  return membersWithCapacity
}

export default async function TeamPage() {
  const teamMembers = await getTeamData()

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage team members and their capabilities"
      />

      <div className="mt-6">
        <TeamDirectory initialMembers={teamMembers} />
      </div>
    </div>
  )
}
