# Alt/Shift AI Traffic Manager - Complete Blueprint

## Executive Summary

**Problem**: Alt/Shift PR agency needs to translate conversational WIP meeting transcripts into actionable project assignments with accurate capacity tracking across team members.

**Solution**: AI-powered traffic management system that extracts structured data from unstructured meeting notes, tracks time allocation across projects, identifies capacity conflicts, and generates assignment recommendations.

**Critical Innovation**: Unlike traditional project management tools that require manual data entry, this system **reverse-engineers structure from natural conversation**, making it zero-friction for the actual team workflow.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Upload     │  │   Review     │  │   Capacity   │          │
│  │  Transcript  │  │  Dashboard   │  │   Timeline   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                      API LAYER                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Python FastAPI Backend                     │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │     │
│  │  │  Transcript  │ │  Capacity    │ │  Assignment  │    │     │
│  │  │  Processing  │ │  Calculator  │ │  Optimizer   │    │     │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    │     │
│  └─────────┼────────────────┼────────────────┼─────────────┘     │
│            │                │                │                   │
│  ┌─────────┼────────────────┼────────────────┼─────────────┐     │
│  │    Claude API Integration                 │             │     │
│  │  - Transcript → Structured Data           │             │     │
│  │  - Entity Recognition (people, projects)  │             │     │
│  │  - Capacity Signal Detection              │             │     │
│  │  - Timeline Extraction                    │             │     │
│  └────────────────────────────────────────────┘             │     │
└──────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                     DATABASE LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Supabase PostgreSQL                        │     │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │     │
│  │  │ Team Members │ │   Projects   │ │  Assignments │    │     │
│  │  │  + Capacity  │ │  + Phases    │ │  + Hours     │    │     │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │     │
│  │  ┌──────────────┐ ┌──────────────┐                     │     │
│  │  │ Transcripts  │ │  Time        │                     │     │
│  │  │  (History)   │ │  Tracking    │                     │     │
│  │  └──────────────┘ └──────────────┘                     │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Data Architecture

### The Capacity Management Challenge

**Key Insight**: Alt/Shift operates in **hours**, not tasks. The transcript analysis reveals:
- "jam packed front of the week" = overallocated
- "three proactive briefs in a week is too much" = capacity threshold
- "I'll have time when I'm not driving" = available capacity window

**The system must track**:
1. **Available capacity** per person per week
2. **Allocated time** across all active projects
3. **Project time requirements** by phase
4. **Conflicts** when allocation > capacity

### Database Schema

