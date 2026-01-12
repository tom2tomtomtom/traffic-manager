# Alt/Shift AI Traffic Manager - Development Package

## 📦 What You Have

This is a **complete, production-ready development specification** for Alt/Shift's AI Traffic Manager system. Every architectural decision has been made, every UX pattern defined, every component specified.

**This is not a concept. This is a blueprint ready for execution.**

---

## 🎯 System Overview

**The Core Innovation**: Teams paste meeting transcripts. AI extracts assignments. System tracks capacity automatically. Zero manual project board updates.

**The Competitive Advantage**: Other PM tools require manual data entry. This reverse-engineers structure from natural conversation - the way agencies actually work.

**The Critical Feature**: Tracks hours per person per week, not just "tasks assigned." Alt/Shift thinks in capacity: "Jess has 40h this week, Legos needs 15h, she's at 38h = OVERALLOCATED."

---

## 📚 Documentation Structure

### Core Development Guides

1. **`altshift_traffic_manager_CLAUDE.md`** → **START HERE**
   - Complete development guide for Claude Code/Cursor
   - UX patterns and design constraints
   - AIDEN design system integration
   - Component patterns with examples
   - Critical rules and anti-patterns

2. **`altshift_traffic_manager_blueprint.md`**
   - Complete system architecture
   - Database schema (6 tables + views)
   - API endpoint specifications
   - AI extraction logic
   - Capacity calculation algorithms
   - Development phases breakdown

3. **`altshift_traffic_manager_progress.md`**
   - Initial analysis of meeting transcripts
   - Pattern identification
   - Architecture decisions
   - Live session tracking template

### Project Structure (`.claude/` directory)

4. **`.claude/STATUS.md`**
   - Current project state
   - Completed milestones
   - Active work tracking
   - Next session goals

5. **`.claude/PATTERNS.md`**
   - Approved code patterns (copy these!)
   - AIDEN design system components
   - Backend patterns
   - Testing patterns
   - Anti-patterns to avoid

6. **`.claude/tasks/phase-1-foundation.md`**
   - Detailed task breakdown
   - Hour estimates
   - Verification checklists
   - Implementation notes
   - Completion criteria

---

## 🛠️ Tech Stack (Finalized)

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Frontend | Next.js | 15.x | App Router + React Server Components |
| Styling | Tailwind CSS | 3.4.x | AIDEN Design System (brutalist) |
| UI Library | shadcn/ui | Latest | Customizable components |
| Backend | Python FastAPI | 0.115+ | Superior AI integration |
| AI | Claude Sonnet 4 | 20250514 | Best for structured extraction |
| Database | Supabase | PostgreSQL 15 | Built-in auth + RLS |
| Deployment | Railway | - | Multi-service architecture |

---

## 🎨 Design System: AIDEN Brutalist

**Not a friendly consumer app. This is a professional tool for creative agencies.**

