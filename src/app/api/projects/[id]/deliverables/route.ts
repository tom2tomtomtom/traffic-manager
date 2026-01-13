import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: deliverables, error } = await supabase
      .from('deliverables')
      .select(`
        *,
        assigned_member:team_members!deliverables_assigned_to_fkey(id, full_name),
        approver:team_members!deliverables_approved_by_fkey(id, full_name)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deliverables })
  } catch (error) {
    console.error('Deliverables fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Handle bulk insert from template
    if (Array.isArray(body.items)) {
      const deliverables = body.items.map((item: { name: string; requires_approval?: boolean }) => ({
        project_id: id,
        name: item.name,
        requires_approval: item.requires_approval || false,
        status: 'not_started',
      }))

      const { data, error } = await supabase
        .from('deliverables')
        .insert(deliverables)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ deliverables: data })
    }

    // Single insert
    const { data: deliverable, error } = await supabase
      .from('deliverables')
      .insert({
        project_id: id,
        name: body.name,
        description: body.description || null,
        assigned_to: body.assigned_to || null,
        due_date: body.due_date || null,
        requires_approval: body.requires_approval || false,
        status: 'not_started',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deliverable })
  } catch (error) {
    console.error('Deliverable create error:', error)
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    )
  }
}
