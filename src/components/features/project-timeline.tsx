'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Flag,
  Plus,
  X,
  Check,
  Trash2,
  Users,
  FileCheck,
  MessageSquare,
  Target
} from 'lucide-react'

interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  type: string
  date: string
  completed: boolean
  completed_at: string | null
}

interface ProjectTimelineProps {
  projectId: string
  projectDeadline: string | null
  projectStartDate?: string | null
  milestones: Milestone[]
}

const milestoneTypes = [
  { value: 'ppm', label: 'PPM', icon: Users, color: 'text-blue-400' },
  { value: 'client-meeting', label: 'Client Meeting', icon: MessageSquare, color: 'text-green-400' },
  { value: 'delivery', label: 'Delivery', icon: FileCheck, color: 'text-orange-accent' },
  { value: 'review', label: 'Review', icon: Target, color: 'text-yellow-electric' },
  { value: 'milestone', label: 'Milestone', icon: Flag, color: 'text-purple-400' },
  { value: 'deadline', label: 'Deadline', icon: Calendar, color: 'text-red-hot' },
]

export function ProjectTimeline({ projectId, projectDeadline, milestones: initialMilestones }: ProjectTimelineProps) {
  const router = useRouter()
  const [milestones, setMilestones] = useState(initialMilestones)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    type: 'milestone',
    date: '',
  })

  const today = new Date().toISOString().split('T')[0]

  const handleAddMilestone = async () => {
    if (!newMilestone.name || !newMilestone.date) return

    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMilestone),
      })

      if (res.ok) {
        const data = await res.json()
        setMilestones(prev => [...prev, data.milestone].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ))
        setShowAddModal(false)
        setNewMilestone({ name: '', description: '', type: 'milestone', date: '' })
      }
    } catch (error) {
      console.error('Failed to add milestone:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      const res = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !milestone.completed }),
      })

      if (res.ok) {
        setMilestones(prev => prev.map(m =>
          m.id === milestone.id ? { ...m, completed: !m.completed } : m
        ))
      }
    } catch (error) {
      console.error('Failed to toggle milestone:', error)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setMilestones(prev => prev.filter(m => m.id !== milestoneId))
      }
    } catch (error) {
      console.error('Failed to delete milestone:', error)
    }
  }

  const getMilestoneIcon = (type: string) => {
    const mt = milestoneTypes.find(t => t.value === type)
    return mt ? mt.icon : Flag
  }

  const getMilestoneColor = (type: string) => {
    const mt = milestoneTypes.find(t => t.value === type)
    return mt ? mt.color : 'text-white-dim'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (dateStr: string, completed: boolean) => {
    if (completed) return false
    return new Date(dateStr) < new Date(today)
  }

  const isUpcoming = (dateStr: string) => {
    const date = new Date(dateStr)
    const todayDate = new Date(today)
    const weekFromNow = new Date(todayDate)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return date >= todayDate && date <= weekFromNow
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white-full uppercase flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-accent" />
          Timeline
        </h2>
        <Button onClick={() => setShowAddModal(true)} size="sm" variant="ghost" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Milestone
        </Button>
      </div>

      {/* Timeline visualization */}
      {(milestones.length > 0 || projectDeadline) && (
        <div className="relative py-4">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border-subtle" />

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const Icon = getMilestoneIcon(milestone.type)
              const colorClass = getMilestoneColor(milestone.type)
              const overdue = isOverdue(milestone.date, milestone.completed)
              const upcoming = isUpcoming(milestone.date)

              return (
                <div key={milestone.id} className="relative flex items-start gap-4 pl-3">
                  {/* Dot on timeline */}
                  <div className={cn(
                    'relative z-10 w-6 h-6 flex items-center justify-center border-2',
                    milestone.completed
                      ? 'bg-orange-accent border-orange-accent'
                      : overdue
                        ? 'bg-red-hot/20 border-red-hot'
                        : 'bg-black-card border-border-subtle'
                  )}>
                    {milestone.completed ? (
                      <Check className="w-3 h-3 text-black-ink" />
                    ) : (
                      <Icon className={cn('w-3 h-3', overdue ? 'text-red-hot' : colorClass)} />
                    )}
                  </div>

                  {/* Milestone card */}
                  <Card
                    className={cn(
                      'flex-1 p-3',
                      milestone.completed && 'opacity-60',
                      overdue && 'border-red-hot',
                      upcoming && !milestone.completed && 'border-yellow-electric'
                    )}
                    hoverable={false}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-white-full font-bold',
                            milestone.completed && 'line-through'
                          )}>
                            {milestone.name}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 text-[10px] uppercase font-bold',
                            milestone.completed
                              ? 'bg-orange-accent/20 text-orange-accent'
                              : overdue
                                ? 'bg-red-hot text-white'
                                : upcoming
                                  ? 'bg-yellow-electric text-black-ink'
                                  : 'bg-border-subtle text-white-dim'
                          )}>
                            {milestone.type}
                          </span>
                        </div>
                        <p className={cn(
                          'text-sm mt-1',
                          overdue ? 'text-red-hot' : 'text-white-dim'
                        )}>
                          {formatDate(milestone.date)}
                          {overdue && ' (Overdue)'}
                          {upcoming && !milestone.completed && ' (This week)'}
                        </p>
                        {milestone.description && (
                          <p className="text-white-muted text-xs mt-1">{milestone.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleComplete(milestone)}
                          className={cn(
                            'p-1.5 transition-colors',
                            milestone.completed
                              ? 'text-orange-accent hover:text-white'
                              : 'text-white-dim hover:text-orange-accent'
                          )}
                          title={milestone.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="p-1.5 text-white-dim hover:text-red-hot transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}

            {/* Project deadline marker */}
            {projectDeadline && (
              <div className="relative flex items-start gap-4 pl-3">
                <div className="relative z-10 w-6 h-6 flex items-center justify-center bg-red-hot border-2 border-red-hot">
                  <Flag className="w-3 h-3 text-white" />
                </div>
                <Card className="flex-1 p-3 border-red-hot" hoverable={false}>
                  <div className="flex items-center gap-2">
                    <span className="text-white-full font-bold">Project Deadline</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-red-hot text-white">
                      Final
                    </span>
                  </div>
                  <p className="text-red-hot text-sm mt-1">{formatDate(projectDeadline)}</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {milestones.length === 0 && !projectDeadline && (
        <Card className="p-6 text-center" hoverable={false}>
          <p className="text-white-muted">No milestones yet.</p>
          <Button onClick={() => setShowAddModal(true)} variant="ghost" className="mt-3">
            Add First Milestone
          </Button>
        </Card>
      )}

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-orange-accent uppercase">Add Milestone</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white-dim hover:text-white-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Name *</label>
                <input
                  type="text"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="e.g., First Draft Review"
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Type</label>
                <select
                  value={newMilestone.type}
                  onChange={(e) => setNewMilestone({ ...newMilestone, type: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                >
                  {milestoneTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Date *</label>
                <input
                  type="date"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddMilestone}
                disabled={!newMilestone.name || !newMilestone.date || saving}
                className="flex-1"
              >
                {saving ? 'Adding...' : 'Add Milestone'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
