import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch projects with assignment counts
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['briefing', 'active', 'on-hold'])
      .order('deadline', { ascending: true, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get assignment counts per project
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

    const projectsWithStats = projects?.map(p => ({
      ...p,
      team_size: projectStats.get(p.id)?.team_size || 0,
      allocated_hours: projectStats.get(p.id)?.allocated_hours || 0,
      total_estimated_hours: projectStats.get(p.id)?.estimated_hours || p.estimated_total_hours || 0,
    }))

    return NextResponse.json({ projects: projectsWithStats })
  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        client: body.client,
        status: body.status || 'briefing',
        phase: body.phase || 'pre-production',
        estimated_total_hours: body.estimated_total_hours,
        start_date: body.start_date,
        deadline: body.deadline,
        priority: body.priority || 'medium',
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
