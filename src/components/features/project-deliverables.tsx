'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Package,
  Plus,
  X,
  Check,
  Trash2,
  User,
  Calendar,
  ChevronRight,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield
} from 'lucide-react'

interface TeamMember {
  id: string
  full_name: string
}

interface Deliverable {
  id: string
  project_id: string
  name: string
  description: string | null
  assigned_to: string | null
  assigned_member: TeamMember | null
  due_date: string | null
  status: string
  requires_approval: boolean
  approved_by: string | null
  approver: TeamMember | null
  approved_at: string | null
}

interface Template {
  id: string
  name: string
  project_type: string
  items: { name: string; requires_approval: boolean }[]
}

interface ProjectDeliverablesProps {
  projectId: string
  deliverables: Deliverable[]
  teamMembers: TeamMember[]
  templates: Template[]
}

const statusConfig = {
  not_started: { label: 'Not Started', icon: Clock, color: 'text-white-dim', bg: 'bg-border-subtle' },
  in_progress: { label: 'In Progress', icon: ChevronRight, color: 'text-blue-400', bg: 'bg-blue-400/20' },
  review: { label: 'In Review', icon: AlertCircle, color: 'text-yellow-electric', bg: 'bg-yellow-electric/20' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/20' },
  blocked: { label: 'Blocked', icon: AlertCircle, color: 'text-red-hot', bg: 'bg-red-hot/20' },
}

const statusFlow = ['not_started', 'in_progress', 'review', 'approved']

export function ProjectDeliverables({
  projectId,
  deliverables: initialDeliverables,
  teamMembers,
  templates
}: ProjectDeliverablesProps) {
  const router = useRouter()
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newDeliverable, setNewDeliverable] = useState({
    name: '',
    description: '',
    assigned_to: '',
    due_date: '',
    requires_approval: false,
  })

  const handleAddDeliverable = async () => {
    if (!newDeliverable.name) return

    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newDeliverable,
          assigned_to: newDeliverable.assigned_to || null,
          due_date: newDeliverable.due_date || null,
        }),
      })

      if (res.ok) {
        router.refresh()
        setShowAddModal(false)
        setNewDeliverable({ name: '', description: '', assigned_to: '', due_date: '', requires_approval: false })
      }
    } catch (error) {
      console.error('Failed to add deliverable:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApplyTemplate = async (template: Template) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: template.items }),
      })

      if (res.ok) {
        router.refresh()
        setShowTemplateModal(false)
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (deliverable: Deliverable, newStatus: string) => {
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setDeliverables(prev => prev.map(d =>
          d.id === deliverable.id ? { ...d, status: newStatus } : d
        ))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAdvanceStatus = async (deliverable: Deliverable) => {
    const currentIndex = statusFlow.indexOf(deliverable.status)
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1]
      await handleStatusChange(deliverable, nextStatus)
    }
  }

  const handleDeleteDeliverable = async (id: string) => {
    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setDeliverables(prev => prev.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete deliverable:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dateStr: string | null, status: string) => {
    if (!dateStr || status === 'approved') return false
    return new Date(dateStr) < new Date()
  }

  // Group by status
  const groupedDeliverables = {
    not_started: deliverables.filter(d => d.status === 'not_started'),
    in_progress: deliverables.filter(d => d.status === 'in_progress'),
    review: deliverables.filter(d => d.status === 'review'),
    approved: deliverables.filter(d => d.status === 'approved'),
    blocked: deliverables.filter(d => d.status === 'blocked'),
  }

  const completedCount = deliverables.filter(d => d.status === 'approved').length
  const totalCount = deliverables.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white-full uppercase flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-accent" />
            Deliverables
          </h2>
          {totalCount > 0 && (
            <span className="text-white-dim text-sm">
              {completedCount}/{totalCount} complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <Button onClick={() => setShowTemplateModal(true)} size="sm" variant="ghost" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Use Template
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)} size="sm" variant="ghost" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-2 bg-black-deep">
          <div
            className="h-full bg-orange-accent transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Deliverables list */}
      {deliverables.length > 0 ? (
        <div className="space-y-2">
          {deliverables.map((deliverable) => {
            const config = statusConfig[deliverable.status as keyof typeof statusConfig] || statusConfig.not_started
            const StatusIcon = config.icon
            const overdue = isOverdue(deliverable.due_date, deliverable.status)
            const canAdvance = statusFlow.indexOf(deliverable.status) < statusFlow.length - 1

            return (
              <Card
                key={deliverable.id}
                className={cn(
                  'p-3',
                  deliverable.status === 'approved' && 'opacity-60',
                  overdue && 'border-red-hot'
                )}
                hoverable={false}
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <button
                    onClick={() => canAdvance && handleAdvanceStatus(deliverable)}
                    disabled={!canAdvance}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center border-2 transition-all',
                      deliverable.status === 'approved'
                        ? 'bg-green-400 border-green-400'
                        : 'border-border-subtle hover:border-orange-accent',
                      !canAdvance && 'cursor-default'
                    )}
                    title={canAdvance ? 'Advance status' : 'Completed'}
                  >
                    {deliverable.status === 'approved' ? (
                      <Check className="w-4 h-4 text-black-ink" />
                    ) : (
                      <StatusIcon className={cn('w-4 h-4', config.color)} />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-white-full font-medium truncate',
                        deliverable.status === 'approved' && 'line-through'
                      )}>
                        {deliverable.name}
                      </span>
                      {deliverable.requires_approval && (
                        <span title="Requires approval">
                          <Shield className="w-3 h-3 text-yellow-electric flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className={cn('px-1.5 py-0.5 uppercase font-bold', config.bg, config.color)}>
                        {config.label}
                      </span>
                      {deliverable.assigned_member && (
                        <span className="text-white-dim flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {deliverable.assigned_member.full_name}
                        </span>
                      )}
                      {deliverable.due_date && (
                        <span className={cn(
                          'flex items-center gap-1',
                          overdue ? 'text-red-hot' : 'text-white-dim'
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(deliverable.due_date)}
                          {overdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={deliverable.status}
                    onChange={(e) => handleStatusChange(deliverable, e.target.value)}
                    className="bg-black-deep border border-border-subtle text-white-full text-xs px-2 py-1 focus:outline-none focus:border-orange-accent"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="blocked">Blocked</option>
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteDeliverable(deliverable.id)}
                    className="p-1.5 text-white-dim hover:text-red-hot transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-6 text-center" hoverable={false}>
          <p className="text-white-muted">No deliverables yet.</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {templates.length > 0 && (
              <Button onClick={() => setShowTemplateModal(true)} variant="ghost">
                Use Template
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)} variant="ghost">
              Add Deliverable
            </Button>
          </div>
        </Card>
      )}

      {/* Add Deliverable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-orange-accent uppercase">Add Deliverable</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white-dim hover:text-white-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Name *</label>
                <input
                  type="text"
                  value={newDeliverable.name}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                  placeholder="e.g., First Draft"
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Assigned To</label>
                <select
                  value={newDeliverable.assigned_to}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, assigned_to: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Due Date</label>
                <input
                  type="date"
                  value={newDeliverable.due_date}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Description</label>
                <textarea
                  value={newDeliverable.description}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full bg-black-deep border-2 border-border-subtle text-white-full px-3 py-2 focus:border-orange-accent focus:outline-none resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDeliverable.requires_approval}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, requires_approval: e.target.checked })}
                  className="w-4 h-4 accent-orange-accent"
                />
                <span className="text-white-muted text-sm">Requires approval before completion</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddDeliverable}
                disabled={!newDeliverable.name || saving}
                className="flex-1"
              >
                {saving ? 'Adding...' : 'Add Deliverable'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-orange-accent uppercase">Choose Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-white-dim hover:text-white-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  disabled={saving}
                  className="w-full text-left p-4 border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white-full font-bold">{template.name}</span>
                    <span className="text-white-dim text-xs uppercase">{template.project_type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.items.slice(0, 4).map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] bg-border-subtle text-white-dim">
                        {item.name}
                      </span>
                    ))}
                    {template.items.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] bg-border-subtle text-white-dim">
                        +{template.items.length - 4} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button variant="ghost" onClick={() => setShowTemplateModal(false)} className="w-full mt-4">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
