import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .order('full_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current week allocations
    const { data: assignments } = await supabase
      .from('assignments')
      .select('team_member_id, hours_this_week')
      .eq('status', 'active')

    const allocationMap = new Map<string, number>()
    assignments?.forEach(a => {
      const current = allocationMap.get(a.team_member_id) || 0
      allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))
    })

    const membersWithCapacity = (teamMembers || []).map(m => ({
      ...m,
      allocated_hours: allocationMap.get(m.id) || 0,
      available_hours: (m.weekly_capacity_hours || 40) - (allocationMap.get(m.id) || 0),
    }))

    return NextResponse.json({ teamMembers: membersWithCapacity })
  } catch (error) {
    console.error('Team fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        full_name: body.full_name,
        email: body.email,
        role: body.role || 'Team Member',
        weekly_capacity_hours: body.weekly_capacity_hours || 40,
        core_roles: body.core_roles || [],
        capabilities: body.capabilities || [],
        industries: body.industries || [],
        known_clients: body.known_clients || [],
        active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Team create error:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
