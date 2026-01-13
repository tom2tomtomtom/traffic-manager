'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfidenceBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Users, Clock, Calendar, Plus, Trash2, AlertTriangle, Sparkles, Check, X } from 'lucide-react'
import { useCanEdit } from '@/lib/auth/user-context'

interface Recommendation {
  team_member_id: string | null
  team_member_name: string
  suggested_role: string
  suggested_hours: number
  match_reason: string
  confidence: number
  priority: string
  available_hours: number
}

interface RecommendationResponse {
  recommendations: Recommendation[]
  team_composition_notes: string
  warnings: string[]
}

interface Assignment {
  id: string
  team_member_id: string
  team_member_name: string
  team_member_role: string
  role_on_project: string
  hours_this_week: number
  estimated_hours: number
  hours_consumed: number
}

interface TeamMember {
  id: string
  full_name: string
  role: string
  weekly_capacity_hours: number
  allocated_hours: number
  available_hours: number
  already_assigned: boolean
}

interface Project {
  id: string
  name: string
  client: string
  status: string
  phase: string
  deadline: string | null
  priority: string
  estimated_total_hours: number | null
  hours_consumed: number | null
  notes: string | null
}

interface ProjectDetailProps {
  project: Project
  assignments: Assignment[]
  availableMembers: TeamMember[]
}

