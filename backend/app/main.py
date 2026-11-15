"""
PIXELRESCUE — Advanced Digital Image Processing Platform Backend
FastAPI Main Application Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .core.config import CORS_ORIGINS, STORAGE_DIR
from .core.database import engine, Base
from .api import (
    fundamentals,
    enhancement,
    spatial,
    frequency,
    restoration,
    color,
    metrics,
    pipeline,
    experiments,
    samples,
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PIXELRESCUE API",
    description="Mathematical Digital Image Processing, Restoration & Frequency Analysis Platform",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(fundamentals.router, prefix="/api")
app.include_router(enhancement.router, prefix="/api")
app.include_router(spatial.router, prefix="/api")
app.include_router(frequency.router, prefix="/api")
app.include_router(restoration.router, prefix="/api")
app.include_router(color.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(samples.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "PIXELRESCUE API",
        "status": "online",
        "description": "Advanced Image Processing, Restoration & Frequency Analysis Engine",
        "version": "1.0.0",
        "modules": [
            "Module 1: Image Fundamentals",
            "Module 2: Enhancement Studio & Histogram Laboratory",
            "Module 3: Spatial Filtering & 2D Convolution",
            "Module 4: SPECTRA Frequency Domain Laboratory",
            "Module 5: Image Restoration Engine",
            "Module 6: Color Processing Laboratory",
            "Module 7: Image Quality Analysis",
            "Advanced: Visual Node-based Processing Pipeline",
            "Persistent Experiment History",
        ]
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
