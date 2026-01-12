-- ============================================================================
-- Alt/Shift Traffic Manager - Initial Schema
-- Migration: 001_initial_schema.sql
-- Created: 2025-01-13
-- ============================================================================

-- ============================================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEAM MEMBERS (with Capacity Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
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

-- ============================================================================
-- PROJECTS (with Phase-Based Time Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
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

-- ============================================================================
-- ASSIGNMENTS (Person + Project + Time Allocation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignments (
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

-- ============================================================================
-- TIME ENTRIES (Actual Hours Logged)
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_entries (
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

-- ============================================================================
-- TRANSCRIPTS (Meeting Archive + AI Extraction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transcript Data
  meeting_date DATE NOT NULL,
  meeting_type TEXT CHECK (meeting_type IN ('wip', 'planning', 'client-debrief')),
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

-- ============================================================================
-- CAPACITY SNAPSHOTS (Weekly Capacity State)
-- ============================================================================
CREATE TABLE IF NOT EXISTS capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- Week Identifier
  week_start_date DATE NOT NULL, -- Monday of the week

  -- Capacity Calculation
  total_capacity_hours DECIMAL(5,2) NOT NULL,
  allocated_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  available_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_capacity_hours - allocated_hours) STORED,
  utilization_pct DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_capacity_hours > 0
    THEN (allocated_hours / total_capacity_hours) * 100
    ELSE 0 END
  ) STORED,

  -- Status Flags
  overallocated BOOLEAN GENERATED ALWAYS AS (allocated_hours > total_capacity_hours) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_member_id, week_start_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member ON assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_capacity_week ON capacity_snapshots(week_start_date);
CREATE INDEX IF NOT EXISTS idx_capacity_member ON capacity_snapshots(team_member_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_transcripts_date ON transcripts(meeting_date);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);
