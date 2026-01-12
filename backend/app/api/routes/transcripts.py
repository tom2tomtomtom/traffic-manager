"""
Transcript processing API routes.
"""

from datetime import date
from fastapi import APIRouter, HTTPException

from app.db.supabase_client import get_client
from app.models.schemas import (
    TranscriptProcessRequest,
    TranscriptProcessResponse,
)
from app.services.claude_extractor import extract_from_transcript

router = APIRouter()


@router.post("/process", response_model=TranscriptProcessResponse)
async def process_transcript(request: TranscriptProcessRequest):
    """
    Process a meeting transcript with AI extraction.

    This endpoint:
    1. Stores the raw transcript
    2. Sends to Claude for structured extraction
    3. Returns extracted data with confidence scores
    """
    client = get_client()

    # Default meeting date to today if not provided
    meeting_date = request.meeting_date or date.today()

    try:
        # Extract structured data using Claude
        extracted_data = await extract_from_transcript(
            transcript_text=request.transcript_text,
            meeting_date=meeting_date.isoformat(),
            meeting_type=request.meeting_type,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract data from transcript: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {str(e)}",
        )

    # Store transcript with extracted data
    transcript_data = {
        "meeting_date": meeting_date.isoformat(),
        "meeting_type": request.meeting_type,
        "raw_text": request.transcript_text,
        "extracted_data": extracted_data.model_dump(),
        "extraction_model": "claude-sonnet-4-20250514",
        "extraction_confidence": extracted_data.overall_confidence,
        "processed_at": "now()",
    }

    result = client.table("transcripts").insert(transcript_data).execute()

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to store transcript",
        )

    transcript = result.data[0]

    # TODO: Resolve entity names to database IDs
    # This would fuzzy-match person_name -> team_member_id
    # and project_name -> project_id
    unresolved_entities = {
        "people": [
            a.person_name
            for a in extracted_data.assignments
            # TODO: Check if name exists in team_members
        ],
        "projects": [
            p.name
            for p in extracted_data.projects
            # TODO: Check if project exists in projects
        ],
    }

    return TranscriptProcessResponse(
        transcript_id=transcript["id"],
        meeting_date=meeting_date,
        meeting_type=request.meeting_type,
        extraction_confidence=extracted_data.overall_confidence,
        extracted_data=extracted_data,
        unresolved_entities=unresolved_entities,
    )


@router.get("/{transcript_id}")
async def get_transcript(transcript_id: str):
    """Get a transcript by ID with its extracted data."""
    client = get_client()

    result = (
        client.table("transcripts")
        .select("*")
        .eq("id", transcript_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Transcript not found")

    return result.data


@router.get("/")
async def list_transcripts(limit: int = 10, offset: int = 0):
    """List recent transcripts."""
    client = get_client()

    result = (
        client.table("transcripts")
        .select("id, meeting_date, meeting_type, extraction_confidence, processed_at, approved")
        .order("meeting_date", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {"transcripts": result.data, "total": len(result.data)}


@router.post("/{transcript_id}/approve")
async def approve_transcript(transcript_id: str):
    """Mark a transcript as approved."""
    client = get_client()

    result = (
        client.table("transcripts")
        .update({"approved": True, "approved_at": "now()"})
        .eq("id", transcript_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Transcript not found")

    return {"status": "approved", "transcript_id": transcript_id}
