ROLE: You are a senior Node/TypeScript backend engineer. I own /backend of ClimateTrust (see shared context above). Another teammate builds /hedera and /dmrv in parallel, so you must code against their contracts and provide MOCKS until they are ready.

GOAL: An Express + TypeScript + SQLite (better-sqlite3) API on port 8000 implementing the REST contract exactly.

PART A: Projects, dMRV and audit
1. Project skeleton: Express, zod validation, CORS, error handler, a SQLite schema (projects, reports, audits, orders, order_serials) and seed data (2 listed demo projects, 1 DRAFT project, a buyer, an auditor).
2. Adapter layers with an environment switch (USE_MOCKS=true/false): `hederaClient` (imports the /hedera module, or a mock returning fake IDs and sequences) and `dmrvClient` (HTTP call to DMRV_URL, or a mock).
3. POST /projects: validate the GeoJSON polygon, compute the area (turf.js), and reject overlaps with existing parcels (turf intersect) with a 409 and the conflicting project id. Store the PDD hash (and call storeHashOnHfs).
4. POST /projects/:id/analyze: call dMRV, store the report, publish {message_type:"dmrv.report", project_id, report_hash, tco2e} on the ct.audit topic, and set status ANALYZED.
5. POST /projects/:id/audit: require status ANALYZED, then build the VC payload {projectId, reportHash, grossTco2e, bufferPct, netTonnage, decision}. Sign it with the auditor key (signVC) and verify it (verifyVC) BEFORE any minting. Publish the "audit.visa.issued" message, create the NFT class, mint netTonnage serials, set status LISTED, and return the VC, tokenId and serials. Make the endpoint idempotent (same project can't be minted twice).

PART B: Marketplace, retirement, explorer
6. GET /catalog and POST /footprint (simple formula with constants kept in one config file: electricity 0.5 kgCO2/kWh, diesel 2.68 kgCO2/L, freight 0.1 kgCO2/t-km).
7. POST /orders: lock the next N available serials for 15 minutes (DB transaction, auto-expire), and reject a quantity above availability.
8. POST /orders/:id/pay: simulate payment, then associate the buyer's token, transfer the serials, wipe them, publish the ct.retirement message {order_id, token_id, serials range, wipe_tx}, set RETIRED, and generate the certificate. The endpoint must be idempotent on the order id.
9. GET /orders/:id/certificate: PDF (pdfkit) with the buyer, quantity, token id, serial range, tx ids, the HCS consensus timestamp and a QR code linking to the frontend explorer URL (qrcode lib).
10. GET /explorer/serial/... and /explorer/project/...: merge the Mirror Node topic messages and NFT info into one chronological `events` array with HashScan links.

DELIVERABLES: full file tree and code, an OpenAPI-lite `docs/api.md`, a `scripts/smoke.ts` that runs the whole flow with curl-like calls, and a Postman or .http file. Mocks must produce the same response shapes as the real services.
ACCEPTANCE: with USE_MOCKS=true the smoke script passes end to end; switching to false needs only the .env.
Start with the file tree and the DB schema, then each file in full.