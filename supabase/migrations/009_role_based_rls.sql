-- ============================================================================
-- Alt/Shift Traffic Manager - Role-Based RLS Policies
-- Migration: 009_role_based_rls.sql
-- Purpose: Replace permissive policies with role-based access control
-- ============================================================================

-- ============================================================================
-- PROJECTS: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

-- Create role-based write policies
CREATE POLICY "Managers can insert projects"
ON projects FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update projects"
ON projects FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete projects"
ON projects FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- TEAM MEMBERS: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can update team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can delete team members" ON team_members;

-- Create role-based write policies
CREATE POLICY "Managers can insert team members"
ON team_members FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update team members"
ON team_members FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete team members"
ON team_members FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- ASSIGNMENTS: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON assignments;

-- Create role-based write policies
CREATE POLICY "Managers can insert assignments"
ON assignments FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update assignments"
ON assignments FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete assignments"
ON assignments FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- TRANSCRIPTS: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert transcripts" ON transcripts;
DROP POLICY IF EXISTS "Authenticated users can update transcripts" ON transcripts;
DROP POLICY IF EXISTS "Authenticated users can delete transcripts" ON transcripts;

-- Create role-based write policies
CREATE POLICY "Managers can insert transcripts"
ON transcripts FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update transcripts"
ON transcripts FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete transcripts"
ON transcripts FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- MILESTONES: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies (if they exist)
DROP POLICY IF EXISTS "Authenticated users can insert milestones" ON milestones;
DROP POLICY IF EXISTS "Authenticated users can update milestones" ON milestones;
DROP POLICY IF EXISTS "Authenticated users can delete milestones" ON milestones;

-- Ensure RLS is enabled
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- SELECT policy (everyone authenticated can view)
CREATE POLICY "Authenticated users can view milestones"
ON milestones FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Role-based write policies
CREATE POLICY "Managers can insert milestones"
ON milestones FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update milestones"
ON milestones FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete milestones"
ON milestones FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- DELIVERABLES: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies (if they exist)
DROP POLICY IF EXISTS "Authenticated users can insert deliverables" ON deliverables;
DROP POLICY IF EXISTS "Authenticated users can update deliverables" ON deliverables;
DROP POLICY IF EXISTS "Authenticated users can delete deliverables" ON deliverables;

-- Ensure RLS is enabled
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- SELECT policy (everyone authenticated can view)
CREATE POLICY "Authenticated users can view deliverables"
ON deliverables FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Role-based write policies
CREATE POLICY "Managers can insert deliverables"
ON deliverables FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update deliverables"
ON deliverables FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete deliverables"
ON deliverables FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- PROFILES: Special rules - users can view all, update own (non-role fields)
-- Admins can update anyone's role
-- ============================================================================

-- Keep existing SELECT policy (all authenticated can view)
-- Update the UPDATE policy to be more nuanced

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Users can update their own profile (but not role field via app - that's admin only)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin(auth.uid()));

-- ============================================================================
-- TIME ENTRIES: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert time entries" ON time_entries;
DROP POLICY IF EXISTS "Authenticated users can update time entries" ON time_entries;
DROP POLICY IF EXISTS "Authenticated users can delete time entries" ON time_entries;

-- Role-based write policies
CREATE POLICY "Managers can insert time entries"
ON time_entries FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update time entries"
ON time_entries FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete time entries"
ON time_entries FOR DELETE
USING (can_edit(auth.uid()));

-- ============================================================================
-- CAPACITY SNAPSHOTS: Managers/Admins can modify, everyone can view
-- ============================================================================

-- Drop existing permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert capacity snapshots" ON capacity_snapshots;
DROP POLICY IF EXISTS "Authenticated users can update capacity snapshots" ON capacity_snapshots;
DROP POLICY IF EXISTS "Authenticated users can delete capacity snapshots" ON capacity_snapshots;

-- Role-based write policies
CREATE POLICY "Managers can insert capacity snapshots"
ON capacity_snapshots FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Managers can update capacity snapshots"
ON capacity_snapshots FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Managers can delete capacity snapshots"
ON capacity_snapshots FOR DELETE
USING (can_edit(auth.uid()));
