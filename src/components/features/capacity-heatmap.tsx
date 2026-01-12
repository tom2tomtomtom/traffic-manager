import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TeamMemberCapacity {
  id: string
  full_name: string
  role: string
  weekly_capacity_hours: number
  allocated_hours: number
  available_hours: number
  utilization_pct: number
  overallocated: boolean
}

interface CapacityHeatmapProps {
  teamMembers: TeamMemberCapacity[]
}

export function CapacityHeatmap({ teamMembers }: CapacityHeatmapProps) {
  const getUtilizationColor = (pct: number, overallocated: boolean): string => {
    if (overallocated) return 'border-red-hot'
    if (pct >= 90) return 'border-yellow-electric'
    if (pct >= 70) return 'border-orange-accent'
    return 'border-border-subtle'
  }

  const getBarColor = (overallocated: boolean): string => {
    return overallocated ? 'bg-red-hot' : 'bg-orange-accent'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teamMembers.map((member) => (
        <Card
          key={member.id}
          variant={member.overallocated ? 'danger' : 'default'}
          hoverable={false}
          className={cn(
            'relative',
            getUtilizationColor(member.utilization_pct, member.overallocated)
          )}
        >
          {/* Utilization visual bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black-deep">
            <div
              className={cn(
                'h-full transition-all',
                getBarColor(member.overallocated)
              )}
              style={{ width: `${Math.min(member.utilization_pct, 100)}%` }}
            />
          </div>

          <div className="pt-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white-full font-bold">{member.full_name}</h3>
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

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white-muted">Allocated</span>
                <span className="text-white-full font-bold">
                  {member.allocated_hours}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-muted">Capacity</span>
                <span className="text-white-full font-bold">
                  {member.weekly_capacity_hours}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-muted">Available</span>
                <span
                  className={cn(
                    'font-bold',
                    member.available_hours < 0
                      ? 'text-red-hot'
                      : 'text-orange-accent'
                  )}
                >
                  {member.available_hours}h
                </span>
              </div>
            </div>

            {/* Overallocation warning */}
            {member.overallocated && (
              <div className="mt-4 pt-4 border-t border-red-hot">
                <p className="text-red-hot text-xs uppercase font-bold">
                  OVERALLOCATED
                </p>
                <p className="text-white-muted text-xs mt-1">
                  Reduce by {Math.abs(member.available_hours)}h to reach capacity
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