```sql
-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Team Members with Capacity Management
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'producer', 'creative', 'strategy', 'director'
  
  -- Capacity Configuration
  weekly_capacity_hours DECIMAL(5,2) DEFAULT 40.0, -- Total available hours per week
  billable_target_hours DECIMAL(5,2) DEFAULT 32.0, -- Target billable hours
  
  -- Metadata
  skills TEXT[], -- ['production', 'client-presentations', 'editing']
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects with Phase-Based Time Tracking
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT,
  
  -- Project Status
  status TEXT DEFAULT 'active' CHECK (status IN ('briefing', 'active', 'on-hold', 'completed', 'archived')),
  phase TEXT CHECK (phase IN ('pre-production', 'production', 'post-production', 'client-review', 'final-delivery')),
  
  -- Time Estimates
  estimated_total_hours DECIMAL(6,2), -- Total project hours estimate
  hours_consumed DECIMAL(6,2) DEFAULT 0, -- Running total of allocated hours
  
  -- Timeline
  start_date DATE,
  deadline DATE,
  next_milestone TEXT,
  next_milestone_date DATE,
  
  -- Metadata
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment = Person + Project + Time Allocation
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Assignment Details
  role_on_project TEXT NOT NULL, -- 'lead-producer', 'editor', 'strategy-lead', 'support'
  
  -- Time Allocation
  estimated_hours DECIMAL(6,2) NOT NULL, -- Total hours for this person on this project
  hours_this_week DECIMAL(5,2) DEFAULT 0, -- Current week allocation
  hours_consumed DECIMAL(6,2) DEFAULT 0, -- Hours used so far
  
  -- Status Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  assigned_by TEXT DEFAULT 'ai', -- 'ai' or 'manual' or user_id
  confidence_score DECIMAL(3,2), -- 0.0-1.0: How confident AI is in this assignment
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, team_member_id) -- One assignment per person per project
);

-- Time Tracking (Actual Hours Logged)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Time Data
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT,
  billable BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Transcripts (Historical Archive + Learning)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transcript Data
  meeting_date DATE NOT NULL,
  meeting_type TEXT, -- 'wip', 'planning', 'client-debrief'
  raw_text TEXT NOT NULL,
  audio_url TEXT, -- Optional S3/Supabase Storage link
  
  -- AI Extraction Results
  extracted_data JSONB, -- Full structured extraction from Claude
  extraction_model TEXT, -- 'claude-sonnet-4-20250514'
  extraction_confidence DECIMAL(3,2), -- Overall confidence score
  
  -- Processing Metadata
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES team_members(id),
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacity Snapshots (Weekly Capacity State)
CREATE TABLE capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id),
  
  -- Week Identifier
  week_start_date DATE NOT NULL, -- Monday of the week
  
  -- Capacity Calculation
  total_capacity_hours DECIMAL(5,2) NOT NULL,
  allocated_hours DECIMAL(5,2) NOT NULL, -- Sum of all assignments.hours_this_week
  available_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_capacity_hours - allocated_hours) STORED,
  utilization_pct DECIMAL(5,2) GENERATED ALWAYS AS ((allocated_hours / NULLIF(total_capacity_hours, 0)) * 100) STORED,
  
  -- Status Flags
  overallocated BOOLEAN GENERATED ALWAYS AS (allocated_hours > total_capacity_hours) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_member_id, week_start_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_member ON assignments(team_member_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX idx_capacity_week ON capacity_snapshots(week_start_date);
CREATE INDEX idx_capacity_member ON capacity_snapshots(team_member_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can read all (single-tenant agency)
-- In production, refine based on roles if needed

CREATE POLICY "Team members can view all team members"
ON team_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can view all projects"
ON projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can view all assignments"
ON assignments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admin/manager can insert/update (implement role-based later)
CREATE POLICY "Authenticated users can manage assignments"
ON assignments FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Team members can view capacity"
ON capacity_snapshots FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Current Week Capacity Overview
CREATE VIEW current_week_capacity AS
SELECT 
  tm.id,
  tm.full_name,
  tm.role,
  tm.weekly_capacity_hours,
  cs.allocated_hours,
  cs.available_hours,
  cs.utilization_pct,
  cs.overallocated
FROM team_members tm
LEFT JOIN capacity_snapshots cs ON cs.team_member_id = tm.id
WHERE cs.week_start_date = DATE_TRUNC('week', CURRENT_DATE)
AND tm.active = true
ORDER BY cs.utilization_pct DESC;

-- Project Workload Summary
CREATE VIEW project_workload AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.phase,
  p.deadline,
  COUNT(a.id) AS team_size,
  SUM(a.estimated_hours) AS total_estimated_hours,
  SUM(a.hours_consumed) AS total_hours_consumed,
  SUM(a.estimated_hours) - SUM(a.hours_consumed) AS remaining_hours
FROM projects p
LEFT JOIN assignments a ON a.project_id = p.id AND a.status = 'active'
WHERE p.status IN ('active', 'briefing')
GROUP BY p.id
ORDER BY p.deadline ASC NULLS LAST;

-- Team Member Assignment Overview
CREATE VIEW team_assignment_overview AS
SELECT 
  tm.id,
  tm.full_name,
  tm.role,
  COUNT(a.id) AS active_projects,
  SUM(a.hours_this_week) AS hours_this_week,
  SUM(a.estimated_hours - a.hours_consumed) AS remaining_hours_total,
  ARRAY_AGG(p.name ORDER BY p.deadline) AS project_names
FROM team_members tm
LEFT JOIN assignments a ON a.team_member_id = tm.id AND a.status = 'active'
LEFT JOIN projects p ON p.id = a.project_id
WHERE tm.active = true
GROUP BY tm.id
ORDER BY hours_this_week DESC;
```

