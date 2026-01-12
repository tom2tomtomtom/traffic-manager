"""
Capacity management API routes.
"""

from datetime import date, timedelta
from fastapi import APIRouter

from app.models.schemas import CapacitySnapshot, CapacityConflict
from app.services.capacity_calculator import (
    get_current_week_capacity,
    detect_capacity_conflicts,
    get_week_start,
    calculate_weekly_capacity,
)
from app.db.supabase_client import get_client

router = APIRouter()


@router.get("/current-week", response_model=list[CapacitySnapshot])
async def get_current_week():
    """Get capacity overview for all team members for the current week."""
    return await get_current_week_capacity()


@router.get("/conflicts", response_model=list[CapacityConflict])
async def get_conflicts():
    """Get all capacity conflicts for the current week."""
    return await detect_capacity_conflicts()


@router.get("/forecast")
async def get_capacity_forecast(weeks: int = 4):
    """
    Get capacity forecast for the next N weeks.

    Returns projected capacity based on current assignments.
    """
    client = get_client()
    current_week = get_week_start()

    # Get all active team members
    members_response = (
        client.table("team_members").select("*").eq("active", True).execute()
    )

    forecast = []

    for week_offset in range(weeks):
        week_start = current_week + timedelta(weeks=week_offset)
        week_data = {
            "week_start": week_start.isoformat(),
            "week_number": week_start.isocalendar()[1],
            "members": [],
        }

        for member in members_response.data:
            # Get assignments that overlap with this week
            # For simplicity, we're using current hours_this_week
            # In production, you'd track week-specific allocations
            assignments_response = (
                client.table("assignments")
                .select("hours_this_week, projects(name)")
                .eq("team_member_id", member["id"])
                .eq("status", "active")
                .execute()
            )

            allocated = sum(a["hours_this_week"] or 0 for a in assignments_response.data)
            capacity = member["weekly_capacity_hours"] or 40

            week_data["members"].append(
                {
                    "team_member_id": member["id"],
                    "full_name": member["full_name"],
                    "role": member["role"],
                    "capacity": capacity,
                    "allocated": allocated,
                    "available": capacity - allocated,
                    "utilization_pct": round((allocated / capacity * 100) if capacity else 0, 1),
                    "overallocated": allocated > capacity,
                }
            )

        # Sort by utilization
        week_data["members"].sort(key=lambda m: m["utilization_pct"], reverse=True)
        forecast.append(week_data)

    return {"forecast": forecast, "weeks": weeks}


@router.get("/team-member/{team_member_id}", response_model=CapacitySnapshot)
async def get_team_member_capacity(team_member_id: str):
    """Get capacity for a specific team member for the current week."""
    return await calculate_weekly_capacity(team_member_id)


@router.get("/summary")
async def get_capacity_summary():
    """
    Get a summary of team capacity metrics.

    Returns aggregate stats for the current week.
    """
    snapshots = await get_current_week_capacity()
    conflicts = await detect_capacity_conflicts()

    if not snapshots:
        return {
            "total_team_members": 0,
            "total_capacity_hours": 0,
            "total_allocated_hours": 0,
            "total_available_hours": 0,
            "average_utilization": 0,
            "overallocated_count": 0,
            "conflict_count": 0,
            "week_start": get_week_start().isoformat(),
        }

    total_capacity = sum(float(s.total_capacity_hours) for s in snapshots)
    total_allocated = sum(float(s.allocated_hours) for s in snapshots)
    overallocated_count = sum(1 for s in snapshots if s.overallocated)

    return {
        "total_team_members": len(snapshots),
        "total_capacity_hours": total_capacity,
        "total_allocated_hours": total_allocated,
        "total_available_hours": total_capacity - total_allocated,
        "average_utilization": round(
            (total_allocated / total_capacity * 100) if total_capacity else 0, 1
        ),
        "overallocated_count": overallocated_count,
        "conflict_count": len(conflicts),
        "week_start": get_week_start().isoformat(),
    }


@router.post("/recalculate")
async def recalculate_all_capacity():
    """
    Recalculate capacity snapshots for all team members.

    Use this endpoint after bulk changes or to fix data inconsistencies.
    """
    client = get_client()

    # Get all active team members
    members_response = (
        client.table("team_members").select("id, full_name").eq("active", True).execute()
    )

    recalculated = []
    errors = []

    for member in members_response.data:
        try:
            snapshot = await calculate_weekly_capacity(member["id"])
            recalculated.append(
                {
                    "team_member_id": member["id"],
                    "full_name": member["full_name"],
                    "allocated_hours": float(snapshot.allocated_hours),
                    "utilization_pct": float(snapshot.utilization_pct),
                }
            )
        except Exception as e:
            errors.append(
                {
                    "team_member_id": member["id"],
                    "full_name": member["full_name"],
                    "error": str(e),
                }
            )

    return {
        "recalculated": recalculated,
        "errors": errors,
        "total": len(recalculated),
    }
