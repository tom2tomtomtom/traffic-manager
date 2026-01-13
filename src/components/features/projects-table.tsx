'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Search, Users, Clock, Calendar, ChevronRight } from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  status: string
  phase: string
  deadline: string | null
  priority: string
  team_size: number
  allocated_hours: number
  estimated_hours: number
}

interface ProjectsTableProps {
  initialProjects: Project[]
}

export function ProjectsTable({ initialProjects }: ProjectsTableProps) {
  const [projects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    estimated_total_hours: '',
    deadline: '',
  })
  const [creating, setCreating] = useState(false)

  const filteredProjects = projects.filter(p => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!p.name.toLowerCase().includes(query) && !p.client.toLowerCase().includes(query)) {
        return false
      }
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-orange-accent text-black-ink'
      case 'briefing': return 'bg-yellow-electric text-black-ink'
      case 'on-hold': return 'bg-white-dim text-black-ink'
      default: return 'bg-border-subtle text-white-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-hot'
      case 'high': return 'text-orange-accent'
      default: return 'text-white-muted'
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProject.name,
          client: newProject.client,
          estimated_total_hours: newProject.estimated_total_hours ? parseFloat(newProject.estimated_total_hours) : null,
          deadline: newProject.deadline || null,
          status: 'briefing',
          phase: 'pre-production',
        }),
      })

      if (res.ok) {
        // Refresh the page to show new project
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      {/* Header with filters and new button */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black-card border-2 border-border-subtle text-white-full text-sm focus:border-orange-accent focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'active', 'briefing', 'on-hold'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 text-xs uppercase font-bold border-2 transition-all',
                statusFilter === status
                  ? 'bg-orange-accent text-black-ink border-orange-accent'
                  : 'bg-black-card text-white-muted border-border-subtle hover:border-orange-accent'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {/* New Project Button */}
        <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Projects Table */}
      <div className="bg-black-card border-2 border-border-subtle">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-subtle text-white-dim text-xs uppercase font-bold">
          <div className="col-span-4">Project</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-center">Team</div>
          <div className="col-span-2 text-center">Hours</div>
          <div className="col-span-2 text-right">Deadline</div>
        </div>

        {/* Table Rows */}
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid grid-cols-12 gap-4 p-4 border-b border-border-subtle hover:bg-black-deep transition-colors group"
            >
              {/* Project Name & Client */}
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <span className={cn('text-white-full font-bold group-hover:text-orange-accent transition-colors', getPriorityColor(project.priority))}>
                    {project.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {project.client && (
                  <p className="text-white-dim text-xs mt-1">{project.client}</p>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center">
                <span className={cn('px-2 py-1 text-[10px] uppercase font-bold', getStatusColor(project.status))}>
                  {project.status}
                </span>
              </div>

              {/* Team */}
              <div className="col-span-2 flex items-center justify-center gap-1 text-white-muted">
                <Users className="w-4 h-4" />
                <span className="text-sm">{project.team_size}</span>
              </div>

              {/* Hours */}
              <div className="col-span-2 flex items-center justify-center gap-1 text-white-muted">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {project.allocated_hours}/{project.estimated_hours}h
                </span>
              </div>

              {/* Deadline */}
              <div className="col-span-2 flex items-center justify-end gap-1 text-white-muted">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(project.deadline)}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center text-white-muted">
            No projects found.
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black-ink/80 flex items-center justify-center z-50">
          <div className="bg-black-card border-2 border-border-subtle p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-orange-accent uppercase mb-6">New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 bg-black-deep border-2 border-border-subtle text-white-full focus:border-orange-accent focus:outline-none"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-white-dim text-xs uppercase mb-2">Client</label>
                <input
                  type="text"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  className="w-full px-4 py-2 bg-black-deep border-2 border-border-subtle text-white-full focus:border-orange-accent focus:outline-none"
                  placeholder="Client name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white-dim text-xs uppercase mb-2">Est. Hours</label>
                  <input
                    type="number"
                    value={newProject.estimated_total_hours}
                    onChange={(e) => setNewProject({ ...newProject, estimated_total_hours: e.target.value })}
                    className="w-full px-4 py-2 bg-black-deep border-2 border-border-subtle text-white-full focus:border-orange-accent focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-white-dim text-xs uppercase mb-2">Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full px-4 py-2 bg-black-deep border-2 border-border-subtle text-white-full focus:border-orange-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowNewModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || creating}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