### Capacity Calculation Logic

**Week-over-week capacity tracking**:

```typescript
interface CapacityState {
  teamMemberId: string;
  weekStartDate: Date;
  totalCapacity: number; // e.g., 40 hours
  allocatedHours: number; // Sum of all assignments.hours_this_week
  availableHours: number; // totalCapacity - allocatedHours
  utilizationPct: number; // (allocated / total) * 100
  overallocated: boolean; // allocated > total
}

// Recalculate capacity after assignment changes
async function updateCapacitySnapshot(
  teamMemberId: string,
  weekStartDate: Date
): Promise<CapacityState> {
  // Get team member's weekly capacity
  const member = await db.teamMembers.findUnique({ where: { id: teamMemberId } });
  
  // Sum all active assignments for this week
  const allocatedHours = await db.assignments.aggregate({
    where: {
      team_member_id: teamMemberId,
      status: 'active',
      // Assignments active during this week
    },
    _sum: { hours_this_week: true }
  });
  
  // Upsert capacity snapshot
  return await db.capacitySnapshots.upsert({
    where: {
      team_member_id_week_start_date: {
        team_member_id: teamMemberId,
        week_start_date: weekStartDate
      }
    },
    update: {
      total_capacity_hours: member.weekly_capacity_hours,
      allocated_hours: allocatedHours._sum.hours_this_week || 0
    },
    create: {
      team_member_id: teamMemberId,
      week_start_date: weekStartDate,
      total_capacity_hours: member.weekly_capacity_hours,
      allocated_hours: allocatedHours._sum.hours_this_week || 0
    }
  });
}
```

---

## AI Extraction Engine

### Claude Prompt Architecture

**Structured extraction using chain-of-thought + JSON output**:

```typescript
interface TranscriptExtractionSchema {
  meeting_metadata: {
    meeting_date: string; // ISO date
    meeting_type: 'wip' | 'planning' | 'client-debrief';
    attendees: string[]; // Names mentioned
  };
  
  projects: ProjectExtraction[];
  assignments: AssignmentExtraction[];
  capacity_signals: CapacitySignal[];
  deadlines: DeadlineExtraction[];
  dependencies: DependencyExtraction[];
  
  overall_confidence: number; // 0-1
  extraction_notes: string; // Any ambiguities
}

interface ProjectExtraction {
  name: string;
  client?: string;
  status: 'briefing' | 'active' | 'on-hold';
  phase?: 'pre-production' | 'production' | 'post-production' | 'client-review';
  next_milestone?: string;
  next_milestone_timeframe?: string; // "this Friday", "end of Jan"
  context: string; // Relevant quote from transcript
  confidence: number; // 0-1
}

interface AssignmentExtraction {
  person_name: string;
  project_name: string;
  role_inferred?: string; // "producer", "creative lead"
  assignment_type: 'explicit' | 'implicit' | 'inferred';
  workload_signal?: 'light' | 'medium' | 'heavy' | 'overloaded';
  context: string; // Quote showing assignment
  confidence: number;
}

interface CapacitySignal {
  person_name: string;
  signal_type: 'overallocated' | 'available' | 'blocked' | 'time-constraint';
  description: string;
  timeframe?: string; // "front of the week", "until Thursday"
  context: string; // Original quote
  confidence: number;
}

interface DeadlineExtraction {
  project_name: string;
  milestone: string; // "PPM", "client presentation", "shoot"
  deadline_text: string; // "Friday", "this afternoon", "end of Jan"
  deadline_date_inferred?: string; // ISO date (if parseable)
  confidence: number;
}

interface DependencyExtraction {
  source_project: string;
  depends_on: string;
  dependency_type: 'blocks' | 'requires-approval' | 'sequential';
  description: string;
  context: string;
}
```

### Extraction Prompt (Prompt Engineering Pattern)

