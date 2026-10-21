# ClimateTrust Backend API 🌍

Express + TypeScript + SQLite REST API implementing the ClimateTrust carbon lifecycle protocol.

## Features

- **SQLite WAL Mode Engine**: Fast atomic operations, locking serials, audit records, and project states.
- **Turf.js Spatial Engine**: Polygon validation, geodesic area computation, and overlap detection rejecting colliding land parcels with HTTP `409 Conflict`.
- **Satellite dMRV Client**: Interfaces with the FastAPI Python micro-service on port 8001 or provides deterministic synthetic fallbacks.
- **Hedera Hashgraph Client**: Dual-mode adapter (`USE_MOCKS=true/false`) communicating with the `/hedera` SDK module for HCS message sequencing, HFS file recording, and HTS token creation and wipe.
- **PDFKit Certificate Engine**: Generates cryptographic retirement certificates with embedded QR codes linking to the public explorer.
- **Comprehensive Smoke Tests**: Automated 11-step end-to-end integration test (`npm run smoke`).

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key variables:
- `PORT`: Port for the API server (default `8000`).
- `USE_MOCKS`: `true` for local development without live Hedera credentials; `false` to invoke live Hedera Testnet SDK calls.
- `DMRV_URL`: URL to the FastAPI dMRV micro-service (default `http://localhost:8001`).

### 3. Run Automated Smoke Test
```bash
npm run smoke
```

### 4. Run Development Server
```bash
npm run dev
```
API endpoints will be exposed at `http://localhost:8000/api`.
Health check: `http://localhost:8000/health`.
