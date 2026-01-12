"""
Assignment management API routes.
"""

from fastapi import APIRouter, HTTPException

from app.db.supabase_client import get_client
from app.models.schemas import (
    AssignmentCreateRequest,
    AssignmentBulkCreateRequest,
    AssignmentUpdateRequest,
    AssignmentResponse,
    AssignmentBulkCreateResponse,
)
from app.services.capacity_calculator import (
    calculate_weekly_capacity,
    detect_capacity_conflicts,
)

router = APIRouter()


@router.post("/", response_model=AssignmentResponse)
async def create_assignment(request: AssignmentCreateRequest):
    """Create a new assignment."""
    client = get_client()

    # Verify project exists
    project = (
        client.table("projects")
        .select("id, name")
        .eq("id", request.project_id)
        .single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify team member exists
    member = (
        client.table("team_members")
        .select("id, full_name")
        .eq("id", request.team_member_id)
        .single()
        .execute()
    )
    if not member.data:
        raise HTTPException(status_code=404, detail="Team member not found")

    # Create assignment
    assignment_data = {
        "project_id": request.project_id,
        "team_member_id": request.team_member_id,
        "role_on_project": request.role_on_project,
        "estimated_hours": float(request.estimated_hours),
        "hours_this_week": float(request.hours_this_week),
        "confidence_score": request.confidence_score,
        "notes": request.notes,
        "assigned_by": "manual",
        "status": "active",
    }

    result = client.table("assignments").insert(assignment_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create assignment")

    assignment = result.data[0]

    # Recalculate capacity (handled by database trigger, but we can also do it here)
    await calculate_weekly_capacity(request.team_member_id)

    return AssignmentResponse(
        id=assignment["id"],
        project_id=assignment["project_id"],
        project_name=project.data["name"],
        team_member_id=assignment["team_member_id"],
        team_member_name=member.data["full_name"],
        role_on_project=assignment["role_on_project"],
        estimated_hours=assignment["estimated_hours"],
        hours_this_week=assignment["hours_this_week"],
        hours_consumed=assignment["hours_consumed"],
        status=assignment["status"],
        confidence_score=assignment["confidence_score"],
    )


@router.post("/bulk", response_model=AssignmentBulkCreateResponse)
async def bulk_create_assignments(request: AssignmentBulkCreateRequest):
    """Create multiple assignments at once and report any conflicts."""
    client = get_client()
    created_assignments: list[AssignmentResponse] = []

    # Create each assignment
    for req in request.assignments:
        try:
            # Get project and member info
            project = (
                client.table("projects")
                .select("id, name")
                .eq("id", req.project_id)
                .single()
                .execute()
            )
            member = (
                client.table("team_members")
                .select("id, full_name")
                .eq("id", req.team_member_id)
                .single()
                .execute()
            )

            if not project.data or not member.data:
                continue

            assignment_data = {
                "project_id": req.project_id,
                "team_member_id": req.team_member_id,
                "role_on_project": req.role_on_project,
                "estimated_hours": float(req.estimated_hours),
                "hours_this_week": float(req.hours_this_week),
                "confidence_score": req.confidence_score,
                "notes": req.notes,
                "assigned_by": "ai",
                "status": "active",
            }

            result = client.table("assignments").insert(assignment_data).execute()

            if result.data:
                assignment = result.data[0]
                created_assignments.append(
                    AssignmentResponse(
                        id=assignment["id"],
                        project_id=assignment["project_id"],
                        project_name=project.data["name"],
                        team_member_id=assignment["team_member_id"],
                        team_member_name=member.data["full_name"],
                        role_on_project=assignment["role_on_project"],
                        estimated_hours=assignment["estimated_hours"],
                        hours_this_week=assignment["hours_this_week"],
                        hours_consumed=assignment["hours_consumed"],
                        status=assignment["status"],
                        confidence_score=assignment["confidence_score"],
                    )
                )
        except Exception as e:
            print(f"Error creating assignment: {e}")
            continue

    # Detect any conflicts created by these assignments
    conflicts = await detect_capacity_conflicts()

    return AssignmentBulkCreateResponse(
        created=created_assignments,
        conflicts=conflicts,
    )


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(assignment_id: str):
    """Get an assignment by ID."""
    client = get_client()

    result = (
        client.table("assignments")
        .select("*, projects(name), team_members(full_name)")
        .eq("id", assignment_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment = result.data

    return AssignmentResponse(
        id=assignment["id"],
        project_id=assignment["project_id"],
        project_name=assignment["projects"]["name"],
        team_member_id=assignment["team_member_id"],
        team_member_name=assignment["team_members"]["full_name"],
        role_on_project=assignment["role_on_project"],
        estimated_hours=assignment["estimated_hours"],
        hours_this_week=assignment["hours_this_week"],
        hours_consumed=assignment["hours_consumed"],
        status=assignment["status"],
        confidence_score=assignment["confidence_score"],
    )


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(assignment_id: str, request: AssignmentUpdateRequest):
    """Update an assignment's hours or status."""
    client = get_client()

    # Build update data
    update_data = {}
    if request.hours_this_week is not None:
        update_data["hours_this_week"] = float(request.hours_this_week)
    if request.estimated_hours is not None:
        update_data["estimated_hours"] = float(request.estimated_hours)
    if request.status is not None:
        update_data["status"] = request.status
    if request.notes is not None:
        update_data["notes"] = request.notes

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        client.table("assignments")
        .update(update_data)
        .eq("id", assignment_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Get full assignment data
    return await get_assignment(assignment_id)


@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str):
    """Delete an assignment."""
    client = get_client()

    # Get assignment first to get team_member_id
    existing = (
        client.table("assignments")
        .select("team_member_id")
        .eq("id", assignment_id)
        .single()
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    team_member_id = existing.data["team_member_id"]

    # Delete the assignment
    client.table("assignments").delete().eq("id", assignment_id).execute()

    # Recalculate capacity
    await calculate_weekly_capacity(team_member_id)

    return {"status": "deleted", "assignment_id": assignment_id}


@router.get("/")
async def list_assignments(
    team_member_id: str | None = None,
    project_id: str | None = None,
    status: str = "active",
):
    """List assignments with optional filters."""
    client = get_client()

    query = client.table("assignments").select(
        "*, projects(name), team_members(full_name)"
    )

    if team_member_id:
        query = query.eq("team_member_id", team_member_id)
    if project_id:
        query = query.eq("project_id", project_id)
    if status:
        query = query.eq("status", status)

    result = query.execute()

    return {
        "assignments": [
            {
                "id": a["id"],
                "project_id": a["project_id"],
                "project_name": a["projects"]["name"] if a.get("projects") else None,
                "team_member_id": a["team_member_id"],
                "team_member_name": a["team_members"]["full_name"]
                if a.get("team_members")
                else None,
                "role_on_project": a["role_on_project"],
                "estimated_hours": a["estimated_hours"],
                "hours_this_week": a["hours_this_week"],
                "hours_consumed": a["hours_consumed"],
                "status": a["status"],
                "confidence_score": a["confidence_score"],
            }
            for a in result.data
        ]
    }
