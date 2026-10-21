"""
Deterministic Synthetic NDVI Fallback Generator
Seeded strictly by project_id for 100% reproducible offline demonstrations.
"""

import hashlib
import random
from datetime import datetime, timedelta
from typing import List, Tuple
from .models import NdviPoint

def generate_synthetic_ndvi(
    project_id: str,
    date_from: str | None = None,
    date_to: str | None = None
) -> Tuple[List[NdviPoint], float]:
    """
    Generates a realistic, monotonically trending NDVI series (0.45 -> 0.70)
    with subtle natural variance, deterministically seeded by project_id.
    """
    # Deterministic seed from project_id hash
    seed_val = int(hashlib.sha256(project_id.encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(seed_val)

    # Date range parsing
    try:
        end_dt = datetime.strptime(date_to, "%Y-%m-%d") if date_to else datetime(2026, 9, 15)
    except Exception:
        end_dt = datetime(2026, 9, 15)

    try:
        start_dt = datetime.strptime(date_from, "%Y-%m-%d") if date_from else (end_dt - timedelta(days=150))
    except Exception:
        start_dt = end_dt - timedelta(days=150)

    # 5 evenly spaced observation dates (representing ~monthly Sentinel-2 composites)
    num_points = 5
    delta = (end_dt - start_dt) / (num_points - 1)
    dates = [(start_dt + delta * i).strftime("%Y-%m-%d") for i in range(num_points)]

    # Plausible vegetation growth curve (reforestation / restorative agriculture)
    base_ndvi = 0.46 + rng.uniform(0.01, 0.04)
    target_ndvi = 0.68 + rng.uniform(0.01, 0.03)

    series: List[NdviPoint] = []
    for i, d in enumerate(dates):
        # Progress factor (0.0 to 1.0)
        progress = i / (num_points - 1)
        # S-curve / asymptotic vegetation recovery trend
        trend = base_ndvi + (target_ndvi - base_ndvi) * (progress ** 0.8)
        # Small natural noise
        noise = rng.uniform(-0.012, 0.012)
        val = round(max(0.35, min(0.85, trend + noise)), 4)
        series.append(NdviPoint(date=d, value=val))

    # Mean cloud cover percentage across scenes
    cloud_cover = round(rng.uniform(2.2, 5.8), 1)

    return series, cloud_cover
