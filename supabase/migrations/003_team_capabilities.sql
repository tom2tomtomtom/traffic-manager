-- ============================================================================
-- Alt/Shift Traffic Manager - Team Capabilities
-- Migration: 003_team_capabilities.sql
-- Created: 2025-01-13
-- ============================================================================

-- Add capability columns to team_members
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS core_roles TEXT[] DEFAULT '{}';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'Executor';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS known_clients TEXT[] DEFAULT '{}';

-- Create index for capability searches
CREATE INDEX IF NOT EXISTS idx_team_members_core_roles ON team_members USING GIN (core_roles);
CREATE INDEX IF NOT EXISTS idx_team_members_capabilities ON team_members USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS idx_team_members_industries ON team_members USING GIN (industries);
CREATE INDEX IF NOT EXISTS idx_team_members_known_clients ON team_members USING GIN (known_clients);
