# ClimateTrust: 10-Slide Hackathon Pitch Deck

**Event:** Hedera Hackathon by Dar Blockchain  
**Tagline:** Trustless Mediterranean Carbon Offsets on Hedera Hashgraph  
**Format:** 10 Slides | 4-5 Minutes Presentation  

---

### Slide 1: Title & Hook
* **Slide Title:** ClimateTrust
* **Subtitle:** Verifiable, Satellite-Audited Carbon Credits for the Mediterranean
* **Visual:** High-contrast satellite NDVI heat map overlaid with a translucent Hedera token badge (`1 Serial = 1 tCO2e`).
* **Presenter Script:**  
  "Every year, billions of dollars are spent on voluntary carbon offsets. Yet 80% of buyers have zero certainty whether the tree was planted, counted twice, or quietly cut down. In North Africa, exporters facing the EU’s Carbon Border Adjustment Mechanism (CBAM) desperately need legitimate, verifiable carbon credits. We built **ClimateTrust**: the first dMRV carbon marketplace where every single tonne of CO2 is an immutable Hedera NFT, backed by Sentinel-2 satellite evidence, validated by an auditor's cryptographic signature, and permanently burned upon retirement."

---

### Slide 2: The Problem
* **Slide Title:** The Triple Crisis of Voluntary Carbon Markets
* **Key Pillars:**
  1. **The Greenwashing Trap:** 85%+ of legacy carbon credits fail additionality or permanence audits. Buyers face corporate reputational catastrophe.
  2. **Double-Counting & Fraud:** In paper registries, the same reforestation parcel is routinely mortgaged and resold across multiple brokers.
  3. **The North African CBAM Shock:** Starting 2026, Tunisian, Moroccan, and Egyptian industrial exporters to the EU must prove decarbonization or pay steep carbon border tariffs. They have no transparent local offset mechanism.
* **Punchline:** *"Voluntary carbon markets don't suffer from a lack of capital; they suffer from a lack of cryptographic truth."*

---

### Slide 3: The Solution
* **Slide Title:** The Cryptographic Carbon Pipeline
* **Core Concept:** Replace blind trust with automated satellite measurement, W3C Verifiable Credentials, and Hedera on-chain burn mechanics.
* **Three Guarantees:**
  * **Empirical Truth:** Continuous multispectral satellite monitoring (Sentinel-2 NDVI & biomass allometry).
  * **Auditor Accountability:** Independent auditors sign a W3C Verifiable Credential using Ed25519; minting cannot occur without it.
  * **Absolute Finality:** Token retirement permanently wipes the serial from circulation on-chain. Resale is cryptographically impossible.

---

### Slide 4: How It Works (The 7-Step Carbon Lifecycle)
* **Slide Title:** The 7-Step Verified Carbon Lifecycle
* **Step-by-Step Flow:**
  1. **Parcel Registration:** Developer submits parcel GeoJSON. Turf.js validates against overlaps (HTTP 409 rejection) and stores the PDD hash on Hedera File Service (HFS).
  2. **Satellite dMRV:** Automated Sentinel-2 ingestion calculates NDVI and net carbon sequestration ($t\text{CO}_2\text{e}$). Hash published on HCS `ct.audit`.
  3. **Auditor Visa:** Auditor evaluates report, signs a W3C Verifiable Credential. Backend validates signature.
  4. **HTS NFT Class & Minting:** Hedera Token Service creates a NonFungibleUnique class with finite supply and mints $N$ serials (1 serial = $1\text{ tCO}_2\text{e}$).
  5. **B2B Purchase:** Exporter calculates carbon footprint on our calculator and locks serials for 15 minutes.
  6. **Transfer & Token Wipe:** Serials transfer to buyer, then Hedera `TokenWipe` permanently burns them. Retirement event logged to HCS `ct.retirement`.
  7. **Certificate & Explorer:** Buyer receives a tamper-evident PDF certificate with QR code linking to HashScan Testnet.

---

### Slide 5: Why Hedera?
* **Slide Title:** The Only Enterprise DLT Built for Carbon
* **Comparison Table:**

