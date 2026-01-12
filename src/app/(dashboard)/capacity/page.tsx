import { PageHeader } from '@/components/layouts/page-header'
import { CapacityHeatmap } from '@/components/features/capacity-heatmap'
import { createClient } from '@/lib/supabase/server'

export default async function CapacityPage() {
  const supabase = await createClient()

  // Fetch current week capacity from the view
  const { data: teamCapacity, error } = await supabase
    .from('current_week_capacity')
    .select('*')

  if (error) {
    console.error('Error fetching capacity:', error)
  }

  // Transform data for the component
  const capacityData = (teamCapacity || []).map((member) => ({
    id: member.id,
    full_name: member.full_name,
    role: member.role,
    weekly_capacity_hours: member.weekly_capacity_hours || 40,
    allocated_hours: member.allocated_hours || 0,
    available_hours: member.available_hours || member.weekly_capacity_hours || 40,
    utilization_pct: member.utilization_pct || 0,
    overallocated: member.overallocated || false,
  }))

  // Check for overallocated team members
  const overallocatedMembers = capacityData.filter((m) => m.overallocated)

  return (
    <div>
      <PageHeader
        title="Team Capacity"
        description="View current week capacity allocation across the team."
      />

      {/* Overallocation warning */}
      {overallocatedMembers.length > 0 && (
        <div className="mt-6 bg-black-card border-2 border-red-hot p-4">
          <p className="text-red-hot font-bold uppercase text-sm">
            Capacity Conflicts Detected
          </p>
          <p className="text-white-muted text-sm mt-2">
            {overallocatedMembers.length} team member
            {overallocatedMembers.length > 1 ? 's are' : ' is'} overallocated
            this week:
          </p>
          <ul className="mt-2 space-y-1">
            {overallocatedMembers.map((m) => (
              <li key={m.id} className="text-white-full text-sm">
                <span className="text-orange-accent">{m.full_name}</span>:{' '}
                {m.allocated_hours}h allocated / {m.weekly_capacity_hours}h
                capacity
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Capacity heatmap */}
      <div className="mt-8">
        {capacityData.length > 0 ? (
          <CapacityHeatmap teamMembers={capacityData} />
        ) : (
          <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
            <p className="text-white-muted">
              No team members found. Add team members to see capacity.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