### Visual Identity
- **Sharp corners only** (border-radius: 0)
- **Deep black backgrounds** (#050505, #0a0a0a, #0f0f0f)
- **Electric red primary** (#ff2e2e)
- **Orange secondary** (#ff6b00)
- **High contrast text** (white on black)
- **Bold uppercase headings**
- **Grid background patterns**

### Why This Matters
Alt/Shift is a creative agency. The tool should feel **powerful and technical**, not playful and friendly. The design projects confidence and professionalism.

---

## 🧠 UX Critical Insights

### Tool Type: Automation
**Promise**: "Set it and forget it"  
**Priority**: Minimal clicks, smart defaults, invisible execution

### The Golden Rule: AI-to-Action
**If AI generated it and user approved it, ONE CLICK should complete the action.**

❌ BAD: Make users copy AI extraction, then manually create assignments  
✅ GOOD: Show extraction with "Approve" button that creates assignments instantly

### Confidence Scores Drive UX
- **High (>0.8)**: Auto-select for approval, green badge
- **Medium (0.5-0.8)**: Flag for review, yellow badge  
- **Low (<0.5)**: Require verification, red badge

### Progressive Disclosure
```
Level 1: Upload transcript, View capacity (always visible)
Level 2: Edit assignment, Adjust hours (one click away)
Level 3: Bulk operations, Export CSV (in menus)
Level 4: Historical analysis (in documentation)
```

---

## 🗄️ Database Architecture

### 6 Core Tables

1. **`team_members`** - Capacity configuration per person
2. **`projects`** - Phase tracking + time estimates
3. **`assignments`** - Person + Project + Hours + Confidence
4. **`time_entries`** - Actual hours logged
5. **`transcripts`** - Meeting archive + AI extraction
6. **`capacity_snapshots`** - Weekly capacity state (computed)

### The Capacity Calculation
```typescript
available_hours = weekly_capacity_hours - sum(assignments.hours_this_week)
utilization_pct = (allocated_hours / capacity_hours) * 100
overallocated = allocated_hours > capacity_hours
```

**Critical**: Recalculate capacity after EVERY assignment change.

---

## 🤖 AI Extraction Logic

### Claude Prompt Architecture

**System Prompt**: Role + Capabilities + Constraints  
**User Prompt**: Transcript + Schema + Examples  
**Output**: JSON with confidence scores

### What Gets Extracted

```typescript
{
  projects: [
    { name: "Legos", phase: "production", confidence: 0.9 }
  ],
  assignments: [
    { person: "Jess", project: "Legos", role: "producer", confidence: 0.85 }
  ],
  capacity_signals: [
    { person: "Elle", signal: "overallocated", context: "jam packed..." }
  ],
  deadlines: [
    { project: "Legos", milestone: "PPM", date: "Friday" }
  ]
}
```

### Entity Resolution
AI extracts "Jess" → Fuzzy match to "Jessica Thompson" in database  
Similarity threshold: 70% required for auto-match

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Core infrastructure + basic transcript processing

- [ ] Supabase setup + database migrations
- [ ] Next.js frontend + AIDEN theme
- [ ] FastAPI backend + Claude integration
- [ ] Basic upload → extract → display flow
- [ ] Railway deployment

**Deliverable**: Can upload transcript, see AI extraction

---

### Phase 2: Core Features (Week 2)
**Goal**: Complete extraction → assignment workflow

- [ ] Extraction review dashboard
- [ ] Manual override UI
- [ ] Assignment CRUD
- [ ] Capacity calculation engine
- [ ] Capacity dashboard with heatmap
- [ ] Conflict detection

**Deliverable**: Can process transcript, approve assignments, see capacity conflicts

---

### Phase 3: Intelligence & Polish (Week 3)
**Goal**: Recommendations + conflict resolution

- [ ] Hour estimation (based on historical data)
- [ ] Conflict detection algorithms
- [ ] 4-week capacity forecast
- [ ] Export functionality (CSV, PDF)
- [ ] Audit trail
- [ ] Mobile-responsive polish

**Deliverable**: Production-ready system with AI recommendations

---

## 💡 Key Technical Decisions

### 1. Python Backend (Not Node.js)
**Why**: Claude SDK native support, better for ML/data processing, clean separation (AI logic in Python, UI in Next.js)

### 2. Weekly Capacity Granularity (Not Daily/Monthly)
**Why**: Alt/Shift thinks in weeks ("jam packed this week"), daily too granular for planning, monthly too coarse

### 3. Confidence Scores Required
**Why**: Transcript analysis is ambiguous, users need to know when to verify, builds trust through transparency

### 4. Manual Approval Workflow
**Why**: AI suggests, humans approve - critical for agency trust and error prevention

---

## ⚠️ Critical Constraints

### NEVER Violate These

1. **No border-radius** (AIDEN design system)
2. **No copy-paste UI** for AI results (direct action buttons)
3. **No capacity changes** without recalculation
4. **No generic loading states** (always show context + progress)
5. **No friendly/playful tone** (professional technical tool)

### ALWAYS Include

1. **Confidence scores** on AI extractions
2. **Optimistic UI updates** for user actions
3. **Error recovery paths** (retry, edit, cancel)
4. **Progress indicators** for >1 second operations
5. **Keyboard navigation** support

---

## 📋 Before You Start Development

### Validate with Alt/Shift

1. ✅ Database schema matches their terminology?
2. ✅ Project phases accurate for their workflow?
3. ✅ Weekly capacity tracking right granularity?
4. ✅ Assignment roles match their team structure?

### Test AI Extraction

1. Run 5-10 real transcripts through Claude
2. Measure accuracy (projects, assignments, capacity)
3. Refine prompt based on failure modes
4. Document edge cases

### Get Infrastructure Ready

1. [ ] Anthropic API key
2. [ ] Supabase account + project
3. [ ] Railway account
4. [ ] Alt/Shift team member list
5. [ ] Sample transcripts for testing

---

## 🎯 Success Metrics

### MVP Success Criteria
- [ ] Process transcript in <30 seconds
- [ ] >80% accuracy on project identification
- [ ] >70% accuracy on assignment detection
- [ ] Zero manual capacity calculation
- [ ] Detect overallocation within 1h margin
- [ ] Mobile-responsive UI
- [ ] Production-deployed on Railway

### Business Value Metrics
- Time saved per week vs. manual updates
- Reduction in overallocation incidents
- Improved team utilization (closer to 80% target)
- Faster onboarding for new project managers

---

## 🚦 How to Use This Package

### For Development in Cursor/Claude Code

1. **Copy entire package** to project root
2. **Read `CLAUDE.md`** first (this is your "system prompt")
3. **Follow patterns** in `PATTERNS.md` (don't invent new ones)
4. **Update `STATUS.md`** after each session
5. **Work through** `phase-1-foundation.md` tasks sequentially

### For Architecture Review

1. **Read `blueprint.md`** for complete system design
2. Review database schema (6 tables)
3. Review API endpoints specification
4. Review AI extraction logic
5. Validate against Alt/Shift workflow

### For UX/Design Review

1. **Check AIDEN design system** specs in `CLAUDE.md`
2. Review component patterns (Button, Card, Badge)
3. Review flow design patterns (optimistic UI, progressive disclosure)
4. Review mobile-first constraints

---

## 🎓 What Makes This Different

### Most PM Tool Specs
- Generic task tracking
- Manual data entry required
- No capacity intelligence
- Friendly consumer design

### This Spec
- **Conversational extraction** (zero manual entry)
- **Hour-based capacity** tracking (not task counts)
- **AI confidence scores** (transparent uncertainty)
- **Professional brutalist** design (agency tool)
- **Complete patterns** (copy code, don't invent)

---

## 📞 Next Actions

### Immediate (Before Code)
1. ✅ Review blueprint with Alt/Shift team
2. ✅ Validate database schema accuracy
3. ✅ Test Claude extraction with real transcripts
4. ✅ Get infrastructure accounts set up

### Development Kickoff
**Tool**: Start in **Cursor** (rapid iteration, <5K lines initially)  
**Session 1**: Supabase setup + database migrations  
**Session 2**: Next.js scaffold + AIDEN theme  
**Session 3**: FastAPI + Claude integration  
**Session 4**: Upload flow + extraction display

---

## 🎉 You're Ready

This is not a proposal. This is not a concept. **This is a complete development specification.**

Every decision has been made. Every pattern has been defined. Every component has been specified.

**The only thing left to do is execute.**

Start with Phase 1, follow the patterns, update the status tracker, and ship production-ready code in 3 weeks.

---

**Package Created**: 2025-01-13  
**Total Planning Time**: ~4 hours  
**Estimated Development**: 60-80 hours (3 weeks)  
**System Complexity**: Medium (well-specified)  
**Risk Level**: Low (clear blueprint + established patterns)

**Let's build this. 🚀**
