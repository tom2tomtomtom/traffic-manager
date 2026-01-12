# Phase 1: Foundation

**Estimated Duration**: 1 week (20-30 hours)  
**Dependencies**: None  
**Status**: ⏳ Ready to Start

---

## Phase Objectives

1. Set up Supabase project with complete database schema
2. Initialize Next.js 15 frontend with AIDEN design system
3. Initialize Python FastAPI backend
4. Implement Claude API integration for transcript extraction
5. Deploy initial services to Railway

---

## Prerequisites Checklist

- [ ] Anthropic API key obtained
- [ ] Supabase account created
- [ ] Railway account created
- [ ] Alt/Shift team member list available
- [ ] Sample meeting transcripts for testing

---

## Tasks

### 1.1 Supabase Project Setup

**Status**: ⏳ Not Started  
**Estimate**: 3 hours  
**Actual**: -

#### Requirements
- [ ] Create new Supabase project
- [ ] Configure authentication settings
- [ ] Set up development and production environments
- [ ] Generate API keys and connection strings
- [ ] Configure RLS policies

#### Files to Create
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_views.sql`
- `.env.local` (with Supabase credentials)

#### Implementation Notes
```sql
-- Create all 6 core tables:
-- 1. team_members (with capacity config)
-- 2. projects (with phase tracking)
-- 3. assignments (with hours + confidence)
-- 4. time_entries (actual hours logged)
-- 5. transcripts (meeting archive)
-- 6. capacity_snapshots (weekly capacity state)

-- See BLUEPRINT.md for complete schema
```

#### Verification
- [ ] Can connect to Supabase from localhost
- [ ] All tables created successfully
- [ ] RLS policies active and tested
- [ ] Views return correct data
- [ ] Sample data can be inserted

---

### 1.2 Next.js Frontend Initialization

**Status**: ⏳ Not Started  
**Estimate**: 4 hours  
**Actual**: -

#### Requirements
- [ ] Initialize Next.js 15 with App Router
- [ ] Configure Tailwind CSS with AIDEN theme
- [ ] Install shadcn/ui base components
- [ ] Set up Supabase client (browser + server)
- [ ] Create basic layout structure
- [ ] Implement authentication pages

#### Files to Create
```
Frontend scaffold with AIDEN design system:
- app/layout.tsx (root with AIDEN theme)
- app/(auth)/login/page.tsx
- app/(auth)/layout.tsx
- app/(dashboard)/layout.tsx (navigation)
- components/ui/button.tsx (AIDEN styled)
- components/ui/card.tsx (AIDEN styled)
- components/ui/badge.tsx (confidence badges)
- lib/supabase/client.ts
- lib/supabase/server.ts
- tailwind.config.ts (AIDEN colors)
```

#### Implementation Notes
```bash
# Initialize project
npx create-next-app@latest altshift-traffic-manager --typescript --tailwind --app
cd altshift-traffic-manager

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install shadcn/ui
npx shadcn-ui@latest init

