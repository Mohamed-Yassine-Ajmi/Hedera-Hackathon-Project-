"""
Anonymized Canonical Report Builder & SHA-256 Hasher
Guarantees byte-for-byte deterministic serialization and tamper evidence.
"""

import hashlib
import json
from typing import List, Dict, Any, Tuple
from .config import PIPELINE_VERSION
from .models import NdviPoint

def build_canonical_report(
    project_id: str,
    period: Dict[str, str | None],
    area_ha: float,
    ndvi_mean: float,
    ndvi_series: List[NdviPoint],
    biomass_t_ha: float,
    tco2e: float,
    cloud_cover_pct: float,
    source: str
) -> Tuple[str, str]:
    """
    Builds an anonymized report (no developer/owner PII),
    serializes it with sorted keys and zero whitespace, and computes its SHA-256 hash.
    """
    report_dict: Dict[str, Any] = {
        "area_ha": round(area_ha, 2),
        "biomass_t_ha": round(biomass_t_ha, 2),
        "cloud_cover_pct": round(cloud_cover_pct, 2),
        "ndvi_mean": round(ndvi_mean, 4),
        "ndvi_series": [{"date": p.date, "value": round(p.value, 4)} for p in ndvi_series],
        "period": {
            "date_from": period.get("date_from") or (ndvi_series[0].date if ndvi_series else "N/A"),
            "date_to": period.get("date_to") or (ndvi_series[-1].date if ndvi_series else "N/A"),
        },
        "pipeline_version": PIPELINE_VERSION,
        "project_id": project_id,
        "source": source,
        "tco2e": round(tco2e, 2),
    }

    # Canonical JSON: strictly sorted keys, no whitespace after delimiters
    canonical_json_str = json.dumps(report_dict, sort_keys=True, separators=(",", ":"))

    # Compute SHA-256 digest with 0x prefix
    report_hash = "0x" + hashlib.sha256(canonical_json_str.encode("utf-8")).hexdigest()

    return canonical_json_str, report_hash