| Requirement | Traditional Ethereum/EVM | Hedera Hashgraph | Why It Matters for Carbon |
| :--- | :--- | :--- | :--- |
| **Transaction Fees** | Volatile Gas ($5 - $50) | **Fixed in USD (~$0.001)** | Predictable unit economics per carbon tonne |
| **Consensus Speed** | 15s - 15 minutes | **3 - 5 Seconds aBFT** | Instant checkout & serial lock finality |
| **Native Token Service** | Vulnerable Smart Contracts | **Native HTS (Built-in Wipe)** | Native token wipe guarantees zero double-counting |
| **Audit Trails** | High calldata costs | **Hedera Consensus Service (HCS)** | Immutable public event ordering under 1KB |
| **Energy Consumption** | Proof of Stake (~varied) | **Carbon-Negative Network** | Offsets can't generate huge emissions to mint! |

---

### Slide 6: Live Product Demo
* **Slide Title:** Live End-to-End Walkthrough
* **Live Action Flow:**
  * **Screen 1:** Registering the Ain Draham cork oak parcel in northwestern Tunisia (507 ha).
  * **Screen 2:** Live dMRV pipeline fetching Sentinel-2 bands, calculating 0.62 NDVI, and hashing the audit report.
  * **Screen 3:** Auditor verifying the cryptographic VC and minting 25 carbon NFT serials on HTS.
  * **Screen 4:** Buyer checkout, instantaneous token wipe on HashScan, and PDF certificate download with live QR code.
* **On-Screen Proof:** Open HashScan link showing `deleted: true` on serial #1.

---

### Slide 7: Technical Architecture
* **Slide Title:** Production-Grade Micro-Service Architecture
* **Simplified Diagram:**
  ```text
  [ React + Vite + Tailwind + Leaflet Frontend ]
                        │
                        ▼ (HTTP REST /api)
  [ Node.js + Express + TypeScript Backend ]
     ├── SQLite (better-sqlite3 WAL)
     ├── Turf.js Spatial Engine (Overlap 409)
     ├── PDFKit + QRCode Certificate Engine
     └── Hedera Adapter (USE_MOCKS switch)
            │                           │
            ▼ (HTTP :8001)               ▼ (@hashgraph/sdk)
  [ FastAPI dMRV Engine ]       [ Hedera Testnet Network ]
     ├── PyProj / Shapely UTM      ├── HCS (ct.project, ct.audit, ct.retirement)
     ├── Planetary Computer STAC   ├── HTS (NonFungibleUnique + Wipe)
     └── Canonical SHA-256 Hasher  ├── HFS (PDD Hash Storage)
                                   └── Mirror Node REST API
  ```

---

### Slide 8: Market & Go-to-Market Strategy
* **Slide Title:** Capturing the Mediterranean CBAM Corridor
* **Target Beachhead:**
  * **Tunisia & Morocco Industrial Exporters:** Cement, aluminum, fertilizers, textiles, and olive oil exporting to France, Italy, and Spain.
  * **The Urgency:** EU CBAM transitional registry is live; financial penalties take effect by 2026. Exporters must neutralize scope 1 & 2 emissions.
* **GTM Flywheel:**
  * Partner with agricultural & forestry cooperatives in Tunisia (Cap Bon, Kroumirie) for supply.
  * Integrate directly with corporate ERP accounting software for quarterly CBAM compliance certificates.

---

### Slide 9: Business Model & Unit Economics
* **Slide Title:** Sustainable Marketplace Monetization
* **Revenue Streams:**
  1. **Marketplace Transaction Take-Rate:** 6% commission charged on gross carbon credit transactions (3% buyer / 3% seller).
  2. **dMRV SaaS Verification Fee:** $250 flat fee per satellite baseline and quarterly re-audit for land developers.
  3. **Enterprise Compliance Reporting:** Tiered API subscription for European importers requiring automated CBAM proof-of-retirement audits.
* **Example Unit Economics:**
  * 10,000 $t\text{CO}_2\text{e}$ traded at $30/tonne = $300,000 GMV $\to$ **$18,000 gross margin** per medium parcel trade.

---

### Slide 10: Roadmap & The Team
* **Slide Title:** From Hackathon MVP to Mainnet Production
* **Milestones:**
  * **Q4 2026 (Hackathon):** Complete REST API, HCS topics, HTS NFT wipe, Sentinel-2 dMRV pipeline, and interactive demo.
  * **Q1 2027:** Full integration with the **Hedera Guardian** open-source policy engine for Verra VM0007 / VM0042 workflows.
  * **Q2 2027:** Hedera Mainnet deployment, Hedera Smart Contract Service (HSCS) multi-sig escrow, and first commercial pilot in Tunisia.
* **The Team:** Multidisciplinary team combining Hedera distributed systems engineering, geospatial remote sensing, and carbon market regulation.
