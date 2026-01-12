"""
Alt/Shift Traffic Manager - FastAPI Backend

AI-powered traffic management with capacity tracking.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import transcripts, assignments, capacity

# Initialize FastAPI app
app = FastAPI(
    title="Alt/Shift Traffic Manager API",
    version="1.0.0",
    description="AI-powered traffic management with capacity tracking",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "service": "traffic-manager-api",
        "version": "1.0.0",
    }


# Include routers
app.include_router(
    transcripts.router,
    prefix="/api/transcripts",
    tags=["transcripts"],
)
app.include_router(
    assignments.router,
    prefix="/api/assignments",
    tags=["assignments"],
)
app.include_router(
    capacity.router,
    prefix="/api/capacity",
    tags=["capacity"],
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Alt/Shift Traffic Manager API",
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else "Disabled in production",
    }
