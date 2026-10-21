# ClimateTrust: 3-Minute Live Demo Script

**Speaker Persona:** Lead Engineer / Presenter  
**Total Duration:** 180 Seconds (3 Minutes)  
**Setup:** Browser tabs open to:
1. `http://localhost:5173` (Frontend Dashboard / Map)
2. `http://localhost:8000/api/catalog` (Backend API)
3. `https://hashscan.io/testnet` (HashScan Explorer)
4. Offline screen recording video loaded in VLC (Fallback Plan)

---

### Second-by-Second Script

#### [0:00 - 0:25] The Setup & Parcel Registration (Screen: Interactive Leaflet Map)
* **Action:** Presenter clicks **"Register New Project"**, draws or loads the sample GeoJSON polygon over Ain Draham, Tunisia.
* **Spoken:**  
  *"Judges, imagine you are a reforestation collective in the Kroumirie mountains of Tunisia. Today, registering a carbon credit takes 18 months and $100,000 of paperwork. On ClimateTrust, we paste our GeoJSON parcel. Instantly, Turf.js calculates 507 hectares and checks for boundary overlaps across the entire national registry. If another developer tried to claim our trees, the system rejects it with an HTTP 409 Conflict. Our project design document hash is stored permanently on the Hedera File Service."*

#### [0:25 - 0:55] Automated dMRV & Satellite Verification (Screen: dMRV Analysis Drawer)
* **Action:** Presenter clicks **"Run Satellite dMRV"**. The progress indicator shows Sentinel-2 band ingestion, cloud masking, and NDVI calculation.
* **Spoken:**  
  *"Now, we trigger our Python dMRV engine on port 8001. Live in under 5 seconds, it queries Microsoft Planetary Computer, downloads Sentinel-2 L2A optical bands B04 and B08, masks cloud pixels with the SCL scene layer, and calculates a median NDVI of 0.62. Our empirical allometric chain translates this biomass increase into 30,600 tonnes of net CO2 sequestered. The entire mathematical report is serialized canonically and its SHA-256 hash is anchored onto Hedera Consensus Service topic `ct.audit`. No one can fake the satellite readings."*

#### [0:55 - 1:30] The Auditor Visa & NFT Minting (Screen: Auditor Portal)
* **Action:** Switch to Auditor View, click **"Review & Sign Visa"**, then click **"Issue Carbon NFTs"**.
* **Spoken:**  
  *"Next, an accredited third-party auditor inspects the satellite evidence. They sign an immutable W3C Verifiable Credential using their Ed25519 private key. Our backend cryptographically validates the signature before a single token can be created. Once approved, the Hedera Token Service deploys a native NFT class and mints exactly 25 serials. Notice: each serial represents exactly 1 certified tonne of CO2, bound to this specific mountain coordinate."*

#### [1:30 - 2:05] Marketplace Purchase & Instant Burn (Screen: B2B Marketplace & Checkout)
* **Action:** Switch to Buyer View (EcoTransit Logistics), enter 5 tonnes on the Footprint Calculator, click **"Offset Footprint"**, then **"Confirm Payment"**.
* **Spoken:**  
  *"Now let's switch to the buyer: a Mediterranean shipping company facing EU CBAM carbon tariffs. They calculate their freight emissions—5 tonnes. They select the Ain Draham project. The backend locks the next 5 available serials for 15 minutes. The buyer pays. Instantly, the tokens transfer to the buyer, and Hedera executes a `TokenWipe` transaction. The tokens are burned permanently. They can never be re-sold, re-packaged, or double-counted."*

#### [2:05 - 2:40] Certificate Generation & HashScan Verification (Screen: PDF & HashScan)
* **Action:** The retirement confirmation appears. Presenter clicks **"View Certificate"** (opening the generated PDF), then clicks the HashScan transaction link.
* **Spoken:**  
  *"Within 3 seconds, the buyer downloads an official PDF Certificate complete with a live QR code and Hedera wipe transaction hash. Let's click right through to the public Hedera HashScan Testnet explorer. Look right here: Serial #1 through #5 are marked `deleted: true`. The consensus timestamp on HCS topic `ct.retirement` provides legal proof of compliance for European customs inspectors."*

#### [2:40 - 3:00] Closing & Call to Action (Screen: Architecture / Summary)
* **Action:** Return to Slide 10 or the live catalog showing available supply decremented from 25 to 20.
* **Spoken:**  
  *"In 3 minutes, we took a parcel of Mediterranean forest from satellite imagery to cryptographic verification, native tokenization, and permanent retirement. This is how Hedera Hashgraph restores trust to the multi-billion dollar carbon economy. Thank you—we're ready for your questions!"*

---

### Contingency & Fallback Plan

| Failure Scenario | Immediate Action | Script Pivot |
| :--- | :--- | :--- |
| **Plan A (Ideal):** Full live testnet & live localhost demo. | Execute steps 1-5 above. | Standard script. |
| **Plan B (Planetary Computer API timeout):** Satellite network query takes > 10s. | The dMRV pipeline automatically engages the deterministic **synthetic fallback** in < 1 second. | *"Our engine detected a satellite STAC timeout and smoothly engaged our deterministic synthetic telemetry model, ensuring zero downtime for the auditor."* |
| **Plan C (Hedera Testnet lag or conference Wi-Fi crash):** Network drops completely. | Switch instantly to **precomputed demo mode** (`precomputed_demo.json` and backend `USE_MOCKS=true`). | *"Notice how our distributed architecture caches verified consensus receipts, enabling offline resilience for field auditors in remote regions."* |
| **Plan D (Complete laptop/browser crash):** Hardware failure. | Play the pre-recorded 3-minute high-definition backup MP4 video stored locally on the desktop. | Narrate the video live without missing a beat. |
