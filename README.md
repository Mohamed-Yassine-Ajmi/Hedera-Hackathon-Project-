# ClimateTrust 🌍

> **A B2B carbon-credit marketplace for North Africa and the Mediterranean on Hedera Hashgraph.**  
> Built for the Hedera Hackathon organized by **Dar Blockchain**.

---

## 1. The Core Problem

Voluntary Carbon Markets (VCM) suffer from three fatal flaws:
1. **Greenwashing & Lack of Physical Evidence:** Offset credits are often issued based on paper estimates with no continuous empirical measurement.
2. **Double Counting & Re-hypothecation:** Legacy registries rely on private databases; the same forest parcel can be pledged across multiple brokers.
3. **The EU CBAM Pressure:** European Carbon Border Adjustment Mechanism regulations are forcing North African exporters (cement, steel, fertilizers, textiles, agriculture) to prove verifiable decarbonization or face heavy border penalties.

**ClimateTrust Solution:**  
Every tonne of $\text{CO}_2\text{e}$ is a unique Hedera NFT serial, backed by Sentinel-2 satellite (NDVI) evidence and an independent auditor's signed W3C Verifiable Credential, and permanently **wiped (burned)** at retirement via Hedera Token Service.

---

## 2. Monorepo Architecture

```text
├── hedera/     # Hedera Hashgraph SDK integration layer (HCS, HTS, HFS, DID/VC)
├── backend/    # Node.js + TypeScript + Express + SQLite API (Port 8000)
├── dMRV/       # Python 3.11+ FastAPI satellite analytical micro-service (Port 8001)
├── frontend/   # React + Vite + Tailwind + Leaflet interactive UI
└── context.md  # Core project specifications & contracts
```

### High-Level Architecture Diagram

```text
 [ B2B Buyers & Exporters ]             [ Forest / Land Developers ]
              │                                      │
              ▼                                      ▼
 [ React + Vite + Leaflet Frontend ] ──────────────────────┐
              │                                            │
              ▼ (REST /api)                                │
 [ Express TypeScript Backend (:8000) ]                    │
    ├── SQLite WAL DB (Projects, Orders, Serials)          │
    ├── Turf.js Spatial Overlap Engine (409 Conflict)      │
    ├── PDFKit + QRCode Certificate Engine                 │
    └── Hedera Adapter Layer                               │
          │                           │                    │
          ▼                           ▼                    │
    [ FastAPI dMRV (:8001) ]   [ Hedera Testnet ]          │
    ├── Sentinel-2 STAC        ├── HCS Topics (Audit Logs) │
    ├── SCL Cloud Masking      ├── HTS (NFT Mint & Wipe)   │
    └── Allometric Chain       ├── HFS (PDD Document Hash) │
                               └── Mirror Node REST API ◄──┘
```

---

## 3. The 7-Step Carbon Lifecycle Flow

1. **Parcel Registration (`POST /api/projects`):** Developer submits parcel GeoJSON and PDD document hash. Turf.js computes area and rejects overlaps with existing parcels (HTTP 409). PDD hash stored on Hedera File Service (HFS).
2. **Satellite dMRV Analysis (`POST /api/projects/:id/analyze`):** dMRV queries Sentinel-2 L2A optical scenes, masks clouds via the SCL band, computes NDVI and net $\text{tCO}_2\text{e}$ sequestration. Analytical report hash published to HCS topic `ct.audit`.
3. **Auditor Certification (`POST /api/projects/:id/audit`):** Auditor signs an Ed25519 W3C Verifiable Credential. The backend cryptographically validates the signature before token creation. Publishes `audit.visa.issued` on HCS.
4. **HTS Tokenization:** Creates a `NonFungibleUnique` NFT class with finite supply and mints $N$ serials ($1\text{ serial} = 1\text{ tCO}_2\text{e}$). Status updated to `LISTED`.
5. **Order Placement (`POST /api/orders`):** Buyer calculates emissions on the footprint calculator and locks serials for 15 minutes (atomic SQLite lock).
6. **Payment & Token Wipe (`POST /api/orders/:id/pay`):** Simulates payment, associates buyer account, transfers serials, and permanently **wipes/burns** them via `TokenWipe`. Emits retirement record to HCS `ct.retirement`.
7. **Certificate & Public Explorer:** Buyer downloads a cryptographic PDF certificate with a live QR code. Public explorer verifies on the Mirror Node that serials are marked `deleted: true`.

