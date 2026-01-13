'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfidenceBadge } from '@/components/ui/badge'
import {
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  FolderKanban,
  Zap,
  ArrowRight,
  PartyPopper
} from 'lucide-react'

interface ExtractedProject {
  name: string
  client?: string
  client_name?: string
  industry?: string
  status: string
  phase?: string
  next_milestone?: string
  notes?: string
  context?: string
  confidence: number
}

interface ExtractedAssignment {
  person_name?: string
  team_member_name?: string
  project_name: string
  role_inferred?: string
  role?: string
  assignment_type?: string
  workload_signal?: string
  hours_this_week?: number
  notes?: string
  context?: string
  match_reason?: string
  confidence: number
}

interface SuggestedAssignment {
  team_member_name: string
  project_name: string
  suggested_role: string
  match_reason: string
  confidence: number
}

interface CapacitySignal {
  person_name?: string
  team_member_name?: string
  signal_type: string
  description?: string
  context_quote?: string
  timeframe?: string
  context?: string
  confidence: number
}

interface TranscriptData {
  id: string
  meeting_date: string
  meeting_type: string
  raw_text: string
  extracted_data: {
    projects?: ExtractedProject[]
    assignments?: ExtractedAssignment[]
    suggested_assignments?: SuggestedAssignment[]
    capacity_signals?: CapacitySignal[]
    overall_confidence?: number
  } | null
  extraction_confidence: number | null
}

interface ExtractionReviewProps {
  transcript: TranscriptData
}

