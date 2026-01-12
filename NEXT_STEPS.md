# Next Steps - Alt/Shift Traffic Manager

## Immediate Tasks (Before Development)

### 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project credentials:
   - Project URL
   - Anon/Public key
   - Service Role key (keep this secret!)
3. Enable Magic Link authentication:
   - Go to Authentication > Providers
   - Enable Email
   - Configure redirect URLs
4. Run migrations in SQL Editor:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   ```

### 2. Get API Keys

- **Anthropic API Key**: [console.anthropic.com](https://console.anthropic.com)
- **Railway Account**: [railway.app](https://railway.app) (for deployment)

### 3. Configure Environment

```bash
# Frontend - copy and edit
cp .env.example .env.local

# Backend - copy and edit
cd backend && cp .env.example .env
```

---

## Start Development Servers

### Frontend (Next.js)

```bash
# From project root
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend (FastAPI)

```bash
# From backend directory
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

---

## Testing Checklist

### Frontend Tests
- [ ] Login page loads at http://localhost:3000/login
- [ ] AIDEN design system renders correctly (sharp corners, dark theme)
- [ ] Magic link email sends
- [ ] Auth callback redirects to dashboard

### Backend Tests
- [ ] Health check: `curl http://localhost:8000/health`
- [ ] API docs: http://localhost:8000/docs (if DEBUG=true)

### Integration Tests
- [ ] Can process a transcript through the API
- [ ] Capacity data loads in dashboard

---

## Development Priority Order

### Phase 1 - Foundation (Current)
1. **Complete Setup**
   - Set up Supabase project and run migrations
   - Configure environment variables
   - Test auth flow

2. **Connect Frontend to Backend**
   - Update API proxy configuration
   - Test transcript upload endpoint

3. **Add Initial Data**
   - Add team members to database
   - Add sample projects

### Phase 2 - Core Features
1. Extraction review UI
2. Assignment CRUD
3. Capacity dashboard

### Phase 3 - Polish
1. Error handling improvements
2. Loading states
3. Mobile responsiveness

---

## Key Files to Edit First

| File | Purpose |
|------|---------|
| `.env.local` | Frontend environment variables |
| `backend/.env` | Backend environment variables |
| `src/app/(dashboard)/upload/page.tsx` | Transcript upload UI |
| `backend/app/api/routes/transcripts.py` | Transcript processing API |

---

## Common Issues

### "CORS error" in browser
- Check `CORS_ORIGINS` in `backend/.env`
- Ensure frontend URL is in the list

### "Invalid Supabase key"
- Verify keys in `.env.local` and `backend/.env`
- Check for extra spaces or newlines

### "Claude API error"
- Verify `ANTHROPIC_API_KEY` in `backend/.env`
- Check API usage limits at console.anthropic.com

### "Module not found" errors
- Run `npm install` in root
- Run `pip install -r requirements.txt` in backend

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Development guide and constraints |
| `.claude/BLUEPRINT.md` | Architecture details |
| `.claude/PATTERNS.md` | Code patterns to follow |
| `.claude/STATUS.md` | Project status |
| `.claude/DEPLOYMENT.md` | Deployment instructions |
| `.claude/SUPABASE_IMPLEMENTATION.md` | Database details |

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/phase-1-foundation

# After making changes
git add .
git commit -m "feat: description of changes"

# Push to remote
git push -u origin feat/phase-1-foundation
```

---

## Get Help

- Check `.claude/` directory for detailed documentation
- Reference `PATTERNS.md` for code examples
- Check CLAUDE.md for UX/design constraints

---

**Ready to build. Start with Supabase setup, then connect the pieces.**
