import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 404 })
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

    const assignmentsWithMembers = assignments?.map(a => ({
      ...a,
      team_member: memberMap.get(a.team_member_id) || null,
    }))

    return NextResponse.json({
      project,
      assignments: assignmentsWithMembers || [],
    })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const allowedFields = [
      'name', 'client', 'status', 'phase', 'estimated_total_hours',
      'start_date', 'deadline', 'priority', 'notes', 'next_milestone', 'next_milestone_date'
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