---

## 4. Setup & Running the Services

### Prerequisites
* Node.js v20+
* Python 3.11+
* Git

### Step A: Start the dMRV Micro-Service (Port 8001)
```bash
cd dMRV
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
*Health check:* [http://localhost:8001/health](http://localhost:8001/health)  
*Precompute demo parcel:* `python scripts/precompute.py`  
*Run hash consistency test:* `python scripts/test_hash.py`

### Step B: Start the Backend API (Port 8000)
```bash
cd backend
npm install
# Run the end-to-end 11-step smoke test
npm run smoke

# Start development server
npm run dev
```
*Health check:* [http://localhost:8000/health](http://localhost:8000/health)  
*API Documentation:* See [`backend/docs/api.md`](./backend/docs/api.md)

### Step C: Start the Frontend UI (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Web Application:* [http://localhost:5173](http://localhost:5173)  
*Frontend Documentation:* See [`frontend/README.md`](./frontend/README.md)

---

## 5. Hedera Testnet Configuration

| Environment Variable | Description | Testnet Example / Default |
| :--- | :--- | :--- |
| `HEDERA_NETWORK` | Target Network | `testnet` |
| `OPERATOR_ID` | Operator Account ID | `0.0.4812345` |
| `OPERATOR_KEY` | Operator Private Key (DER or Hex) | `302e020100300506032b657004220420...` |
| `TOPIC_PROJECT` | HCS Topic 1 (`ct.project`) | `0.0.5001` |
| `TOPIC_AUDIT` | HCS Topic 2 (`ct.audit`) | `0.0.5002` |
| `TOPIC_RETIREMENT` | HCS Topic 3 (`ct.retirement`) | `0.0.5003` |
| `MIRROR_URL` | Public Mirror Node REST API | `https://testnet.mirrornode.hedera.com` |

---

## 6. What is Real vs. Simulated

To uphold intellectual honesty for the hackathon jury:

| Component | Status | Details |
| :--- | :--- | :--- |
| **Hedera Consensus Service (HCS)** | **REAL** | Structured compact messages (< 800 bytes) with schema versions. |
| **Hedera Token Service (HTS) Wipe** | **REAL** | Native `TokenWipe` deletes serials from circulation; verified on Mirror Node. |
| **W3C Verifiable Credentials** | **REAL** | Canonical JSON key sorting, Ed25519 signatures, and tamper detection. |
| **Geospatial Processing** | **REAL** | Reprojection to UTM zones (PyProj/Shapely) and Turf.js spatial intersection. |
| **Satellite Data Acquisition** | **REAL + FALLBACK** | Queries Microsoft Planetary Computer Sentinel-2 L2A with deterministic fallback. |
| **Payment Gateway** | **SIMULATED** | Simulates instant settlement to enable seamless hackathon demonstration. |

---

## 7. Pitch & Presentation Materials

Detailed competition collateral is available in the [`dMRV/pitch/`](./dMRV/pitch/) folder:
* **[10-Slide Deck Outline](./dMRV/pitch/deck_outline.md):** Exact slide text, speaker notes, and value proposition.
* **[3-Minute Demo Script](./dMRV/pitch/demo_script.md):** Second-by-second presentation walkthrough with contingency plans.
* **[8 Judge Q&As](./dMRV/pitch/judge_qa.md):** In-depth answers covering database vs DLT, auditor fraud, permanence/buffer pools, and CBAM economics.