export function ExtractionReview({ transcript }: ExtractionReviewProps) {
  const router = useRouter()
  const extracted = transcript.extracted_data

  // Early return for no data
  if (!extracted) {
    return (
      <Card variant="danger" hoverable={false}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-hot" />
          <div>
            <p className="text-red-hot font-bold uppercase">No Extracted Data</p>
            <p className="text-white-muted text-sm mt-1">
              This transcript has not been processed yet or extraction failed.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const projects = extracted.projects || []
  const assignments = extracted.assignments || []
  const suggestedAssignments = extracted.suggested_assignments || []
  const capacitySignals = extracted.capacity_signals || []

  // Auto-select high confidence assignments (>= 0.7)
  const highConfidenceIndices = useMemo(() => {
    return new Set(
      assignments
        .map((a, i) => (a.confidence >= 0.7 ? i : -1))
        .filter((i) => i !== -1)
    )
  }, [assignments])

  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(highConfidenceIndices)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set())
  const [approving, setApproving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [approvalResult, setApprovalResult] = useState<{ created: number; projects: number } | null>(null)

  // Expandable sections - start with details collapsed for simplicity
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [showCapacitySignals, setShowCapacitySignals] = useState(false)

  // Sync selection when assignments change
  useEffect(() => {
    setSelectedAssignments(highConfidenceIndices)
  }, [highConfidenceIndices])

  const toggleAssignment = (index: number) => {
    const newSelected = new Set(selectedAssignments)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedAssignments(newSelected)
  }

  const acceptSuggestion = (index: number) => {
    setAcceptedSuggestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedAssignments(new Set(assignments.map((_, i) => i)))
  }

  const selectNone = () => {
    setSelectedAssignments(new Set())
  }

  const totalSelectedCount = selectedAssignments.size + acceptedSuggestions.size

  // Calculate capacity impact preview
  const capacityImpact = useMemo(() => {
    const impact: Record<string, number> = {}

    assignments.forEach((a, i) => {
      if (selectedAssignments.has(i)) {
        const name = a.person_name || a.team_member_name || 'Unknown'
        impact[name] = (impact[name] || 0) + (a.hours_this_week || 8)
      }
    })

    suggestedAssignments.forEach((s, i) => {
      if (acceptedSuggestions.has(i)) {
        impact[s.team_member_name] = (impact[s.team_member_name] || 0) + 8
      }
    })

    return impact
  }, [selectedAssignments, acceptedSuggestions, assignments, suggestedAssignments])

  const handleApprove = async () => {
    const selected = assignments.filter((_, i) => selectedAssignments.has(i))
    const acceptedSuggestionsList = suggestedAssignments.filter((_, i) => acceptedSuggestions.has(i))

    if (selected.length + acceptedSuggestionsList.length === 0) return

    setApproving(true)

    try {
      const allAssignments = [
        ...selected.map((a) => ({
          person_name: a.person_name || a.team_member_name,
          project_name: a.project_name,
          role_inferred: a.role_inferred || a.role,
          hours_this_week: a.hours_this_week || 8,
        })),
        ...acceptedSuggestionsList.map((s) => ({
          person_name: s.team_member_name,
          project_name: s.project_name,
          role_inferred: s.suggested_role,
          hours_this_week: 8,
        })),
      ]

      const response = await fetch('/api/assignments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_id: transcript.id,
          assignments: allAssignments,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Approval failed')
      }

      // Show success state instead of immediate redirect
      setApprovalResult({
        created: result.created || allAssignments.length,
        projects: result.projects_created || projects.length,
      })
      setShowSuccess(true)
    } catch (error) {
      console.error('Approval error:', error)
      setApproving(false)
    }
  }

  // Success State - Clear next steps
  if (showSuccess && approvalResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card hoverable={false} className="p-8 border-orange-accent text-center">
          <div className="w-16 h-16 bg-orange-accent/20 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-8 h-8 text-orange-accent" />
          </div>

          <h2 className="text-2xl font-bold text-orange-accent uppercase mb-2">
            All Done!
          </h2>
          <p className="text-white-muted mb-6">
            Your WIP meeting data has been processed and saved.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black-deep p-4 border-2 border-border-subtle">
              <p className="text-3xl font-bold text-white-full">{approvalResult.created}</p>
              <p className="text-white-dim text-xs uppercase">Assignments Created</p>
            </div>
            <div className="bg-black-deep p-4 border-2 border-border-subtle">
              <p className="text-3xl font-bold text-white-full">{approvalResult.projects}</p>
              <p className="text-white-dim text-xs uppercase">Projects Updated</p>
            </div>
          </div>

          <p className="text-white-dim text-sm mb-6 uppercase tracking-wide">
            What would you like to do next?
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/capacity')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              View Team Capacity
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push('/projects')}
              className="w-full flex items-center justify-center gap-2"
            >
              <FolderKanban className="w-4 h-4" />
              View Projects
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push('/upload')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Another Transcript
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const overallConfidence = transcript.extraction_confidence || 0
  const isHighConfidence = overallConfidence >= 0.8

  return (
    <div className="space-y-6">
      {/* Primary Action Area - Always visible at top */}
      <Card hoverable={false} className={`p-6 ${isHighConfidence ? 'border-orange-accent' : 'border-border-subtle'}`}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isHighConfidence && <Zap className="w-5 h-5 text-orange-accent" />}
              <h2 className="text-lg font-bold text-white-full uppercase">
                {isHighConfidence ? 'High Confidence Extraction' : 'Review Extraction'}
              </h2>
              <ConfidenceBadge score={overallConfidence} />
            </div>

            <p className="text-white-muted text-sm mb-4">
              {isHighConfidence
                ? `AI found ${assignments.length} assignments across ${projects.length} projects. High confidence items are pre-selected.`
                : `AI found ${assignments.length} assignments across ${projects.length} projects. Review and select items to approve.`
              }
            </p>

            {/* Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-accent" />
                <span className="text-white-dim">{projects.length} projects</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-accent" />
                <span className="text-white-dim">{assignments.length} assignments</span>
              </div>
              {suggestedAssignments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-accent" />
                  <span className="text-white-dim">{suggestedAssignments.length} AI suggestions</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleApprove}
              disabled={totalSelectedCount === 0 || approving}
              size="lg"
              className="min-w-[200px]"
            >
              {approving ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isHighConfidence && totalSelectedCount === assignments.length
                    ? 'Looks Good - Approve All'
                    : `Approve ${totalSelectedCount} Selected`
                  }
                </>
              )}
            </Button>
            <p className="text-white-dim text-xs">
              {totalSelectedCount} of {assignments.length + suggestedAssignments.length} selected
            </p>
          </div>
        </div>

        {/* Capacity Impact Preview */}
        {Object.keys(capacityImpact).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-white-dim text-xs uppercase mb-2">Hours being added this week:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(capacityImpact).map(([name, hours]) => (
                <span
                  key={name}
                  className="px-2 py-1 bg-black-deep text-xs text-white-muted border border-border-subtle"
                >
                  {name}: <span className="text-orange-accent font-bold">+{hours}h</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Assignments Section - The main action area */}
      {assignments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white-muted uppercase">
              Assignments
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-orange-accent hover:underline uppercase"
              >
                Select All
              </button>
              <span className="text-white-dim">|</span>
              <button
                onClick={selectNone}
                className="text-xs text-white-dim hover:text-white-full uppercase"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {assignments.map((assignment, index) => {
              const isSelected = selectedAssignments.has(index)
              const personName = assignment.person_name || assignment.team_member_name

              return (
                <div
                  key={index}
                  className={`bg-black-card p-3 border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-orange-accent'
                      : 'border-border-subtle hover:border-border-medium'
                  }`}
                  onClick={() => toggleAssignment(index)}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-orange-accent border-orange-accent'
                        : 'border-border-medium'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black-ink" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white-full font-medium truncate">
                      <span className="text-orange-accent">{personName}</span>
                      <span className="text-white-dim mx-2">→</span>
                      {assignment.project_name}
                    </p>
                    <p className="text-white-dim text-xs truncate">
                      {assignment.role_inferred || assignment.role || 'Team Member'}
                      {assignment.hours_this_week && (
                        <span className="ml-2">• {assignment.hours_this_week}h/week</span>
                      )}
                    </p>
                  </div>

                  {/* Confidence */}
                  <ConfidenceBadge score={assignment.confidence} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* AI Suggestions - Collapsed by default if there are regular assignments */}
      {suggestedAssignments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-orange-accent" />
            <h3 className="text-sm font-bold text-white-muted uppercase">
              AI Suggestions
            </h3>
            <span className="text-white-dim text-xs">
              (Based on team capabilities)
            </span>
          </div>

          <div className="space-y-2">
            {suggestedAssignments.map((suggestion, index) => {
              const isAccepted = acceptedSuggestions.has(index)

              return (
                <div
                  key={index}
                  className={`bg-black-card p-3 border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isAccepted
                      ? 'border-orange-accent'
                      : 'border-border-subtle border-dashed hover:border-border-medium'
                  }`}
                  onClick={() => acceptSuggestion(index)}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
                      isAccepted
                        ? 'bg-orange-accent border-orange-accent'
                        : 'border-border-medium border-dashed'
                    }`}
                  >
                    {isAccepted ? (
                      <Check className="w-3 h-3 text-black-ink" />
                    ) : (
                      <Plus className="w-3 h-3 text-white-dim" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white-full font-medium truncate">
                      <span className="text-orange-accent">{suggestion.team_member_name}</span>
                      <span className="text-white-dim mx-2">→</span>
                      {suggestion.project_name}
                    </p>
                    <p className="text-white-dim text-xs truncate">
                      {suggestion.suggested_role}
                      <span className="text-orange-accent/60 ml-2">• {suggestion.match_reason}</span>
                    </p>
                  </div>

                  {/* Confidence */}
                  <ConfidenceBadge score={suggestion.confidence} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Projects - Collapsible details */}
      {projects.length > 0 && (
        <section>
          <button
            onClick={() => setShowProjectDetails(!showProjectDetails)}
            className="flex items-center gap-2 text-sm font-bold text-white-muted uppercase hover:text-white-full transition-colors w-full"
          >
            {showProjectDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Projects Mentioned ({projects.length})
          </button>

          {showProjectDetails && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((project, index) => (
                <Card key={index} hoverable={false} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white-full font-bold text-sm">{project.name}</h4>
                      {project.client && (
                        <p className="text-white-dim text-xs">{project.client}</p>
                      )}
                      {project.next_milestone && (
                        <p className="text-orange-accent text-xs mt-1">
                          Next: {project.next_milestone}
                        </p>
                      )}
                    </div>
                    <ConfidenceBadge score={project.confidence} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Capacity Signals - Collapsible */}
      {capacitySignals.length > 0 && (
        <section>
          <button
            onClick={() => setShowCapacitySignals(!showCapacitySignals)}
            className="flex items-center gap-2 text-sm font-bold text-white-muted uppercase hover:text-white-full transition-colors w-full"
          >
            {showCapacitySignals ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Capacity Signals ({capacitySignals.length})
          </button>

          {showCapacitySignals && (
            <div className="mt-3 space-y-2">
              {capacitySignals.map((signal, index) => (
                <div
                  key={index}
                  className="bg-black-card p-3 border-2 border-border-subtle flex items-center justify-between"
                >
                  <div>
                    <p className="text-white-full font-medium text-sm">
                      {signal.person_name || signal.team_member_name}
                    </p>
                    <p className="text-white-dim text-xs">
                      {signal.description || signal.context_quote}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase ${
                      signal.signal_type === 'overallocated'
                        ? 'bg-red-hot text-white'
                        : signal.signal_type === 'available'
                        ? 'bg-green-500 text-black-ink'
                        : 'bg-yellow-electric text-black-ink'
                    }`}
                  >
                    {signal.signal_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Secondary Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <Button variant="ghost" onClick={() => router.push('/transcripts')}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <p className="text-white-dim text-xs">
          Tip: High confidence items are pre-selected. Just click &quot;Approve&quot; if it looks right.
        </p>
      </div>
    </div>
  )
}
