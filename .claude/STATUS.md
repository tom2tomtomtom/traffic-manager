# Project Status

## Current State

**Phase**: Foundation (Phase 1) - Nearly Complete
**Status**: Core Flow Working - Needs Polish & Wiring
**Last Updated**: 2025-01-13

---

## What's Working

### Authentication
- [x] Magic link login via Supabase
- [x] Auth callback handling
- [x] Protected routes via middleware
- [x] Sign out functionality

### Transcript Processing
- [x] Upload page with word count validation
- [x] Claude AI extraction (claude-sonnet-4)
- [x] Progress indicator during processing
- [x] Saves to Supabase transcripts table
- [x] Redirects to review page after processing

### Review Page
- [x] Fetches transcript from database
- [x] Displays extracted projects, assignments, capacity signals
- [x] Confidence badges (HIGH/REVIEW/VERIFY)
- [x] Selectable assignments for bulk approval
- [x] AIDEN brutalist design system

### Capacity Page
- [x] Page structure complete
- [x] Capacity heatmap component
- [x] Overallocation warnings

---

## What's Broken/Missing

### Critical Path Issues

1. **Wrong URL Paths in Nav**
   - `dashboard-nav.tsx` uses `/dashboard/upload` instead of `/upload`
   - `dashboard-nav.tsx` uses `/dashboard/capacity` instead of `/capacity`
   - `extraction-review.tsx` redirects to `/dashboard/capacity`
   - These cause 404 errors

2. **Assignment Approval Not Implemented**
   - `handleApproveSelected()` only logs to console
   - Needs API route to create assignments in database
   - No project creation from extracted data

3. **No Seed Data**
   - No team members in database
   - No projects in database
   - Capacity page shows "No team members found"

4. **Hours Not Captured**
   - Extraction doesn't include `hours_this_week` field
   - Assignment interface missing hours input
   - Claude prompt needs to extract hour estimates

---

## Remaining Tasks

### Priority 1: Fix Broken Paths
- [ ] Update `dashboard-nav.tsx` hrefs to remove `/dashboard` prefix
- [ ] Update `extraction-review.tsx` redirect path
- [ ] Verify all navigation works

### Priority 2: Wire Up Assignment Approval
- [ ] Create `/api/assignments/approve` route
- [ ] Match/create team members from extracted names
- [ ] Match/create projects from extracted data
- [ ] Create assignments with hours
- [ ] Update capacity snapshots

### Priority 3: Seed Data
- [ ] Add Alt/Shift team members to database
- [ ] Add sample projects (or create from extractions)

### Priority 4: UX Polish
- [ ] Add hours input to assignment review
- [ ] Pre-select high-confidence assignments
- [ ] Add edit functionality for assignments
- [ ] Add success toast after approval
- [ ] Show capacity impact preview before approval

### Priority 5: Capacity Dashboard
- [ ] Test with real data
- [ ] Add click-through to see assignments
- [ ] Add weekly navigation

---

## File Issues to Fix

| File | Issue |
|------|-------|
| `src/components/layouts/dashboard-nav.tsx` | Wrong hrefs: `/dashboard/upload` → `/upload`, `/dashboard/capacity` → `/capacity` |
| `src/components/features/extraction-review.tsx` | Wrong redirect: `/dashboard/capacity` → `/capacity` |
| `src/components/features/extraction-review.tsx` | `handleApproveSelected()` needs implementation |
| `src/app/api/assignments/approve/route.ts` | Doesn't exist - needs creation |

---

## Database Status

### Tables Created (via migrations)
- [x] profiles
- [x] team_members
- [x] projects
- [x] assignments
- [x] time_entries
- [x] transcripts
- [x] capacity_snapshots

### Views Created
- [x] current_week_capacity
- [x] project_workload
- [x] team_assignment_overview

### Data Status
- transcripts: Has data (from testing)
- team_members: EMPTY
- projects: EMPTY
- assignments: EMPTY
- capacity_snapshots: EMPTY

---

## Quick Test Checklist

1. Login at `/login` ✅
2. Upload transcript at `/upload` ✅
3. See extraction at `/review/[id]` ✅
4. Approve assignments → ❌ (not implemented)
5. See capacity at `/capacity` → ⚠️ (no data)

---

## Notes

- Routes use (dashboard) route group - URLs don't include "dashboard"
- All pages are at `/upload`, `/capacity`, `/review/[id]` (not `/dashboard/*`)
- Claude extraction working well with good confidence scores
- AIDEN design system rendering correctly
