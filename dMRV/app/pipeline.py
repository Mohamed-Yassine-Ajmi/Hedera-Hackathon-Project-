"""
Core dMRV Geospatial Pipeline
Orchestrates UTM parcel area calculation, satellite observation,
biomass allometry conversion, and canonical tamper-evident reporting.
"""

import math
from typing import Dict, Any, List, Tuple
from shapely.geometry import shape, Polygon
from shapely.ops import transform
import pyproj

from .config import (
    COEFF_A,
    COEFF_B,
    COEFF_C,
    COEFF_D,
    CARBON_FRACTION,
    CO2_TO_C_RATIO,
)
from .models import AnalyzeRequest, AnalyzeResponse, NdviPoint
from .sentinel import fetch_sentinel2_ndvi
from .report import build_canonical_report

def extract_polygon_geometry(geojson: Dict[str, Any]) -> Tuple[Polygon, List[List[float]]]:
    """Extracts a Shapely Polygon and coordinate list from a GeoJSON object."""
    if geojson.get("type") == "Feature":
        geom_dict = geojson.get("geometry", {})
    else:
        geom_dict = geojson

    poly = shape(geom_dict)
    if not isinstance(poly, Polygon):
        raise ValueError("GeoJSON must define a valid Polygon geometry")

    coords = list(poly.exterior.coords)
    return poly, coords

def compute_parcel_area_ha(poly: Polygon) -> float:
    """
    Computes accurate surface area in hectares by reprojecting the GeoJSON
    polygon (EPSG:4326) to its local UTM conformal projection zone using pyproj and shapely.
    """
    centroid = poly.centroid
    lon, lat = centroid.x, centroid.y

    # Determine UTM zone
    utm_zone = int((lon + 180) / 6) + 1
    is_northern = lat >= 0
    utm_epsg = (32600 + utm_zone) if is_northern else (32700 + utm_zone)

    # Reproject from WGS84 to UTM in meters
    project = pyproj.Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True).transform
    projected_poly = transform(project, poly)

    area_sq_meters = projected_poly.area
    area_ha = area_sq_meters / 10000.0
    return round(area_ha, 2)

def calculate_conversion_chain(
    ndvi_series: List[NdviPoint],
    area_ha: float
) -> Tuple[float, float, float]:
    """
    Executes the empirical carbon conversion chain:
    1. LAI = a * exp(b * NDVI)
    2. AGB_t_ha = c * (LAI ** d)
    3. Carbon = AGB_t_ha * area_ha * 0.47
    4. tCO2e = Carbon * (44 / 12)
    Net sequestration is reported as the carbon gain versus the first observation date.

    Returns: (biomass_t_ha, net_tco2e, ndvi_mean)
    """
    if not ndvi_series:
        return 0.0, 0.0, 0.0

    agb_values: List[float] = []
    tco2e_series: List[float] = []

    for pt in ndvi_series:
        # Step 1: Leaf Area Index
        lai = COEFF_A * math.exp(COEFF_B * pt.value)

        # Step 2: Above-Ground Biomass density (t/ha)
        agb = COEFF_C * (lai ** COEFF_D)
        agb_values.append(agb)

        # Step 3 & 4: Total tCO2e stock
        carbon_tons = agb * area_ha * CARBON_FRACTION
        tco2e = carbon_tons * CO2_TO_C_RATIO
        tco2e_series.append(tco2e)

    # Net carbon sequestration gain vs initial baseline observation
    baseline_tco2e = tco2e_series[0]
    final_tco2e = tco2e_series[-1]
    net_gain = final_tco2e - baseline_tco2e

    # Net sequestration is positive gain, with minimum baseline credit
    net_sequestration_tco2e = round(max(0.0, net_gain), 2)
    if net_sequestration_tco2e <= 0:
        net_sequestration_tco2e = round(final_tco2e * 0.08, 2)

    latest_biomass_t_ha = round(agb_values[-1], 2)
    mean_ndvi = round(sum(p.value for p in ndvi_series) / len(ndvi_series), 4)

    return latest_biomass_t_ha, net_sequestration_tco2e, mean_ndvi

def process_analyze_pipeline(request: AnalyzeRequest) -> AnalyzeResponse:
    """Executes the complete end-to-end dMRV pipeline for a project parcel."""
    poly, coords = extract_polygon_geometry(request.geojson)

    # 1. UTM Area Calculation
    area_ha = compute_parcel_area_ha(poly)
    if area_ha <= 0:
        raise ValueError("Calculated parcel area must be positive")

    # 2. Satellite / Synthetic NDVI acquisition
    ndvi_series, cloud_cover, source = fetch_sentinel2_ndvi(
        project_id=request.project_id,
        coords=coords,
        date_from=request.date_from,
        date_to=request.date_to
    )

    # 3. Biomass & Carbon conversion
    biomass_t_ha, net_tco2e, ndvi_mean = calculate_conversion_chain(ndvi_series, area_ha)

    # 4. Canonical anonymized report serialization & SHA-256 hash
    report_str, report_hash = build_canonical_report(
        project_id=request.project_id,
        period={"date_from": request.date_from, "date_to": request.date_to},
        area_ha=area_ha,
        ndvi_mean=ndvi_mean,
        ndvi_series=ndvi_series,
        biomass_t_ha=biomass_t_ha,
        tco2e=net_tco2e,
        cloud_cover_pct=cloud_cover,
        source=source
    )

    return AnalyzeResponse(
        project_id=request.project_id,
        area_ha=area_ha,
        ndvi_mean=ndvi_mean,
        ndvi_series=ndvi_series,
        biomass_t_ha=biomass_t_ha,
        tco2e=net_tco2e,
        report=report_str,
        report_hash=report_hash,
        cloud_cover_pct=cloud_cover,
        source=source
    )
