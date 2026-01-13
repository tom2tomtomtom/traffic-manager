import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface BulkAssignmentRequest {
  team_member_id: string
  assignments: {
    project_id: string
    role_on_project: string
    hours_this_week: number
    existing_id?: string
  }[]
}

export async function POST(request: Request) {
  try {
    const body: BulkAssignmentRequest = await request.json()
    const { team_member_id, assignments } = body

    if (!team_member_id) {
      return NextResponse.json({ error: 'Team member ID required' }, { status: 400 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check user has edit permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'member'
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get existing assignments for this team member
    const { data: existingAssignments } = await supabase
      .from('assignments')
      .select('id, project_id')
      .eq('team_member_id', team_member_id)
      .eq('status', 'active')

    const existingProjectIds = new Set(existingAssignments?.map(a => a.project_id) || [])
    const submittedProjectIds = new Set(assignments.map(a => a.project_id))

    const results = { created: 0, updated: 0, deleted: 0, errors: [] as string[] }

    // Delete assignments that are no longer in the submission
    const toDelete = existingAssignments?.filter(a => !submittedProjectIds.has(a.project_id)) || []
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .in('id', toDelete.map(a => a.id))

      if (deleteError) {
        results.errors.push(`Failed to delete removed assignments: ${deleteError.message}`)
      } else {
        results.deleted = toDelete.length
      }
    }

    // Process each assignment
    for (const assignment of assignments) {
      if (!assignment.project_id) {
        results.errors.push('Assignment missing project ID')
        continue
      }

      const isExisting = existingProjectIds.has(assignment.project_id)

      if (isExisting) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            role_on_project: assignment.role_on_project,
            hours_this_week: assignment.hours_this_week,
            estimated_hours: assignment.hours_this_week,
          })
          .eq('team_member_id', team_member_id)
          .eq('project_id', assignment.project_id)
          .eq('status', 'active')

        if (updateError) {
          results.errors.push(`Failed to update assignment: ${updateError.message}`)
        } else {
          results.updated++
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('assignments')
          .insert({
            team_member_id,
            project_id: assignment.project_id,
            role_on_project: assignment.role_on_project,
            hours_this_week: assignment.hours_this_week,
            estimated_hours: assignment.hours_this_week,
            status: 'active',
            assigned_by: 'manual',
            confidence_score: 1.0,
          })

        if (insertError) {
          // Check for duplicate
          if (insertError.code === '23505') {
            results.errors.push('Assignment already exists')
          } else {
            results.errors.push(`Failed to create assignment: ${insertError.message}`)
          }
        } else {
          results.created++
        }
      }
    }

    return NextResponse.json({
      message: `Processed ${results.created + results.updated} assignments`,
      created: results.created,
      updated: results.updated,
      deleted: results.deleted,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Bulk assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk assignment failed' },
      { status: 500 }
    )
  }
}