```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an AI traffic manager analyzing Alt/Shift PR agency WIP meeting transcripts.

ROLE: Extract structured project, assignment, and capacity data from conversational meeting notes.

CAPABILITIES:
- Identify projects and their current status
- Detect team member assignments (explicit and implicit)
- Recognize capacity signals ("jam packed", "available next week")
- Extract deadlines and milestones
- Identify project dependencies

CONSTRAINTS:
- Only extract information explicitly mentioned or strongly implied
- Use confidence scores (0-1) for all extractions
- Mark ambiguous assignments as "inferred" with lower confidence
- Preserve original context quotes for verification

OUTPUT FORMAT: Return ONLY valid JSON matching the TranscriptExtractionSchema.`;

const EXTRACTION_USER_PROMPT = `Analyze this WIP meeting transcript and extract all structured information.

Transcript:
"""
${transcriptText}
"""

Extract:
1. All projects mentioned (with status, phase, next milestones)
2. All assignments (who is working on what)
3. Capacity signals (workload indicators, availability mentions)
4. Deadlines and timeframes
5. Project dependencies

Return JSON following TranscriptExtractionSchema. Use confidence scores to indicate certainty.`;

async function extractFromTranscript(transcriptText: string): Promise<TranscriptExtractionSchema> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: EXTRACTION_USER_PROMPT
    }]
  });
  
  const jsonText = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Strip markdown code fences if present
  const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
  
  return JSON.parse(cleanJson);
}
```

### Entity Resolution & Matching

**Problem**: Transcripts use informal names ("Jess", "Elle", "Tommy") but database needs canonical IDs.

```typescript
// Fuzzy matching for team member names
async function resolveTeamMember(extractedName: string): Promise<string | null> {
  // Exact match
  let member = await db.teamMembers.findFirst({
    where: { full_name: { equals: extractedName, mode: 'insensitive' } }
  });
  
  if (member) return member.id;
  
  // Partial match on first name
  member = await db.teamMembers.findFirst({
    where: { 
      full_name: { 
        contains: extractedName.split(' ')[0], 
        mode: 'insensitive' 
      }
    }
  });
  
  if (member) return member.id;
  
  // No match - flag for manual resolution
  return null;
}

// Project name matching (more lenient - projects have nicknames)
async function resolveProject(extractedName: string): Promise<string | null> {
  // Fuzzy match with similarity scoring
  const projects = await db.projects.findMany({
    where: { status: { in: ['active', 'briefing'] } }
  });
  
  // Use string similarity (Levenshtein distance)
  const matches = projects.map(p => ({
    project: p,
    similarity: stringSimilarity(extractedName.toLowerCase(), p.name.toLowerCase())
  }));
  
  const bestMatch = matches.sort((a, b) => b.similarity - a.similarity)[0];
  
  // Require 70% similarity for auto-match
  if (bestMatch && bestMatch.similarity > 0.7) {
    return bestMatch.project.id;
  }
  
  return null;
}
```

---

## Backend API Architecture

### FastAPI Service Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + CORS
│   ├── config.py                  # Environment config
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── transcripts.py     # Upload, process, history
│   │   │   ├── assignments.py     # CRUD, bulk operations
│   │   │   ├── capacity.py        # Capacity overview, conflicts
│   │   │   ├── projects.py        # Project CRUD
│   │   │   └── team.py            # Team member management
│   │   │
│   │   └── dependencies.py        # Auth, DB session
│   │
│   ├── services/
│   │   ├── claude_extractor.py    # Transcript → structured data
│   │   ├── capacity_calculator.py # Capacity math
│   │   ├── assignment_optimizer.py # Assignment recommendations
│   │   └── entity_resolver.py     # Name → ID matching
│   │
│   ├── models/
│   │   ├── database.py            # SQLAlchemy models
│   │   └── schemas.py             # Pydantic request/response
│   │
│   ├── db/
│   │   └── supabase_client.py     # Supabase connection
│   │
│   └── utils/
│       ├── date_parser.py         # "this Friday" → datetime
│       └── string_similarity.py   # Fuzzy matching
│
├── tests/
│   ├── test_extraction.py
│   ├── test_capacity.py
│   └── test_api.py
│
├── requirements.txt
├── Dockerfile
└── railway.json                   # Railway deployment config
```

