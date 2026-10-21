"""
Offline Precomputer Script
Precomputes the dMRV analysis for the Ain Draham demo parcel
and persists the result to data/precomputed_demo.json.
"""

import json
import os
import sys

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import AnalyzeRequest
from app.pipeline import process_analyze_pipeline

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    geojson_path = os.path.join(base_dir, "data", "demo_parcel.geojson")
    output_path = os.path.join(base_dir, "data", "precomputed_demo.json")

    print("=" * 65)
    print(" ClimateTrust dMRV - Demo Parcel Offline Precomputation")
    print("=" * 65)

    if not os.path.exists(geojson_path):
        print(f"Error: Demo parcel not found at {geojson_path}")
        sys.exit(1)

    with open(geojson_path, "r", encoding="utf-8") as f:
        geojson_data = json.load(f)

    req = AnalyzeRequest(
        project_id="proj_ain_draham_demo",
        geojson=geojson_data,
        date_from="2026-03-01",
        date_to="2026-09-15"
    )

    print(f"Analyzing demo parcel: {req.project_id}...")
    response = process_analyze_pipeline(req)

    result_dict = response.model_dump()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result_dict, f, indent=2)

    print("\n[SUCCESS] Precomputed analysis saved to:")
    print(f"  {output_path}\n")
    print("Key Analysis Metrics:")
    print(f"  Area:             {response.area_ha:,.2f} hectares")
    print(f"  Mean NDVI:        {response.ndvi_mean:.4f}")
    print(f"  Biomass Density:  {response.biomass_t_ha:.2f} t/ha")
    print(f"  Net Sequestration:{response.tco2e:,.2f} tCO2e")
    print(f"  Report SHA-256:   {response.report_hash}")
    print(f"  Data Lineage:     {response.source.upper()}")
    print("=" * 65)

if __name__ == "__main__":
    main()
