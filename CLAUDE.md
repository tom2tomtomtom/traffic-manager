# CLAUDE.md - Alt/Shift AI Traffic Manager

## MANDATORY: Read Before ANY Action

Before writing ANY code, you MUST:
1. Read `.claude/STATUS.md` - Know current state
2. Read `.claude/BLUEPRINT.md` - Understand architecture
3. Read `.claude/PATTERNS.md` - Use approved patterns
4. Check relevant task file in `.claude/tasks/`

---

## Project Identity

**Name**: Alt/Shift AI Traffic Manager  
**Type**: Full-stack SaaS (Internal Tool)  
**Stage**: Foundation Phase  
**Purpose**: Transform conversational WIP meeting transcripts into structured project assignments with capacity tracking

**The Core Innovation**: Zero-friction data entry - teams just talk, AI extracts assignments and tracks capacity automatically.

---

## Tech Stack (Quick Reference)

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | Next.js (App Router) | 15.x | React Server Components |
| Styling | Tailwind CSS | 3.4.x | AIDEN Design System |
| UI Components | shadcn/ui | Latest | Brutalist customization |
| Backend | Python FastAPI | 0.115+ | AI extraction service |
| AI | Claude Sonnet 4 | 20250514 | Structured extraction |
| Database | Supabase (PostgreSQL) | 15 | Auth + RLS |
| Deployment | Railway | - | Multi-service architecture |

For complete stack details: `.claude/STACK.md`

---

## Critical System Constraints

### **The Core UX Promise**

**What users should feel**: "This just works - I paste a transcript, and it handles everything."

**Tool Type**: **Automation** ("Set it and forget it")  
**UX Priority**: Minimal clicks, smart defaults, invisible execution, only surface when something needs attention

**User Flow Principle**: 
```
GOOD: Upload → See Results → One-Click Approve
BAD:  Upload → Configure Settings → Review Options → Confirm Choices → Apply
```

**Never violate**: Users came here to avoid manual project board updates. Don't make them do manual work after AI extraction.

### **Design System: AIDEN Brutalist**

This is NOT a friendly consumer app. This is a professional tool for creative agencies.