### Key API Endpoints

```python
# POST /api/transcripts/process
# Upload and process transcript
{
  "transcript_text": "string",
  "meeting_date": "2025-01-13",
  "meeting_type": "wip"
}
→ Returns: TranscriptExtractionSchema + unresolved entities

# GET /api/capacity/current-week
# Current week capacity for all team members
→ Returns: CapacityState[] with overallocation flags

# GET /api/capacity/forecast?weeks=4
# Forecast capacity over next N weeks
→ Returns: Weekly capacity projections

# POST /api/assignments/bulk-create
# Create multiple assignments from transcript
{
  "assignments": [
    {
      "project_id": "uuid",
      "team_member_id": "uuid",
      "role_on_project": "producer",
      "estimated_hours": 15,
      "hours_this_week": 8
    }
  ]
}
→ Returns: Created assignments + capacity conflicts

# GET /api/assignments/conflicts
# Find capacity conflicts in current assignments
→ Returns: Overallocated team members + conflicting projects

# PUT /api/assignments/{id}/adjust-hours
# Adjust hours for assignment (recalculates capacity)
{
  "hours_this_week": 5
}
→ Returns: Updated assignment + new capacity state
```

---

## Frontend Architecture

### Next.js 15 App Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── upload/
│   │   │   │   └── page.tsx              # Transcript upload
│   │   │   │
│   │   │   ├── review/
│   │   │   │   └── [transcriptId]/
│   │   │   │       └── page.tsx          # Review extracted data
│   │   │   │
│   │   │   ├── capacity/
│   │   │   │   └── page.tsx              # Capacity dashboard
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   └── page.tsx              # Project list
│   │   │   │
│   │   │   └── layout.tsx                # Dashboard shell
│   │   │
│   │   ├── api/
│   │   │   └── [...catchall]/route.ts    # Proxy to FastAPI
│   │   │
│   │   └── layout.tsx                    # Root layout
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── badge.tsx
│   │   │
│   │   ├── features/
│   │   │   ├── transcript-upload.tsx
│   │   │   ├── extraction-review.tsx
│   │   │   ├── capacity-heatmap.tsx
│   │   │   ├── project-board.tsx
│   │   │   └── assignment-table.tsx
│   │   │
│   │   └── layouts/
│   │       ├── dashboard-nav.tsx
│   │       └── page-header.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   └── server.ts                 # Server client
│   │   │
│   │   ├── api-client.ts                 # FastAPI client
│   │   └── utils.ts                      # Utility functions
│   │
│   └── types/
│       ├── database.ts                   # Supabase types
│       └── api.ts                        # API types
│
├── public/
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### Key User Interfaces

#### 1. Transcript Upload Page

```typescript
// app/(dashboard)/upload/page.tsx

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'

export default function TranscriptUploadPage() {
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  
  async function handleUpload() {
    setProcessing(true)
    
    try {
      const result = await apiClient.post('/transcripts/process', {
        transcript_text: transcript,
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_type: 'wip'
      })
      
      // Redirect to review page
      router.push(`/review/${result.transcript_id}`)
    } catch (error) {
      // Handle error
    } finally {
      setProcessing(false)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1>Upload WIP Meeting Transcript</h1>
      
      <div className="mt-6">
        <Textarea
          placeholder="Paste meeting transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={15}
        />
        
        <Button 
          onClick={handleUpload} 
          disabled={!transcript || processing}
          className="mt-4"
        >
          {processing ? 'Processing...' : 'Analyze Transcript'}
        </Button>
      </div>
    </div>
  )
}
```

#### 2. Extraction Review Dashboard

**Critical feature**: Show AI-extracted data with confidence scores, allow manual edits before finalizing.

