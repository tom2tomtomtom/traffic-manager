-- ============================================================================
-- Alt/Shift Traffic Manager - RLS Policies, Views, Functions & Triggers
-- Migration: 002_rls_policies.sql
-- Created: 2025-01-13
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Single-tenant - all authenticated users can access)
-- ============================================================================

-- Profiles
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- Team Members
CREATE POLICY "Authenticated users can view all team members"
ON team_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert team members"
ON team_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update team members"
ON team_members FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete team members"
ON team_members FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Projects
CREATE POLICY "Authenticated users can view all projects"
ON projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update projects"
ON projects FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete projects"
ON projects FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Assignments
CREATE POLICY "Authenticated users can view all assignments"
ON assignments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert assignments"
ON assignments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update assignments"
ON assignments FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete assignments"
ON assignments FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Time Entries
CREATE POLICY "Authenticated users can view all time entries"
ON time_entries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert time entries"
ON time_entries FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update time entries"
ON time_entries FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete time entries"
ON time_entries FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Transcripts
CREATE POLICY "Authenticated users can view all transcripts"
ON transcripts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert transcripts"
ON transcripts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update transcripts"
ON transcripts FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete transcripts"
ON transcripts FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Capacity Snapshots
CREATE POLICY "Authenticated users can view all capacity snapshots"
ON capacity_snapshots FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert capacity snapshots"
ON capacity_snapshots FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update capacity snapshots"
ON capacity_snapshots FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete capacity snapshots"
ON capacity_snapshots FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Handle new user signup (create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate capacity snapshot for a team member
CREATE OR REPLACE FUNCTION recalculate_capacity_snapshot(
  p_team_member_id UUID,
  p_week_start_date DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS capacity_snapshots AS $$
DECLARE
  v_member team_members%ROWTYPE;
  v_allocated DECIMAL(5,2);
  v_result capacity_snapshots%ROWTYPE;
BEGIN
  -- Get team member
  SELECT * INTO v_member FROM team_members WHERE id = p_team_member_id;

  IF v_member IS NULL THEN
    RAISE EXCEPTION 'Team member not found: %', p_team_member_id;
  END IF;

  -- Sum allocated hours for the week from active assignments
  SELECT COALESCE(SUM(hours_this_week), 0) INTO v_allocated
  FROM assignments
  WHERE team_member_id = p_team_member_id
    AND status = 'active';

  -- Upsert capacity snapshot
  INSERT INTO capacity_snapshots (team_member_id, week_start_date, total_capacity_hours, allocated_hours)
  VALUES (p_team_member_id, p_week_start_date, v_member.weekly_capacity_hours, v_allocated)
  ON CONFLICT (team_member_id, week_start_date)
  DO UPDATE SET
    total_capacity_hours = v_member.weekly_capacity_hours,
    allocated_hours = v_allocated
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to recalculate capacity on assignment changes
CREATE OR REPLACE FUNCTION trigger_recalculate_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_team_member_id UUID;
BEGIN
  -- Get the affected team member ID
  IF TG_OP = 'DELETE' THEN
    v_team_member_id := OLD.team_member_id;
  ELSE
    v_team_member_id := NEW.team_member_id;
  END IF;

  -- Recalculate capacity for affected team member
  PERFORM recalculate_capacity_snapshot(v_team_member_id);

  -- If team member changed (rare case), recalculate for old member too
  IF TG_OP = 'UPDATE' AND OLD.team_member_id != NEW.team_member_id THEN
    PERFORM recalculate_capacity_snapshot(OLD.team_member_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get week start date (Monday) for a given date
CREATE OR REPLACE FUNCTION get_week_start(p_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('week', p_date)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Capacity recalculation on assignment changes
DROP TRIGGER IF EXISTS on_assignment_change ON assignments;
CREATE TRIGGER on_assignment_change
  AFTER INSERT OR UPDATE OR DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_capacity();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Current Week Capacity Overview
CREATE OR REPLACE VIEW current_week_capacity AS
SELECT
  tm.id,
  tm.full_name,
  tm.role,
  tm.weekly_capacity_hours,
  COALESCE(cs.allocated_hours, 0) as allocated_hours,
  COALESCE(cs.available_hours, tm.weekly_capacity_hours) as available_hours,
  COALESCE(cs.utilization_pct, 0) as utilization_pct,
  COALESCE(cs.overallocated, false) as overallocated
FROM team_members tm
LEFT JOIN capacity_snapshots cs ON cs.team_member_id = tm.id
  AND cs.week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE
WHERE tm.active = true
ORDER BY cs.utilization_pct DESC NULLS LAST;

-- Project Workload Summary
CREATE OR REPLACE VIEW project_workload AS
SELECT
  p.id,
  p.name,
  p.client,
  p.status,
  p.phase,
  p.deadline,
  p.priority,
  COUNT(a.id) AS team_size,
  COALESCE(SUM(a.estimated_hours), 0) AS total_estimated_hours,
  COALESCE(SUM(a.hours_consumed), 0) AS total_hours_consumed,
  COALESCE(SUM(a.estimated_hours) - SUM(a.hours_consumed), 0) AS remaining_hours
FROM projects p
LEFT JOIN assignments a ON a.project_id = p.id AND a.status = 'active'
WHERE p.status IN ('active', 'briefing')
GROUP BY p.id
ORDER BY p.deadline ASC NULLS LAST;

-- Team Member Assignment Overview
CREATE OR REPLACE VIEW team_assignment_overview AS
SELECT
  tm.id,
  tm.full_name,
  tm.role,
  tm.weekly_capacity_hours,
  COUNT(a.id) AS active_projects,
  COALESCE(SUM(a.hours_this_week), 0) AS hours_this_week,
  COALESCE(SUM(a.estimated_hours - a.hours_consumed), 0) AS remaining_hours_total,
  ARRAY_AGG(p.name ORDER BY p.deadline) FILTER (WHERE p.name IS NOT NULL) AS project_names
FROM team_members tm
LEFT JOIN assignments a ON a.team_member_id = tm.id AND a.status = 'active'
LEFT JOIN projects p ON p.id = a.project_id
WHERE tm.active = true
GROUP BY tm.id
ORDER BY hours_this_week DESC;
