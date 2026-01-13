import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface TeamMemberRow {
  Person: string
  Roles: string
  Capacity: string
  [key: string]: string // Week columns
}

interface ProjectRow {
  Client: string
  Project: string
  'Project Code': string
  'Project Label': string
  'Project Tags': string
  Person: string
  Roles: string
  [key: string]: string // Week columns
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx]
      })
      rows.push(row)
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())

  return values
}

function generateEmail(fullName: string): string {
  const parts = fullName.toLowerCase().split(' ')
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1]}@altshift.com.au`
  }
  return `${parts[0]}@altshift.com.au`
}

function shouldSkipProject(client: string, project: string): boolean {
  // Skip empty clients
  if (!client || client.trim() === '') return true

  // Skip internal/non-billable
  if (client === 'alt/shift/' || client === 'alt/shift/ NEW BUSINESS ONLY') return true

  // Skip time off and non-billable projects
  if (project.includes('Non-Billable') || project.includes('Time Off')) return true

  return false
}

function getWeekColumns(row: Record<string, string>): string[] {
  return Object.keys(row).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/))
}

function getCurrentWeekHours(row: Record<string, string>): number {
  const weekColumns = getWeekColumns(row)
  if (weekColumns.length === 0) return 0

  // Get first week column (current week)
  const firstWeek = weekColumns[0]
  return parseFloat(row[firstWeek]) || 0
}

function getTotalEstimatedHours(row: Record<string, string>): number {
  const weekColumns = getWeekColumns(row)
  return weekColumns.reduce((sum, col) => sum + (parseFloat(row[col]) || 0), 0)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const teamFile = formData.get('teamCsv') as File | null
    const projectFile = formData.get('projectCsv') as File | null

    if (!teamFile || !projectFile) {
      return NextResponse.json(
        { error: 'Both team and project CSV files are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can import data' },
        { status: 403 }
      )
    }

    // Parse CSV files
    const teamCsvText = await teamFile.text()
    const projectCsvText = await projectFile.text()

    const teamRows = parseCSV(teamCsvText) as TeamMemberRow[]
    const projectRows = parseCSV(projectCsvText) as ProjectRow[]

    const results = {
      teamMembers: { created: 0, updated: 0 },
      projects: { created: 0 },
      assignments: { created: 0, skipped: 0 },
      errors: [] as string[],
    }

    // Step 1: Import team members
    const teamMemberMap = new Map<string, string>() // name -> id

    for (const row of teamRows) {
      const fullName = row.Person?.trim()
      if (!fullName) continue

      const capacity = parseFloat(row.Capacity) || 38

      const memberData = {
        full_name: fullName,
        role: row.Roles?.split(',')[0]?.trim() || 'Team Member',
        email: generateEmail(fullName),
        weekly_capacity_hours: capacity,
        active: true,
      }

      // Check if exists
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('full_name', fullName)
        .single()

      if (existing) {
        // Update
        await supabase
          .from('team_members')
          .update(memberData)
          .eq('id', existing.id)

        teamMemberMap.set(fullName, existing.id)
        results.teamMembers.updated++
      } else {
        // Insert
        const { data: newMember, error } = await supabase
          .from('team_members')
          .insert(memberData)
          .select('id')
          .single()

        if (error) {
          results.errors.push(`Failed to create team member ${fullName}: ${error.message}`)
        } else if (newMember) {
          teamMemberMap.set(fullName, newMember.id)
          results.teamMembers.created++
        }
      }
    }

    // Step 2: Import projects (unique combinations of Client + Project)
    const projectMap = new Map<string, string>() // "client|project" -> id
    const seenProjects = new Set<string>()

    for (const row of projectRows) {
      const client = row.Client?.trim() || ''
      const projectName = row.Project?.trim() || ''

      if (shouldSkipProject(client, projectName)) continue

      const projectKey = `${client}|${projectName}`
      if (seenProjects.has(projectKey)) continue
      seenProjects.add(projectKey)

      // Check if project exists
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('name', projectName)
        .eq('client', client)
        .single()

      if (existing) {
        projectMap.set(projectKey, existing.id)
      } else {
        const projectData = {
          name: projectName,
          client: client,
          status: 'active',
        }

        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id')
          .single()

        if (error) {
          results.errors.push(`Failed to create project ${projectName}: ${error.message}`)
        } else if (newProject) {
          projectMap.set(projectKey, newProject.id)
          results.projects.created++
        }
      }
    }

    // Step 3: Create assignments
    for (const row of projectRows) {
      const client = row.Client?.trim() || ''
      const projectName = row.Project?.trim() || ''
      const personName = row.Person?.trim() || ''

      if (shouldSkipProject(client, projectName)) continue

      const hoursThisWeek = getCurrentWeekHours(row)
      if (hoursThisWeek === 0) {
        results.assignments.skipped++
        continue
      }

      const teamMemberId = teamMemberMap.get(personName)
      const projectKey = `${client}|${projectName}`
      const projectId = projectMap.get(projectKey)

      if (!teamMemberId || !projectId) {
        results.assignments.skipped++
        continue
      }

      const estimatedHours = getTotalEstimatedHours(row)

      // Check for existing assignment
      const { data: existingAssignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('team_member_id', teamMemberId)
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single()

      if (existingAssignment) {
        // Update existing
        await supabase
          .from('assignments')
          .update({
            hours_this_week: hoursThisWeek,
            estimated_hours: estimatedHours,
            role_on_project: row.Roles?.split(',')[0]?.trim() || 'team-member',
          })
          .eq('id', existingAssignment.id)
      } else {
        // Create new
        const assignmentData = {
          team_member_id: teamMemberId,
          project_id: projectId,
          role_on_project: row.Roles?.split(',')[0]?.trim() || 'team-member',
          hours_this_week: hoursThisWeek,
          estimated_hours: estimatedHours,
          status: 'active',
          assigned_by: 'import',
          confidence_score: 1.0,
        }

        const { error } = await supabase
          .from('assignments')
          .insert(assignmentData)

        if (error) {
          if (error.code !== '23505') { // Ignore duplicates
            results.errors.push(`Failed to create assignment: ${error.message}`)
          }
        } else {
          results.assignments.created++
        }
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
