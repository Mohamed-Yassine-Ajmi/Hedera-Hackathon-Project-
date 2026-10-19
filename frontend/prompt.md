ROLE: You are a senior React/UI engineer who builds polished hackathon demos fast. I own /frontend of ClimateTrust (see shared context above). The backend is built in parallel, so you must start with a MOCK API layer.

GOAL: A React + Vite + TypeScript + Tailwind + Leaflet app with a clean, trustworthy "climate-fintech" look (green/teal palette, cards, clear status badges) that makes the full demo flow obvious in under 3 minutes.

PART A: Seller and Auditor
1. Setup: routing (react-router), an `api.ts` client where each function matches the REST contract and a `VITE_USE_MOCK` flag returns realistic mock data (a Tunisian forest parcel near Ain Draham/Tabarka, tCO2e values, fake Hedera IDs). A top navigation with role switch: Seller, Auditor, Buyer, Explorer. Toast notifications and loading states on every call.
2. Seller page: a Leaflet map where the user draws a polygon (leaflet-draw) or pastes/uploads GeoJSON, with a form (project name, owner, methodology select, PDD file upload that computes the SHA-256 in the browser using crypto.subtle and shows it). Submit calls POST /projects, shows area in hectares, and shows an error with the conflicting zone highlighted when the backend returns a 409.
3. Project detail (seller): a status stepper DRAFT -> ANALYZED -> LISTED, an "Run satellite analysis" button, and, after analysis, a NDVI time-series line chart (recharts), NDVI mean, tCO2e, report hash, and a HashScan link.
4. Auditor page: a list of ANALYZED projects, a review panel (map, NDVI chart, report hash), inputs for net tonnage and buffer %, and an "Approve and sign" button. After success, display the signed VC JSON (collapsible), the token id, the serial range, and HashScan links.

PART B: Buyer, Explorer, polish
5. Buyer page: a footprint calculator (electricity, fuel, freight, live result in tCO2e), then the catalog as cards (project, NDVI badge, price, available tonnes, "Verified on Hedera" badge). A "Buy N tonnes" modal calls POST /orders (show a 15-minute countdown), then "Pay (simulated)" calls /pay, then shows the success screen with serials, wipe tx, a HashScan link and a "Download certificate" button.
6. Explorer page (public, no login): a search box (token id + serial, or project id), then a vertical timeline of events (project created, satellite report hashed, audit visa, minted, transferred, retired) with the consensus timestamp and a HashScan link for each. Add a QR landing route /verify/:tokenId/:serial used by the certificate QR code.
7. Polish: responsive layout, empty states, a demo-mode "Reset" button, and a small "What is real vs simulated" info tooltip on the payment step.

DELIVERABLES: file tree and full code, a README with run commands, and a `.env.example` (VITE_API_URL, VITE_USE_MOCK).
ACCEPTANCE: with VITE_USE_MOCK=true the whole flow can be clicked through without a backend, and switching the flag to false works against the real API with no code change.
Start with the folder structure and the mock data, then each file in full.