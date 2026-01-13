import { PageHeader } from '@/components/layouts/page-header'
import { ProjectDetail } from '@/components/features/project-detail'
import { ProjectTimeline } from '@/components/features/project-timeline'
import { ProjectDeliverables } from '@/components/features/project-deliverables'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProject(id: string) {
  const supabase = await createClient()

  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    return null
  }

  // Fetch assignments with team member info
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, team_member_id, role_on_project, hours_this_week, estimated_hours, hours_consumed, status')
    .eq('project_id', id)
    .eq('status', 'active')

  // Fetch team member details
  const memberIds = assignments?.map(a => a.team_member_id) || []
  const { data: members } = memberIds.length > 0
    ? await supabase
        .from('team_members')
        .select('id, full_name, role, weekly_capacity_hours')
        .in('id', memberIds)
    : { data: [] }

  const memberMap = new Map(members?.map(m => [m.id, m]) || [])

  const assignmentsWithMembers = (assignments || []).map(a => ({
    id: a.id,
    team_member_id: a.team_member_id,
    team_member_name: memberMap.get(a.team_member_id)?.full_name || 'Unknown',
    team_member_role: memberMap.get(a.team_member_id)?.role || '',
    role_on_project: a.role_on_project,
    hours_this_week: a.hours_this_week || 0,
    estimated_hours: a.estimated_hours || 0,
    hours_consumed: a.hours_consumed || 0,
  }))

  // Get all team members for the add modal
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('id, full_name, role, weekly_capacity_hours')
    .eq('active', true)
    .order('full_name')

  // Get current allocations for available hours calculation
  const { data: allAssignments } = await supabase
    .from('assignments')
    .select('team_member_id, hours_this_week')
    .eq('status', 'active')

  const allocationMap = new Map<string, number>()
  allAssignments?.forEach(a => {
    const current = allocationMap.get(a.team_member_id) || 0
    allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))
  })

  const availableMembers = (allMembers || []).map(m => ({
    id: m.id,
    full_name: m.full_name,
    role: m.role,
    weekly_capacity_hours: m.weekly_capacity_hours || 40,
    allocated_hours: allocationMap.get(m.id) || 0,
    available_hours: (m.weekly_capacity_hours || 40) - (allocationMap.get(m.id) || 0),
    already_assigned: memberIds.includes(m.id),
  }))

  // Fetch milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', id)
    .order('date', { ascending: true })

  // Fetch deliverables
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select(`
      *,
      assigned_member:team_members!deliverables_assigned_to_fkey(id, full_name),
      approver:team_members!deliverables_approved_by_fkey(id, full_name)
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  // Fetch deliverable templates
  const { data: templates } = await supabase
    .from('deliverable_templates')
    .select('*')
    .order('name')

  return {
    project,
    assignments: assignmentsWithMembers,
    availableMembers,
    milestones: milestones || [],
    deliverables: deliverables || [],
    templates: templates || [],
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getProject(id)

  if (!data) {
    notFound()
  }

  return (
    <div>
      <PageHeader
        title={data.project.name}
        description={data.project.client || 'No client specified'}
        backLink="/projects"
        backLabel="Projects"
      />

      <div className="mt-6 space-y-8">
        <ProjectDetail
          project={data.project}
          assignments={data.assignments}
          availableMembers={data.availableMembers}
        />

        <ProjectTimeline
          projectId={data.project.id}
          projectDeadline={data.project.deadline}
          milestones={data.milestones}
        />

        <ProjectDeliverables
          projectId={data.project.id}
          deliverables={data.deliverables}
          teamMembers={data.availableMembers.map(m => ({ id: m.id, full_name: m.full_name }))}
          templates={data.templates}
        />
      </div>
    </div>
  )
}