# Add base components
npx shadcn-ui@latest add button card input textarea badge
```

#### Verification
- [ ] Dev server runs on localhost:3000
- [ ] AIDEN theme colors applied correctly
- [ ] Login page renders with proper styling
- [ ] Navigation uses sharp corners (no border-radius)
- [ ] Typography follows AIDEN patterns
- [ ] Can authenticate via Supabase

---

### 1.3 FastAPI Backend Initialization

**Status**: ⏳ Not Started  
**Estimate**: 3 hours  
**Actual**: -

#### Requirements
- [ ] Initialize Python FastAPI project
- [ ] Set up project structure
- [ ] Configure CORS for Next.js frontend
- [ ] Implement health check endpoint
- [ ] Create Supabase client wrapper
- [ ] Set up environment configuration

#### Files to Create
```
backend/
├── app/
│   ├── main.py (FastAPI app + CORS)
│   ├── config.py (environment config)
│   ├── api/
│   │   ├── routes/
│   │   │   ├── transcripts.py
│   │   │   ├── assignments.py
│   │   │   └── capacity.py
│   │   └── dependencies.py
│   ├── services/
│   │   └── claude_extractor.py
│   ├── models/
│   │   ├── database.py
│   │   └── schemas.py
│   └── db/
│       └── supabase_client.py
├── requirements.txt
├── Dockerfile
└── .env
```

#### Implementation Notes
```python
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
anthropic==0.75.0
supabase==2.15.0
pydantic==2.12.0
python-dotenv==1.0.0
```

#### Verification
- [ ] Dev server runs on localhost:8000
- [ ] /health endpoint returns 200
- [ ] CORS allows Next.js origin
- [ ] Can connect to Supabase
- [ ] Environment variables load correctly

---

### 1.4 Claude API Integration

**Status**: ⏳ Not Started  
**Estimate**: 5 hours  
**Actual**: -

#### Requirements
- [ ] Implement Claude client wrapper
- [ ] Create extraction system prompt
- [ ] Implement structured JSON parsing
- [ ] Add confidence score calculation
- [ ] Handle API errors gracefully
- [ ] Test with real meeting transcripts

#### Files to Create
- `backend/app/services/claude_extractor.py`
- `backend/app/models/extraction_schema.py`
- `backend/tests/test_claude_extraction.py`

#### Implementation Notes
```python
# Key patterns from prompt-engineering-patterns skill:
# 1. Clear system prompt with role, capabilities, constraints
# 2. Explicit JSON schema in user prompt
# 3. Confidence scores for all extractions
# 4. Context preservation (original quotes)
# 5. Error handling for malformed JSON

# Test with actual transcripts from Alt/Shift
```

#### Verification
- [ ] Can extract projects from transcript
- [ ] Can detect assignments (explicit + implicit)
- [ ] Confidence scores calculated (0-1)
- [ ] Context quotes preserved
- [ ] Handles edge cases (short transcripts, no data)
- [ ] Response time < 10 seconds

---

### 1.5 Basic Upload Flow

**Status**: ⏳ Not Started  
**Estimate**: 6 hours  
**Actual**: -

#### Requirements
- [ ] Create transcript upload page
- [ ] Implement transcript processing API route
- [ ] Show progress indicator during extraction
- [ ] Display extraction results
- [ ] Handle errors with recovery UI

#### Files to Create
- `app/(dashboard)/upload/page.tsx`
- `components/features/transcript-upload.tsx`
- `components/features/extraction-preview.tsx`
- `backend/app/api/routes/transcripts.py`

#### Implementation Notes
```typescript
// Upload flow:
// 1. User pastes transcript
// 2. Click "Analyze" → API call to FastAPI
// 3. Show progress bar (5-15 seconds)
// 4. Display extraction results
// 5. Allow manual edits before finalizing

// Use optimistic UI patterns
// Show confidence badges
// Provide error recovery
```

#### Verification
- [ ] Can paste transcript text
- [ ] Progress indicator shows during processing
- [ ] Results display correctly
- [ ] Confidence badges visible
- [ ] Can handle extraction errors
- [ ] UI matches AIDEN design system

---

### 1.6 Railway Deployment

**Status**: ⏳ Not Started  
**Estimate**: 4 hours  
**Actual**: -

#### Requirements
- [ ] Configure Railway project
- [ ] Deploy Next.js frontend
- [ ] Deploy FastAPI backend
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Verify production deployment

#### Files to Create
- `railway.json` (service configuration)
- `.dockerignore` (for backend)
- `Dockerfile` (for backend)

#### Implementation Notes
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Verification
- [ ] Frontend accessible via Railway URL
- [ ] Backend health check returns 200
- [ ] CORS configured for production domain
- [ ] Environment variables loaded correctly
- [ ] Supabase connection works in production
- [ ] Claude API works in production

---

## Phase Completion Criteria

- [ ] All tasks marked complete
- [ ] All verifications passing
- [ ] No TypeScript errors
- [ ] No Python lint errors
- [ ] Can upload transcript and see extraction
- [ ] Production deployment successful
- [ ] STATUS.md updated

---

## Phase Sign-off

**Completed**: [Date]  
**Signed off by**: [Name]  
**Notes**: 

---

## Blockers & Resolutions

| Blocker | Impact | Resolution | Date Resolved |
|---------|--------|------------|---------------|
| None yet | - | - | - |

---

## Lessons Learned

(To be filled in after phase completion)

---

**Next Phase**: Phase 2 - Core Features (extraction review, capacity dashboard, assignment CRUD)
