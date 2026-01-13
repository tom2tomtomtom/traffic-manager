'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search } from 'lucide-react'

interface Assignment {
  id: string
  project_id: string
  project_name: string
  client_name: string
  role: string
  hours_this_week: number
  estimated_hours: number
  status: string
}

interface TeamMemberCapacity {
  id: string
  full_name: string
  role: string
  weekly_capacity_hours: number
  allocated_hours: number
  available_hours: number
  utilization_pct: number
  overallocated: boolean
  core_roles: string[]
  capabilities: string[]
  industries: string[]
  permission_level: string
  known_clients: string[]
  assignments: Assignment[]
}

interface CapacityData {
  weekStart: string
  weekEnd: string
  weekOffset: number
  teamMembers: TeamMemberCapacity[]
}

interface CapacityDashboardProps {
  initialData: CapacityData
}

export function CapacityDashboard({ initialData }: CapacityDashboardProps) {
  const router = useRouter()
  const [data] = useState<CapacityData>(initialData)
  const [loading] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [editHours, setEditHours] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'overallocated'>('all')
  const [saving, setSaving] = useState(false)

  const handleSaveHours = async (assignmentId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours_this_week: editHours }),
      })

      if (res.ok) {
        // Refresh data
        router.refresh()
        setEditingAssignment(null)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const getUtilizationColor = (pct: number, overallocated: boolean): string => {
    if (overallocated) return 'border-red-hot'
    if (pct >= 90) return 'border-yellow-electric'
    if (pct >= 70) return 'border-orange-accent'
    return 'border-border-subtle'
  }

  const getBarColor = (overallocated: boolean): string => {
    return overallocated ? 'bg-red-hot' : 'bg-orange-accent'
  }

  // Filter team members
  const filteredMembers = (data?.teamMembers || []).filter(member => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!member.full_name.toLowerCase().includes(query) &&
          !member.role.toLowerCase().includes(query)) {
        return false
      }
    }

    // Status filter
    if (statusFilter === 'available' && member.overallocated) return false
    if (statusFilter === 'overallocated' && !member.overallocated) return false

    return true
  }) || []

  const overallocatedCount = (data?.teamMembers || []).filter(m => m.overallocated).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white-muted">Loading capacity data...</div>
      </div>
    )
  }

  if (!data?.teamMembers?.length) {
    return (
      <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
        <p className="text-white-muted">No team members found.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 bg-black-card border-2 border-border-subtle p-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={true}
          className="flex items-center gap-1 opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev Week
        </Button>

        <div className="text-center">
          <p className="text-white-full font-bold uppercase text-sm">
            Current Week
          </p>
          <p className="text-white-muted text-xs mt-1">
            {data.weekStart} - {data.weekEnd}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={true}
          className="flex items-center gap-1 opacity-50"
        >
          Next Week
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black-card border-2 border-border-subtle text-white-full text-sm focus:border-orange-accent focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-4 py-2 text-xs uppercase font-bold border-2 transition-all',
              statusFilter === 'all'
                ? 'bg-orange-accent text-black-ink border-orange-accent'
                : 'bg-black-card text-white-muted border-border-subtle hover:border-orange-accent'
            )}
          >
            All ({data?.teamMembers?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={cn(
              'px-4 py-2 text-xs uppercase font-bold border-2 transition-all',
              statusFilter === 'available'
                ? 'bg-orange-accent text-black-ink border-orange-accent'
                : 'bg-black-card text-white-muted border-border-subtle hover:border-orange-accent'
            )}
          >
            Available
          </button>
          <button
            onClick={() => setStatusFilter('overallocated')}
            className={cn(
              'px-4 py-2 text-xs uppercase font-bold border-2 transition-all',
              statusFilter === 'overallocated'
                ? 'bg-red-hot text-white border-red-hot'
                : 'bg-black-card text-white-muted border-border-subtle hover:border-red-hot'
            )}
          >
            Overallocated ({overallocatedCount})
          </button>
        </div>
      </div>

      {/* Overallocation Warning */}
      {overallocatedCount > 0 && statusFilter !== 'available' && (
        <div className="mb-6 bg-black-card border-2 border-red-hot p-4">
          <p className="text-red-hot font-bold uppercase text-sm">
            Capacity Conflicts Detected
          </p>
          <p className="text-white-muted text-sm mt-2">
            {overallocatedCount} team member{overallocatedCount > 1 ? 's are' : ' is'} overallocated this week
          </p>
        </div>
      )}

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card
            key={member.id}
            variant={member.overallocated ? 'danger' : 'default'}
            hoverable={false}
            className={cn(
              'relative',
              getUtilizationColor(member.utilization_pct, member.overallocated)
            )}
          >
            {/* Utilization bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-black-deep">
              <div
                className={cn('h-full transition-all', getBarColor(member.overallocated))}
                style={{ width: `${Math.min(member.utilization_pct, 100)}%` }}
              />
            </div>

            <div className="pt-2">
              {/* Header - Clickable to expand */}
              <button
                onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white-full font-bold">{member.full_name}</h3>
                      {member.assignments.length > 0 && (
                        expandedMember === member.id
                          ? <ChevronUp className="w-4 h-4 text-white-dim" />
                          : <ChevronDown className="w-4 h-4 text-white-dim" />
                      )}
                    </div>
                    <p className="text-white-dim text-xs uppercase tracking-wide">
                      {member.role}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'text-2xl font-bold',
                      member.overallocated ? 'text-red-hot' : 'text-orange-accent'
                    )}
                  >
                    {Math.round(member.utilization_pct)}%
                  </span>
                </div>
              </button>

              {/* Capabilities Tags */}
              {(member.core_roles?.length > 0 || member.industries?.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.core_roles?.slice(0, 2).map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold bg-orange-accent/20 text-orange-accent"
                    >
                      {role}
                    </span>
                  ))}
                  {member.industries?.slice(0, 2).map((industry) => (
                    <span
                      key={industry}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold bg-white-dim/20 text-white-muted"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white-muted">Allocated</span>
                  <span className="text-white-full font-bold">{member.allocated_hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white-muted">Capacity</span>
                  <span className="text-white-full font-bold">{member.weekly_capacity_hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white-muted">Available</span>
                  <span className={cn('font-bold', member.available_hours < 0 ? 'text-red-hot' : 'text-orange-accent')}>
                    {member.available_hours}h
                  </span>
                </div>
              </div>

              {/* Expanded Assignment Details */}
              {expandedMember === member.id && member.assignments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <p className="text-white-dim text-xs uppercase mb-3">
                    Assignments ({member.assignments.length})
                  </p>
                  <div className="space-y-3">
                    {member.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-black-deep p-3 border border-border-subtle"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white-full font-bold text-sm">
                              {assignment.project_name}
                            </p>
                            {assignment.client_name && (
                              <p className="text-white-dim text-xs">{assignment.client_name}</p>
                            )}
                            <p className="text-orange-accent text-xs mt-1">{assignment.role}</p>
                          </div>

                          {editingAssignment === assignment.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editHours}
                                onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-black-card border border-orange-accent text-white-full text-sm text-right"
                                min="0"
                                max="40"
                              />
                              <span className="text-white-muted text-sm">h</span>
                              <Button
                                size="sm"
                                onClick={() => handleSaveHours(assignment.id)}
                                disabled={saving}
                              >
                                {saving ? '...' : 'Save'}
                              </Button>
                              <button
                                onClick={() => setEditingAssignment(null)}
                                className="text-white-dim text-xs hover:text-white-full"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingAssignment(assignment.id)
                                setEditHours(assignment.hours_this_week)
                              }}
                              className="text-white-full font-bold text-sm hover:text-orange-accent transition-colors"
                            >
                              {assignment.hours_this_week}h
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overallocation warning */}
              {member.overallocated && (
                <div className="mt-4 pt-4 border-t border-red-hot">
                  <p className="text-red-hot text-xs uppercase font-bold">OVERALLOCATED</p>
                  <p className="text-white-muted text-xs mt-1">
                    Reduce by {Math.abs(member.available_hours)}h to reach capacity
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
          <p className="text-white-muted">
            No team members match your filters.
          </p>
        </div>
      )}
    </div>
  )
}
