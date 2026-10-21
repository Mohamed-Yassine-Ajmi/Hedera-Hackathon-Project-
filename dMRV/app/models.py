"""
Pydantic Data Models for dMRV API Requests & Responses
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class NdviPoint(BaseModel):
    date: str = Field(..., description="Observation date in ISO format YYYY-MM-DD", example="2026-06-15")
    value: float = Field(..., description="Median NDVI vegetation index across parcel pixels (0.0 to 1.0)", example=0.68)

class AnalyzeRequest(BaseModel):
    project_id: str = Field(..., description="Unique Project ID", example="proj_ain_draham_01")
    geojson: Dict[str, Any] = Field(..., description="GeoJSON Polygon or Feature specifying parcel boundaries")
    date_from: Optional[str] = Field(default=None, description="Start date (YYYY-MM-DD). Defaults to 6 months ago.")
    date_to: Optional[str] = Field(default=None, description="End date (YYYY-MM-DD). Defaults to today.")

class AnalyzeResponse(BaseModel):
    project_id: str
    area_ha: float = Field(..., description="Surface area of the parcel in hectares (UTM reprojected)")
    ndvi_mean: float = Field(..., description="Mean NDVI across all observation dates")
    ndvi_series: List[NdviPoint] = Field(..., description="Temporal sequence of cloud-masked median NDVI observations")
    biomass_t_ha: float = Field(..., description="Above-ground biomass density in tonnes of dry matter per hectare")
    tco2e: float = Field(..., description="Net carbon sequestration gain in tonnes of CO2 equivalent (tCO2e)")
    report: str = Field(..., description="Canonical, anonymized dMRV audit report JSON string")
    report_hash: str = Field(..., description="SHA-256 cryptographic digest of the canonical report")
    cloud_cover_pct: float = Field(..., description="Average cloud cover percentage across sampled satellite scenes")
    source: Literal["sentinel2", "synthetic"] = Field(..., description="Data lineage: live 'sentinel2' or deterministic 'synthetic'")
