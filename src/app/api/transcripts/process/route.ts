import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface TeamMember {
  id: string
  full_name: string
  role: string
  core_roles: string[]
  capabilities: string[]
  industries: string[]
  known_clients: string[]
  weekly_capacity_hours: number
}

function buildExtractionPrompt(teamMembers: TeamMember[]) {
  const teamRoster = teamMembers.map(m => {
    const skills = [
      ...(m.core_roles || []),
      ...(m.capabilities || [])
    ].join(', ')
    const industries = (m.industries || []).join(', ')
    const clients = (m.known_clients || []).join(', ')

    return `- ${m.full_name} (${m.role}): ${skills}${industries ? ` | Industries: ${industries}` : ''}${clients ? ` | Clients: ${clients}` : ''}`
  }).join('\n')

  return `You are an AI traffic manager for Alt/Shift PR agency.

TEAM ROSTER (use for smart assignment matching):
${teamRoster}

Extract structured data from the WIP meeting transcript. Return ONLY valid JSON with this structure:

{
  "projects": [
    {
      "name": "string",
      "client_name": "string (if mentioned)",
      "industry": "string (if identifiable)",
      "status": "active" | "briefing" | "on_hold" | "completed",
      "phase": "string (e.g., 'production', 'review', 'planning')",
      "notes": "string",
      "confidence": 0.0-1.0
    }
  ],
  "assignments": [
    {
      "team_member_name": "string (must match a name from TEAM ROSTER)",
      "project_name": "string",
      "role": "string (e.g., 'producer', 'lead', 'support', 'strategy')",
      "hours_this_week": number,
      "notes": "string",
      "confidence": 0.0-1.0,
      "match_reason": "string (why this person is a good fit based on their skills/clients)"
    }
  ],
  "suggested_assignments": [
    {
      "team_member_name": "string",
      "project_name": "string",
      "suggested_role": "string",
      "match_reason": "string (e.g., 'Has Travel/Tourism experience', 'Knows Officeworks')",
      "confidence": 0.0-1.0
    }
  ],
  "capacity_signals": [
    {
      "team_member_name": "string",
      "signal_type": "overallocated" | "available" | "busy" | "normal",
      "context_quote": "string (exact quote from transcript)",
      "confidence": 0.0-1.0
    }
  ],
  "overall_confidence": 0.0-1.0
}

SMART MATCHING RULES:
1. If a project mentions a CLIENT (e.g., Officeworks), prioritize team members who have that client in their known_clients
2. Match projects to team members by INDUSTRY (e.g., Travel project → people with Travel/Tourism industry)
3. Match by CAPABILITY (e.g., strategy work → people with Strategy core role)
4. For explicitly mentioned assignments, include match_reason showing why the person fits
5. For unassigned projects, add suggested_assignments based on team capabilities

Guidelines:
- Only extract information explicitly mentioned or strongly implied
- Use confidence scores: >0.8 for explicit mentions, 0.5-0.8 for inferred, <0.5 for uncertain
- Include context quotes where possible
- Team member names MUST match exactly from the roster above
- If hours aren't mentioned, estimate based on role (lead=15-20h, support=5-10h)`
}

export async function POST(request: Request) {
  try {
    const { transcript_text, meeting_date, meeting_type } = await request.json()

    if (!transcript_text || transcript_text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript too short' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Fetch team members with capabilities for smart matching
    const supabase = await createClient()
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, full_name, role, core_roles, capabilities, industries, known_clients, weekly_capacity_hours')
      .eq('active', true)
      .order('full_name')

    // Build prompt with team roster
    const extractionPrompt = buildExtractionPrompt(teamMembers || [])

    // Call Claude for extraction
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${extractionPrompt}\n\nMeeting Date: ${meeting_date || 'Not specified'}\nMeeting Type: ${meeting_type || 'WIP'}\n\nTranscript:\n"""\n${transcript_text}\n"""`,
        },
      ],
    })

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Try to parse JSON from response (handle markdown code blocks)
    let extractedData
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        responseText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText
      extractedData = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      )
    }

    // Store in Supabase
    const { data: transcript, error: dbError } = await supabase
      .from('transcripts')
      .insert({
        raw_text: transcript_text,
        meeting_date: meeting_date || new Date().toISOString().split('T')[0],
        meeting_type: meeting_type || 'wip',
        extracted_data: extractedData,
        extraction_model: 'claude-sonnet-4-20250514',
        extraction_confidence: extractedData.overall_confidence || 0.7,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save transcript', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transcript_id: transcript.id,
      extracted_data: extractedData,
      status: 'processed',
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
