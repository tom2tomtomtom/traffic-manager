# Supabase Implementation Guide

## Database Schema Overview

The Alt/Shift Traffic Manager uses 6 core tables with PostgreSQL-specific features for capacity tracking.

---

## Tables

### 1. profiles (extends Supabase auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'producer', 'creative', 'strategy', 'director'

  -- Capacity Configuration
  weekly_capacity_hours DECIMAL(5,2) DEFAULT 40.0,
  billable_target_hours DECIMAL(5,2) DEFAULT 32.0,

  -- Metadata
  skills TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT,

  -- Project Status
  status TEXT DEFAULT 'active' CHECK (status IN ('briefing', 'active', 'on-hold', 'completed', 'archived')),
  phase TEXT CHECK (phase IN ('pre-production', 'production', 'post-production', 'client-review', 'final-delivery')),

  -- Time Estimates
  estimated_total_hours DECIMAL(6,2),
  hours_consumed DECIMAL(6,2) DEFAULT 0,

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
```

### 4. assignments
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

  -- Assignment Details
  role_on_project TEXT NOT NULL,

  -- Time Allocation
  estimated_hours DECIMAL(6,2) NOT NULL,
  hours_this_week DECIMAL(5,2) DEFAULT 0,
  hours_consumed DECIMAL(6,2) DEFAULT 0,

  -- Status Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  assigned_by TEXT DEFAULT 'ai',
  confidence_score DECIMAL(3,2),

  -- Timeline
  start_date DATE,
  end_date DATE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, team_member_id)
);
```

### 5. time_entries
```sql
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

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. transcripts
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transcript Data
  meeting_date DATE NOT NULL,
  meeting_type TEXT CHECK (meeting_type IN ('wip', 'planning', 'client-debrief')),
  raw_text TEXT NOT NULL,
  audio_url TEXT,

  -- AI Extraction Results
  extracted_data JSONB,
  extraction_model TEXT,
  extraction_confidence DECIMAL(3,2),

  -- Processing Metadata
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES team_members(id),
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. capacity_snapshots
```sql
CREATE TABLE capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id),

  -- Week Identifier
  week_start_date DATE NOT NULL,

  -- Capacity Calculation
  total_capacity_hours DECIMAL(5,2) NOT NULL,
  allocated_hours DECIMAL(5,2) NOT NULL,
  available_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_capacity_hours - allocated_hours) STORED,
  utilization_pct DECIMAL(5,2) GENERATED ALWAYS AS ((allocated_hours / NULLIF(total_capacity_hours, 0)) * 100) STORED,

  -- Status Flags
  overallocated BOOLEAN GENERATED ALWAYS AS (allocated_hours > total_capacity_hours) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(team_member_id, week_start_date)
);
```

---

## Views

### current_week_capacity
```sql
CREATE VIEW current_week_capacity AS
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
```

### project_workload
```sql
CREATE VIEW project_workload AS
SELECT
  p.id,
  p.name,
  p.client,
  p.status,
  p.phase,
  p.deadline,
  COUNT(a.id) AS team_size,
  COALESCE(SUM(a.estimated_hours), 0) AS total_estimated_hours,
  COALESCE(SUM(a.hours_consumed), 0) AS total_hours_consumed,
  COALESCE(SUM(a.estimated_hours) - SUM(a.hours_consumed), 0) AS remaining_hours
FROM projects p
LEFT JOIN assignments a ON a.project_id = p.id AND a.status = 'active'
WHERE p.status IN ('active', 'briefing')
GROUP BY p.id
ORDER BY p.deadline ASC NULLS LAST;
```

### team_assignment_overview
```sql
CREATE VIEW team_assignment_overview AS
SELECT
  tm.id,
  tm.full_name,
  tm.role,
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
```

---

## Functions & Triggers

### handle_new_user
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### recalculate_capacity_snapshot
```sql
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

  -- Sum allocated hours for the week
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
```

### update_assignment_trigger
```sql
CREATE OR REPLACE FUNCTION trigger_recalculate_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate capacity for affected team member
  PERFORM recalculate_capacity_snapshot(
    COALESCE(NEW.team_member_id, OLD.team_member_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_assignment_change
  AFTER INSERT OR UPDATE OR DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_capacity();
```

### updated_at trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS) Policies

### Enable RLS
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_snapshots ENABLE ROW LEVEL SECURITY;
```

### Policies (Single-tenant - all authenticated users can access)
```sql
-- Profiles
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Team Members
CREATE POLICY "Authenticated users can view all team members"
ON team_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage team members"
ON team_members FOR ALL
USING (auth.uid() IS NOT NULL);

-- Projects
CREATE POLICY "Authenticated users can view all projects"
ON projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage projects"
ON projects FOR ALL
USING (auth.uid() IS NOT NULL);

-- Assignments
CREATE POLICY "Authenticated users can view all assignments"
ON assignments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage assignments"
ON assignments FOR ALL
USING (auth.uid() IS NOT NULL);

-- Time Entries
CREATE POLICY "Authenticated users can view all time entries"
ON time_entries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage time entries"
ON time_entries FOR ALL
USING (auth.uid() IS NOT NULL);

-- Transcripts
CREATE POLICY "Authenticated users can view all transcripts"
ON transcripts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage transcripts"
ON transcripts FOR ALL
USING (auth.uid() IS NOT NULL);

-- Capacity Snapshots
CREATE POLICY "Authenticated users can view all capacity snapshots"
ON capacity_snapshots FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage capacity snapshots"
ON capacity_snapshots FOR ALL
USING (auth.uid() IS NOT NULL);
```

---

## Indexes

```sql
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_member ON assignments(team_member_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX idx_capacity_week ON capacity_snapshots(week_start_date);
CREATE INDEX idx_capacity_member ON capacity_snapshots(team_member_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_transcripts_date ON transcripts(meeting_date);
```

---

## Supabase Client Setup

### Browser Client (lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (lib/supabase/server.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  )
}
```

### Middleware Client (middleware.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/upload'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# .env (Backend)
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```
