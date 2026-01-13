'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { User, Check, ChevronRight, Zap, Plus } from 'lucide-react'
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

interface QuickEntry {
  id: string
  text: string
  projectName: string
  hours: number
  projectId: string | null
  isNew: boolean
}

export function BulkEntry({ teamMembers, projects, existingAssignments }: BulkEntryProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [entries, setEntries] = useState<QuickEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [quickText, setQuickText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Get selected member's data
  const selectedMember = teamMembers.find(m => m.id === selectedMemberId)

  // Calculate progress
  const membersWithData = useMemo(() => {
    const memberIds = new Set(existingAssignments.map(a => a.team_member_id))
    return teamMembers.filter(m => memberIds.has(m.id)).length
  }, [teamMembers, existingAssignments])

  // Calculate hours for selected member
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  // When selecting a member, load their existing assignments
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    setQuickText('')

    // Load existing assignments
    const memberAssignments = existingAssignments.filter(a => a.team_member_id === memberId)
    const loaded: QuickEntry[] = memberAssignments.map(a => {
      const project = projects.find(p => p.id === a.project_id)
      return {
        id: a.id,
        text: `${project?.name || 'Unknown'} ${a.hours_this_week}h`,
        projectName: project?.name || 'Unknown',
        hours: a.hours_this_week || 0,
        projectId: a.project_id,
        isNew: false,
      }
    })

    setEntries(loaded)

    // Focus input after selection
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Parse quick text like "Legos 15" or "Officeworks 8h"
  const parseQuickEntry = (text: string): { projectName: string; hours: number } | null => {
    const trimmed = text.trim()
    if (!trimmed) return null

    // Match patterns like "Project Name 15" or "Project Name 15h"
    const match = trimmed.match(/^(.+?)\s+(\d+)h?$/i)
    if (match) {
      return {
        projectName: match[1].trim(),
        hours: parseInt(match[2], 10),
      }
    }

    // If no hours specified, default to 8
    return {
      projectName: trimmed,
      hours: 8,
    }
  }

  // Find matching project (fuzzy)
  const findProject = (name: string): Project | null => {
    const lower = name.toLowerCase()
    // Exact match first
    let match = projects.find(p => p.name.toLowerCase() === lower)
    if (match) return match
    // Partial match
    match = projects.find(p => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase()))
    return match || null
  }

  // Add entry from quick text
  const handleAddEntry = () => {
    const parsed = parseQuickEntry(quickText)
    if (!parsed) return

    const existingProject = findProject(parsed.projectName)

    // Check if already added
    if (entries.some(e => e.projectName.toLowerCase() === parsed.projectName.toLowerCase())) {
      toast.warning(`${parsed.projectName} already added`)
      return
    }

    setEntries([
      ...entries,
      {
        id: Math.random().toString(36).substring(7),
        text: quickText,
        projectName: existingProject?.name || parsed.projectName,
        hours: parsed.hours,
        projectId: existingProject?.id || null,
        isNew: true,
      },
    ])
    setQuickText('')
    inputRef.current?.focus()
  }

  // Remove entry
  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id))
  }

  // Update hours inline
  const updateHours = (id: string, hours: number) => {
    setEntries(entries.map(e => e.id === id ? { ...e, hours } : e))
  }

  // Save all
  const handleSave = async () => {
    if (!selectedMemberId || entries.length === 0) return

    setSaving(true)
    try {
      // First, create any new projects
      const newProjects = entries.filter(e => !e.projectId)
      for (const entry of newProjects) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: entry.projectName, status: 'active' }),
        })
        if (res.ok) {
          const { project } = await res.json()
          entry.projectId = project.id
        }
      }

      // Now save assignments
      const response = await fetch('/api/bulk-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_member_id: selectedMemberId,
          assignments: entries.filter(e => e.projectId).map(e => ({
            project_id: e.projectId,
            role_on_project: 'team-member',
            hours_this_week: e.hours,
          })),
        }),
      })

      if (response.ok) {
        toast.success(`Saved ${entries.length} assignments for ${selectedMember?.full_name}`)

        // Auto-advance to next member without data
        const nextMember = teamMembers.find(m =>
          m.id !== selectedMemberId &&
          !existingAssignments.some(a => a.team_member_id === m.id)
        )

        if (nextMember) {
          handleSelectMember(nextMember.id)
          toast.info(`Now entering for ${nextMember.full_name}`)
        } else {
          setSelectedMemberId(null)
          setEntries([])
        }

        router.refresh()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickText.trim()) {
      e.preventDefault()
      handleAddEntry()
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-black-card border-2 border-border-subtle p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase text-white-dim">Setup Progress</span>
          <span className="text-sm font-bold text-orange-accent">
            {membersWithData} / {teamMembers.length} people
          </span>
        </div>
        <div className="bg-black-deep h-2">
          <div
            className="bg-orange-accent h-full transition-all"
            style={{ width: `${(membersWithData / teamMembers.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="lg:col-span-1">
          <div className="bg-black-card border-2 border-border-subtle p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-orange-accent mb-4">
              Team Members
            </h3>

            <div className="space-y-1 max-h-[55vh] overflow-y-auto">
              {teamMembers.map(member => {
                const hasData = existingAssignments.some(a => a.team_member_id === member.id)
                const isSelected = selectedMemberId === member.id

                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMember(member.id)}
                    className={cn(
                      'w-full text-left p-3 border-2 transition-all flex items-center justify-between',
                      isSelected
                        ? 'border-orange-accent bg-orange-accent/10'
                        : hasData
                          ? 'border-green-500/30 bg-green-500/5 hover:border-orange-accent'
                          : 'border-transparent hover:border-border-subtle'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {hasData ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <User className="w-4 h-4 text-white-dim" />
                      )}
                      <span className={cn(
                        'text-sm',
                        hasData ? 'text-white-muted' : 'text-white-full font-medium'
                      )}>
                        {member.full_name}
                      </span>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-orange-accent" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Entry Form */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="bg-black-card border-2 border-border-subtle p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white-full">
                    {selectedMember.full_name}
                  </h3>
                  <p className="text-sm text-white-dim">{selectedMember.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    <span className={cn(
                      totalHours > selectedMember.weekly_capacity_hours ? 'text-red-hot' : 'text-orange-accent'
                    )}>
                      {totalHours}
                    </span>
                    <span className="text-white-dim text-lg">/{selectedMember.weekly_capacity_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Quick Entry Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-white-dim mb-2">
                  Quick Add (type project name + hours)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-accent" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={quickText}
                      onChange={e => setQuickText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Legos 15 or Officeworks 8"
                      className="w-full pl-10 pr-4 py-3 bg-black-deep text-white-full border-2 border-border-subtle text-lg focus:border-orange-accent outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    onClick={handleAddEntry}
                    disabled={!quickText.trim()}
                    className="px-6 py-3 bg-orange-accent text-black-ink font-bold uppercase text-sm disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-white-dim mt-2">
                  Press Enter to add. New projects will be created automatically.
                </p>
              </div>

              {/* Entries List */}
              <div className="space-y-2 mb-6">
                {entries.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border-subtle">
                    <p className="text-white-muted">No projects yet</p>
                    <p className="text-white-dim text-sm mt-1">
                      Type a project name and hours above
                    </p>
                  </div>
                ) : (
                  entries.map(entry => (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center justify-between p-3 border-2',
                        entry.isNew ? 'border-orange-accent/50' : 'border-border-subtle',
                        !entry.projectId && entry.isNew && 'border-yellow-electric/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white-full font-medium">{entry.projectName}</span>
                        {!entry.projectId && entry.isNew && (
                          <span className="text-[10px] uppercase font-bold text-yellow-electric bg-yellow-electric/20 px-2 py-0.5">
                            New Project
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={entry.hours}
                          onChange={e => updateHours(entry.id, parseInt(e.target.value) || 0)}
                          className="w-16 bg-black-deep text-white-full border-2 border-border-subtle px-2 py-1 text-center text-lg font-bold focus:border-orange-accent outline-none"
                          min="0"
                          max="60"
                        />
                        <span className="text-white-dim text-sm">hrs</span>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-white-dim hover:text-red-hot transition-colors ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <button
                  onClick={() => {
                    setSelectedMemberId(null)
                    setEntries([])
                  }}
                  className="text-white-muted hover:text-white-full text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || entries.length === 0}
                  className={cn(
                    'px-8 py-3 font-bold uppercase text-sm transition-all',
                    'bg-orange-accent text-black-ink hover:bg-orange-accent/90',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {saving ? 'Saving...' : `Save & Continue`}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black-card border-2 border-dashed border-border-subtle p-12 text-center">
              <User className="w-12 h-12 text-white-dim mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white-muted mb-2">
                Select a Team Member
              </h3>
              <p className="text-sm text-white-dim max-w-md mx-auto mb-6">
                Click on a name to enter their current project assignments.
              </p>
              {membersWithData === 0 && (
                <button
                  onClick={() => {
                    const first = teamMembers[0]
                    if (first) handleSelectMember(first.id)
                  }}
                  className="px-6 py-3 bg-orange-accent text-black-ink font-bold uppercase text-sm"
                >
                  Start with {teamMembers[0]?.full_name?.split(' ')[0] || 'First Person'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
