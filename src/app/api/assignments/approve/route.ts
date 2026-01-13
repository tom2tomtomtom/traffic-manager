import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ApprovalRequest {
  transcript_id: string
  assignments: {
    person_name: string
    project_name: string
    role_inferred?: string
    hours_this_week?: number
  }[]
}

export async function POST(request: Request) {
  try {
    const { transcript_id, assignments }: ApprovalRequest = await request.json()

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'No assignments to approve' }, { status: 400 })
    }

    const supabase = await createClient()
    const results = { created: 0, errors: [] as string[] }

    for (const assignment of assignments) {
      // Find or create team member by name (fuzzy match)
      let { data: teamMember } = await supabase
        .from('team_members')
        .select('id, full_name')
        .ilike('full_name', `%${assignment.person_name}%`)
        .limit(1)
        .single()

      if (!teamMember) {
        // Try first name only
        const firstName = assignment.person_name.split(' ')[0]
        const { data: byFirstName } = await supabase
          .from('team_members')
          .select('id, full_name')
          .ilike('full_name', `${firstName}%`)
          .limit(1)
          .single()

        teamMember = byFirstName
      }

      if (!teamMember) {
        results.errors.push(`Team member not found: ${assignment.person_name}`)
        continue
      }

      // Find or create project by name
      let { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', `%${assignment.project_name}%`)
        .limit(1)
        .single()

      if (!project) {
        // Create the project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: assignment.project_name,
            status: 'active',
          })
          .select()
          .single()

        if (projectError || !newProject) {
          results.errors.push(`Failed to create project: ${assignment.project_name}`)
          continue
        }
        project = newProject
      }

      // Ensure project exists at this point
      if (!project) {
        results.errors.push(`No project found for: ${assignment.project_name}`)
        continue
      }

      // Create assignment (upsert to avoid duplicates)
      const { error: assignmentError } = await supabase
        .from('assignments')
        .upsert({
          project_id: project.id,
          team_member_id: teamMember.id,
          role_on_project: assignment.role_inferred || 'team-member',
          hours_this_week: assignment.hours_this_week || 8,
          estimated_hours: assignment.hours_this_week || 8,
          status: 'active',
          assigned_by: 'ai',
          confidence_score: 0.8,
        }, {
          onConflict: 'project_id,team_member_id',
        })

      if (assignmentError) {
        results.errors.push(`Failed to create assignment: ${teamMember.full_name} → ${project.name}`)
        continue
      }

      results.created++
    }

    // Mark transcript as approved
    if (transcript_id) {
      await supabase
        .from('transcripts')
        .update({ approved: true, approved_at: new Date().toISOString() })
        .eq('id', transcript_id)
    }

    return NextResponse.json({
      message: `Created ${results.created} assignments`,
      created: results.created,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 500 }
    )
  }
}