```typescript
// app/(dashboard)/review/[transcriptId]/page.tsx

interface ExtractionReviewProps {
  params: { transcriptId: string }
}

export default async function ExtractionReviewPage({ params }: ExtractionReviewProps) {
  const transcript = await apiClient.get(`/transcripts/${params.transcriptId}`)
  const extracted = transcript.extracted_data
  
  return (
    <div className="container mx-auto py-8">
      <h1>Review Extracted Data</h1>
      
      {/* Projects Section */}
      <section className="mt-6">
        <h2>Projects Mentioned</h2>
        {extracted.projects.map(project => (
          <ProjectCard
            key={project.name}
            project={project}
            onEdit={handleEditProject}
          />
        ))}
      </section>
      
      {/* Assignments Section */}
      <section className="mt-6">
        <h2>Assignments Detected</h2>
        <AssignmentTable
          assignments={extracted.assignments}
          onEditAssignment={handleEditAssignment}
        />
      </section>
      
      {/* Capacity Signals */}
      <section className="mt-6">
        <h2>Capacity Signals</h2>
        {extracted.capacity_signals.map(signal => (
          <CapacitySignalCard
            key={signal.person_name}
            signal={signal}
          />
        ))}
      </section>
      
      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleApproveAll}>
          Approve & Create Assignments
        </Button>
        <Button variant="outline" onClick={handleExport}>
          Export to CSV
        </Button>
      </div>
    </div>
  )
}
```

#### 3. Capacity Dashboard (The Critical View)

```typescript
// app/(dashboard)/capacity/page.tsx

export default async function CapacityDashboardPage() {
  const currentWeekCapacity = await apiClient.get('/capacity/current-week')
  
  return (
    <div className="container mx-auto py-8">
      <h1>Team Capacity Overview</h1>
      
      {/* Capacity Heatmap */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentWeekCapacity.map(member => (
          <CapacityCard
            key={member.id}
            teamMember={member}
            alertOnOverallocation
          />
        ))}
      </div>
      
      {/* Overallocation Warnings */}
      {currentWeekCapacity.some(m => m.overallocated) && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Capacity Conflicts Detected</AlertTitle>
          <AlertDescription>
            The following team members are overallocated this week:
            <ul>
              {currentWeekCapacity
                .filter(m => m.overallocated)
                .map(m => (
                  <li key={m.id}>
                    {m.full_name}: {m.allocated_hours}h allocated, {m.weekly_capacity_hours}h available
                  </li>
                ))
              }
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Timeline View */}
      <div className="mt-8">
        <h2>4-Week Capacity Forecast</h2>
        <CapacityTimeline teamMembers={currentWeekCapacity} />
      </div>
    </div>
  )
}
```

---

## Capacity Intelligence Features

### Smart Assignment Recommendations

**Problem**: When AI extracts "Jess is on Legos", it doesn't know how many hours to allocate.

**Solution**: Historical learning + phase-based estimation.

```typescript
interface AssignmentRecommendation {
  assignment: AssignmentExtraction; // From AI
  recommended_hours: number; // Calculated estimate
  reasoning: string;
  confidence: number;
}

async function recommendHours(
  assignment: AssignmentExtraction,
  project: Project
): Promise<AssignmentRecommendation> {
  // Strategy 1: Historical average for similar role + project phase
  const historicalAvg = await db.assignments.aggregate({
    where: {
      role_on_project: assignment.role_inferred,
      project: { phase: project.phase }
    },
    _avg: { estimated_hours: true }
  });
  
  // Strategy 2: Phase-based heuristics
  const phaseEstimates = {
    'pre-production': { producer: 20, creative: 15, strategy: 10 },
    'production': { producer: 40, creative: 30, strategy: 5 },
    'post-production': { producer: 25, creative: 35, strategy: 5 },
    'client-review': { producer: 10, creative: 5, strategy: 8 }
  };
  
  const heuristicEstimate = phaseEstimates[project.phase]?.[assignment.role_inferred] || 20;
  
  // Weighted average
  const recommended = (historicalAvg._avg.estimated_hours || heuristicEstimate) * 0.7 + heuristicEstimate * 0.3;
  
  return {
    assignment,
    recommended_hours: Math.round(recommended),
    reasoning: `Based on ${historicalAvg._avg.estimated_hours ? 'historical data' : 'phase estimates'} for ${assignment.role_inferred} in ${project.phase}`,
    confidence: historicalAvg._avg.estimated_hours ? 0.8 : 0.6
  };
}
```

