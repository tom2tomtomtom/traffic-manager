import { PageHeader } from '@/components/layouts/page-header'
import { ProjectsTable } from '@/components/features/projects-table'
import { createClient } from '@/lib/supabase/server'

async function getProjects() {
  const supabase = await createClient()

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['briefing', 'active', 'on-hold'])
    .order('deadline', { ascending: true, nullsFirst: false })

  // Get assignment stats per project
  const { data: assignments } = await supabase
    .from('assignments')
    .select('project_id, hours_this_week, estimated_hours')
    .eq('status', 'active')

  const projectStats = new Map<string, { team_size: number; allocated_hours: number; estimated_hours: number }>()

  assignments?.forEach(a => {
    const existing = projectStats.get(a.project_id) || { team_size: 0, allocated_hours: 0, estimated_hours: 0 }
    existing.team_size += 1
    existing.allocated_hours += a.hours_this_week || 0
    existing.estimated_hours += a.estimated_hours || 0
    projectStats.set(a.project_id, existing)
  })

  return (projects || []).map(p => ({
    id: p.id,
    name: p.name,
    client: p.client || '',
    status: p.status,
    phase: p.phase,
    deadline: p.deadline,
    priority: p.priority,
    team_size: projectStats.get(p.id)?.team_size || 0,
    allocated_hours: projectStats.get(p.id)?.allocated_hours || 0,
    estimated_hours: projectStats.get(p.id)?.estimated_hours || p.estimated_total_hours || 0,
  }))
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage active projects and assignments."
      />

      <div className="mt-6">
        <ProjectsTable initialProjects={projects} />
      </div>
    </div>
  )
}
