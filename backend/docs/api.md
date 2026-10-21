# ClimateTrust Backend REST API Specification

Port: `8000`  
Base URL: `/api` (also mounted on `/` for backward compatibility)  
CORS: Open (`*`)  
Content-Type: `application/json`

---

## 1. Projects & Parcel Registry

### Register Parcel
`POST /api/projects`

Registers a new project polygon, computes land area in hectares using Turf.js, validates against spatial parcel overlaps, stores the PDD hash on Hedera File Service (HFS), and logs creation to HCS `ct.project`.

**Request Body:**
```json
{
  "name": "Cap Bon Agroforestry & Soil Carbon",
  "owner": "Tunisian Regenerative Farmers Collective",
  "methodology": "VM0042 - Improved Agricultural Land Management",
  "geojson": {
    "type": "Polygon",
    "coordinates": [
      [
        [10.80, 36.80],
        [10.95, 36.80],
        [10.95, 36.92],
        [10.80, 36.92],
        [10.80, 36.80]
      ]
    ]
  },
  "pddHash": "0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01",
  "pricePerTonneUsd": 32.5
}
```

**Responses:**
* `201 Created`:
  ```json
  {
    "id": "proj_1a2b3c4d5e6f",
    "status": "DRAFT",
    "areaHa": 480.5
  }
  ```
* `409 Conflict`: Overlaps with an existing registered parcel.
  ```json
  {
    "error": "Parcel overlaps with existing project \"Atlas Cedar Reforestation\" (proj_atlas_cedar)",
    "conflictingProjectId": "proj_atlas_cedar"
  }
  ```

---

### List All Projects
`GET /api/projects`

**Response (`200 OK`):**
```json
[
  {
    "id": "proj_atlas_cedar",
    "name": "Atlas Cedar Reforestation & Watershed",
    "owner": "Atlas Conservation NGO",
    "methodology": "VM0007 - REDD+ Improved Forest Management",
    "area_ha": 1045.2,
    "status": "LISTED",
    "token_id": "0.0.300101",
    "total_tonnage": 100,
    "price_per_tonne_usd": 28.0,
    "ndvi_mean": 0.68,
    "created_at": "2026-10-20T12:00:00.000Z"
  }
]
```

---

### Get Project Details
`GET /api/projects/:id`

**Response (`200 OK`):**
Returns project metadata, parsed GeoJSON, dMRV analysis reports, and audit certificates.

---

### Run Satellite dMRV Analysis
`POST /api/projects/:id/analyze`

Calls the dMRV micro-service (Sentinel-2 L2A biomass & NDVI analysis), persists the analytical report, publishes the report hash on HCS `ct.audit`, and sets status to `ANALYZED`.

**Response (`200 OK`):**
```json
{
  "ndviMean": 0.69,
  "areaHa": 480.5,
  "tco2e": 58,
  "reportHash": "0x4f8a92b...",
  "hcsSeq": 103,
  "status": "ANALYZED"
}
```

---

### Auditor Certification & NFT Minting
`POST /api/projects/:id/audit`

Idempotent endpoint. Verifies project is in `ANALYZED` status, compiles W3C Verifiable Credential payload, signs with auditor Ed25519 key, cryptographically validates the signature with `verifyVC`, publishes the `audit.visa.issued` message on HCS, deploys the HTS NFT class, mints `netTonnage` serials, sets status to `LISTED`, and stores serials.

**Request Body:**
```json
{
  "auditorId": "auditor_demo",
  "approve": true,
  "netTonnage": 50,
  "bufferPct": 15.0,
  "notes": "Verified against Sentinel-2 spectral indices and baseline."
}
```

**Response (`200 OK`):**
```json
{
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "ClimateTrustAuditCredential"],
    "issuer": "did:hedera:testnet:0.0.800456",
    "issuanceDate": "2026-10-20T12:30:00.000Z",
    "credentialSubject": {
      "projectId": "proj_1a2b3c4d5e6f",
      "reportHash": "0x4f8a92b...",
      "grossTco2e": 58,
      "bufferPct": 15,
      "netTonnage": 50,
      "decision": "APPROVED"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2026-10-20T12:30:00.000Z",
      "proofValue": "a8f3b..."
    }
  },
  "tokenId": "0.0.300201",
  "serials": [1, 2, 3, 4, 5],
  "txIds": ["0.0.123456@1700000000.000000000"],
  "status": "LISTED"
}
```

---

## 2. Marketplace & Catalog

### Get Catalog
`GET /api/catalog`

Returns all listed projects with live counts of currently available (unlocked) NFT serials.

**Response (`200 OK`):**
```json
[
  {
    "projectId": "proj_atlas_cedar",
    "name": "Atlas Cedar Reforestation & Watershed",
    "tokenId": "0.0.300101",
    "availableSerials": 80,
    "pricePerTonneUsd": 28.0,
    "ndviMean": 0.68,
    "status": "LISTED"
  }
]
```

