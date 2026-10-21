import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { hederaClient, VC } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export async function auditProject(
  projectId: string,
  params: {
    auditorId: string;
    approve: boolean;
    netTonnage?: number;
    bufferPct?: number;
    notes?: string;
  }
): Promise<{
  vc: VC;
  tokenId: string;
  serials: number[];
  txIds: string[];
  status: string;
}> {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

  if (!project) {
    const error: any = new Error(`Project ${projectId} not found`);
    error.status = 404;
    throw error;
  }

  // Idempotency: If already LISTED, return existing audit result
  if (project.status === 'LISTED' && project.token_id) {
    const existingAudit = db.prepare('SELECT * FROM audits WHERE project_id = ?').get(projectId) as any;
    const serialRows = db
      .prepare('SELECT serial FROM project_serials WHERE project_id = ? ORDER BY serial ASC')
      .all(projectId) as Array<{ serial: number }>;

    let parsedVc: VC;
    try {
      parsedVc = JSON.parse(existingAudit.vc_json);
    } catch {
      parsedVc = existingAudit?.vc_json;
    }

    return {
      vc: parsedVc,
      tokenId: project.token_id,
      serials: serialRows.map((r) => r.serial),
      txIds: [existingAudit?.hcs_tx_id || '0.0.123456@1700000000.000000000'],
      status: 'LISTED',
    };
  }

  if (project.status !== 'ANALYZED') {
    const error: any = new Error(
      `Cannot audit project in status "${project.status}". Project must first be in "ANALYZED" status.`
    );
    error.status = 400;
    throw error;
  }

  if (!params.approve) {
    const error: any = new Error('Auditor rejected the project certification');
    error.status = 400;
    throw error;
  }

  // Fetch latest dMRV report
  const report = db
    .prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(projectId) as any;

  if (!report) {
    const error: any = new Error('No dMRV analysis report found for this project');
    error.status = 400;
    throw error;
  }

  const bufferPct = params.bufferPct ?? 15.0;
  const netTonnage =
    params.netTonnage && params.netTonnage > 0
      ? params.netTonnage
      : Math.max(1, Math.floor(report.tco2e * (1 - bufferPct / 100)));

  // 1. Build W3C-style Verifiable Credential payload
  const vcPayload = {
    projectId,
    reportHash: report.report_hash,
    grossTco2e: report.tco2e,
    bufferPct,
    netTonnage,
    decision: 'APPROVED',
  };

  // 2. Sign VC with auditor key
  const vc = hederaClient.signVC(vcPayload, config.auditorKey);

  // 3. Verify VC cryptographically BEFORE any on-chain minting
  const isValid = hederaClient.verifyVC(vc);
  if (!isValid) {
    const error: any = new Error('Cryptographic Verifiable Credential verification failed; minting halted.');
    error.status = 500;
    throw error;
  }

  const now = new Date().toISOString();

  // 4. Publish "audit.visa.issued" message to HCS topic ct.audit
  const hcsAuditResult = await hederaClient.submitMessage(config.topicAudit, {
    schema_version: '1.0',
    message_type: 'audit.visa.issued',
    project_id: projectId,
    report_hash: report.report_hash,
    net_tonnage: netTonnage,
    auditor_id: params.auditorId,
    timestamp: now,
  });

  // 5. Create HTS NFT class for this project
  const tokenId = await hederaClient.createNftClass({
    name: `ClimateTrust - ${project.name}`,
    symbol: 'CTCO2',
    maxSupply: netTonnage,
  });

  // 6. Mint netTonnage serials
  const serials = await hederaClient.mintSerials(
    tokenId,
    netTonnage,
    `ipfs://QmProjectMetadata-${projectId}`
  );

  const auditId = `aud_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

  // 7. Save in DB transaction
  db.transaction(() => {
    db.prepare(`
      INSERT INTO audits (
        id, project_id, auditor_id, report_hash, gross_tco2e, buffer_pct,
        net_tonnage, decision, notes, vc_json, hcs_seq, hcs_tx_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      projectId,
      params.auditorId,
      report.report_hash,
      report.tco2e,
      bufferPct,
      netTonnage,
      'APPROVED',
      params.notes || 'Audited and verified according to standard methodology.',
      JSON.stringify(vc),
      hcsAuditResult.sequence,
      hcsAuditResult.txId,
      now
    );

    const insertSerial = db.prepare(`
      INSERT INTO project_serials (token_id, serial, project_id, status, order_id, locked_at)
      VALUES (?, ?, ?, 'AVAILABLE', NULL, NULL)
    `);

    for (const s of serials) {
      insertSerial.run(tokenId, s, projectId);
    }

    db.prepare(`
      UPDATE projects
      SET status = 'LISTED', token_id = ?, total_tonnage = ?, updated_at = ?
      WHERE id = ?
    `).run(tokenId, netTonnage, now, projectId);
  })();

  return {
    vc,
    tokenId,
    serials,
    txIds: [hcsAuditResult.txId],
    status: 'LISTED',
  };
}
