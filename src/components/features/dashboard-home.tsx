'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FolderKanban,
  Users,
  AlertTriangle,
  Clock,
  Upload,
  Plus,
  ChevronRight,
  Calendar,
  FileText,
  Package,
  Flag,
  BarChart3
} from 'lucide-react'

interface DashboardStats {
  activeProjects: number
  teamUtilization: number
  overallocatedMembers: number
  overdueItems: number
}

interface Project {
  id: string
  name: string
  client: string | null
  status: string
  deadline: string | null
  priority: string
}

interface Milestone {
  id: string
  name: string
  type: string
  date: string
  completed: boolean
  project: { id: string; name: string } | null
}

interface Deliverable {
  id: string
  name: string
  status: string
  due_date: string | null
  project: { id: string; name: string } | null
}

interface Transcript {
  id: string
  meeting_date: string
  meeting_type: string
  extraction_confidence: number | null
  created_at: string
}

interface DashboardData {
  stats: DashboardStats
  upcomingProjects: Project[]
  upcomingMilestones: Milestone[]
  pendingDeliverables: Deliverable[]
  recentTranscripts: Transcript[]
}

interface DashboardHomeProps {
  data: DashboardData
}

export function DashboardHome({ data }: DashboardHomeProps) {
  const { stats, upcomingProjects, upcomingMilestones, pendingDeliverables, recentTranscripts } = data

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-accent uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="text-white-muted text-sm mt-1">
            Welcome back. Here&apos;s your weekly overview.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button variant="ghost" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Transcript
            </Button>
          </Link>
          <Link href="/projects">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Link href="/projects">
          <Card className="p-4 hover:border-orange-accent transition-all" hoverable={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-dim text-xs uppercase tracking-wide">Active Projects</p>
                <p className="text-3xl font-bold text-white-full mt-1">{stats.activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-orange-accent/20 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-orange-accent" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Team Utilization */}
        <Link href="/capacity">
          <Card className="p-4 hover:border-orange-accent transition-all" hoverable={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-dim text-xs uppercase tracking-wide">Team Utilization</p>
                <p className={cn(
                  'text-3xl font-bold mt-1',
                  stats.teamUtilization > 100 ? 'text-red-hot' :
                  stats.teamUtilization > 85 ? 'text-yellow-electric' :
                  'text-white-full'
                )}>
                  {stats.teamUtilization}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-accent/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-accent" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Overallocated */}
        <Link href="/capacity">
          <Card
            className={cn(
              'p-4 hover:border-orange-accent transition-all',
              stats.overallocatedMembers > 0 && 'border-red-hot'
            )}
            hoverable={false}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-dim text-xs uppercase tracking-wide">Overallocated</p>
                <p className={cn(
                  'text-3xl font-bold mt-1',
                  stats.overallocatedMembers > 0 ? 'text-red-hot' : 'text-white-full'
                )}>
                  {stats.overallocatedMembers}
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 flex items-center justify-center',
                stats.overallocatedMembers > 0 ? 'bg-red-hot/20' : 'bg-orange-accent/20'
              )}>
                <Users className={cn(
                  'w-6 h-6',
                  stats.overallocatedMembers > 0 ? 'text-red-hot' : 'text-orange-accent'
                )} />
              </div>
            </div>
          </Card>
        </Link>

        {/* Overdue Items */}
        <Card
          className={cn(
            'p-4',
            stats.overdueItems > 0 && 'border-yellow-electric'
          )}
          hoverable={false}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white-dim text-xs uppercase tracking-wide">Overdue Items</p>
              <p className={cn(
                'text-3xl font-bold mt-1',
                stats.overdueItems > 0 ? 'text-yellow-electric' : 'text-white-full'
              )}>
                {stats.overdueItems}
              </p>
            </div>
            <div className={cn(
              'w-12 h-12 flex items-center justify-center',
              stats.overdueItems > 0 ? 'bg-yellow-electric/20' : 'bg-orange-accent/20'
            )}>
              <AlertTriangle className={cn(
                'w-6 h-6',
                stats.overdueItems > 0 ? 'text-yellow-electric' : 'text-orange-accent'
              )} />
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Projects */}
        <Card className="p-4" hoverable={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white-full font-bold uppercase flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-orange-accent" />
              Upcoming Deadlines
            </h2>
            <Link href="/projects" className="text-orange-accent text-xs uppercase hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingProjects.length > 0 ? (
            <div className="space-y-2">
              {upcomingProjects.map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3 border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white-full font-medium">{project.name}</p>
                      <p className="text-white-dim text-xs">{project.client || 'No client'}</p>
                    </div>
                    {project.deadline && (
                      <span className={cn(
                        'text-xs font-bold px-2 py-1',
                        isOverdue(project.deadline)
                          ? 'bg-red-hot text-white'
                          : 'bg-border-subtle text-white-dim'
                      )}>
                        {formatDate(project.deadline)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white-muted text-sm text-center py-4">No upcoming deadlines</p>
          )}
        </Card>

        {/* Upcoming Milestones */}
        <Card className="p-4" hoverable={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white-full font-bold uppercase flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-accent" />
              This Week&apos;s Milestones
            </h2>
          </div>

          {upcomingMilestones.length > 0 ? (
            <div className="space-y-2">
              {upcomingMilestones.map(milestone => (
                <Link
                  key={milestone.id}
                  href={milestone.project ? `/projects/${milestone.project.id}` : '#'}
                  className="block p-3 border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white-full font-medium">{milestone.name}</p>
                      <p className="text-white-dim text-xs">
                        {milestone.project?.name || 'Unknown project'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-border-subtle text-white-dim">
                        {milestone.type}
                      </span>
                      <span className="text-xs text-orange-accent font-bold">
                        {formatDate(milestone.date)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white-muted text-sm text-center py-4">No milestones this week</p>
          )}
        </Card>

        {/* Pending Deliverables */}
        <Card className="p-4" hoverable={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white-full font-bold uppercase flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-accent" />
              In Progress
            </h2>
          </div>

          {pendingDeliverables.length > 0 ? (
            <div className="space-y-2">
              {pendingDeliverables.map(deliverable => (
                <Link
                  key={deliverable.id}
                  href={deliverable.project ? `/projects/${deliverable.project.id}` : '#'}
                  className="block p-3 border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white-full font-medium">{deliverable.name}</p>
                      <p className="text-white-dim text-xs">
                        {deliverable.project?.name || 'Unknown project'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] uppercase font-bold px-1.5 py-0.5',
                        deliverable.status === 'review'
                          ? 'bg-yellow-electric/20 text-yellow-electric'
                          : 'bg-blue-400/20 text-blue-400'
                      )}>
                        {deliverable.status === 'in_progress' ? 'In Progress' : 'Review'}
                      </span>
                      {deliverable.due_date && (
                        <span className={cn(
                          'text-xs font-bold',
                          isOverdue(deliverable.due_date) ? 'text-red-hot' : 'text-white-dim'
                        )}>
                          {formatDate(deliverable.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white-muted text-sm text-center py-4">No items in progress</p>
          )}
        </Card>

        {/* Recent Transcripts */}
        <Card className="p-4" hoverable={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white-full font-bold uppercase flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-accent" />
              Recent Uploads
            </h2>
            <Link href="/transcripts" className="text-orange-accent text-xs uppercase hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTranscripts.length > 0 ? (
            <div className="space-y-2">
              {recentTranscripts.map(transcript => (
                <Link
                  key={transcript.id}
                  href={`/review/${transcript.id}`}
                  className="block p-3 border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white-full font-medium capitalize">
                        {transcript.meeting_type} Meeting
                      </p>
                      <p className="text-white-dim text-xs">
                        {formatDate(transcript.meeting_date)}
                      </p>
                    </div>
                    {transcript.extraction_confidence && (
                      <span className={cn(
                        'text-xs font-bold px-2 py-1',
                        transcript.extraction_confidence >= 0.8
                          ? 'bg-orange-accent/20 text-orange-accent'
                          : transcript.extraction_confidence >= 0.5
                            ? 'bg-yellow-electric/20 text-yellow-electric'
                            : 'bg-red-hot/20 text-red-hot'
                      )}>
                        {Math.round(transcript.extraction_confidence * 100)}%
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white-muted text-sm mb-3">No transcripts yet</p>
              <Link href="/upload">
                <Button size="sm" variant="ghost">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Transcript
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-4 border-orange-accent/30" hoverable={false}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-accent/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-accent" />
          </div>
          <div>
            <h3 className="text-white-full font-bold uppercase text-sm">Quick Start</h3>
            <p className="text-white-muted text-sm mt-1">
              Upload a WIP meeting transcript to automatically extract projects, assignments, and capacity signals.
              The AI will match team members based on their skills and availability.
            </p>
            <div className="flex gap-3 mt-3">
              <Link href="/upload">
                <Button size="sm">Upload Transcript</Button>
              </Link>
              <Link href="/team">
                <Button size="sm" variant="ghost">Manage Team</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
