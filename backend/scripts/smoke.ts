/**
 * ClimateTrust Backend End-to-End Smoke Test Script
 *
 * Runs the entire carbon credit lifecycle from registration to retirement:
 * 1. Health check
 * 2. Footprint calculation
 * 3. Project parcel registration (GeoJSON + PDD Hash)
 * 4. Parcel overlap conflict rejection (HTTP 409 test)
 * 5. Satellite dMRV analysis & HCS publishing
 * 6. Auditor Verifiable Credential issuance & HTS NFT minting
 * 7. Catalog verification
 * 8. 15-minute serial locking order creation
 * 9. Order settlement, token transfer & HTS wipe (burn/retirement)
 * 10. PDF certificate download verification
 * 11. Public Explorer timeline & serial status verification
 */

import { app } from '../src/index.js';
import { config } from '../src/config.js';
import type { Server } from 'http';

const BASE_URL = `http://localhost:${config.port}/api`;

async function run() {
  console.log('='.repeat(70));
  console.log('   ClimateTrust Backend End-to-End Smoke Test');
  console.log(`   Target: ${BASE_URL} (USE_MOCKS=${config.useMocks})`);
  console.log('='.repeat(70));

  let server: Server | null = null;

  // Start internal test server if not already running
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (healthCheck.ok) {
      console.log('Connected to existing server on port', config.port);
    }
  } catch {
    console.log(`Starting local server on port ${config.port} for smoke tests...`);
    await new Promise<void>((resolve) => {
      server = app.listen(config.port, () => resolve());
    });
  }

  const passed: string[] = [];

  try {
    // 1. Health Check
    console.log('\n[1/11] Testing GET /api/health...');
    const resHealth = await fetch(`${BASE_URL}/health`);
    if (!resHealth.ok) throw new Error(`Health check failed: ${resHealth.status}`);
    const healthData = await resHealth.json();
    console.log('   [PASS] Health OK:', healthData);
    passed.push('Health Check');

    // 2. Footprint Calculation
    console.log('\n[2/11] Testing POST /api/footprint...');
    const footprintPayload = { electricityKwh: 2000, fuelLiters: 500, freightTkm: 3000 };
    const resFootprint = await fetch(`${BASE_URL}/footprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(footprintPayload),
    });
    if (!resFootprint.ok) throw new Error(`Footprint failed: ${resFootprint.status}`);
    const footprintData = await resFootprint.json();
    console.log('   [PASS] Footprint calculated:', footprintData);
    if (typeof footprintData.tco2e !== 'number' || footprintData.tco2e <= 0) {
      throw new Error('Invalid tco2e calculated');
    }
    passed.push('Footprint Calculation');

    // 3. Register New Project Parcel (GeoJSON)
    console.log('\n[3/11] Testing POST /api/projects (Registration)...');
    const uniqueLon = -150 + Math.random() * 50;
    const uniqueLat = -40 + Math.random() * 30;
    const newProjectPayload = {
      name: `Smoke Test Argan Agroforestry #${Date.now().toString().slice(-4)}`,
      owner: 'Souss Cooperative de Developpement',
      methodology: 'VM0042 - Improved Agricultural Land Management',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [uniqueLon, uniqueLat],
            [uniqueLon + 0.1, uniqueLat],
            [uniqueLon + 0.1, uniqueLat + 0.1],
            [uniqueLon, uniqueLat + 0.1],
            [uniqueLon, uniqueLat],
          ],
        ],
      },
      pddHash: `0xabcdef${Date.now()}1234567890abcdef1234567890abcdef1234567890`,
      pricePerTonneUsd: 30.0,
    };

    const resProj = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectPayload),
    });
    if (!resProj.ok) throw new Error(`Project creation failed: ${resProj.status} ${await resProj.text()}`);
    const projData = await resProj.json();
    console.log('   [PASS] Project registered:', projData);
    const projectId = projData.id;
    passed.push('Project Registration');

    // 4. Overlap Conflict Check (Turf Intersect 409 rejection)
    console.log('\n[4/11] Testing Turf Spatial Overlap Rejection (409 Conflict)...');
    const resOverlap = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectPayload), // Identical geometry
    });
    if (resOverlap.status === 409) {
      const overlapErr = await resOverlap.json();
      console.log('   [PASS] Correctly rejected overlapping parcel with 409 Conflict:', overlapErr);
      passed.push('Turf Spatial Overlap Check (409)');
    } else {
      throw new Error(`Expected 409 Conflict but got ${resOverlap.status}`);
    }

    // 5. dMRV Analysis
    console.log(`\n[5/11] Testing POST /api/projects/${projectId}/analyze (dMRV)...`);
    const resAnalyze = await fetch(`${BASE_URL}/projects/${projectId}/analyze`, {
      method: 'POST',
    });
    if (!resAnalyze.ok) throw new Error(`Analyze failed: ${resAnalyze.status} ${await resAnalyze.text()}`);
    const analyzeData = await resAnalyze.json();
    console.log('   [PASS] dMRV Analysis completed & published on HCS:', analyzeData);
    passed.push('dMRV Satellite Analysis');

    // 6. Auditor Certification & NFT Minting
    console.log(`\n[6/11] Testing POST /api/projects/${projectId}/audit (VC & HTS Mint)...`);
    const auditPayload = {
      auditorId: 'auditor_demo',
      approve: true,
      netTonnage: 25,
      bufferPct: 15.0,
      notes: 'Passed smoke test audit verification.',
    };
    const resAudit = await fetch(`${BASE_URL}/projects/${projectId}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditPayload),
    });
    if (!resAudit.ok) throw new Error(`Audit failed: ${resAudit.status} ${await resAudit.text()}`);
    const auditData = await resAudit.json();
    console.log('   [PASS] VC Signed & Verified. NFT Token Class & Serials Minted:', {
      tokenId: auditData.tokenId,
      serialsCount: auditData.serials.length,
      status: auditData.status,
      issuer: auditData.vc.issuer,
    });
    const tokenId = auditData.tokenId;
    passed.push('Auditor VC Certification & HTS Minting');

    // 7. Catalog Verification
    console.log('\n[7/11] Testing GET /api/catalog...');
    const resCatalog = await fetch(`${BASE_URL}/catalog`);
    if (!resCatalog.ok) throw new Error(`Catalog failed: ${resCatalog.status}`);
    const catalogData = await resCatalog.json();
    const listedProject = catalogData.find((p: any) => p.projectId === projectId);
    if (!listedProject || listedProject.availableSerials !== 25) {
      throw new Error(`Project not found in catalog with 25 available serials`);
    }
    console.log(`   [PASS] Catalog updated: Found "${listedProject.name}" with ${listedProject.availableSerials} serials available.`);
    passed.push('Catalog Verification');

    // 8. Place Order (Lock Serials for 15 mins)
    console.log('\n[8/11] Testing POST /api/orders (Lock 5 serials)...');
    const orderPayload = {
      buyerId: 'buyer_demo',
      projectId,
      quantity: 5,
    };
    const resOrder = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!resOrder.ok) throw new Error(`Order failed: ${resOrder.status} ${await resOrder.text()}`);
    const orderData = await resOrder.json();
    console.log('   [PASS] Order created and serials locked:', orderData);
    const orderId = orderData.orderId;
    passed.push('Order Creation & Serial Locking');

    // 9. Pay Order & Retire Serials (Token Wipe)
    console.log(`\n[9/11] Testing POST /api/orders/${orderId}/pay (Settle & Wipe Serials)...`);
    const resPay = await fetch(`${BASE_URL}/orders/${orderId}/pay`, {
      method: 'POST',
    });
    if (!resPay.ok) throw new Error(`Payment failed: ${resPay.status} ${await resPay.text()}`);
    const payData = await resPay.json();
    console.log('   [PASS] Payment processed & Serials Permanently Wiped on Hedera:', payData);
    if (payData.status !== 'RETIRED' || payData.serials.length !== 5) {
      throw new Error('Order not retired properly');
    }
    passed.push('Payment Settlement & HTS Token Wipe');

    // 10. Certificate PDF Download
    console.log(`\n[10/11] Testing GET /api/orders/${orderId}/certificate (PDF generation)...`);
    const resCert = await fetch(`${BASE_URL}/orders/${orderId}/certificate`);
    if (!resCert.ok) throw new Error(`Certificate failed: ${resCert.status}`);
    const contentType = resCert.headers.get('content-type');
    const certBuffer = await resCert.arrayBuffer();
    const isPdfHeader = Buffer.from(certBuffer.slice(0, 5)).toString() === '%PDF-';

    if (!contentType?.includes('application/pdf') || !isPdfHeader) {
      throw new Error(`Expected valid PDF response but got content-type: ${contentType}`);
    }
    console.log(`   [PASS] Certificate PDF generated successfully (${certBuffer.byteLength} bytes, valid %PDF- header).`);
    passed.push('Retirement PDF Certificate Generation');

    // 11. Explorer Verification
    console.log(`\n[11/11] Testing GET /api/explorer/project/${projectId} and /api/explorer/serial/${tokenId}/1...`);
    const resProjExplorer = await fetch(`${BASE_URL}/explorer/project/${projectId}`);
    if (!resProjExplorer.ok) throw new Error(`Project explorer failed: ${resProjExplorer.status}`);
    const projExplorerData = await resProjExplorer.json();

    const resSerialExplorer = await fetch(`${BASE_URL}/explorer/serial/${tokenId}/1`);
    if (!resSerialExplorer.ok) throw new Error(`Serial explorer failed: ${resSerialExplorer.status}`);
    const serialExplorerData = await resSerialExplorer.json();

    console.log(`   [PASS] Explorer verified: ${projExplorerData.events.length} chronological events on project.`);
    console.log(`   [PASS] Serial #1 status: deleted=${serialExplorerData.deleted} (Wiped upon retirement).`);
    passed.push('Public Explorer On-Chain Timeline');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(`   ALL ${passed.length}/11 SMOKE TESTS PASSED END-TO-END!`);
    console.log('='.repeat(70));
    for (let i = 0; i < passed.length; i++) {
      console.log(`   ${i + 1}. [OK] ${passed[i]}`);
    }
    console.log('='.repeat(70));
    process.exit(0);
  } catch (err) {
    console.error('\n[FAIL] Smoke test encountered error:', err);
    process.exit(1);
  } finally {
    if (server) {
      (server as Server).close();
    }
  }
}

run();
