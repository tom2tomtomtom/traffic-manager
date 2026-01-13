import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const allowedFields = ['name', 'description', 'assigned_to', 'due_date', 'status', 'requires_approval']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Handle approval
    if (body.status === 'approved' && body.approved_by) {
      updates.approved_by = body.approved_by
      updates.approved_at = new Date().toISOString()
    }

    // Clear approval if moving back from approved
    if (body.status && body.status !== 'approved') {
      updates.approved_by = null
      updates.approved_at = null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: deliverable, error } = await supabase
      .from('deliverables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deliverable })
  } catch (error) {
    console.error('Deliverable update error:', error)
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
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
      .from('deliverables')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deliverable delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    )
  }
}
