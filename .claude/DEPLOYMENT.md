# Deployment Guide

## Railway Deployment

The Alt/Shift Traffic Manager is deployed as a multi-service application on Railway.

### Services

1. **Frontend (Next.js)**
   - Framework: Next.js 15 with App Router
   - Build: Automatic via Railway Nixpacks
   - Domain: `traffic.altshift.com` (or Railway-provided)

2. **Backend (FastAPI)**
   - Framework: Python FastAPI
   - Build: Dockerfile in `/backend`
   - Domain: `api-traffic.altshift.com` (or Railway-provided)

3. **Database (Supabase)**
   - Hosted externally on Supabase
   - Connection via environment variables

---

## Setup Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### 2. Create Services

In the Railway dashboard:

1. Create new project "traffic-manager"
2. Add service: Next.js frontend (from GitHub repo, root directory)
3. Add service: FastAPI backend (from GitHub repo, `/backend` directory)

### 3. Configure Environment Variables

#### Frontend Service Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://api-traffic-xxxxx.railway.app
```

#### Backend Service Variables
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-xxxxx
CORS_ORIGINS=["https://traffic.altshift.com","https://traffic-xxxxx.railway.app"]
DEBUG=false
```

### 4. Configure Build Settings

#### Frontend
- Root directory: `/` (default)
- Build command: `npm run build`
- Start command: `npm start`

#### Backend
- Root directory: `/backend`
- Dockerfile path: `Dockerfile`
- Health check path: `/health`

### 5. Set Up Custom Domains (Optional)

1. In Railway dashboard, go to each service
2. Click "Settings" > "Domains"
3. Add custom domain
4. Update DNS records at your registrar

---

## Environment Variables Reference

### Frontend (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key

# API
NEXT_PUBLIC_API_URL=               # Backend API URL (Railway or localhost)
```

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=                      # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key (secret!)

# Anthropic
ANTHROPIC_API_KEY=                 # Claude API key

# CORS
CORS_ORIGINS=                      # JSON array of allowed origins

# Debug
DEBUG=                             # true/false
```

---

## Monitoring

### Health Checks

- Frontend: Automatic via Railway
- Backend: `/health` endpoint returns `{"status": "healthy"}`

### Logs

View logs in Railway dashboard or via CLI:
```bash
railway logs
```

### Metrics

Railway provides built-in metrics:
- Response times
- Request counts
- Memory usage
- CPU usage

---

## Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure `CORS_ORIGINS` includes your frontend domain
   - Check for trailing slashes in URLs

2. **Database connection fails**
   - Verify Supabase credentials
   - Check if IP restrictions are enabled in Supabase

3. **Claude API errors**
   - Verify `ANTHROPIC_API_KEY` is valid
   - Check API usage limits

4. **Build failures**
   - Check Railway build logs
   - Verify all dependencies are in requirements.txt/package.json

---

## Rollback

To rollback to a previous deployment:

1. Go to Railway dashboard
2. Select the service
3. Go to "Deployments" tab
4. Click on a previous successful deployment
5. Click "Redeploy"

---

## Scaling

Railway automatically handles scaling. For high traffic:

1. Consider upgrading Railway plan
2. Enable horizontal scaling in settings
3. Add Redis for caching (future enhancement)
