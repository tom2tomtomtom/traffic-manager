import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const teamMembers = [
  // Senior Leadership
  { full_name: 'Elly Hewitt', email: 'elly@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'strategy'] },
  { full_name: 'Richard Hayward', email: 'richard@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'strategy'] },
  { full_name: 'Sam Vassos', email: 'sam.vassos@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'strategy'] },

  // Office Leadership
  { full_name: 'Katie Raleigh', email: 'katie@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'client-management'] },
  { full_name: 'Priscilla Jeha', email: 'priscilla@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'operations'] },
  { full_name: 'Samantha Razzell', email: 'samantha.razzell@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'operations'] },
  { full_name: 'JJ McPherson', email: 'jj@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'consumer'] },

  // Practice Heads
  { full_name: 'Alycia Jack', email: 'alycia@altshift.com.au', role: 'strategy', weekly_capacity_hours: 40, skills: ['pr', 'strategy', 'client-presentations'] },
  { full_name: 'Damian Davitt', email: 'damian@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['social', 'content', 'strategy'] },
  { full_name: 'Sophie Truter', email: 'sophie@altshift.com.au', role: 'strategy', weekly_capacity_hours: 40, skills: ['integrated', 'strategy', 'government'] },
  { full_name: 'Sofya Daroy', email: 'sofya@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['people', 'operations', 'culture'] },

  // Creative & Strategy
  { full_name: 'Anna Fullerton', email: 'anna@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['creative', 'art-direction', 'strategy'] },
  { full_name: 'Tom Hyde', email: 'tom@altshift.com.au', role: 'strategy', weekly_capacity_hours: 8, skills: ['ai', 'technology', 'strategy'] },

  // Research
  { full_name: 'Maddy Chambers', email: 'maddy@altshift.com.au', role: 'strategy', weekly_capacity_hours: 40, skills: ['research', 'insights', 'psychology'] },

  // Brisbane Account Team
  { full_name: 'Alison Prowse', email: 'alison@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Cassie Dellit', email: 'cassie@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Kate Healy', email: 'kate.healy@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },

  // Sydney Account Team
  { full_name: 'Conor Nastasi', email: 'conor@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Taylor O\'Neill', email: 'taylor@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Lucy Lincoln', email: 'lucy@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },

  // Melbourne Account Team
  { full_name: 'Jemima Crawford', email: 'jemima@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Georgia Gogoll', email: 'georgia@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Paula Cardamone', email: 'paula@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Sarah McCarthy', email: 'sarah@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management', 'client-relations'] },
  { full_name: 'Steph McMullin', email: 'steph@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Clementine Donohoe', email: 'clementine@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Martha Palmer-Endean', email: 'martha@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Ainsley Coote', email: 'ainsley@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Bronte Mather', email: 'bronte@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Joey Gan', email: 'joey@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-management'] },
  { full_name: 'Shanya Sylvester', email: 'shanya@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-coordination'] },
  { full_name: 'Tilly Fennell', email: 'tilly@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['account-coordination'] },
  { full_name: 'Jacqueline McPherson', email: 'jacqueline@altshift.com.au', role: 'director', weekly_capacity_hours: 40, skills: ['leadership', 'client-management'] },

  // Content & Social Team
  { full_name: 'Genevieve O\'Shea', email: 'genevieve@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['content', 'production'] },
  { full_name: 'Emma Fitzgerald', email: 'emma@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['social', 'content'] },

  // Creative & Production
  { full_name: 'David Ye', email: 'david@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['paid-media', 'performance'] },
  { full_name: 'Omar Al Jabi', email: 'omar@altshift.com.au', role: 'creative', weekly_capacity_hours: 40, skills: ['creative', 'design'] },
  { full_name: 'Jess Lucas', email: 'jess@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['production', 'project-management'] },

  // Events
  { full_name: 'Brodie Beel', email: 'brodie@altshift.com.au', role: 'producer', weekly_capacity_hours: 40, skills: ['events', 'production'] },
]

export async function POST() {
  try {
    const supabase = await createClient()

    // Clear existing team members (optional - comment out if you want to preserve existing)
    // await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert team members
    const { data, error } = await supabase
      .from('team_members')
      .upsert(
        teamMembers.map(member => ({
          ...member,
          active: true,
          billable_target_hours: member.weekly_capacity_hours * 0.8, // 80% billable target
        })),
        { onConflict: 'email' }
      )
      .select()

    if (error) {
      console.error('Seed error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Seeded ${teamMembers.length} team members`,
      count: data?.length || teamMembers.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed team members',
    count: teamMembers.length,
  })
}
