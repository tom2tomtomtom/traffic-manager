import { createClient } from '@/lib/supabase/server'
import { DashboardHome } from '@/components/features/dashboard-home'

async function getDashboardData() {
  const supabase = await createClient()

  // Get active projects count and list
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, status, deadline, priority')
    .in('status', ['active', 'briefing'])
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(5)

  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'briefing'])

  // Get team capacity stats
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, full_name, weekly_capacity_hours')
    .eq('active', true)

  const { data: assignments } = await supabase
    .from('assignments')
    .select('team_member_id, hours_this_week')
    .eq('status', 'active')

  // Calculate capacity stats
  const allocationMap = new Map<string, number>()
  assignments?.forEach(a => {
    const current = allocationMap.get(a.team_member_id) || 0
    allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))
  })

  let totalCapacity = 0
  let totalAllocated = 0
  let overallocatedCount = 0

  teamMembers?.forEach(m => {
    const capacity = m.weekly_capacity_hours || 40
    const allocated = allocationMap.get(m.id) || 0
    totalCapacity += capacity
    totalAllocated += allocated
    if (allocated > capacity) overallocatedCount++
  })

  // Get upcoming milestones
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: upcomingMilestones } = await supabase
    .from('milestones')
    .select(`
      id, name, type, date, completed,
      project:projects(id, name)
    `)
    .eq('completed', false)
    .gte('date', today)
    .lte('date', nextWeek)
    .order('date', { ascending: true })
    .limit(5)

  // Get pending deliverables
  const { data: pendingDeliverables } = await supabase
    .from('deliverables')
    .select(`
      id, name, status, due_date,
      project:projects(id, name)
    `)
    .in('status', ['in_progress', 'review'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(5)

  // Get recent transcripts
  const { data: recentTranscripts } = await supabase
    .from('transcripts')
    .select('id, meeting_date, meeting_type, extraction_confidence, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  // Overdue items count
  const { count: overdueCount } = await supabase
    .from('deliverables')
    .select('*', { count: 'exact', head: true })
    .lt('due_date', today)
    .neq('status', 'approved')

  // Transform milestones to flatten project relation
  const transformedMilestones = (upcomingMilestones || []).map(m => ({
    ...m,
    project: Array.isArray(m.project) ? m.project[0] : m.project,
  }))

  // Transform deliverables to flatten project relation
  const transformedDeliverables = (pendingDeliverables || []).map(d => ({
    ...d,
    project: Array.isArray(d.project) ? d.project[0] : d.project,
  }))

  return {
    stats: {
      activeProjects: activeProjectsCount || 0,
      teamUtilization: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0,
      overallocatedMembers: overallocatedCount,
      overdueItems: overdueCount || 0,
    },
    upcomingProjects: projects || [],
    upcomingMilestones: transformedMilestones,
    pendingDeliverables: transformedDeliverables,
    recentTranscripts: recentTranscripts || [],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return <DashboardHome data={data} />
}
