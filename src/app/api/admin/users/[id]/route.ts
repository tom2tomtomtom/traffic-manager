import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['viewer', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be viewer, manager, or admin.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check requesting user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requestingProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (requestingProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update user roles' },
        { status: 403 }
      )
    }

    // Update the target user's role
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id, email, role')
      .single()

    if (error) {
      console.error('Error updating role:', error)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