### Conflict Detection Engine

```typescript
interface CapacityConflict {
  type: 'overallocation' | 'timeline-conflict' | 'skill-mismatch';
  team_member_id: string;
  affected_projects: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggested_resolution?: string;
}

async function detectCapacityConflicts(
  weekStartDate: Date
): Promise<CapacityConflict[]> {
  const conflicts: CapacityConflict[] = [];
  
  // Get all capacity snapshots for this week
  const snapshots = await db.capacitySnapshots.findMany({
    where: { week_start_date: weekStartDate },
    include: {
      team_member: true,
      assignments: {
        include: { project: true },
        where: { status: 'active' }
      }
    }
  });
  
  for (const snapshot of snapshots) {
    // Check overallocation
    if (snapshot.overallocated) {
      const overage = snapshot.allocated_hours - snapshot.total_capacity_hours;
      
      conflicts.push({
        type: 'overallocation',
        team_member_id: snapshot.team_member_id,
        affected_projects: snapshot.assignments.map(a => a.project.name),
        severity: overage > 10 ? 'high' : overage > 5 ? 'medium' : 'low',
        description: `${snapshot.team_member.full_name} is ${overage}h overallocated this week`,
        suggested_resolution: `Reduce hours on: ${snapshot.assignments
          .sort((a, b) => (b.hours_this_week || 0) - (a.hours_this_week || 0))[0]
          .project.name}`
      });
    }
    
    // Check for conflicting deadlines
    const urgentProjects = snapshot.assignments
      .filter(a => a.project.priority === 'urgent' && a.project.deadline)
      .length;
    
    if (urgentProjects > 1) {
      conflicts.push({
        type: 'timeline-conflict',
        team_member_id: snapshot.team_member_id,
        affected_projects: snapshot.assignments
          .filter(a => a.project.priority === 'urgent')
          .map(a => a.project.name),
        severity: 'high',
        description: `${snapshot.team_member.full_name} has ${urgentProjects} urgent projects with overlapping deadlines`
      });
    }
  }
  
  return conflicts;
}
```

---

## Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Core infrastructure + basic transcript processing

#### Tasks:
- [x] Database schema design & migration
- [ ] Supabase project setup
- [ ] FastAPI backend scaffold
- [ ] Next.js frontend scaffold
- [ ] Claude API integration (basic extraction)
- [ ] Authentication (Supabase Auth)
- [ ] Railway deployment config

**Deliverable**: Can upload transcript, see basic extraction

---

### Phase 2: Core Features (Week 2)
**Goal**: Complete extraction → assignment workflow

#### Tasks:
- [ ] Full Claude extraction logic (projects, assignments, capacity)
- [ ] Entity resolution (fuzzy matching)
- [ ] Capacity calculation engine
- [ ] Assignment CRUD operations
- [ ] Review dashboard UI
- [ ] Capacity dashboard UI
- [ ] Manual override functionality

**Deliverable**: Can process transcript, review data, create assignments, see capacity state

---

### Phase 3: Intelligence & Polish (Week 3)
**Goal**: Recommendations + conflict detection

#### Tasks:
- [ ] Hour estimation recommendations
- [ ] Conflict detection algorithms
- [ ] Historical learning (average hours by role/phase)
- [ ] 4-week capacity forecast
- [ ] Export functionality (CSV, PDF)
- [ ] Audit trail (who approved what)
- [ ] Mobile-responsive UI polish

**Deliverable**: Production-ready system with AI recommendations

---

### Phase 4: Advanced Features (Future)
**Post-MVP enhancements**:
- Audio transcription integration (Whisper API)
- Email/Slack notifications for assignments
- Calendar integration (block time in Google Cal)
- Time tracking integration (harvest/Toggl)
- Budget tracking (hours × rates = project costs)
- Client portal (view project status)
- Analytics dashboard (utilization trends, project profitability)

---

## Technical Decisions & Rationale

### Decision 1: Python Backend vs. Node.js

