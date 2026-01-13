import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        project_id: projectId,
        team_member_id: body.team_member_id,
        role_on_project: body.role_on_project || 'support',
        estimated_hours: body.estimated_hours || 0,
        hours_this_week: body.hours_this_week || 0,
        status: 'active',
        assigned_by: 'manual',
        confidence_score: 1.0,
      })
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This person is already assigned to this project' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
