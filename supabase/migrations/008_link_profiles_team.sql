-- ============================================================================
-- Alt/Shift Traffic Manager - Link Profiles to Team Members
-- Migration: 008_link_profiles_team.sql
-- Purpose: Connect auth users to their team_member records for role-based access
-- ============================================================================

-- Add profile_id to link auth users to team members
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create unique index (one team_member per profile)
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_profile
ON team_members(profile_id) WHERE profile_id IS NOT NULL;

-- Auto-link existing records by email match
UPDATE team_members tm
SET profile_id = p.id
FROM profiles p
WHERE LOWER(tm.email) = LOWER(p.email)
  AND tm.profile_id IS NULL;

-- Update role constraint to include viewer
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'viewer', 'member'));

-- Helper function: check if user can edit (admin or manager)
CREATE OR REPLACE FUNCTION can_edit(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'manager') FROM profiles WHERE id = user_id),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = user_id),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get current user's team_member_id
CREATE OR REPLACE FUNCTION get_my_team_member_id()
RETURNS UUID AS $$
  SELECT id FROM team_members WHERE profile_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'member'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
