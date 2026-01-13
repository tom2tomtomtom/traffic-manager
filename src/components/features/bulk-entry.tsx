'use client'

import { useState, useMemo } from 'react'
import { User, Plus, X, Save, FolderKanban, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  full_name: string
  role: string
  weekly_capacity_hours: number
}

interface Project {
  id: string
  name: string
  client: string | null
  status: string
}

interface Assignment {
  id: string
  project_id: string
  team_member_id: string
  role_on_project: string
  hours_this_week: number
  estimated_hours: number
  status: string
}

interface BulkEntryProps {
  teamMembers: TeamMember[]
  projects: Project[]
  existingAssignments: Assignment[]
}

interface PendingAssignment {
  tempId: string
  projectId: string
  projectName: string
  role: string
  hoursThisWeek: number
  isNew: boolean
  existingId?: string
}

const ROLE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'producer', label: 'Producer' },
  { value: 'support', label: 'Support' },
  { value: 'team-member', label: 'Team Member' },
]

export function BulkEntry({ teamMembers, projects, existingAssignments }: BulkEntryProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([])
  const [saving, setSaving] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  // Get selected member's data
  const selectedMember = teamMembers.find(m => m.id === selectedMemberId)

  // Get existing assignments for selected member
  const memberExistingAssignments = useMemo(() => {
    if (!selectedMemberId) return []
    return existingAssignments.filter(a => a.team_member_id === selectedMemberId)
  }, [selectedMemberId, existingAssignments])

  // Calculate current allocated hours for selected member
  const allocatedHours = useMemo(() => {
    const existingHours = memberExistingAssignments.reduce(
      (sum, a) => sum + (a.hours_this_week || 0),
      0
    )
    const pendingHours = pendingAssignments.reduce(
      (sum, a) => sum + (a.hoursThisWeek || 0),
      0
    )
    return existingHours + pendingHours
  }, [memberExistingAssignments, pendingAssignments])

  // When selecting a member, load their existing assignments as pending
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)

    // Load existing assignments for this member
    const memberAssignments = existingAssignments.filter(a => a.team_member_id === memberId)
    const loaded: PendingAssignment[] = memberAssignments.map(a => {
      const project = projects.find(p => p.id === a.project_id)
      return {
        tempId: a.id,
        projectId: a.project_id,
        projectName: project?.name || 'Unknown',
        role: a.role_on_project,
        hoursThisWeek: a.hours_this_week || 0,
        isNew: false,
        existingId: a.id,
      }
    })

    setPendingAssignments(loaded)
  }

  // Add a new assignment row
  const addAssignment = (projectId?: string) => {
    const project = projectId ? projects.find(p => p.id === projectId) : null
    setPendingAssignments([
      ...pendingAssignments,
      {
        tempId: Math.random().toString(36).substring(7),
        projectId: projectId || '',
        projectName: project?.name || '',
        role: 'team-member',
        hoursThisWeek: 8,
        isNew: true,
      },
    ])
  }

  // Remove an assignment
  const removeAssignment = (tempId: string) => {
    setPendingAssignments(pendingAssignments.filter(a => a.tempId !== tempId))
  }

  // Update an assignment field
  const updateAssignment = (tempId: string, field: keyof PendingAssignment, value: string | number) => {
    setPendingAssignments(
      pendingAssignments.map(a => {
        if (a.tempId !== tempId) return a
        if (field === 'projectId') {
          const project = projects.find(p => p.id === value)
          return { ...a, projectId: value as string, projectName: project?.name || '' }
        }
        return { ...a, [field]: value }
      })
    )
  }

  // Create new project inline
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), status: 'active' }),
      })

      if (response.ok) {
        toast.success(`Created project: ${newProjectName}`)
        setNewProjectName('')
        router.refresh()
      } else {
        toast.error('Failed to create project')
      }
    } catch {
      toast.error('Failed to create project')
    }
  }

  // Save all assignments
  const handleSave = async () => {
    if (!selectedMemberId || pendingAssignments.length === 0) return

    setSaving(true)
    try {
      const response = await fetch('/api/bulk-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_member_id: selectedMemberId,
          assignments: pendingAssignments.map(a => ({
            project_id: a.projectId,
            role_on_project: a.role,
            hours_this_week: a.hoursThisWeek,
            existing_id: a.existingId,
          })),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Saved ${result.updated + result.created} assignments for ${selectedMember?.full_name}`)
        router.refresh()
        // Reset to allow entering next person
        setSelectedMemberId(null)
        setPendingAssignments([])
      } else {
        toast.error(result.error || 'Failed to save assignments')
      }
    } catch {
      toast.error('Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  // Get projects not yet assigned
  const availableProjects = projects.filter(
    p => !pendingAssignments.some(a => a.projectId === p.id)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Members List */}
      <div className="lg:col-span-1">
        <div className="bg-black-card border-2 border-border-subtle p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-orange-accent mb-4">
            Select Team Member
          </h3>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {teamMembers.map(member => {
              const memberAssignments = existingAssignments.filter(
                a => a.team_member_id === member.id
              )
              const memberAllocated = memberAssignments.reduce(
                (sum, a) => sum + (a.hours_this_week || 0),
                0
              )
              const hasData = memberAssignments.length > 0
              const isSelected = selectedMemberId === member.id

              return (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id)}
                  className={cn(
                    'w-full text-left p-3 border-2 transition-all',
                    isSelected
                      ? 'border-orange-accent bg-orange-accent/10'
                      : hasData
                        ? 'border-border-subtle bg-black-deep hover:border-orange-accent'
                        : 'border-dashed border-border-subtle hover:border-orange-accent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white-dim" />
                      <span className="text-white-full font-medium text-sm">
                        {member.full_name}
                      </span>
                    </div>
                    {hasData && (
                      <span className="text-xs text-white-muted">
                        {memberAllocated}h
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white-dim">{member.role}</span>
                    {!hasData && (
                      <span className="text-xs text-yellow-electric">No data</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Assignment Entry Form */}
      <div className="lg:col-span-2">
        {selectedMember ? (
          <div className="bg-black-card border-2 border-border-subtle p-6">
            {/* Header with capacity bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white-full">
                  {selectedMember.full_name}
                </h3>
                <p className="text-sm text-white-dim">{selectedMember.role}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  <span
                    className={cn(
                      allocatedHours > selectedMember.weekly_capacity_hours
                        ? 'text-red-hot'
                        : 'text-orange-accent'
                    )}
                  >
                    {allocatedHours}
                  </span>
                  <span className="text-white-dim">
                    /{selectedMember.weekly_capacity_hours}h
                  </span>
                </div>
                <p className="text-xs text-white-dim uppercase tracking-wide">
                  Weekly Capacity
                </p>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mb-6 bg-black-deep h-2">
              <div
                className={cn(
                  'h-full transition-all',
                  allocatedHours > selectedMember.weekly_capacity_hours
                    ? 'bg-red-hot'
                    : 'bg-orange-accent'
                )}
                style={{
                  width: `${Math.min(
                    (allocatedHours / selectedMember.weekly_capacity_hours) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            {/* Assignments list */}
            <div className="space-y-3 mb-6">
              {pendingAssignments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border-subtle">
                  <FolderKanban className="w-8 h-8 text-white-dim mx-auto mb-2" />
                  <p className="text-white-muted text-sm">No assignments yet</p>
                  <p className="text-white-dim text-xs mt-1">
                    Add projects this person is working on
                  </p>
                </div>
              ) : (
                pendingAssignments.map(assignment => (
                  <div
                    key={assignment.tempId}
                    className={cn(
                      'flex items-center gap-3 p-3 border-2',
                      assignment.isNew ? 'border-orange-accent' : 'border-border-subtle'
                    )}
                  >
                    {/* Project selector */}
                    <select
                      value={assignment.projectId}
                      onChange={e =>
                        updateAssignment(assignment.tempId, 'projectId', e.target.value)
                      }
                      className="flex-1 bg-black-deep text-white-full border-2 border-border-subtle px-3 py-2 text-sm focus:border-orange-accent outline-none"
                    >
                      <option value="">Select project...</option>
                      {[
                        ...(assignment.projectId
                          ? [projects.find(p => p.id === assignment.projectId)].filter(
                              Boolean
                            )
                          : []),
                        ...availableProjects,
                      ].map(project =>
                        project ? (
                          <option key={project.id} value={project.id}>
                            {project.name}
                            {project.client ? ` (${project.client})` : ''}
                          </option>
                        ) : null
                      )}
                    </select>

                    {/* Role selector */}
                    <select
                      value={assignment.role}
                      onChange={e =>
                        updateAssignment(assignment.tempId, 'role', e.target.value)
                      }
                      className="w-32 bg-black-deep text-white-full border-2 border-border-subtle px-3 py-2 text-sm focus:border-orange-accent outline-none"
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {/* Hours input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={assignment.hoursThisWeek}
                        onChange={e =>
                          updateAssignment(
                            assignment.tempId,
                            'hoursThisWeek',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-black-deep text-white-full border-2 border-border-subtle px-3 py-2 text-sm text-center focus:border-orange-accent outline-none"
                      />
                      <span className="text-white-dim text-sm">hrs</span>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeAssignment(assignment.tempId)}
                      className="p-2 text-white-dim hover:text-red-hot transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add assignment row */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => addAssignment()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-dashed border-border-subtle text-white-muted hover:border-orange-accent hover:text-orange-accent transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>

              {/* Quick add from unassigned projects */}
              {availableProjects.length > 0 && (
                <select
                  value=""
                  onChange={e => {
                    if (e.target.value) addAssignment(e.target.value)
                  }}
                  className="bg-black-deep text-white-muted border-2 border-border-subtle px-3 py-2 text-xs focus:border-orange-accent outline-none"
                >
                  <option value="">Quick add project...</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Create new project inline */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border-subtle">
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="New project name..."
                className="flex-1 bg-black-deep text-white-full border-2 border-border-subtle px-3 py-2 text-sm focus:border-orange-accent outline-none"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateProject()
                }}
              />
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-border-subtle text-white-muted hover:border-orange-accent hover:text-orange-accent transition-all disabled:opacity-50"
              >
                Create Project
              </button>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedMemberId(null)
                  setPendingAssignments([])
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-white-muted hover:text-white-full transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving || pendingAssignments.length === 0}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wide border-2 transition-all',
                  'bg-orange-accent text-black-ink border-orange-accent hover:bg-orange-accent/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-black-card border-2 border-dashed border-border-subtle p-12 text-center">
            <User className="w-12 h-12 text-white-dim mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white-muted mb-2">
              Select a Team Member
            </h3>
            <p className="text-sm text-white-dim max-w-md mx-auto">
              Choose a team member from the left to enter their current project
              assignments. This will populate the capacity dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
