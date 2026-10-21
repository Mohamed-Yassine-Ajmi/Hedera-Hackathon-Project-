# ClimateTrust Frontend 🌍

Clean, trustworthy "climate-fintech" React + Vite + TypeScript + Tailwind + Leaflet web application for ClimateTrust.

## Features

- **Role Switcher Navigation**: Instant tab switching between **Seller**, **Auditor**, **Buyer**, and public **Explorer**, plus a **Demo Reset** button.
- **Seller Page**:
  - Interactive Leaflet map with drawing tools (`leaflet-draw`) and GeoJSON upload/paste.
  - Browser-side SHA-256 computation of PDD documents using Web Crypto API (`crypto.subtle`).
  - Spatial overlap detection with automatic 409 conflict alerts and conflicting parcel highlights.
  - Status stepper: `DRAFT` ➔ `ANALYZED` ➔ `LISTED`.
  - One-click Sentinel-2 satellite analysis trigger with NDVI time-series line chart (Recharts) and HashScan link.
- **Auditor Page**:
  - Review queue of `ANALYZED` projects awaiting third-party certification.
  - Spatial boundary review and NDVI historical trend validation.
  - Net tonnage calculation with configurable risk buffer pool %.
  - Ed25519 W3C Verifiable Credential generation with cryptographic signature verification.
  - Immediate HTS NFT class tokenization ($1\text{ serial} = 1\text{ tCO}_2\text{e}$) and HashScan links.
- **Buyer Page**:
  - Interactive carbon footprint calculator (Electricity kWh, Fuel L, Freight tonne-km) with live $\text{tCO}_2\text{e}$ estimation.
  - Catalog cards with NDVI score badges, prices, and Hedera verification indicators.
  - 15-minute serial reservation timer with live countdown.
  - Simulated payment execution with native Hedera `TokenWipe` retirement.
  - Cryptographic PDF certificate download and live serial range status.
  - "What is real vs simulated" educational transparency tooltip.
- **Public Explorer & QR Verification**:
  - Search by project ID or Token ID + Serial number.
  - Vertical consensus timeline showing Hedera Consensus Service (HCS) sequenced transactions with direct HashScan links.
  - Dedicated `/verify/:tokenId/:serial` landing page for scanning QR codes from retirement certificates.

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

Variables:
- `VITE_API_URL`: Backend REST API URL (default: `http://localhost:8000/api`).
- `VITE_USE_MOCK`: Set to `true` to run completely offline without backend dependencies (all realistic mock data included). Set to `false` to communicate with the real backend.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Build output will be generated in `dist/`.
