import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface TeamMemberWithCapacity {
  id: string
  full_name: string
  role: string
  core_roles: string[]
  capabilities: string[]
  industries: string[]
  known_clients: string[]
  weekly_capacity_hours: number
  allocated_hours: number
  available_hours: number
}

interface Project {
  id: string
  name: string
  client: string | null
  status: string
  phase: string | null
  priority: string
  notes: string | null
  estimated_total_hours: number | null
}

function buildRecommendationPrompt(project: Project, teamMembers: TeamMemberWithCapacity[]) {
  const teamRoster = teamMembers.map(m => {
    const skills = [
      ...(m.core_roles || []),
      ...(m.capabilities || [])
    ].join(', ')
    const industries = (m.industries || []).join(', ')
    const clients = (m.known_clients || []).join(', ')

    return `- ${m.full_name} (${m.role}): ${skills}${industries ? ` | Industries: ${industries}` : ''}${clients ? ` | Clients: ${clients}` : ''} | Available: ${m.available_hours}h/week`
  }).join('\n')

  return `You are an AI traffic manager for Alt/Shift PR agency.

PROJECT NEEDING TEAM ASSIGNMENTS:
- Name: ${project.name}
- Client: ${project.client || 'Not specified'}
- Status: ${project.status}
- Phase: ${project.phase || 'Not specified'}
- Priority: ${project.priority}
- Notes: ${project.notes || 'None'}
- Estimated Hours: ${project.estimated_total_hours || 'Not specified'}

AVAILABLE TEAM MEMBERS:
${teamRoster}

Analyze the project and recommend the best team members. Return ONLY valid JSON with this structure:

{
  "recommendations": [
    {
      "team_member_name": "string (must match exactly from roster)",
      "suggested_role": "lead" | "producer" | "strategy" | "creative" | "support",
      "suggested_hours": number (weekly hours, consider their availability),
      "match_reason": "string (specific reason why this person fits)",
      "confidence": 0.0-1.0,
      "priority": "primary" | "secondary" | "backup"
    }
  ],
  "team_composition_notes": "string (brief note about overall team balance)",
  "warnings": ["array of potential issues to consider"]
}

MATCHING RULES:
1. Prioritize team members who know the CLIENT (if specified)
2. Match by INDUSTRY expertise if client industry is identifiable
3. Consider ROLE fit - every project needs a lead
4. Check AVAILABILITY - don't recommend overallocated people unless necessary
5. Balance seniority - mix experienced and junior for mentorship
6. Consider current workload - prefer people with more available hours

Return 3-5 recommendations, ranked by fit. Be specific in match_reason.`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get current assignments for this project to exclude already assigned members
    const { data: currentAssignments } = await supabase
      .from('assignments')
      .select('team_member_id')
      .eq('project_id', id)
      .eq('status', 'active')

    const assignedMemberIds = (currentAssignments || []).map(a => a.team_member_id)

    // Get all active team members with capabilities
    const { data: allMembers } = await supabase
      .from('team_members')
      .select('id, full_name, role, core_roles, capabilities, industries, known_clients, weekly_capacity_hours')
      .eq('active', true)
      .order('full_name')

    // Get all active assignments for capacity calculation
    const { data: allAssignments } = await supabase
      .from('assignments')
      .select('team_member_id, hours_this_week')
      .eq('status', 'active')

    // Calculate capacity for each member
    const allocationMap = new Map<string, number>()
    allAssignments?.forEach(a => {
      const current = allocationMap.get(a.team_member_id) || 0
      allocationMap.set(a.team_member_id, current + (a.hours_this_week || 0))
    })

    // Build team members with capacity, excluding already assigned
    const teamMembersWithCapacity: TeamMemberWithCapacity[] = (allMembers || [])
      .filter(m => !assignedMemberIds.includes(m.id))
      .map(m => ({
        id: m.id,
        full_name: m.full_name,
        role: m.role,
        core_roles: m.core_roles || [],
        capabilities: m.capabilities || [],
        industries: m.industries || [],
        known_clients: m.known_clients || [],
        weekly_capacity_hours: m.weekly_capacity_hours || 40,
        allocated_hours: allocationMap.get(m.id) || 0,
        available_hours: (m.weekly_capacity_hours || 40) - (allocationMap.get(m.id) || 0),
      }))

    if (teamMembersWithCapacity.length === 0) {
      return NextResponse.json({
        recommendations: [],
        team_composition_notes: 'All team members are already assigned to this project.',
        warnings: [],
      })
    }

    // Call Claude for recommendations
    const prompt = buildRecommendationPrompt(project, teamMembersWithCapacity)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let recommendations
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText
      recommendations = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI recommendations', raw: responseText },
        { status: 500 }
      )
    }

    // Add team member IDs to recommendations for easier assignment
    const membersMap = new Map(teamMembersWithCapacity.map(m => [m.full_name, m]))
    recommendations.recommendations = (recommendations.recommendations || []).map((r: {
      team_member_name: string
      suggested_role: string
      suggested_hours: number
      match_reason: string
      confidence: number
      priority: string
    }) => {
      const member = membersMap.get(r.team_member_name)
      return {
        ...r,
        team_member_id: member?.id || null,
        available_hours: member?.available_hours || 0,
      }
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Recommendation failed' },
      { status: 500 }
    )
  }
}