export function ProjectDetail({ project, assignments: initialAssignments, availableMembers }: ProjectDetailProps) {
  const router = useRouter()
  const canEdit = useCanEdit()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [newAssignment, setNewAssignment] = useState({
    role_on_project: 'support',
    hours_this_week: 0,
    estimated_hours: 0,
  })
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState(project.status)
  const [phase, setPhase] = useState(project.phase || '')
  const [saving, setSaving] = useState(false)

  // AI Recommendations state
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [addingRecommendation, setAddingRecommendation] = useState<string | null>(null)

  const totalAllocatedHours = assignments.reduce((sum, a) => sum + a.hours_this_week, 0)
  const totalEstimatedHours = assignments.reduce((sum, a) => sum + a.estimated_hours, 0)

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    setSaving(true)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhaseChange = async (newPhase: string) => {
    setPhase(newPhase)
    setSaving(true)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phase: newPhase }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedMember) return

    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          team_member_id: selectedMember,
          role_on_project: newAssignment.role_on_project,
          hours_this_week: newAssignment.hours_this_week,
          estimated_hours: newAssignment.estimated_hours,
        }),
      })

      if (res.ok) {
        router.refresh()
        setShowAddModal(false)
        setSelectedMember('')
        setNewAssignment({ role_on_project: 'support', hours_this_week: 0, estimated_hours: 0 })
      }
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId))
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error)
    }
  }

  const handleGetRecommendations = async () => {
    setLoadingRecommendations(true)
    setShowRecommendations(true)

    try {
      const res = await fetch(`/api/projects/${project.id}/recommend`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setRecommendations(data)
      } else {
        console.error('Failed to get recommendations')
      }
    } catch (error) {
      console.error('Recommendation error:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleAcceptRecommendation = async (rec: Recommendation) => {
    if (!rec.team_member_id) return

    setAddingRecommendation(rec.team_member_name)

    try {
      const res = await fetch(`/api/projects/${project.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          team_member_id: rec.team_member_id,
          role_on_project: rec.suggested_role,
          hours_this_week: rec.suggested_hours,
          estimated_hours: rec.suggested_hours * 4, // Estimate 4 weeks
        }),
      })

      if (res.ok) {
        // Remove this recommendation from the list
        setRecommendations(prev => prev ? {
          ...prev,
          recommendations: prev.recommendations.filter(r => r.team_member_id !== rec.team_member_id),
        } : null)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to accept recommendation:', error)
    } finally {
      setAddingRecommendation(null)
    }
  }

  const selectedMemberData = availableMembers.find(m => m.id === selectedMember)
  const wouldOverallocate = selectedMemberData &&
    (selectedMemberData.allocated_hours + newAssignment.hours_this_week) > selectedMemberData.weekly_capacity_hours

  return (
    <div className="space-y-6">
      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <Card className="p-4">
          <p className="text-white-dim text-xs uppercase mb-2">Status</p>
          {canEdit ? (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={saving}
              className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
            >
              <option value="briefing">Briefing</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          ) : (
            <p className="text-white-full font-bold capitalize">{status}</p>
          )}
        </Card>

        {/* Phase */}
        <Card className="p-4">
          <p className="text-white-dim text-xs uppercase mb-2">Phase</p>
          {canEdit ? (
            <select
              value={phase}
              onChange={(e) => handlePhaseChange(e.target.value)}
              disabled={saving}
              className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
            >
              <option value="pre-production">Pre-Production</option>
              <option value="production">Production</option>
              <option value="post-production">Post-Production</option>
              <option value="client-review">Client Review</option>
              <option value="final-delivery">Final Delivery</option>
            </select>
          ) : (
            <p className="text-white-full font-bold capitalize">{phase.replace('-', ' ')}</p>
          )}
        </Card>

        {/* Deadline */}
        <Card className="p-4">
          <p className="text-white-dim text-xs uppercase mb-2">Deadline</p>
          <div className="flex items-center gap-2 text-white-full">
            <Calendar className="w-5 h-5 text-orange-accent" />
            <span className="font-bold">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Not set'}
            </span>
          </div>
        </Card>
      </div>

      {/* Hours Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-accent" />
              <span className="text-white-dim text-sm uppercase">Hours This Week:</span>
              <span className="text-white-full font-bold text-lg">{totalAllocatedHours}h</span>
            </div>
            <div className="text-white-dim">|</div>
            <div className="flex items-center gap-2">
              <span className="text-white-dim text-sm uppercase">Total Estimated:</span>
              <span className="text-white-full font-bold text-lg">{totalEstimatedHours}h</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-accent" />
            <span className="text-white-full font-bold">{assignments.length} team members</span>
          </div>
        </div>
      </Card>

      {/* Team Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white-full uppercase">Team</h2>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGetRecommendations}
                size="sm"
                variant="ghost"
                className="flex items-center gap-2"
                disabled={loadingRecommendations}
              >
                <Sparkles className="w-4 h-4" />
                {loadingRecommendations ? 'Getting Suggestions...' : 'AI Suggest'}
              </Button>
              <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Team Member
              </Button>
            </div>
          )}
        </div>

        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map(assignment => (
              <Card key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white-full font-bold">{assignment.team_member_name}</span>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-orange-accent/20 text-orange-accent">
                        {assignment.role_on_project}
                      </span>
                    </div>
                    <p className="text-white-dim text-xs mt-1">{assignment.team_member_role}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-white-full font-bold">{assignment.hours_this_week}h</p>
                      <p className="text-white-dim text-xs">this week</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white-full font-bold">{assignment.estimated_hours}h</p>
                      <p className="text-white-dim text-xs">total est.</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-2 text-white-dim hover:text-red-hot transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-white-muted">No team members assigned yet.</p>
            {canEdit && (
              <Button onClick={() => setShowAddModal(true)} variant="ghost" className="mt-4">
                Add Team Member
              </Button>
            )}
          </Card>
        )}

        {/* AI Recommendations Panel */}
        {showRecommendations && (
          <div className="mt-6 border-2 border-orange-accent bg-black-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-accent" />
                <h3 className="text-orange-accent font-bold uppercase">AI Recommendations</h3>
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="text-white-dim hover:text-white-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRecommendations ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-pulse text-orange-accent">
                  Analyzing project and team capabilities...
                </div>
              </div>
            ) : recommendations ? (
              <div className="space-y-4">
                {recommendations.team_composition_notes && (
                  <p className="text-white-muted text-sm border-b border-border-subtle pb-3">
                    {recommendations.team_composition_notes}
                  </p>
                )}

                {recommendations.warnings && recommendations.warnings.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-electric/10 border border-yellow-electric">
                    <AlertTriangle className="w-4 h-4 text-yellow-electric flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-electric">
                      {recommendations.warnings.map((w, i) => (
                        <p key={i}>{w}</p>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.recommendations.length === 0 ? (
                  <p className="text-white-muted text-center py-4">
                    No additional team members available to recommend.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recommendations.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border-2 border-border-subtle hover:border-orange-accent/50 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white-full font-bold">{rec.team_member_name}</span>
                            <span className={cn(
                              'px-2 py-0.5 text-[10px] uppercase font-bold',
                              rec.priority === 'primary' ? 'bg-orange-accent text-black-ink' :
                              rec.priority === 'secondary' ? 'bg-orange-accent/50 text-white' :
                              'bg-border-subtle text-white-dim'
                            )}>
                              {rec.priority}
                            </span>
                            <ConfidenceBadge score={rec.confidence} />
                          </div>
                          <p className="text-white-dim text-sm mt-1">
                            {rec.suggested_role} • {rec.suggested_hours}h/week • {rec.available_hours}h available
                          </p>
                          <p className="text-orange-accent/70 text-xs mt-1">
                            {rec.match_reason}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAcceptRecommendation(rec)}
                          disabled={!rec.team_member_id || addingRecommendation === rec.team_member_name}
                          className="ml-4"
                        >
                          {addingRecommendation === rec.team_member_name ? (
                            'Adding...'
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-orange-accent uppercase mb-6">Add Team Member</h2>

            {/* Member Selection */}
            <div className="mb-4">
              <label className="block text-white-dim text-xs uppercase mb-2">Select Person *</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
              >
                <option value="">Choose a team member...</option>
                {availableMembers.filter(m => !m.already_assigned).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role}) - {m.available_hours}h available
                  </option>
                ))}
              </select>
            </div>

            {selectedMemberData && (
              <div className={cn(
                'mb-4 p-3 border-2',
                wouldOverallocate ? 'border-red-hot bg-red-hot/10' : 'border-border-subtle'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-white-muted text-sm">Current allocation:</span>
                  <span className="text-white-full font-bold">
                    {selectedMemberData.allocated_hours}h / {selectedMemberData.weekly_capacity_hours}h
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white-muted text-sm">Available:</span>
                  <span className={cn('font-bold', selectedMemberData.available_hours < 0 ? 'text-red-hot' : 'text-orange-accent')}>
                    {selectedMemberData.available_hours}h
                  </span>
                </div>
                {wouldOverallocate && (
                  <div className="flex items-center gap-2 mt-2 text-red-hot text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    This would overallocate {selectedMemberData.full_name}
                  </div>
                )}
              </div>
            )}

            {/* Role */}
            <div className="mb-4">
              <label className="block text-white-dim text-xs uppercase mb-2">Role on Project</label>
              <select
                value={newAssignment.role_on_project}
                onChange={(e) => setNewAssignment({ ...newAssignment, role_on_project: e.target.value })}
                className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
              >
                <option value="lead">Lead</option>
                <option value="producer">Producer</option>
                <option value="strategy">Strategy</option>
                <option value="creative">Creative</option>
                <option value="support">Support</option>
              </select>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Hours This Week</label>
                <input
                  type="number"
                  value={newAssignment.hours_this_week}
                  onChange={(e) => setNewAssignment({ ...newAssignment, hours_this_week: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                  min="0"
                  max="40"
                />
              </div>
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Estimated Total Hours</label>
                <input
                  type="number"
                  value={newAssignment.estimated_hours}
                  onChange={(e) => setNewAssignment({ ...newAssignment, estimated_hours: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedMember('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedMember || adding}
                className="flex-1"
              >
                {adding ? 'Adding...' : 'Add to Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