---

### Calculate Carbon Footprint
`POST /api/footprint`

Computes emissions based on electricity (0.5 kg/kWh), diesel (2.68 kg/L), and freight (0.1 kg/t-km).

**Request Body:**
```json
{
  "electricityKwh": 1500,
  "fuelLiters": 400,
  "freightTkm": 2000
}
```

**Response (`200 OK`):**
```json
{
  "tco2e": 2.02,
  "totalKgCO2": 2022.0,
  "breakdown": {
    "electricityKg": 750.0,
    "fuelKg": 1072.0,
    "freightKg": 200.0
  }
}
```

---

## 3. Orders, Settlement & Retirement

### Place Order (Lock Serials)
`POST /api/orders`

Reserves and locks the next N available serials for 15 minutes. Automatically rejects quantities exceeding availability.

**Request Body:**
```json
{
  "buyerId": "buyer_demo",
  "projectId": "proj_atlas_cedar",
  "quantity": 5
}
```

**Response (`201 Created`):**
```json
{
  "orderId": "ord_9f8e7d6c5b4a",
  "status": "LOCKED",
  "expiresAt": "2026-10-20T12:45:00.000Z",
  "totalUsd": 140.0
}
```

---

### Pay & Retire Order (HTS Token Wipe)
`POST /api/orders/:id/pay`

Idempotent endpoint. Simulates payment, associates buyer's account with the token, transfers serials to buyer, executes Hedera `TokenWipe` to permanently destroy/burn serials from circulation, submits a retirement record to HCS `ct.retirement`, and generates the certificate URL.

**Response (`200 OK`):**
```json
{
  "status": "RETIRED",
  "serials": [1, 2, 3, 4, 5],
  "wipeTxId": "0.0.900123@1700000000.000000003",
  "hcsSeq": 105,
  "certificateUrl": "/api/orders/ord_9f8e7d6c5b4a/certificate"
}
```

---

### Download Retirement Certificate
`GET /api/orders/:id/certificate`

Generates an official PDF certificate with buyer name, project details, retired serial range, Hedera wipe transaction ID, HCS consensus timestamp, and a scannable QR code linking to the on-chain explorer.

**Response (`200 OK`):**
* Content-Type: `application/pdf`
* Content-Disposition: `inline; filename="climatetrust-certificate-<orderId>.pdf"`

---

## 4. Public Explorer & HashScan Links

### Get Project On-Chain Event Timeline
`GET /api/explorer/project/:id`

Merges HCS consensus messages and on-chain records into a chronological timeline with direct HashScan links.

**Response (`200 OK`):**
```json
{
  "projectId": "proj_atlas_cedar",
  "name": "Atlas Cedar Reforestation & Watershed",
  "status": "LISTED",
  "tokenId": "0.0.300101",
  "events": [
    {
      "type": "project.registered",
      "consensusTimestamp": "2026-10-20T10:00:00.000Z",
      "txId": "0.0.123456@1700000000.000000001",
      "hashscanUrl": "https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000001",
      "data": { "areaHa": 1045.2, "pddHash": "0xa1b2..." }
    },
    {
      "type": "dmrv.report",
      "consensusTimestamp": "2026-10-20T11:00:00.000Z",
      "txId": "0.0.123456@1700000000.000000002",
      "hashscanUrl": "https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000002",
      "data": { "ndviMean": 0.68, "tco2e": 120 }
    },
    {
      "type": "audit.visa.issued",
      "consensusTimestamp": "2026-10-20T11:30:00.000Z",
      "txId": "0.0.123456@1700000000.000000003",
      "hashscanUrl": "https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000003",
      "data": { "netTonnage": 100, "decision": "APPROVED" }
    }
  ]
}
```

---

### Get Serial On-Chain Status
`GET /api/explorer/serial/:tokenId/:serial`

Queries the Hedera Mirror Node to verify NFT ownership and confirmed retirement status (`deleted: true`).

**Response (`200 OK`):**
```json
{
  "tokenId": "0.0.300101",
  "serial": 1,
  "owner": null,
  "deleted": true,
  "events": [
    {
      "type": "nft.minted",
      "consensusTimestamp": "2026-10-20T11:30:00.000Z",
      "txId": "0.0.123456@1700000000.000000003",
      "hashscanUrl": "https://hashscan.io/testnet/transaction/...",
      "data": { "tokenId": "0.0.300101", "serial": 1 }
    },
    {
      "type": "ct.retirement",
      "consensusTimestamp": "2026-10-20T12:50:00.000Z",
      "txId": "0.0.900123@1700000000.000000003",
      "hashscanUrl": "https://hashscan.io/testnet/transaction/...",
      "data": { "wipeTxId": "0.0.900123@...", "permanentlyWiped": true }
    }
  ]
}
```
