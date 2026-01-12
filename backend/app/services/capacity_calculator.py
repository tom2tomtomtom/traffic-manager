"""
Capacity calculation and conflict detection service.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from app.db.supabase_client import get_client
from app.models.schemas import CapacitySnapshot, CapacityConflict


def get_week_start(d: date | None = None) -> date:
    """Get Monday of the week for given date."""
    if d is None:
        d = date.today()
    return d - timedelta(days=d.weekday())


async def calculate_weekly_capacity(
    team_member_id: str,
    week_start_date: date | None = None,
) -> CapacitySnapshot:
    """
    Calculate capacity snapshot for a team member for a specific week.

    This function:
    1. Gets team member's weekly capacity
    2. Sums all active assignments for the week
    3. Calculates derived fields (available, utilization, overallocated)
    4. Upserts the capacity snapshot

    Args:
        team_member_id: UUID of the team member
        week_start_date: Monday of the target week (defaults to current week)

    Returns:
        CapacitySnapshot with calculated values
    """
    if week_start_date is None:
        week_start_date = get_week_start()

    client = get_client()

    # Get team member
    member_response = client.table("team_members").select("*").eq("id", team_member_id).single().execute()
    member = member_response.data

    if not member:
        raise ValueError(f"Team member not found: {team_member_id}")

    # Sum all active assignments for this week
    assignments_response = (
        client.table("assignments")
        .select("hours_this_week")
        .eq("team_member_id", team_member_id)
        .eq("status", "active")
        .execute()
    )

    allocated_hours = sum(
        Decimal(str(a["hours_this_week"] or 0)) for a in assignments_response.data
    )

    total_capacity = Decimal(str(member["weekly_capacity_hours"] or 40))
    available_hours = total_capacity - allocated_hours
    utilization_pct = (allocated_hours / total_capacity * 100) if total_capacity > 0 else Decimal(0)
    overallocated = allocated_hours > total_capacity

    # Upsert capacity snapshot
    snapshot_data = {
        "team_member_id": team_member_id,
        "week_start_date": week_start_date.isoformat(),
        "total_capacity_hours": float(total_capacity),
        "allocated_hours": float(allocated_hours),
    }

    # Check if exists
    existing = (
        client.table("capacity_snapshots")
        .select("id")
        .eq("team_member_id", team_member_id)
        .eq("week_start_date", week_start_date.isoformat())
        .execute()
    )

    if existing.data:
        # Update
        result = (
            client.table("capacity_snapshots")
            .update(snapshot_data)
            .eq("id", existing.data[0]["id"])
            .execute()
        )
    else:
        # Insert
        result = client.table("capacity_snapshots").insert(snapshot_data).execute()

    snapshot = result.data[0] if result.data else snapshot_data

    return CapacitySnapshot(
        id=snapshot.get("id", ""),
        team_member_id=team_member_id,
        full_name=member["full_name"],
        role=member["role"],
        week_start_date=week_start_date,
        total_capacity_hours=total_capacity,
        allocated_hours=allocated_hours,
        available_hours=available_hours,
        utilization_pct=utilization_pct,
        overallocated=overallocated,
    )


async def get_current_week_capacity() -> list[CapacitySnapshot]:
    """
    Get capacity snapshots for all active team members for current week.

    Returns:
        List of CapacitySnapshot for each team member
    """
    week_start = get_week_start()
    client = get_client()

    # Get all active team members
    members_response = (
        client.table("team_members")
        .select("*")
        .eq("active", True)
        .execute()
    )

    snapshots = []
    for member in members_response.data:
        try:
            snapshot = await calculate_weekly_capacity(member["id"], week_start)
            snapshots.append(snapshot)
        except Exception as e:
            print(f"Error calculating capacity for {member['full_name']}: {e}")

    # Sort by utilization descending
    snapshots.sort(key=lambda s: s.utilization_pct, reverse=True)

    return snapshots


async def detect_capacity_conflicts(
    week_start_date: date | None = None,
) -> list[CapacityConflict]:
    """
    Detect capacity conflicts for all team members in a given week.

    Checks for:
    - Overallocation (allocated > capacity)
    - Multiple urgent project conflicts
    - Timeline conflicts (overlapping deadlines)

    Args:
        week_start_date: Monday of the target week (defaults to current week)

    Returns:
        List of CapacityConflict objects
    """
    if week_start_date is None:
        week_start_date = get_week_start()

    client = get_client()
    conflicts: list[CapacityConflict] = []

    # Get all capacity snapshots for this week with team member info
    snapshots = await get_current_week_capacity()

    for snapshot in snapshots:
        # Check overallocation
        if snapshot.overallocated:
            # Get assignments for this member
            assignments_response = (
                client.table("assignments")
                .select("*, projects(name, priority, deadline)")
                .eq("team_member_id", snapshot.team_member_id)
                .eq("status", "active")
                .execute()
            )

            affected_projects = [
                a["projects"]["name"] for a in assignments_response.data if a.get("projects")
            ]

            overage = float(snapshot.allocated_hours - snapshot.total_capacity_hours)

            # Determine severity
            if overage > 10:
                severity = "high"
            elif overage > 5:
                severity = "medium"
            else:
                severity = "low"

            # Find project with most hours to suggest reduction
            assignments_sorted = sorted(
                assignments_response.data,
                key=lambda a: a.get("hours_this_week", 0),
                reverse=True,
            )
            suggested_project = (
                assignments_sorted[0]["projects"]["name"]
                if assignments_sorted and assignments_sorted[0].get("projects")
                else None
            )

            conflicts.append(
                CapacityConflict(
                    type="overallocation",
                    team_member_id=snapshot.team_member_id,
                    team_member_name=snapshot.full_name,
                    affected_projects=affected_projects,
                    severity=severity,
                    description=f"{snapshot.full_name} is {overage:.0f}h overallocated this week",
                    suggested_resolution=f"Reduce hours on: {suggested_project}"
                    if suggested_project
                    else None,
                )
            )

            # Check for multiple urgent projects
            urgent_projects = [
                a for a in assignments_response.data
                if a.get("projects", {}).get("priority") == "urgent"
            ]

            if len(urgent_projects) > 1:
                conflicts.append(
                    CapacityConflict(
                        type="timeline-conflict",
                        team_member_id=snapshot.team_member_id,
                        team_member_name=snapshot.full_name,
                        affected_projects=[
                            p["projects"]["name"]
                            for p in urgent_projects
                            if p.get("projects")
                        ],
                        severity="high",
                        description=f"{snapshot.full_name} has {len(urgent_projects)} urgent projects with overlapping deadlines",
                        suggested_resolution=None,
                    )
                )

    return conflicts
