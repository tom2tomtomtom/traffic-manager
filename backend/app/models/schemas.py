"""
Pydantic schemas for request/response validation.
"""

from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Literal


# ============================================================================
# Extraction Schemas (AI Output)
# ============================================================================


class ProjectExtraction(BaseModel):
    """Extracted project information from transcript."""

    name: str
    client: str | None = None
    status: Literal["briefing", "active", "on-hold"] = "active"
    phase: str | None = None
    next_milestone: str | None = None
    next_milestone_timeframe: str | None = None
    context: str  # Original quote from transcript
    confidence: float = Field(ge=0, le=1)


class AssignmentExtraction(BaseModel):
    """Extracted assignment information from transcript."""

    person_name: str
    project_name: str
    role_inferred: str | None = None
    assignment_type: Literal["explicit", "implicit", "inferred"]
    workload_signal: Literal["light", "medium", "heavy", "overloaded"] | None = None
    context: str  # Original quote from transcript
    confidence: float = Field(ge=0, le=1)


class CapacitySignal(BaseModel):
    """Extracted capacity signal from transcript."""

    person_name: str
    signal_type: Literal["overallocated", "available", "blocked", "time-constraint"]
    description: str
    timeframe: str | None = None
    context: str  # Original quote from transcript
    confidence: float = Field(ge=0, le=1)


class DeadlineExtraction(BaseModel):
    """Extracted deadline information from transcript."""

    project_name: str
    milestone: str
    deadline_text: str
    deadline_date_inferred: date | None = None
    confidence: float = Field(ge=0, le=1)


class TranscriptExtractionSchema(BaseModel):
    """Complete extraction result from Claude."""

    meeting_metadata: dict = {}
    projects: list[ProjectExtraction] = []
    assignments: list[AssignmentExtraction] = []
    capacity_signals: list[CapacitySignal] = []
    deadlines: list[DeadlineExtraction] = []
    overall_confidence: float = Field(ge=0, le=1, default=0.0)
    extraction_notes: str | None = None


# ============================================================================
# Request Schemas
# ============================================================================


class TranscriptProcessRequest(BaseModel):
    """Request body for transcript processing."""

    transcript_text: str = Field(min_length=50)
    meeting_date: date | None = None
    meeting_type: Literal["wip", "planning", "client-debrief"] = "wip"


class AssignmentCreateRequest(BaseModel):
    """Request body for creating an assignment."""

    project_id: str
    team_member_id: str
    role_on_project: str
    estimated_hours: Decimal = Field(ge=0)
    hours_this_week: Decimal = Field(ge=0, default=0)
    confidence_score: float | None = Field(ge=0, le=1, default=None)
    notes: str | None = None


class AssignmentBulkCreateRequest(BaseModel):
    """Request body for bulk assignment creation."""

    assignments: list[AssignmentCreateRequest]


class AssignmentUpdateRequest(BaseModel):
    """Request body for updating an assignment."""

    hours_this_week: Decimal | None = Field(ge=0, default=None)
    estimated_hours: Decimal | None = Field(ge=0, default=None)
    status: Literal["active", "paused", "completed"] | None = None
    notes: str | None = None


# ============================================================================
# Response Schemas
# ============================================================================


class TranscriptProcessResponse(BaseModel):
    """Response body for transcript processing."""

    transcript_id: str
    meeting_date: date
    meeting_type: str
    extraction_confidence: float
    extracted_data: TranscriptExtractionSchema
    unresolved_entities: dict = {}  # Names that couldn't be matched


class CapacitySnapshot(BaseModel):
    """Capacity snapshot for a team member."""

    id: str
    team_member_id: str
    full_name: str
    role: str
    week_start_date: date
    total_capacity_hours: Decimal
    allocated_hours: Decimal
    available_hours: Decimal
    utilization_pct: Decimal
    overallocated: bool


class CapacityConflict(BaseModel):
    """Detected capacity conflict."""

    type: Literal["overallocation", "timeline-conflict", "skill-mismatch"]
    team_member_id: str
    team_member_name: str
    affected_projects: list[str]
    severity: Literal["low", "medium", "high"]
    description: str
    suggested_resolution: str | None = None


class AssignmentResponse(BaseModel):
    """Response body for assignment operations."""

    id: str
    project_id: str
    project_name: str
    team_member_id: str
    team_member_name: str
    role_on_project: str
    estimated_hours: Decimal
    hours_this_week: Decimal
    hours_consumed: Decimal
    status: str
    confidence_score: float | None


class AssignmentBulkCreateResponse(BaseModel):
    """Response body for bulk assignment creation."""

    created: list[AssignmentResponse]
    conflicts: list[CapacityConflict]
