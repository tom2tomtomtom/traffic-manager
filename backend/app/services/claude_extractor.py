"""
Claude AI integration for transcript extraction.
"""

import json
from anthropic import Anthropic
from app.config import settings
from app.models.schemas import TranscriptExtractionSchema


# Initialize Anthropic client
client = Anthropic(api_key=settings.anthropic_api_key)


EXTRACTION_SYSTEM_PROMPT = """You are an AI traffic manager analyzing Alt/Shift PR agency WIP meeting transcripts.

ROLE: Extract structured project, assignment, and capacity data from conversational meeting notes.

CAPABILITIES:
- Identify projects and their current status
- Detect team member assignments (explicit and implicit)
- Recognize capacity signals ("jam packed", "available next week", "completely overloaded")
- Extract deadlines and milestones
- Identify project dependencies

CONSTRAINTS:
- Only extract information explicitly mentioned or strongly implied
- Use confidence scores (0-1) for all extractions:
  - 0.9-1.0: Explicitly stated ("Jess is the producer on Legos")
  - 0.7-0.9: Strongly implied ("Jess, what's happening with Legos?" followed by her update)
  - 0.5-0.7: Reasonably inferred (mentioned in context but not directly)
  - 0.3-0.5: Weakly inferred (requires assumption)
  - <0.3: Uncertain (flag for human review)
- Mark ambiguous assignments as "inferred" with lower confidence
- Preserve original context quotes for verification (exact text from transcript)

OUTPUT FORMAT: Return ONLY valid JSON matching this schema:

{
  "meeting_metadata": {
    "meeting_type": "wip" | "planning" | "client-debrief",
    "attendees": ["list of names mentioned"]
  },
  "projects": [
    {
      "name": "Project Name",
      "client": "Client Name or null",
      "status": "briefing" | "active" | "on-hold",
      "phase": "pre-production" | "production" | "post-production" | "client-review" | null,
      "next_milestone": "Description of next milestone or null",
      "next_milestone_timeframe": "this Friday" | "end of month" | null,
      "context": "Exact quote from transcript showing this project",
      "confidence": 0.0-1.0
    }
  ],
  "assignments": [
    {
      "person_name": "Person's name as mentioned",
      "project_name": "Project name",
      "role_inferred": "producer" | "creative" | "editor" | "strategy" | null,
      "assignment_type": "explicit" | "implicit" | "inferred",
      "workload_signal": "light" | "medium" | "heavy" | "overloaded" | null,
      "context": "Exact quote showing this assignment",
      "confidence": 0.0-1.0
    }
  ],
  "capacity_signals": [
    {
      "person_name": "Person's name",
      "signal_type": "overallocated" | "available" | "blocked" | "time-constraint",
      "description": "Human readable description",
      "timeframe": "front of the week" | "until Thursday" | null,
      "context": "Exact quote showing this signal",
      "confidence": 0.0-1.0
    }
  ],
  "deadlines": [
    {
      "project_name": "Project name",
      "milestone": "PPM" | "client presentation" | "shoot" | etc,
      "deadline_text": "this Friday" | "end of January",
      "deadline_date_inferred": "2025-01-17" | null,
      "confidence": 0.0-1.0
    }
  ],
  "overall_confidence": 0.0-1.0,
  "extraction_notes": "Any ambiguities or notes about the extraction"
}"""


async def extract_from_transcript(
    transcript_text: str,
    meeting_date: str | None = None,
    meeting_type: str = "wip",
) -> TranscriptExtractionSchema:
    """
    Extract structured data from meeting transcript using Claude.

    Args:
        transcript_text: Raw meeting transcript text
        meeting_date: Optional date of the meeting (ISO format)
        meeting_type: Type of meeting (wip, planning, client-debrief)

    Returns:
        TranscriptExtractionSchema with extracted data

    Raises:
        ValueError: If JSON parsing fails
    """
    user_prompt = f"""Analyze this WIP meeting transcript and extract all structured information.

Meeting Date: {meeting_date or "Not specified"}
Meeting Type: {meeting_type}

Transcript:
\"\"\"
{transcript_text}
\"\"\"

Extract:
1. All projects mentioned (with status, phase, next milestones)
2. All assignments (who is working on what)
3. Capacity signals (workload indicators, availability mentions)
4. Deadlines and timeframes
5. Overall confidence in the extraction

Return ONLY valid JSON. Use confidence scores to indicate certainty.
Context quotes MUST be exact excerpts from the transcript."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Extract text from response
    json_text = response.content[0].text

    # Strip markdown code fences if present
    clean_json = json_text
    if json_text.startswith("```"):
        # Remove ```json and ``` markers
        lines = json_text.split("\n")
        clean_json = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    clean_json = clean_json.strip()

    # Parse and validate
    try:
        extracted_data = json.loads(clean_json)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Claude response as JSON: {e}")

    return TranscriptExtractionSchema(**extracted_data)
