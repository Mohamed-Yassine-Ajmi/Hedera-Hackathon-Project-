import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { dmrvClient } from '../adapters/dmrvClient.js';
import { hederaClient } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export async function analyzeProject(projectId: string): Promise<{
  ndviMean: number;
  areaHa: number;
  tco2e: number;
  reportHash: string;
  hcsSeq: number;
  status: string;
}> {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

  if (!project) {
    const error: any = new Error(`Project ${projectId} not found`);
    error.status = 404;
    throw error;
  }

  let geojson = null;
  try {
    geojson = JSON.parse(project.geojson);
  } catch {
    geojson = project.geojson;
  }

  // Call dMRV micro-service or mock adapter
  const analysis = await dmrvClient.analyze(
    {
      project_id: projectId,
      geojson,
      date_from: '2026-01-01',
      date_to: '2026-09-01',
    },
    project.area_ha
  );

  const now = new Date().toISOString();

  // Publish dMRV report hash to HCS topic ct.audit
  const hcsResult = await hederaClient.submitMessage(config.topicAudit, {
    schema_version: '1.0',
    message_type: 'dmrv.report',
    project_id: projectId,
    report_hash: analysis.report_hash,
    tco2e: analysis.tco2e,
    ndvi_mean: analysis.ndvi_mean,
    area_ha: analysis.area_ha,
    source: analysis.source,
    timestamp: now,
  });

  const reportId = `rep_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

  db.transaction(() => {
    // Store report in DB
    db.prepare(`
      INSERT INTO reports (
        id, project_id, ndvi_mean, ndvi_series, biomass_t_ha, tco2e, report_hash,
        cloud_cover_pct, source, hcs_seq, hcs_tx_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      projectId,
      analysis.ndvi_mean,
      JSON.stringify(analysis.ndvi_series),
      analysis.biomass_t_ha,
      analysis.tco2e,
      analysis.report_hash,
      analysis.cloud_cover_pct,
      analysis.source,
      hcsResult.sequence,
      hcsResult.txId,
      now
    );

    // Update project status to ANALYZED
    db.prepare(`
      UPDATE projects
      SET status = 'ANALYZED', ndvi_mean = ?, updated_at = ?
      WHERE id = ?
    `).run(analysis.ndvi_mean, now, projectId);
  })();

  return {
    ndviMean: analysis.ndvi_mean,
    areaHa: analysis.area_ha,
    tco2e: analysis.tco2e,
    reportHash: analysis.report_hash,
    hcsSeq: hcsResult.sequence,
    status: 'ANALYZED',
  };
}
