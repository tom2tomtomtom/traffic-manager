-- Deliverables table for tracking project outputs
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES team_members(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started',
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES team_members(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_deliverable_status CHECK (status IN ('not_started', 'in_progress', 'review', 'approved', 'blocked'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to ON deliverables(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON deliverables(due_date);

-- Enable RLS
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view deliverables"
ON deliverables FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert deliverables"
ON deliverables FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deliverables"
ON deliverables FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deliverables"
ON deliverables FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_deliverables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_deliverables_updated_at();

-- Deliverable templates table for quick-add
CREATE TABLE IF NOT EXISTS deliverable_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE deliverable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
ON deliverable_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage templates"
ON deliverable_templates FOR ALL
USING (auth.uid() IS NOT NULL);

-- Insert some default templates
INSERT INTO deliverable_templates (name, project_type, items) VALUES
('Video Production', 'video', '[
  {"name": "Creative Brief", "requires_approval": true},
  {"name": "Script Draft", "requires_approval": true},
  {"name": "Storyboard", "requires_approval": false},
  {"name": "First Cut", "requires_approval": true},
  {"name": "Final Edit", "requires_approval": true},
  {"name": "Color Grade", "requires_approval": false},
  {"name": "Sound Mix", "requires_approval": false},
  {"name": "Final Delivery", "requires_approval": true}
]'),
('PR Campaign', 'pr', '[
  {"name": "Media List", "requires_approval": false},
  {"name": "Press Release Draft", "requires_approval": true},
  {"name": "Media Kit", "requires_approval": true},
  {"name": "Pitch Deck", "requires_approval": true},
  {"name": "Coverage Report", "requires_approval": false}
]'),
('Social Campaign', 'social', '[
  {"name": "Content Calendar", "requires_approval": true},
  {"name": "Creative Assets", "requires_approval": true},
  {"name": "Copy Deck", "requires_approval": true},
  {"name": "Platform Setup", "requires_approval": false},
  {"name": "Launch Checklist", "requires_approval": false},
  {"name": "Performance Report", "requires_approval": false}
]'),
('Event', 'event', '[
  {"name": "Event Brief", "requires_approval": true},
  {"name": "Venue Proposal", "requires_approval": true},
  {"name": "Run Sheet", "requires_approval": true},
  {"name": "Supplier Contracts", "requires_approval": false},
  {"name": "Guest List", "requires_approval": false},
  {"name": "Post-Event Report", "requires_approval": false}
]');
