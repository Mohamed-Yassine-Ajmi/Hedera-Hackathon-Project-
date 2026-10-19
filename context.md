PROJECT: ClimateTrust, a 24-hour hackathon MVP for a Hedera hackathon organized by Dar Blockchain.
One-liner: a B2B carbon-credit marketplace for North Africa and the Mediterranean. Each tonne of CO2e is a unique Hedera NFT serial, backed by satellite (NDVI) evidence and an independent auditor's signed credential, and permanently burned at retirement. This prevents greenwashing and double counting.

THE ONE FLOW TO DEMO (everything else is out of scope):
1. Seller registers a parcel (GeoJSON) and a PDD document hash.
2. dMRV computes NDVI, converts it to tCO2e, hashes the report, and the hash is published on HCS.
3. Auditor approves: a Verifiable-Credential-like JSON is signed with Ed25519, and an audit "visa" is published on HCS.
4. Backend verifies the VC, creates an HTS NFT class and mints N serials (1 serial = 1 tCO2e).
5. Buyer enters a simple footprint, picks a project, and buys N tCO2e (payment is simulated).
6. Serials are transferred to the buyer, then WIPED (burned). A retirement message goes to HCS. A PDF certificate with a QR code is produced.
7. A public explorer reads the full history from the Hedera Mirror Node (testnet).

STACK: Hedera TESTNET only. Node 20 + TypeScript + Express backend using @hashgraph/sdk. Python 3.11 + FastAPI dMRV micro-service (port 8001). React + Vite + Tailwind + Leaflet frontend. SQLite storage. Backend on port 8000.
MONOREPO: /hedera (M1), /backend (M2), /frontend (M3), /dmrv (M4), /docs.

CONTRACTS (never change without telling the team):
- Project status: DRAFT -> ANALYZED -> LISTED -> SOLD_OUT. Order status: LOCKED -> RETIRED.
- 3 HCS topics: ct.project, ct.audit, ct.retirement. Messages are compact JSON under 800 bytes with {schema_version, message_type, project_id, ...hashes}. No personal data on-chain.
- REST API (JSON, prefix /api, CORS open):
  POST /projects {name, owner, methodology, geojson, pddHash} -> {id, status, areaHa}
  GET /projects, GET /projects/:id
  POST /projects/:id/analyze -> {ndviMean, areaHa, tco2e, reportHash, hcsSeq, status}
  POST /projects/:id/audit {auditorId, approve, netTonnage, bufferPct, notes} -> {vc, tokenId, serials[], txIds[], status}
  GET /catalog -> [{projectId, name, tokenId, availableSerials, pricePerTonneUsd, ndviMean}]
  POST /footprint {electricityKwh, fuelLiters, freightTkm} -> {tco2e}
  POST /orders {buyerId, projectId, quantity} -> {orderId, status, expiresAt, totalUsd}
  POST /orders/:id/pay -> {status, serials[], wipeTxId, hcsSeq, certificateUrl}
  GET /orders/:id/certificate -> PDF
  GET /explorer/serial/:tokenId/:serial and GET /explorer/project/:id -> {events:[{type, consensusTimestamp, txId, hashscanUrl, data}]}
- dMRV API: POST http://localhost:8001/analyze {project_id, geojson, date_from, date_to} -> {project_id, area_ha, ndvi_mean, ndvi_series:[{date,value}], biomass_t_ha, tco2e, report, report_hash, cloud_cover_pct, source: "sentinel2"|"synthetic"}
- Hedera module (/hedera/src/index.ts exports): createTopic(memo), submitMessage(topicId, obj) -> {sequence, txId}, storeHashOnHfs(hashHex) -> fileId, createNftClass({name, symbol, maxSupply}) -> tokenId, mintSerials(tokenId, count, metadataStr) -> number[], associateToken(accountId, privateKey, tokenId), transferSerials(tokenId, serials, toAccountId) -> txId, wipeSerials(tokenId, fromAccountId, serials) -> txId, generateDidKeypair(), signVC(payload, privateKeyHex) -> vc, verifyVC(vc) -> boolean, getTopicMessages(topicId), getNftInfo(tokenId, serial), hashscanUrl(txId).
- .env variable names: OPERATOR_ID, OPERATOR_KEY, TREASURY_ID, TREASURY_KEY, BUYER_ID, BUYER_KEY, SUPPLY_KEY, WIPE_KEY, TOPIC_PROJECT, TOPIC_AUDIT, TOPIC_RETIREMENT, DMRV_URL, MIRROR_URL=https://testnet.mirrornode.hedera.com. NEVER commit real keys; provide .env.example.

WORKING RULES: write complete, runnable code (no placeholders), include a README section with run commands, add small tests or a smoke script, keep it simple (hackathon, not production), and tell me exactly which files to create and where.