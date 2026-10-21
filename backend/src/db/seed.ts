import { getDb } from './index.js';

export function seedDatabase(): void {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (count.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, name, owner, methodology, geojson, area_ha, pdd_hash, hfs_file_id,
      status, token_id, total_tonnage, price_per_tonne_usd, ndvi_mean, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReport = db.prepare(`
    INSERT INTO reports (
      id, project_id, ndvi_mean, ndvi_series, biomass_t_ha, tco2e, report_hash,
      cloud_cover_pct, source, hcs_seq, hcs_tx_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audits (
      id, project_id, auditor_id, report_hash, gross_tco2e, buffer_pct,
      net_tonnage, decision, notes, vc_json, hcs_seq, hcs_tx_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSerial = db.prepare(`
    INSERT INTO project_serials (token_id, serial, project_id, status, order_id, locked_at)
    VALUES (?, ?, ?, ?, NULL, NULL)
  `);

  const insertActor = db.prepare(`
    INSERT INTO actors (id, name, role, hedera_account_id, did)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    // 1. Seed Actors
    insertActor.run(
      'buyer_demo',
      'EcoTransit Logistics',
      'BUYER',
      '0.0.900123',
      'did:hedera:testnet:buyer900123'
    );

    insertActor.run(
      'auditor_demo',
      'Bureau Veritas Mediterranean',
      'AUDITOR',
      '0.0.800456',
      'did:hedera:testnet:auditor800456'
    );

    // 2. Demo Project 1 (LISTED)
    const p1GeoJson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [-5.15, 33.40],
          [-5.00, 33.40],
          [-5.00, 33.55],
          [-5.15, 33.55],
          [-5.15, 33.40],
        ],
      ],
    });

    insertProject.run(
      'proj_atlas_cedar',
      'Atlas Cedar Reforestation & Watershed',
      'Atlas Conservation NGO',
      'VM0007 - REDD+ Improved Forest Management',
      p1GeoJson,
      1045.2,
      '0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      '0.0.400101',
      'LISTED',
      '0.0.300101',
      100,
      28.0,
      0.68,
      now,
      now
    );

    insertReport.run(
      'rep_atlas_1',
      'proj_atlas_cedar',
      0.68,
      JSON.stringify([
        { date: '2026-06-01', value: 0.62 },
        { date: '2026-07-01', value: 0.65 },
        { date: '2026-08-01', value: 0.68 },
      ]),
      14.2,
      120.0,
      '0xreport_atlas_hash_abc123',
      4.2,
      'sentinel2',
      101,
      '0.0.123456@1690000001.000000001',
      now
    );

    const vc1 = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'ClimateTrustAuditCredential'],
      issuer: 'did:hedera:testnet:auditor800456',
      issuanceDate: now,
      credentialSubject: {
        projectId: 'proj_atlas_cedar',
        reportHash: '0xreport_atlas_hash_abc123',
        grossTco2e: 120.0,
        bufferPct: 16.67,
        netTonnage: 100,
        decision: 'APPROVED',
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: now,
        proofValue: 'sig_atlas_auditor_proof_valid_hash',
      },
    };

    insertAudit.run(
      'aud_atlas_1',
      'proj_atlas_cedar',
      'auditor_demo',
      '0xreport_atlas_hash_abc123',
      120.0,
      16.67,
      100,
      'APPROVED',
      'Field inspection and satellite biomass density verified with Sentinel-2 L2A.',
      JSON.stringify(vc1),
      102,
      '0.0.123456@1690000002.000000002',
      now
    );

    // 100 serials for Project 1
    for (let s = 1; s <= 100; s++) {
      insertSerial.run('0.0.300101', s, 'proj_atlas_cedar', 'AVAILABLE');
    }

    // 3. Demo Project 2 (LISTED)
    const p2GeoJson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [10.80, 36.80],
          [10.95, 36.80],
          [10.95, 36.92],
          [10.80, 36.92],
          [10.80, 36.80],
        ],
      ],
    });

    insertProject.run(
      'proj_cap_bon',
      'Cap Bon Agroforestry & Soil Carbon',
      'Tunisian Regenerative Farmers Collective',
      'VM0042 - Improved Agricultural Land Management',
      p2GeoJson,
      480.5,
      '0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
      '0.0.400201',
      'LISTED',
      '0.0.300201',
      50,
      32.5,
      0.74,
      now,
      now
    );

    insertReport.run(
      'rep_capbon_1',
      'proj_cap_bon',
      0.74,
      JSON.stringify([
        { date: '2026-06-01', value: 0.70 },
        { date: '2026-07-01', value: 0.72 },
        { date: '2026-08-01', value: 0.74 },
      ]),
      18.5,
      60.0,
      '0xreport_capbon_hash_def456',
      2.1,
      'sentinel2',
      201,
      '0.0.123456@1690000003.000000003',
      now
    );

    const vc2 = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'ClimateTrustAuditCredential'],
      issuer: 'did:hedera:testnet:auditor800456',
      issuanceDate: now,
      credentialSubject: {
        projectId: 'proj_cap_bon',
        reportHash: '0xreport_capbon_hash_def456',
        grossTco2e: 60.0,
        bufferPct: 16.67,
        netTonnage: 50,
        decision: 'APPROVED',
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: now,
        proofValue: 'sig_capbon_auditor_proof_valid_hash',
      },
    };

    insertAudit.run(
      'aud_capbon_1',
      'proj_cap_bon',
      'auditor_demo',
      '0xreport_capbon_hash_def456',
      60.0,
      16.67,
      50,
      'APPROVED',
      'Soil organic carbon and perennial biomass verified against baseline.',
      JSON.stringify(vc2),
      202,
      '0.0.123456@1690000004.000000004',
      now
    );

    // 50 serials for Project 2
    for (let s = 1; s <= 50; s++) {
      insertSerial.run('0.0.300201', s, 'proj_cap_bon', 'AVAILABLE');
    }

    // 4. Demo Project 3 (DRAFT)
    const p3GeoJson = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [8.60, 36.70],
          [8.75, 36.70],
          [8.75, 36.82],
          [8.60, 36.82],
          [8.60, 36.70],
        ],
      ],
    });

    insertProject.run(
      'proj_kroumirie_draft',
      'Kroumirie Cork Oak Conservation',
      'North Africa Forestry Service',
      'VM0007 - Afforestation, Reforestation and Revegetation',
      p3GeoJson,
      750.0,
      '0xc3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012',
      '0.0.400301',
      'DRAFT',
      null,
      null,
      25.0,
      null,
      now,
      now
    );
  })();
}
