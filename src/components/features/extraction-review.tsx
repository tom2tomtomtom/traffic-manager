'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfidenceBadge, StatusBadge } from '@/components/ui/badge'
import { Check, Edit2, X, AlertTriangle } from 'lucide-react'

interface ExtractedProject {
  name: string
  client?: string
  status: string
  phase?: string
  next_milestone?: string
  context: string
  confidence: number
}

interface ExtractedAssignment {
  person_name: string
  project_name: string
  role_inferred?: string
  assignment_type: string
  workload_signal?: string
  context: string
  confidence: number
}

interface CapacitySignal {
  person_name: string
  signal_type: string
  description: string
  timeframe?: string
  context: string
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
  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(
    new Set()
  )

  const extracted = transcript.extracted_data

  if (!extracted) {
    return (
      <Card variant="danger" hoverable={false}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-hot" />
          <div>
            <p className="text-red-hot font-bold uppercase">
              No Extracted Data
            </p>
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
  const capacitySignals = extracted.capacity_signals || []

  // Select high-confidence assignments by default
  const toggleAssignment = (index: number) => {
    const newSelected = new Set(selectedAssignments)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedAssignments(newSelected)
  }

  const handleApproveSelected = async () => {
    // TODO: Implement API call to create assignments
    const selected = assignments.filter((_, i) => selectedAssignments.has(i))
    console.log('Approving assignments:', selected)

    // After approval, redirect to capacity view
    router.push('/dashboard/capacity')
  }

  return (
    <div className="space-y-8">
      {/* Overall confidence */}
      <div className="flex items-center justify-between p-4 bg-black-card border-2 border-border-subtle">
        <div>
          <p className="text-white-muted text-xs uppercase tracking-wide">
            Overall Extraction Confidence
          </p>
          <p className="text-white-full text-lg font-bold mt-1">
            {Math.round((transcript.extraction_confidence || 0) * 100)}%
          </p>
        </div>
        <ConfidenceBadge score={transcript.extraction_confidence || 0} />
      </div>

      {/* Projects Section */}
      {projects.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-orange-accent uppercase mb-4">
            Projects Mentioned ({projects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <Card key={index} hoverable={false}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white-full font-bold">{project.name}</h3>
                    {project.client && (
                      <p className="text-white-dim text-xs">{project.client}</p>
                    )}
                  </div>
                  <ConfidenceBadge score={project.confidence} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge
                    status={project.status as 'active' | 'briefing' | 'on-hold'}
                  />
                  {project.phase && (
                    <span className="text-white-dim text-xs uppercase">
                      {project.phase}
                    </span>
                  )}
                </div>

                {project.next_milestone && (
                  <p className="text-white-muted text-sm">
                    Next: {project.next_milestone}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <p className="text-white-dim text-xs italic">
                    &quot;{project.context}&quot;
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Assignments Section */}
      {assignments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-orange-accent uppercase">
              Assignments Detected ({assignments.length})
            </h2>
            <p className="text-white-dim text-xs">
              {selectedAssignments.size} selected
            </p>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment, index) => {
              const isSelected = selectedAssignments.has(index)
              const isHighConfidence = assignment.confidence >= 0.8

              return (
                <div
                  key={index}
                  className={`bg-black-card p-4 border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-orange-accent'
                      : 'border-border-subtle hover:border-border-medium'
                  }`}
                  onClick={() => toggleAssignment(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-orange-accent border-orange-accent'
                            : 'border-border-medium'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-black-ink" />
                        )}
                      </div>

                      <div>
                        <p className="text-white-full font-bold">
                          <span className="text-orange-accent">
                            {assignment.person_name}
                          </span>{' '}
                          <span className="text-white-dim">→</span>{' '}
                          {assignment.project_name}
                        </p>
                        <p className="text-white-muted text-sm">
                          {assignment.role_inferred || 'Role TBD'}
                          {assignment.workload_signal && (
                            <span className="text-white-dim ml-2">
                              ({assignment.workload_signal} workload)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-white-dim text-xs uppercase">
                        {assignment.assignment_type}
                      </span>
                      <ConfidenceBadge score={assignment.confidence} />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-white-dim text-xs italic">
                      &quot;{assignment.context}&quot;
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Capacity Signals Section */}
      {capacitySignals.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-orange-accent uppercase mb-4">
            Capacity Signals ({capacitySignals.length})
          </h2>

          <div className="space-y-3">
            {capacitySignals.map((signal, index) => (
              <Card key={index} hoverable={false} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white-full font-bold">
                      {signal.person_name}
                    </p>
                    <p className="text-white-muted text-sm mt-1">
                      {signal.description}
                    </p>
                    {signal.timeframe && (
                      <p className="text-orange-accent text-xs mt-2 uppercase">
                        {signal.timeframe}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-1 text-xs font-bold uppercase ${
                      signal.signal_type === 'overallocated'
                        ? 'bg-red-hot text-white'
                        : signal.signal_type === 'available'
                        ? 'bg-green-success text-black-ink'
                        : 'bg-yellow-electric text-black-ink'
                    }`}
                  >
                    {signal.signal_type}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
        <Button variant="ghost" onClick={() => router.back()}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="ghost">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Manually
          </Button>

          <Button
            onClick={handleApproveSelected}
            disabled={selectedAssignments.size === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            Approve Selected ({selectedAssignments.size})
          </Button>
        </div>
      </div>
    </div>
  )
}
