# ClimateTrust dMRV Micro-Service

Digital Measurement, Reporting & Verification (dMRV) engine for Mediterranean & North African carbon offset projects.

Runs on **Python 3.11+ / 3.13**, **FastAPI**, and **port 8001**.

---

## 1. Overview & Conversion Chain

The micro-service implements `POST /analyze`:
1. **UTM Projected Area**: Reprojects the WGS84 GeoJSON polygon to its local Universal Transverse Mercator (UTM) conformal projection zone (`EPSG:32632` for Tunisia) to calculate precise parcel area in hectares.
2. **Sentinel-2 L2A STAC Acquisition**: Queries the Microsoft Planetary Computer STAC API for cloud-free observations (< 30% cloud cover). Applies scene classification masking (SCL) and computes per-pixel Normalized Difference Vegetation Index:
   $$\text{NDVI} = \frac{\text{B08 (NIR)} - \text{B04 (Red)}}{\text{B08 (NIR)} + \text{B04 (Red)}}$$
3. **Deterministic Synthetic Fallback**: If the satellite API is unavailable, engages a deterministic, smooth rising curve ($0.45 \to 0.70$) seeded by `project_id`. The response explicitly flags `source: "sentinel2"` or `source: "synthetic"`.
4. **Allometric Biomass & Carbon Chain** (calibrated for Mediterranean agroforestry / cork oak in `app/config.py`):
   * $\text{LAI} = a \cdot e^{b \cdot \text{NDVI}}$
   * $\text{AGB (t/ha)} = c \cdot \text{LAI}^d$
   * $\text{Carbon (t)} = \text{AGB} \cdot \text{Area (ha)} \cdot 0.47$
   * $\text{tCO}_2\text{e} = \text{Carbon} \cdot \frac{44}{12}$
   * Net sequestration is calculated as the incremental gain from baseline to the latest observation.
5. **Canonical Anonymized Hashing**: Anonymizes metadata (strips owner PII), formats JSON with sorted keys and zero delimiter whitespace, and produces an immutable SHA-256 digest (`report_hash`) published to Hedera Consensus Service.

---

## 2. Running Locally (No Docker Required)

### 1. Install Dependencies
```bash
cd dMRV
pip install -r requirements.txt
```

### 2. Start the Server
```bash
# Run on port 8001
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Interactive OpenAPI docs: **[http://localhost:8001/docs](http://localhost:8001/docs)**  
Health check: **[http://localhost:8001/health](http://localhost:8001/health)**

---

## 3. Offline Precomputation & Tests

### Run Offline Precomputer
Saves full analysis of the Ain Draham demo parcel to `data/precomputed_demo.json` for 0ms demo latency:
```bash
python scripts/precompute.py
```

### Run Hash Consistency Unit Test
Verifies that canonical formatting produces identical hashes across runs and detects any payload tampering:
```bash
python scripts/test_hash.py
```

---

## 4. Sample API Request

```bash
curl -X POST "http://localhost:8001/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_ain_draham_demo",
    "geojson": {
      "type": "Polygon",
      "coordinates": [
        [
          [8.6650, 36.7620],
          [8.6920, 36.7620],
          [8.6920, 36.7810],
          [8.6650, 36.7810],
          [8.6650, 36.7620]
        ]
      ]
    },
    "date_from": "2026-03-01",
    "date_to": "2026-09-15"
  }'
```

**Response (`200 OK`):**
```json
{
  "project_id": "proj_ain_draham_demo",
  "area_ha": 507.85,
  "ndvi_mean": 0.6193,
  "ndvi_series": [
    {"date": "2026-03-01", "value": 0.5212},
    {"date": "2026-05-15", "value": 0.5980},
    {"date": "2026-07-20", "value": 0.6432},
    {"date": "2026-09-15", "value": 0.7150}
  ],
  "biomass_t_ha": 74.8,
  "tco2e": 30608.37,
  "report": "{\"area_ha\":507.85,\"biomass_t_ha\":74.8,\"cloud_cover_pct\":3.5,...}",
  "report_hash": "0x55fa93e5e837d9293af77fc45923b5218b6e63b254652af1c196f770ab63b0dc",
  "cloud_cover_pct": 3.5,
  "source": "sentinel2"
}
```
