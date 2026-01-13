import { PageHeader } from '@/components/layouts/page-header'
import { CapacityDashboard } from '@/components/features/capacity-dashboard'
import { createClient } from '@/lib/supabase/server'

async function getCapacityData(weekOffset: number = 0) {
  const supabase = await createClient()

  // Calculate week start based on offset
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() + mondayOffset + (weekOffset * 7))
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('full_name')

  // Fetch assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, team_member_id, project_id, role_on_project, hours_this_week, estimated_hours, status')
    .eq('status', 'active')

  // Fetch projects
  const projectIds = [...new Set(assignments?.map(a => a.project_id) || [])]
  const { data: projects } = projectIds.length > 0
    ? await supabase.from('projects').select('id, name, client_name').in('id', projectIds)
    : { data: [] }

  const projectMap = new Map(projects?.map(p => [p.id, p]) || [])

  // Build allocation and assignments map
  const memberAssignments = new Map<string, Array<{
    id: string
    project_id: string
    project_name: string
    client_name: string
    role: string
    hours_this_week: number
    estimated_hours: number
    status: string
  }>>()
  const allocationMap = new Map<string, number>()

  assignments?.forEach(a => {
    const current = allocationMap.get(a.team_member_id) || 0
    allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))

    const project = projectMap.get(a.project_id)
    const assignWithProject = {
      id: a.id,
      project_id: a.project_id,
      project_name: project?.name || 'Unknown Project',
      client_name: project?.client_name || '',
      role: a.role_on_project || '',
      hours_this_week: a.hours_this_week || 0,
      estimated_hours: a.estimated_hours || 0,
      status: a.status || 'active',
    }

    const existing = memberAssignments.get(a.team_member_id) || []
    existing.push(assignWithProject)
    memberAssignments.set(a.team_member_id, existing)
  })

  // Transform to capacity data
  const capacityData = (teamMembers || []).map(member => {
    const allocated = allocationMap.get(member.id) || 0
    const memberAssigns = memberAssignments.get(member.id) || []

    return {
      id: member.id,
      full_name: member.full_name,
      role: member.role,
      weekly_capacity_hours: member.weekly_capacity_hours || 40,
      allocated_hours: allocated,
      available_hours: (member.weekly_capacity_hours || 40) - allocated,
      utilization_pct: member.weekly_capacity_hours > 0
        ? (allocated / member.weekly_capacity_hours) * 100
        : 0,
      overallocated: allocated > (member.weekly_capacity_hours || 40),
      core_roles: member.core_roles || [],
      capabilities: member.capabilities || [],
      industries: member.industries || [],
      permission_level: member.permission_level || 'Executor',
      known_clients: member.known_clients || [],
      assignments: memberAssigns,
    }
  })

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    weekOffset,
    teamMembers: capacityData,
  }
}

export default async function CapacityPage() {
  const initialData = await getCapacityData(0)

  return (
    <div>
      <PageHeader
        title="Team Capacity"
        description="View and manage weekly capacity allocation across the team."
      />

      <div className="mt-6">
        <CapacityDashboard initialData={initialData} />
      </div>
    </div>
  )
}
