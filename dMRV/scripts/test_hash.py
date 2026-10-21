"""
Unit Test: Deterministic Report Hash Verification
Proves that identical inputs consistently produce identical canonical JSON and SHA-256 digests.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import NdviPoint
from app.report import build_canonical_report

def test_identical_inputs_produce_identical_hashes():
    project_id = "proj_test_consistency"
    period = {"date_from": "2026-04-01", "date_to": "2026-08-30"}
    area_ha = 485.50
    ndvi_mean = 0.6750
    ndvi_series = [
        NdviPoint(date="2026-04-15", value=0.55),
        NdviPoint(date="2026-06-01", value=0.62),
        NdviPoint(date="2026-07-15", value=0.68),
        NdviPoint(date="2026-08-30", value=0.71),
    ]
    biomass_t_ha = 18.25
    tco2e = 65.40
    cloud_cover_pct = 3.2
    source = "sentinel2"

    # Run 1
    canonical_1, hash_1 = build_canonical_report(
        project_id, period, area_ha, ndvi_mean, ndvi_series,
        biomass_t_ha, tco2e, cloud_cover_pct, source
    )

    # Run 2 with identical data
    canonical_2, hash_2 = build_canonical_report(
        project_id, period, area_ha, ndvi_mean, ndvi_series,
        biomass_t_ha, tco2e, cloud_cover_pct, source
    )

    assert canonical_1 == canonical_2, "Canonical strings must be identical"
    assert hash_1 == hash_2, "Hashes must be identical on repeated runs"
    assert hash_1.startswith("0x"), "Hash must begin with 0x prefix"
    assert len(hash_1) == 66, "0x + 64 hex characters = 66 characters"

    # Tamper test: perturb one value slightly
    _, tampered_hash = build_canonical_report(
        project_id, period, area_ha, ndvi_mean, ndvi_series,
        biomass_t_ha, tco2e + 0.01, cloud_cover_pct, source
    )

    assert hash_1 != tampered_hash, "Any tampered value must produce a completely different hash"

    print("[PASS] Test Deterministic Report Hash: Identical input yields identical hash.")
    print(f"       Hash 1:        {hash_1}")
    print(f"       Hash 2:        {hash_2}")
    print(f"       Tampered Hash: {tampered_hash}")
    print("[PASS] Tamper detection verified.")

if __name__ == "__main__":
    test_identical_inputs_produce_identical_hashes()