**Visual Identity**:
- Sharp corners only (border-radius: 0)
- Deep black backgrounds (#050505, #0a0a0a, #0f0f0f)
- Electric red primary (#ff2e2e)
- Orange secondary (#ff6b00)
- High contrast text (white on black)
- Grid background patterns
- Bold uppercase headings
- System fonts (Geist Sans/Mono)

**Why this matters**: Alt/Shift is a creative agency. The tool should feel powerful and technical, not playful and friendly.

### **Capacity Management Philosophy**

**The system tracks HOURS, not tasks.**

Alt/Shift thinks in weekly capacity:
- "Jess has 40 hours this week"
- "Legos needs 15 hours from her"
- "She's already at 38 hours = OVERALLOCATED"

**Critical distinction**: Most PM tools track "Jess assigned to 3 projects." This tracks "Jess allocated 38/40 hours across 3 projects with specific time per project."

---

## UX Critical Rules

### **Flow Design Patterns**

#### 1. The Pit of Success
The easiest path must be the correct path. Default behavior = what 90% of users want.

**Example**:
```
❌ BAD:  "Do you want to create assignments? [Yes] [No]"
✅ GOOD: Auto-create assignments with [Review Before Finalizing] button
```

#### 2. AI-to-Action (No Copy-Paste)

**The Golden Rule**: If AI generated it and user approved it, ONE CLICK should complete the action.

```tsx
// ❌ BAD: Make users copy AI results
<div>
  <p>AI extracted: "Jess assigned to Legos, 15 hours"</p>
  <textarea>Manually create assignment...</textarea>
</div>

// ✅ GOOD: Direct action buttons
<div className="bg-black-card p-4 border-2 border-border-subtle">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-white-full font-bold">Jess → Legos</p>
      <p className="text-white-muted text-sm">Producer role, 15 hours this week</p>
    </div>
    <div className="flex gap-2">
      <button className="bg-red-hot px-4 py-2 text-xs uppercase font-bold">
        Approve
      </button>
      <button className="bg-black-card border border-border-subtle px-4 py-2 text-xs uppercase">
        Edit
      </button>
    </div>
  </div>
</div>
```

#### 3. Confidence Scores Drive UX

AI extraction includes confidence scores (0-1). Use them:

```tsx
// High confidence (>0.8): Auto-select for approval
<div className="border-2 border-orange-accent"> {/* Highlighted */}
  <Badge className="bg-orange-accent">HIGH CONFIDENCE</Badge>
  {/* Pre-checked for bulk approval */}
</div>

// Medium confidence (0.5-0.8): Flag for review
<div className="border-2 border-yellow-electric">
  <Badge className="bg-yellow-electric text-black-ink">REVIEW</Badge>
  {/* User should verify */}
</div>

// Low confidence (<0.5): Require manual confirmation
<div className="border-2 border-red-hot">
  <Badge className="bg-red-hot">VERIFY</Badge>
  {/* Must explicitly approve */}
</div>
```

#### 4. Progressive Disclosure

Don't overwhelm with options. Show complexity only when needed.

```
Level 1: Essential actions (always visible)
  → Upload transcript, View capacity

Level 2: Common actions (one click away)
  → Edit assignment, Adjust hours

Level 3: Advanced actions (in menus/settings)
  → Bulk operations, Export to CSV, Configure capacity

Level 4: Rare actions (in documentation)
  → Historical analysis, Capacity forecasting
```

#### 5. Forgiving Inputs

Accept messy data, clean it automatically:

```typescript
// User pastes: "Team Meeting - 13/01/2025"
// System extracts: { meetingDate: "2025-01-13", meetingType: "wip" }

// User uploads: Raw audio file
// System: Auto-transcribes → Extracts → Shows results

// AI extracts: "Jess" (informal name)
// System: Fuzzy matches to "Jessica Thompson" in database
```

#### 6. Optimistic UI Updates

Assume success, show immediate feedback:

```tsx
function handleApproveAssignment(assignmentId: string) {
  // 1. Immediately update UI (optimistic)
  setAssignments(prev => prev.map(a => 
    a.id === assignmentId 
      ? { ...a, status: 'approved', approving: true }
      : a
  ))
  
  // 2. Show success state
  toast.success('Assignment approved')
  
  // 3. Make API call in background
  api.post(`/assignments/${assignmentId}/approve`)
    .catch(error => {
      // 4. Rollback on error
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'pending', approving: false }
          : a
      ))
      toast.error('Failed to approve - try again')
    })
}
```

### **Performance as UX**

| Threshold | Perception | Action |
|-----------|------------|--------|
| 0-100ms | Instant | Direct feedback (button press) |
| 100-300ms | Slight delay | Show active state (processing) |
| 300-1000ms | Working | Show spinner with label |
| 1-10s | Waiting | Show progress bar (AI extraction) |
| 10s+ | Broken | Background job + notification |

**AI transcript processing takes 5-15 seconds**:

```tsx
// ✅ GOOD: Show progress with context
<div className="bg-black-card p-6 border-2 border-orange-accent">
  <div className="flex items-center gap-4">
    <Spinner className="text-orange-accent" />
    <div>
      <p className="text-white-full font-bold uppercase">Processing Transcript</p>
      <p className="text-white-muted text-sm">
        Extracting projects, assignments, and capacity signals...
      </p>
    </div>
  </div>
  <div className="mt-4 bg-black-deep h-2">
    <div className="bg-orange-accent h-full transition-all" style={{ width: '45%' }} />
  </div>
</div>

// ❌ BAD: Generic spinner with no context
<Spinner /> {/* User has no idea what's happening */}
```

### **Error Handling Patterns**

**Nielsen's Heuristic #9**: Help users recognize, diagnose, and recover from errors.

```tsx
// ❌ BAD: Unhelpful error
<p className="text-red-hot">Error processing transcript</p>

// ✅ GOOD: Actionable error with recovery path
<div className="bg-black-card border-2 border-red-hot p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="text-red-hot mt-1" />
    <div>
      <p className="text-red-hot font-bold uppercase">Extraction Failed</p>
      <p className="text-white-muted text-sm mt-1">
        Claude API couldn't parse the transcript. This usually means:
      </p>
      <ul className="text-white-muted text-sm mt-2 space-y-1 list-disc list-inside">
        <li>The transcript is too short (needs 50+ words)</li>
        <li>No projects or people were mentioned</li>
        <li>The format is unclear (try adding more context)</li>
      </ul>
      <div className="flex gap-2 mt-4">
        <button className="bg-red-hot px-4 py-2 text-xs uppercase font-bold">
          Try Again
        </button>
        <button className="text-orange-accent text-xs uppercase underline">
          Edit Transcript
        </button>
      </div>
    </div>
  </div>
</div>
```

### **Mobile-First Constraints**

Even though this is desktop-focused, mobile constraints improve desktop UX:

- **Touch targets**: Minimum 44x44px (but we're using desktop so 40x40px acceptable)
- **Thumb zones**: Primary actions within easy reach (top-right for CTAs)
- **One-handed use**: Consider reachability (nav at top, actions at top-right)
- **Offline-first**: Cache capacity data, transcripts (future enhancement)
- **Interruption-friendly**: Autosave transcript drafts

---

## Component Architecture Patterns

### **Directory Structure Enforcement**

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/              # Protected routes
│   │   ├── upload/               # Transcript upload
│   │   ├── review/[id]/          # Review extraction
│   │   ├── capacity/             # Capacity dashboard
│   │   ├── projects/             # Project list
│   │   └── layout.tsx            # Dashboard shell
│   │
│   ├── api/                      # API routes (proxy to FastAPI)
│   └── layout.tsx                # Root layout (AIDEN design system)
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx            # AIDEN-styled button
│   │   ├── card.tsx              # AIDEN-styled card
│   │   ├── badge.tsx             # Confidence badges
│   │   └── ...
│   │
│   ├── features/                 # Feature-specific components
│   │   ├── transcript-upload.tsx
│   │   ├── extraction-review.tsx
│   │   ├── capacity-heatmap.tsx
│   │   ├── assignment-table.tsx
│   │   └── project-board.tsx
│   │
│   └── layouts/                  # Layout components
│       ├── dashboard-nav.tsx     # AIDEN brutalist nav
│       └── page-header.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   │
│   ├── api-client.ts             # FastAPI client wrapper
│   └── utils.ts
│
└── types/
    ├── database.ts               # Supabase generated types
    └── api.ts                    # API request/response types
```

### **AIDEN Design System Components**

#### Button Component

```tsx
// components/ui/button.tsx
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles (ALWAYS APPLIED)
        "font-bold uppercase tracking-wide transition-all border-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-red-hot focus:ring-offset-2 focus:ring-offset-black-ink",
        
        // Variant styles
        variant === 'primary' && "bg-red-hot text-white border-red-hot hover:bg-red-dim",
        variant === 'secondary' && "bg-orange-accent text-white border-orange-accent hover:opacity-90",
        variant === 'ghost' && "bg-black-card text-white-muted border-border-subtle hover:border-orange-accent hover:text-white-full",
        variant === 'danger' && "bg-transparent text-red-hot border-red-hot hover:bg-red-hot hover:text-white",
        
        // Size styles
        size === 'sm' && "px-4 py-2 text-xs",
        size === 'md' && "px-6 py-3 text-sm",
        size === 'lg' && "px-8 py-4 text-base",
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

#### Card Component

```tsx
// components/ui/card.tsx
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'danger'
  hoverable?: boolean
}

export function Card({ 
  variant = 'default', 
  hoverable = true,
  className, 
  children,
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        "bg-black-card p-6 border-2",
        
        // Variant styles
        variant === 'default' && "border-border-subtle",
        variant === 'highlighted' && "border-orange-accent",
        variant === 'danger' && "border-red-hot",
        
        // Hover effect
        hoverable && "hover:border-orange-accent transition-all cursor-pointer",
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

#### Confidence Badge

```tsx
// components/ui/confidence-badge.tsx
interface ConfidenceBadgeProps {
  score: number; // 0-1
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const getVariant = (score: number) => {
    if (score >= 0.8) return { 
      bg: 'bg-orange-accent', 
      text: 'text-black-ink', 
      label: 'HIGH CONFIDENCE' 
    }
    if (score >= 0.5) return { 
      bg: 'bg-yellow-electric', 
      text: 'text-black-ink', 
      label: 'REVIEW' 
    }
    return { 
      bg: 'bg-red-hot', 
      text: 'text-white', 
      label: 'VERIFY' 
    }
  }
  
  const variant = getVariant(score)
  
  return (
    <span className={cn(
      "inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide",
      variant.bg,
      variant.text
    )}>
      {variant.label}
    </span>
  )
}
```

### **Feature Component Patterns**

#### Transcript Upload Component

```tsx
// components/features/transcript-upload.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

export function TranscriptUpload() {
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  
  async function handleUpload() {
    if (!transcript.trim()) return
    
    setProcessing(true)
    setProgress(0)
    
    // Simulate progress for perceived speed
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 500)
    
    try {
      const result = await apiClient.post('/transcripts/process', {
        transcript_text: transcript,
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_type: 'wip'
      })
      
      setProgress(100)
      clearInterval(progressInterval)
      
      // Redirect to review page
      setTimeout(() => {
        router.push(`/review/${result.transcript_id}`)
      }, 500)
      
    } catch (error) {
      clearInterval(progressInterval)
      setProcessing(false)
      setProgress(0)
      // Error handling component will show
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black-card p-8 border-2 border-border-subtle">
        <h2 className="text-2xl font-bold text-orange-accent uppercase mb-6">
          Upload WIP Meeting Transcript
        </h2>
        
        <Textarea
          placeholder="Paste your meeting transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={15}
          className="bg-black-deep text-white-full border-2 border-border-subtle focus:border-orange-accent p-4 text-sm font-mono"
          disabled={processing}
        />
        
        <div className="mt-6 flex items-center justify-between">
          <p className="text-white-dim text-xs uppercase tracking-wide">
            {transcript.trim().split(/\s+/).length} words
          </p>
          
          <Button 
            onClick={handleUpload}
            disabled={!transcript.trim() || processing}
            size="lg"
          >
            {processing ? 'Processing...' : 'Analyze Transcript'}
          </Button>
        </div>
        
        {processing && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white-muted text-sm uppercase">
                Extracting Data
              </p>
              <p className="text-orange-accent text-sm font-bold">
                {progress}%
              </p>
            </div>
            <div className="bg-black-deep h-2 overflow-hidden">
              <div 
                className="bg-orange-accent h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white-dim text-xs mt-2">
              AI is analyzing projects, assignments, and capacity signals...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### Capacity Heatmap

```tsx
// components/features/capacity-heatmap.tsx
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
  const getUtilizationColor = (pct: number, overallocated: boolean) => {
    if (overallocated) return 'border-red-hot'
    if (pct >= 90) return 'border-yellow-electric'
    if (pct >= 70) return 'border-orange-accent'
    return 'border-border-subtle'
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teamMembers.map(member => (
        <Card
          key={member.id}
          variant={member.overallocated ? 'danger' : 'default'}
          hoverable={false}
          className={cn(
            "relative",
            getUtilizationColor(member.utilization_pct, member.overallocated)
          )}
        >
          {/* Utilization visual bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black-deep">
            <div 
              className={cn(
                "h-full transition-all",
                member.overallocated ? "bg-red-hot" : "bg-orange-accent"
              )}
              style={{ width: `${Math.min(member.utilization_pct, 100)}%` }}
            />
          </div>
          
          <div className="pt-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white-full font-bold">{member.full_name}</h3>
                <p className="text-white-dim text-xs uppercase tracking-wide">
                  {member.role}
                </p>
              </div>
              
              <span className={cn(
                "text-2xl font-bold",
                member.overallocated ? "text-red-hot" : "text-orange-accent"
              )}>
                {Math.round(member.utilization_pct)}%
              </span>
            </div>
            
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
                <span className={cn(
                  "font-bold",
                  member.available_hours < 0 ? "text-red-hot" : "text-orange-accent"
                )}>
                  {member.available_hours}h
                </span>
              </div>
            </div>
            
            {member.overallocated && (
              <div className="mt-4 pt-4 border-t border-red-hot">
                <p className="text-red-hot text-xs uppercase font-bold">
                  ⚠️ OVERALLOCATED
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
```

---

## Backend API Architecture

### **FastAPI Service Structure**

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Alt/Shift Traffic Manager API",
    version="1.0.0",
    description="AI-powered traffic management with capacity tracking"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://traffic.altshift.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "traffic-manager-api"}

# Import routes
from app.api.routes import transcripts, assignments, capacity

app.include_router(transcripts.router, prefix="/api/transcripts", tags=["transcripts"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(capacity.router, prefix="/api/capacity", tags=["capacity"])
```

### **Claude Extraction Service**

```python
# app/services/claude_extractor.py
from anthropic import Anthropic
import json
from typing import Dict, Any
from app.models.schemas import TranscriptExtractionSchema

client = Anthropic()

EXTRACTION_SYSTEM_PROMPT = """You are an AI traffic manager for Alt/Shift PR agency.

ROLE: Extract structured project, assignment, and capacity data from WIP meeting transcripts.

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

OUTPUT: Return ONLY valid JSON matching TranscriptExtractionSchema."""

async def extract_from_transcript(
    transcript_text: str,
    meeting_date: str = None
) -> TranscriptExtractionSchema:
    """
    Extract structured data from meeting transcript using Claude.
    
    Returns TranscriptExtractionSchema with:
    - projects: List of projects mentioned
    - assignments: List of assignments detected
    - capacity_signals: List of capacity indicators
    - deadlines: List of deadlines mentioned
    - overall_confidence: Confidence score (0-1)
    """
    
    user_prompt = f"""Analyze this WIP meeting transcript and extract all structured information.

Transcript:
\"\"\"
{transcript_text}
\"\"\"

Meeting Date: {meeting_date or "Not specified"}

Extract:
1. All projects mentioned (with status, phase, next milestones)
2. All assignments (who is working on what)
3. Capacity signals (workload indicators, availability mentions)
4. Deadlines and timeframes
5. Project dependencies

Return JSON following TranscriptExtractionSchema. Use confidence scores to indicate certainty.
Context quotes must be direct excerpts from the transcript."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": user_prompt
        }]
    )
    
    # Extract text from response
    json_text = response.content[0].text
    
    # Strip markdown code fences if present
    clean_json = json_text.replace('```json\n', '').replace('\n```', '').strip()
    
    # Parse and validate
    extracted_data = json.loads(clean_json)
    
    return TranscriptExtractionSchema(**extracted_data)
```

### **Capacity Calculator Service**

```python
# app/services/capacity_calculator.py
from datetime import date, timedelta
from typing import List, Dict
from app.models.database import CapacitySnapshot, TeamMember, Assignment

def get_week_start(d: date = None) -> date:
    """Get Monday of the week for given date."""
    if d is None:
        d = date.today()
    return d - timedelta(days=d.weekday())

async def calculate_weekly_capacity(
    team_member_id: str,
    week_start_date: date = None
) -> CapacitySnapshot:
    """
    Calculate capacity snapshot for a team member for a specific week.
    
    Returns CapacitySnapshot with:
    - total_capacity_hours: Weekly capacity
    - allocated_hours: Sum of active assignments
    - available_hours: Remaining capacity
    - utilization_pct: Percentage utilized
    - overallocated: Boolean flag
    """
    
    if week_start_date is None:
        week_start_date = get_week_start()
    
    # Get team member capacity
    member = await get_team_member(team_member_id)
    
    # Sum all active assignments for this week
    active_assignments = await get_active_assignments(
        team_member_id=team_member_id,
        week_start_date=week_start_date
    )
    
    allocated_hours = sum(a.hours_this_week for a in active_assignments)
    
    # Calculate derived fields
    available_hours = member.weekly_capacity_hours - allocated_hours
    utilization_pct = (allocated_hours / member.weekly_capacity_hours) * 100
    overallocated = allocated_hours > member.weekly_capacity_hours
    
    # Upsert capacity snapshot
    snapshot = CapacitySnapshot(
        team_member_id=team_member_id,
        week_start_date=week_start_date,
        total_capacity_hours=member.weekly_capacity_hours,
        allocated_hours=allocated_hours,
        available_hours=available_hours,
        utilization_pct=utilization_pct,
        overallocated=overallocated
    )
    
    await upsert_capacity_snapshot(snapshot)
    
    return snapshot

async def detect_capacity_conflicts(
    week_start_date: date = None
) -> List[Dict]:
    """
    Detect capacity conflicts for all team members in a given week.
    
    Returns list of conflicts with:
    - type: 'overallocation' | 'timeline-conflict' | 'skill-mismatch'
    - team_member_id: Affected team member
    - affected_projects: List of conflicting projects
    - severity: 'low' | 'medium' | 'high'
    - description: Human-readable description
    - suggested_resolution: Recommended action
    """
    
    if week_start_date is None:
        week_start_date = get_week_start()
    
    conflicts = []
    
    # Get all capacity snapshots for this week
    snapshots = await get_capacity_snapshots(week_start_date)
    
    for snapshot in snapshots:
        # Check overallocation
        if snapshot.overallocated:
            overage = snapshot.allocated_hours - snapshot.total_capacity_hours
            
            # Get assignments for this member
            assignments = await get_active_assignments(
                team_member_id=snapshot.team_member_id,
                week_start_date=week_start_date
            )
            
            conflicts.append({
                'type': 'overallocation',
                'team_member_id': snapshot.team_member_id,
                'affected_projects': [a.project.name for a in assignments],
                'severity': 'high' if overage > 10 else 'medium' if overage > 5 else 'low',
                'description': f"{snapshot.team_member.full_name} is {overage}h overallocated this week",
                'suggested_resolution': f"Reduce hours on: {max(assignments, key=lambda a: a.hours_this_week).project.name}"
            })
        
        # Check for conflicting urgent deadlines
        urgent_projects = [a for a in snapshot.assignments 
                          if a.project.priority == 'urgent' and a.project.deadline]
        
        if len(urgent_projects) > 1:
            conflicts.append({
                'type': 'timeline-conflict',
                'team_member_id': snapshot.team_member_id,
                'affected_projects': [a.project.name for a in urgent_projects],
                'severity': 'high',
                'description': f"{snapshot.team_member.full_name} has {len(urgent_projects)} urgent projects with overlapping deadlines"
            })
    
    return conflicts
```

---

## Database Schema Patterns

### **Supabase Row Level Security (RLS)**

```sql
-- Enable RLS on all tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_snapshots ENABLE ROW LEVEL SECURITY;

-- Single-tenant agency: all authenticated users can read/write
-- (Refine based on roles in production if needed)

CREATE POLICY "Authenticated users can view all data"
ON team_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage data"
ON assignments FOR ALL
USING (auth.uid() IS NOT NULL);
```

### **Useful Views**

```sql
-- Current week capacity overview
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
LEFT JOIN capacity_snapshots cs 
  ON cs.team_member_id = tm.id
WHERE cs.week_start_date = DATE_TRUNC('week', CURRENT_DATE)
  AND tm.active = true
ORDER BY cs.utilization_pct DESC;

-- Project workload summary
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
LEFT JOIN assignments a 
  ON a.project_id = p.id AND a.status = 'active'
WHERE p.status IN ('active', 'briefing')
GROUP BY p.id
ORDER BY p.deadline ASC NULLS LAST;
```

---

## Critical Rules (Never Violate)

### **NEVER Do Without Checking**
- [ ] Create new files without checking BLUEPRINT.md for location
- [ ] Add dependencies without checking STACK.md for approved versions
- [ ] Implement features without checking task files for requirements
- [ ] Change patterns without checking PATTERNS.md
- [ ] Use border-radius > 0 (AIDEN design system)
- [ ] Create copy-paste UI when direct action is possible
- [ ] Skip confidence score visualization
- [ ] Show generic loading spinners without context
- [ ] Make users remember info between screens

### **ALWAYS Do**
- [ ] Update STATUS.md after completing any task
- [ ] Follow AIDEN design system (sharp corners, high contrast)
- [ ] Use approved code patterns - copy, don't invent
- [ ] Mark task checkboxes when complete
- [ ] Provide optimistic UI updates
- [ ] Show progress for AI operations (5-15s)
- [ ] Include confidence scores in extraction UI
- [ ] Test keyboard navigation
- [ ] Implement proper error recovery paths

---

## Current Focus

**Active Phase**: Phase 1 - Foundation  
**Active Task File**: `.claude/tasks/phase-1-foundation.md`  
**Blockers**: None

---

## Session Startup Checklist

When starting ANY session:
```
1. Read STATUS.md → Know where we are
2. Read active task file → Know what's next
3. Check DECISIONS.md if architectural questions arise
4. Use PATTERNS.md for all implementations
5. Reference this CLAUDE.md for UX/design constraints
```

---

## Documentation Updates

After completing work:
1. Update STATUS.md with completed items
2. Check off completed tasks in task files
3. Add any new decisions to DECISIONS.md
4. Add any new patterns to PATTERNS.md
5. Update this CLAUDE.md if core constraints change

---

**Remember**: This is a professional tool for a creative agency. Make it powerful, make it fast, make it feel technical. Don't make it cute.
