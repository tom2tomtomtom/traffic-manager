# Approved Code Patterns

## Frontend Patterns

### AIDEN Button Pattern

```tsx
// ALWAYS use this button pattern
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-bold uppercase tracking-wide transition-all border-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-red-hot focus:ring-offset-2",
        
        variant === 'primary' && "bg-red-hot text-white border-red-hot hover:bg-red-dim",
        variant === 'secondary' && "bg-orange-accent text-white border-orange-accent",
        variant === 'ghost' && "bg-black-card border-border-subtle hover:border-orange-accent",
        variant === 'danger' && "bg-transparent text-red-hot border-red-hot hover:bg-red-hot hover:text-white",
        
        size === 'sm' && "px-4 py-2 text-xs",
        size === 'md' && "px-6 py-3 text-sm",
        size === 'lg' && "px-8 py-4 text-base",
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

### AIDEN Card Pattern

```tsx
// ALWAYS use this card pattern
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'danger'
  hoverable?: boolean
}

export function Card({ 
  variant = 'default', 
  hoverable = true,
  className, 
  children,
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-black-card p-6 border-2",
        variant === 'default' && "border-border-subtle",
        variant === 'highlighted' && "border-orange-accent",
        variant === 'danger' && "border-red-hot",
        hoverable && "hover:border-orange-accent transition-all cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Optimistic UI Update Pattern

```tsx
// ALWAYS use optimistic updates for user actions
async function handleAction(itemId: string) {
  // 1. Immediately update UI (optimistic)
  setState(prev => updateItem(prev, itemId))
  
  // 2. Show success feedback
  toast.success('Action completed')
  
  // 3. Make API call in background
  try {
    await apiClient.post(`/endpoint/${itemId}`)
  } catch (error) {
    // 4. Rollback on error
    setState(prev => revertItem(prev, itemId))
    toast.error('Action failed - try again')
  }
}
```

### Progress Indicator Pattern

```tsx
// ALWAYS show progress for operations >1 second
function ProcessingIndicator({ progress, label }: { progress: number, label: string }) {
  return (
    <div className="bg-black-card p-6 border-2 border-orange-accent">
      <div className="flex items-center gap-4 mb-4">
        <Spinner className="text-orange-accent" />
        <div>
          <p className="text-white-full font-bold uppercase">{label}</p>
          <p className="text-white-muted text-sm">Processing...</p>
        </div>
      </div>
      <div className="bg-black-deep h-2">
        <div 
          className="bg-orange-accent h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

### Confidence Badge Pattern

```tsx
// ALWAYS show confidence scores visually
function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 0.8 
    ? { bg: 'bg-orange-accent', text: 'text-black-ink', label: 'HIGH' }
    : score >= 0.5
    ? { bg: 'bg-yellow-electric', text: 'text-black-ink', label: 'REVIEW' }
    : { bg: 'bg-red-hot', text: 'text-white', label: 'VERIFY' }
  
  return (
    <span className={cn(
      "inline-block px-2 py-1 text-xs font-bold uppercase",
      variant.bg,
      variant.text
    )}>
      {variant.label}
    </span>
  )
}
```

### Error Handling Pattern

```tsx
// ALWAYS provide actionable error messages
function ErrorDisplay({ error, onRetry, onEdit }: ErrorProps) {
  return (
    <div className="bg-black-card border-2 border-red-hot p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-hot mt-1" />
        <div>
          <p className="text-red-hot font-bold uppercase">{error.title}</p>
          <p className="text-white-muted text-sm mt-1">
            {error.message}
          </p>
          {error.suggestions && (
            <ul className="text-white-muted text-sm mt-2 space-y-1 list-disc list-inside">
              {error.suggestions.map(s => <li key={s}>{s}</li>)}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            {onRetry && (
              <Button variant="primary" size="sm" onClick={onRetry}>
                Try Again
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit Input
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Backend Patterns

### FastAPI Route Pattern

```python
# ALWAYS use this route structure
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import RequestSchema, ResponseSchema
from app.services import service_module

router = APIRouter()

@router.post("/endpoint", response_model=ResponseSchema)
async def endpoint_name(
    data: RequestSchema,
    current_user = Depends(get_current_user)
):
    """
    Brief description of what this endpoint does.
    
    Args:
        data: Request payload
        current_user: Authenticated user from JWT
        
    Returns:
        ResponseSchema with result data
        
    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 404 if resource not found
    """
    try:
        result = await service_module.process(data)
        return ResponseSchema(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Claude API Integration Pattern

```python
# ALWAYS use this pattern for Claude API calls
from anthropic import Anthropic
import json

client = Anthropic()

async def extract_structured_data(
    text: str,
    schema: str,
    system_prompt: str
) -> dict:
    """
    Extract structured data using Claude with schema validation.
    
    Args:
        text: Input text to analyze
        schema: JSON schema description
        system_prompt: System instruction for Claude
        
    Returns:
        Parsed and validated data dict
        
    Raises:
        ValueError: If JSON parsing fails
    """
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        system=system_prompt,
        messages=[{
            "role": "user",
            "content": f"{text}\n\nReturn JSON matching schema:\n{schema}"
        }]
    )
    
    json_text = response.content[0].text
    clean_json = json_text.replace('```json\n', '').replace('\n```', '').strip()
    
    return json.loads(clean_json)
```

### Capacity Calculation Pattern

```python
# ALWAYS recalculate capacity after assignment changes
async def update_assignment_hours(
    assignment_id: str,
    new_hours: float
) -> Assignment:
    """
    Update assignment hours and recalculate capacity.
    
    This function MUST:
    1. Update the assignment
    2. Recalculate team member capacity
    3. Check for conflicts
    4. Return updated state
    """
    # Update assignment
    assignment = await db.assignments.update(
        where={'id': assignment_id},
        data={'hours_this_week': new_hours}
    )
    
    # Recalculate capacity for this team member
    await capacity_calculator.calculate_weekly_capacity(
        team_member_id=assignment.team_member_id,
        week_start_date=get_current_week_start()
    )
    
    # Check for new conflicts
    conflicts = await capacity_calculator.detect_capacity_conflicts()
    
    return assignment
```

### Database Query Pattern

```python
# ALWAYS use async/await for database queries
from supabase import create_client

async def get_team_capacity(week_start_date: date) -> List[CapacitySnapshot]:
    """
    Get capacity snapshots for all team members for a specific week.
    
    Args:
        week_start_date: Monday of the target week
        
    Returns:
        List of capacity snapshots with team member details
    """
    response = await supabase \
        .from('capacity_snapshots') \
        .select('*, team_members(*)') \
        .eq('week_start_date', week_start_date.isoformat()) \
        .execute()
    
    return [CapacitySnapshot(**item) for item in response.data]
```

---

## Database Patterns

### Migration Pattern

```sql
-- ALWAYS include rollback migrations
-- UP Migration
ALTER TABLE assignments
ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.5;

-- DOWN Migration (in separate file)
ALTER TABLE assignments
DROP COLUMN confidence_score;
```

### RLS Policy Pattern

```sql
-- ALWAYS enable RLS and create appropriate policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name"
ON table_name FOR SELECT
USING (auth.uid() IS NOT NULL);
```

### View Pattern

```sql
-- ALWAYS create views for complex queries
CREATE VIEW view_name AS
SELECT 
  t1.id,
  t1.name,
  COUNT(t2.id) AS related_count
FROM table1 t1
LEFT JOIN table2 t2 ON t2.table1_id = t1.id
GROUP BY t1.id
ORDER BY related_count DESC;
```

---

## Testing Patterns

### Component Test Pattern

```tsx
// ALWAYS test user interactions
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)
    
    fireEvent.click(screen.getByText('Click Me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
```

### API Test Pattern

```python
# ALWAYS test API endpoints
import pytest
from fastapi.testclient import TestClient

def test_create_assignment(client: TestClient, auth_headers: dict):
    """Test creating a new assignment."""
    payload = {
        "project_id": "proj-123",
        "team_member_id": "member-456",
        "role_on_project": "producer",
        "estimated_hours": 20
    }
    
    response = client.post(
        "/api/assignments",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    assert response.json()["role_on_project"] == "producer"
```

---

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `TranscriptUpload.tsx`)
- Utilities: `kebab-case.ts` (e.g., `api-client.ts`)
- Styles: `kebab-case.css` (e.g., `global-styles.css`)

### Functions
- React components: `PascalCase` (e.g., `CapacityHeatmap`)
- Utility functions: `camelCase` (e.g., `calculateCapacity`)
- Async functions: `async` prefix (e.g., `async function fetchData()`)

### Variables
- React state: `camelCase` (e.g., `const [isLoading, setIsLoading]`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `const MAX_CAPACITY_HOURS = 40`)
- Props interfaces: `PascalCase` with `Props` suffix (e.g., `ButtonProps`)

### Database
- Tables: `snake_case` plural (e.g., `team_members`)
- Columns: `snake_case` (e.g., `weekly_capacity_hours`)
- Primary keys: `id` (UUID)
- Foreign keys: `{table_singular}_id` (e.g., `team_member_id`)

---

## Anti-Patterns (Never Use)

### ❌ Don't: Generic Loading States
```tsx
// BAD
<div>Loading...</div>

// GOOD
<ProcessingIndicator progress={45} label="Extracting Data" />
```

### ❌ Don't: Unhandled Errors
```tsx
// BAD
await apiClient.post('/endpoint')

// GOOD
try {
  await apiClient.post('/endpoint')
} catch (error) {
  showError(error)
  rollbackState()
}
```

### ❌ Don't: Copy-Paste UI for AI Results
```tsx
// BAD
<div>
  <p>AI Result: {aiText}</p>
  <textarea />
</div>

// GOOD
<div>
  <p>{aiText}</p>
  <Button onClick={() => applyResult(aiText)}>Use This</Button>
</div>
```

### ❌ Don't: Border Radius (AIDEN Design System)
```tsx
// BAD
<div className="rounded-lg">

// GOOD
<div className="border-2 border-border-subtle">
```

### ❌ Don't: Skip Confidence Scores
```tsx
// BAD
<div>Assignment: Jess → Legos</div>

// GOOD
<div>
  <div>Assignment: Jess → Legos</div>
  <ConfidenceBadge score={0.85} />
</div>
```

---

**Last Updated**: 2025-01-13  
**Maintained By**: Development Team  
**Review Frequency**: Every sprint