**Choice**: Python FastAPI

**Reasoning**:
- Claude SDK native Python support (anthropic-sdk-python)
- Better for data processing/ML workloads
- Type safety with Pydantic models
- Async support (same as Node)
- Your team has Node experience, but this is clean separation (AI logic in Python, UI logic in Next.js)

**Trade-off**: Slightly more deployment complexity (multi-service Railway setup)

---

### Decision 2: Supabase vs. Custom PostgreSQL

**Choice**: Supabase

**Reasoning**:
- Built-in auth (don't build your own)
- RLS for security
- Real-time subscriptions (future: live capacity updates)
- Your established pattern (AIDEN Studio, other projects)
- Free tier sufficient for MVP

**Trade-off**: None - this is your standard stack

---

### Decision 3: Capacity Tracking Granularity

**Choice**: Weekly snapshots + project-level hours

**Reasoning**:
- Alt/Shift thinks in weeks ("jam packed this week")
- Daily tracking too granular for planning
- Monthly too coarse for accurate allocation
- Project-level gives flexibility (can redistribute within week)

**Trade-off**: Can't track specific day availability (future enhancement if needed)

---

### Decision 4: AI Confidence Scores

**Choice**: Include confidence scores for all extractions

**Reasoning**:
- Transcript analysis is inherently ambiguous
- Users need to know when to double-check AI decisions
- Low-confidence extractions can be flagged for manual review
- Builds trust (transparency about uncertainty)

**Trade-off**: More complex UI (need to visualize confidence)

---

## Risk Mitigation

### Risk 1: AI Hallucination
**Mitigation**: 
- Always show original transcript context with extractions
- Require manual approval before creating assignments
- Confidence scores highlight uncertain extractions

### Risk 2: Name Resolution Failures
**Mitigation**:
- Fuzzy matching with similarity threshold
- Manual disambiguation UI for ambiguous matches
- "Unknown person" handling (flag for later resolution)

### Risk 3: Capacity Calculation Errors
**Mitigation**:
- Use database-generated columns (computed capacity fields)
- Validation constraints (can't allocate > capacity without override)
- Audit trail of all capacity changes

### Risk 4: Transcript Format Variations
**Mitigation**:
- Few-shot learning in Claude prompt (show examples)
- Iterative prompt refinement based on real transcripts
- Manual correction feeds back into training data

---

## Success Metrics

### MVP Success Criteria:
- [ ] Can process transcript in <30 seconds
- [ ] >80% accuracy on project identification
- [ ] >70% accuracy on assignment detection
- [ ] Zero manual capacity calculation (all automatic)
- [ ] Detect overallocation within 1 hour margin
- [ ] Mobile-responsive UI
- [ ] Production-deployed on Railway

### Business Value Metrics:
- Time saved per week (vs. manual project board updates)
- Reduction in overallocation incidents
- Improved team utilization (closer to target 80%)
- Faster onboarding (new PMs can review past transcripts)

---

## Next Actions

### Immediate (Before Development):
1. **Validate database schema** with Alt/Shift
   - Confirm: Weekly capacity model makes sense?
   - Confirm: Project phases accurate for their workflow?
   - Confirm: Assignment roles match their terminology?

2. **Test AI extraction** with real transcripts
   - Run 5-10 past transcripts through Claude
   - Measure accuracy of project/assignment detection
   - Refine prompt based on failure modes

3. **Confirm tech stack approval**
   - Python backend acceptable?
   - Railway deployment plan clear?
   - Any infrastructure constraints?

### Development Kickoff:
**Tool**: Start in Cursor (new project, <5K lines initially)
**Session 1**: Database schema + Supabase setup
**Session 2**: FastAPI scaffold + Claude integration
**Session 3**: Next.js frontend + review dashboard

**Progress tracking**: Live artifact updated each session with:
- Completed tasks
- Test results
- Blockers
- Handoff instructions for next session

---

*This blueprint created: 2025-01-13*
*Review with: Tom + Alt/Shift team before development*
*Estimated MVP timeline: 3 weeks (60-80 hours total)*
