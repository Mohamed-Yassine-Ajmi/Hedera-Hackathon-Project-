"""
FastAPI Server Entry Point for ClimateTrust dMRV Micro-Service
Port: 8001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import HOST, PORT, PIPELINE_VERSION
from .models import AnalyzeRequest, AnalyzeResponse
from .pipeline import process_analyze_pipeline

app = FastAPI(
    title="ClimateTrust dMRV Micro-Service",
    description="Digital Measurement, Reporting and Verification for Mediterranean Carbon Credits",
    version=PIPELINE_VERSION,
)

# Open CORS policy for hackathon microservices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "ClimateTrust dMRV Engine",
        "version": PIPELINE_VERSION,
        "status": "online",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "pipeline_version": PIPELINE_VERSION,
        "port": PORT,
    }

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_parcel(request: AnalyzeRequest):
    """
    Analyzes a GeoJSON parcel:
    1. Computes area in hectares using UTM projection.
    2. Gathers Sentinel-2 L2A optical satellite scenes (or synthetic deterministic fallback).
    3. Masks cloud cover and calculates median NDVI time series.
    4. Computes biomass density (AGB) and net sequestration tCO2e.
    5. Returns canonical anonymized report and SHA-256 cryptographic digest.
    """
    try:
        response = process_analyze_pipeline(request)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"dMRV pipeline execution failed: {str(exc)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
